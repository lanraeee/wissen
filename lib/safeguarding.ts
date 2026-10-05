import crypto from 'crypto'
import sql from './db'
import { hashPassword } from './auth'
import { log } from './logger'
import { notifySafeguardingTeam } from './email'

// Access and ingestion for the WHF-CIO Safeguarding tab (the incident log).
//
// Who can read it (safeguardingGuard() in lib/admin-guard.ts): directors, plus the designated safeguarding team -- the
// lead address below and whoever directors add to cio_safeguarding_team.
// Nobody else, whatever their admin role: the safeguarding policy promises
// reports are read by the safeguarding lead, not by general staff. The team
// sees only this tab; lib/admin-access.ts keeps them out of the rest of the
// admin panel.

export const SAFEGUARDING_LEAD_EMAIL = (process.env.SAFEGUARDING_LEAD_EMAIL || 'safeguarding@wissenhaus.org').trim().toLowerCase()

export async function getSafeguardingTeamEmails(): Promise<string[]> {
  let rows: Record<string, unknown>[] = []
  try {
    rows = await sql`SELECT email FROM cio_safeguarding_team`
  } catch (err) {
    // Table not migrated yet: the lead address still works.
    log.error('safeguarding', err, { stage: 'read team' })
  }
  return Array.from(new Set([SAFEGUARDING_LEAD_EMAIL, ...rows.map(r => String(r.email).toLowerCase())]))
}

export async function isSafeguardingTeam(email?: string): Promise<boolean> {
  if (!email) return false
  return (await getSafeguardingTeamEmails()).includes(email.trim().toLowerCase())
}


// ─── Incidents ──────────────────────────────────────────────────────────────

export type IncidentSource = 'safeguarding_form' | 'contact_form' | 'support_ticket' | 'manual'

export const SOURCE_LABELS: Record<IncidentSource, string> = {
  safeguarding_form: 'Safeguarding report form',
  contact_form: 'Contact form',
  support_ticket: 'Support ticket',
  manual: 'Logged by staff',
}

export interface NewIncident {
  source: IncidentSource
  sourceRef?: string | null
  reporterName?: string | null
  reporterEmail?: string | null
  reporterPhone?: string | null
  reporterRelationship?: string | null
  personAtRisk?: 'child' | 'adult_at_risk' | 'other' | 'unknown'
  concernType?: string | null
  description: string
  location?: string | null
  immediateDanger?: boolean
  createdBy?: string | null
}

/** SG- plus ten characters from an unambiguous alphabet. Quoted to the reporter. */
export function newReference() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(10)
  let s = ''
  for (const b of bytes) s += alphabet[b % alphabet.length]
  return `SG-${s.slice(0, 5)}-${s.slice(5)}`
}

/**
 * Logs an incident. Idempotent per (source, sourceRef): ingesting the same
 * contact message twice returns null the second time instead of a duplicate.
 */
export async function createIncident(i: NewIncident): Promise<{ id: string; reference: string } | null> {
  const reference = newReference()
  const rows = await sql`
    INSERT INTO cio_safeguarding_incidents
      (reference, source, source_ref, reporter_name, reporter_email, reporter_phone, reporter_relationship,
       person_at_risk, concern_type, description, location, immediate_danger, created_by)
    VALUES
      (${reference}, ${i.source}, ${i.sourceRef ?? null}, ${i.reporterName ?? null}, ${i.reporterEmail ?? null},
       ${i.reporterPhone ?? null}, ${i.reporterRelationship ?? null}, ${i.personAtRisk ?? 'unknown'},
       ${i.concernType ?? null}, ${i.description}, ${i.location ?? null}, ${i.immediateDanger ?? false}, ${i.createdBy ?? null})
    ON CONFLICT (source, source_ref) WHERE source_ref IS NOT NULL DO NOTHING
    RETURNING id, reference
  `
  return rows[0] ? { id: rows[0].id as string, reference: rows[0].reference as string } : null
}

// Words that make a contact-form or support message a likely safeguarding
// concern. Deliberately broad: a false positive costs the safeguarding team a
// glance, a false negative leaves a concern sitting in the general inbox.
const SAFEGUARDING_RE = /\b(safeguard\w*|abus(e|ed|ing|ive)|groom(ed|ing)|exploitation|self[- ]?harm|suicid\w*|unsafe|harass\w*|bully(ing)?|bullied|neglect\w*|trafficking|inappropriate (contact|messages?|behaviou?r))\b/i

export function looksLikeSafeguarding(...texts: (string | null | undefined)[]) {
  return texts.some(t => !!t && SAFEGUARDING_RE.test(t))
}

// ─── Team accounts ──────────────────────────────────────────────────────────

/**
 * Makes sure a team address has a login. Accounts here are self-registered
 * and nothing verifies that the person who signs up owns the address, so a
 * designated address must not be left open for a stranger to register first.
 * Creating the account up front with an unusable password closes that gap:
 * the real owner sets a password through "Forgot password", which proves they
 * read that mailbox. Returns the user id when an account was created now.
 */
export async function ensureTeamAccount(email: string, name?: string | null): Promise<string | null> {
  const [first, ...rest] = (name || 'Safeguarding Team').trim().split(/\s+/)
  const unusable = await hashPassword(crypto.randomBytes(32).toString('hex'))
  const rows = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name)
    VALUES (${email.toLowerCase()}, ${unusable}, ${first || 'Safeguarding'}, ${rest.join(' ') || 'Team'})
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  `
  return rows[0] ? (rows[0].id as string) : null
}

/**
 * Logs a concern that arrived from the public site and tells the team it is
 * there. The email is best-effort: the record is what matters, and it exists
 * by the time this returns.
 */
export async function recordConcern(i: NewIncident): Promise<{ id: string; reference: string } | null> {
  const created = await createIncident(i)
  if (!created) return null
  try {
    await notifySafeguardingTeam({
      to: await getSafeguardingTeamEmails(),
      reference: created.reference,
      sourceLabel: SOURCE_LABELS[i.source],
      urgent: !!i.immediateDanger,
    })
  } catch (err) {
    log.error('safeguarding notify', err, { reference: created.reference })
  }
  return created
}
