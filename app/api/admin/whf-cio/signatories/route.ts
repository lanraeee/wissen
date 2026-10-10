import { NextResponse } from 'next/server'
import { sectionGuard } from '@/lib/admin-guard'
import { log } from '@/lib/logger'
import sql from '@/lib/db'

// One entry per active trustee for the constitution's signature blocks, with
// the signature and date from their trustee declaration when they have signed.
export async function GET() {
  const session = await sectionGuard('whf_cio.constitution')
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  try {
    const rows = await sql`
      SELECT t.id, t.full_name, t.position_title, d.signature_data, d.signed_date
      FROM trustee_register t
      LEFT JOIN cio_trustee_declarations d ON d.trustee_id = t.id
      WHERE t.status = 'active'
      ORDER BY t.appointment_date ASC, t.full_name ASC
    `
    return NextResponse.json(rows.map(r => ({
      id: r.id as string,
      name: r.full_name as string,
      role: (r.position_title as string | null) ?? '',
      signature: (r.signature_data as string | null) ?? null,
      signed_date: r.signed_date ? String(r.signed_date).slice(0, 10) : '',
    })))
  } catch (err) {
    log.error('constitution-signatories', err)
    return NextResponse.json({ error: 'Could not load trustees' }, { status: 500 })
  }
}
