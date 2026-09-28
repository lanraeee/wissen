import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { userAdminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseCsv } from '@/lib/csv'
import { generateUnsubscribeToken } from '@/lib/newsletter'
import { parseBody, zEmail } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 })

const ImportSchema = z.object({ csv: z.string().min(1).max(2_000_000) })

const EMAIL_HEADERS = ['email', 'email address', 'e-mail']
const NAME_HEADERS = ['name', 'full name', 'full_name']

export async function POST(req: NextRequest) {
  const session = await userAdminGuard()
  if (!session) return forbidden()

  const { data, error } = await parseBody(req, ImportSchema)
  if (error) return error

  const rows = parseCsv(data.csv)
  if (rows.length === 0) return NextResponse.json({ error: 'The CSV file is empty.' }, { status: 400 })

  const header = rows[0].map(h => h.trim().toLowerCase())
  const emailIdx = header.findIndex(h => EMAIL_HEADERS.includes(h))
  const nameIdx = header.findIndex(h => NAME_HEADERS.includes(h))
  if (emailIdx === -1) {
    return NextResponse.json({ error: 'Could not find an "email" column in the CSV header row.' }, { status: 400 })
  }

  const dataRows = rows.slice(1)
  let imported = 0
  let skipped = 0
  let invalid = 0

  for (const r of dataRows) {
    const rawEmail = (r[emailIdx] ?? '').trim().toLowerCase()
    const name = nameIdx !== -1 ? (r[nameIdx] ?? '').trim() : ''

    if (!zEmail.safeParse(rawEmail).success) { invalid++; continue }

    const [existing] = await sql`SELECT id FROM newsletter_subscribers WHERE email = ${rawEmail}`
    if (existing) { skipped++; continue }

    await sql`
      INSERT INTO newsletter_subscribers (email, name, source, unsubscribe_token)
      VALUES (${rawEmail}, ${name || null}, 'csv_import', ${generateUnsubscribeToken()})
    `
    imported++
  }

  logActivity(session, 'newsletter.import_csv', { details: { imported, skipped, invalid, totalRows: dataRows.length } })
  return NextResponse.json({ success: true, imported, skipped, invalid })
}
