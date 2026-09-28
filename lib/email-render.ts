import sql from './db'
import { shell, DEFAULT_TAGLINE } from './email-shell'

export function fillVars(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '')
}

export interface TemplateDefault {
  subject: string
  body: string
}

export interface TemplateOverride {
  subject: string
  html: string
  updated_at: string
}

export async function getTemplateOverride(id: string): Promise<TemplateOverride | undefined> {
  try {
    const [row] = await sql`SELECT subject, html, updated_at FROM email_templates WHERE id = ${id}`
    return row as TemplateOverride | undefined
  } catch {
    // Table may not exist yet in a brand-new environment -- fall back to the
    // built-in default rather than 500ing every email send.
    return undefined
  }
}

// A direct query rather than lib/site-content.ts's getSiteContent(): that
// helper wraps next/cache's unstable_cache, which needs a real Next.js
// request context and throws under plain unit tests (and there's no need
// for the request-scoped/tag-invalidated caching here anyway -- email sends
// are low-frequency compared to page renders).
async function getTagline(): Promise<string> {
  try {
    const [row] = await sql`SELECT value FROM site_content WHERE key = 'site_settings'`
    return (row?.value as { tagline?: string } | undefined)?.tagline || DEFAULT_TAGLINE
  } catch {
    return DEFAULT_TAGLINE
  }
}

/**
 * Renders a transactional email: an admin-saved override in email_templates
 * if one exists, else the built-in default passed by the caller. Both are
 * {{var}}-templated strings filled with the same `vars` the send function
 * already computed (e.g. firstName, resetUrl) -- editing a template in the
 * admin panel never changes what variables are available, only the copy and
 * layout around them.
 */
export async function renderTemplate(id: string, vars: Record<string, string>, fallback: TemplateDefault) {
  const override = await getTemplateOverride(id)
  const subjectTpl = override?.subject || fallback.subject
  const bodyTpl = override?.html || fallback.body
  const tagline = await getTagline()
  return { subject: fillVars(subjectTpl, vars), html: shell(fillVars(bodyTpl, vars), tagline) }
}

/** Renders a draft (unsaved) subject/body against sample data, for the admin preview pane. Never touches the database. */
export function renderPreview(subjectTpl: string, bodyTpl: string, sampleVars: Record<string, string>) {
  return { subject: fillVars(subjectTpl, sampleVars), html: shell(fillVars(bodyTpl, sampleVars)) }
}
