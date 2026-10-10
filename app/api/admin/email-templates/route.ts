import { NextResponse } from 'next/server'
import { userAdminGuard, sectionGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { EMAIL_TEMPLATES, EMAIL_CATEGORIES } from '@/lib/email-catalog'

export async function GET() {
  const session = (await userAdminGuard() || await sectionGuard('email_templates'))
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let overrides: Record<string, { subject: string; html: string; updated_at: string }> = {}
  try {
    const rows = await sql`SELECT id, subject, html, updated_at FROM email_templates`
    overrides = Object.fromEntries(rows.map(r => [r.id as string, r as { subject: string; html: string; updated_at: string }]))
  } catch {
    // table may not exist yet in a brand-new environment
  }

  return NextResponse.json({ templates: EMAIL_TEMPLATES, categories: EMAIL_CATEGORIES, overrides })
}
