import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { adminGuard } from '@/lib/admin-guard'

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params

  const [event] = await sql`SELECT slug, title FROM fair_events WHERE id = ${id}`
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const registrations = await sql`
    SELECT name, email, phone, school, class_grade, career_interest, attending_as, newsletter_opt_in,
           checked_in, checked_in_at, created_at
    FROM fair_registrations
    WHERE event_id = ${id}
    ORDER BY created_at ASC
  `

  const header = ['Name', 'Email', 'Phone', 'School', 'Class/Grade', 'Career Interest', 'Attending As', 'Newsletter Opt-In', 'Checked In', 'Checked In At', 'Registered At']
  const rows = registrations.map(r => [
    r.name, r.email, r.phone, r.school, r.class_grade, r.career_interest, r.attending_as,
    r.newsletter_opt_in ? 'Yes' : 'No', r.checked_in ? 'Yes' : 'No', r.checked_in_at, r.created_at,
  ])
  const csv = [header, ...rows].map(row => row.map(csvCell).join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.slug}-registrations.csv"`,
    },
  })
}
