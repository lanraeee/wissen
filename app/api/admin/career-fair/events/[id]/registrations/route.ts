import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { adminGuard } from '@/lib/admin-guard'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const registrations = await sql`
    SELECT id, name, email, phone, school, class_grade, career_interest,
           newsletter_opt_in, checked_in, checked_in_at, checkin_token, created_at
    FROM fair_registrations
    WHERE event_id = ${id}
    ORDER BY created_at DESC
  `
  return NextResponse.json({ registrations })
}
