import sql from './db'
import { shell, DEFAULT_TAGLINE, DEFAULT_SITE_URL, type EmailChrome } from './email-shell'
import { brandFromSettings } from './brand'
import { CONTACT_DETAILS_DEFAULTS } from './contact-details'
import type { ContactDetails } from '@/components/admin/ContactDetailsEditor'

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

// Direct queries rather than lib/site-content.ts's getSiteContent(): that
// helper wraps next/cache's unstable_cache, which needs a real Next.js
// request context and throws under plain unit tests (and there's no need
// for the request-scoped/tag-invalidated caching here anyway -- email sends
// are low-frequency compared to page renders).
async function readSetting<T>(key: string): Promise<T | null> {
  try {
    const [row] = await sql`SELECT value FROM site_content WHERE key = ${key}`
    return (row?.value as T | undefined) ?? null
  } catch {
    return null
  }
}

/**
 * The header/footer data every email is wrapped in: brand from site_settings,
 * contact details from contact_details (both admin-editable), so an edit there
 * reaches the very next email. Never throws -- a failed lookup falls back to
 * the built-in defaults rather than blocking a send.
 */
export async function getEmailChrome(extra: Partial<EmailChrome> = {}): Promise<EmailChrome> {
  const [settings, stored] = await Promise.all([
    readSetting<Record<string, unknown>>('site_settings'),
    readSetting<Partial<ContactDetails>>('contact_details'),
  ])
  const brand = brandFromSettings(settings)
  const d: ContactDetails = { ...CONTACT_DETAILS_DEFAULTS, ...(stored ?? {}) }
  const settingsTagline = typeof settings?.tagline === 'string' ? settings.tagline : ''
  return {
    brandName: brand.name,
    brandDescriptor: brand.descriptor,
    tagline: settingsTagline || d.tagline || DEFAULT_TAGLINE,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_SITE_URL,
    email: d.primary_email,
    phoneNigeria: d.phone_nigeria,
    phoneUk: d.phone_uk,
    addressNigeria: d.address_nigeria,
    addressUk: d.address_uk,
    socials: [
      { label: 'Instagram', url: d.instagram_url },
      { label: 'LinkedIn', url: d.linkedin_url },
      { label: 'X', url: d.twitter_url },
      { label: 'WhatsApp', url: d.whatsapp_url },
    ].filter(s => s.url),
    ...extra,
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
  return { subject: fillVars(subjectTpl, vars), html: shell(fillVars(bodyTpl, vars), await getEmailChrome()) }
}

/** Renders a draft (unsaved) subject/body against sample data, for the admin preview pane. Reads the header/footer data, never writes or sends anything. */
export async function renderPreview(subjectTpl: string, bodyTpl: string, sampleVars: Record<string, string>, extra: Partial<EmailChrome> = {}) {
  return { subject: fillVars(subjectTpl, sampleVars), html: shell(fillVars(bodyTpl, sampleVars), await getEmailChrome(extra)) }
}
