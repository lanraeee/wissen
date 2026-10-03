import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { directorGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

export async function GET() {
  try {
    const session = await directorGuard()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const trustees = await sql`
      SELECT
        id,
        full_name,
        email,
        phone,
        date_of_birth,
        appointment_date,
        term_end_date,
        position_title,
        appointment_type,
        nominating_org,
        status,
        conflict_of_interest_declaration,
        notes,
        created_at,
        updated_at
      FROM trustee_register
      ORDER BY appointment_date DESC
    `

    return NextResponse.json(trustees)
  } catch (err) {
    console.error('Trustee register GET error:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await directorGuard()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const {
      full_name,
      email,
      phone,
      date_of_birth,
      appointment_date,
      term_end_date,
      position_title,
      appointment_type,
      nominating_org,
      status = 'active',
      notes,
    } = body

    if (!full_name || !appointment_date || !appointment_type) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name, appointment_date, appointment_type' },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO trustee_register (
        full_name,
        email,
        phone,
        date_of_birth,
        appointment_date,
        term_end_date,
        position_title,
        appointment_type,
        nominating_org,
        status,
        notes
      ) VALUES (
        ${full_name},
        ${email || null},
        ${phone || null},
        ${date_of_birth || null},
        ${appointment_date},
        ${term_end_date || null},
        ${position_title || null},
        ${appointment_type},
        ${nominating_org || null},
        ${status},
        ${notes || null}
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (err) {
    console.error('Trustee register POST error:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
