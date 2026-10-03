import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { directorGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await directorGuard()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const result = await sql`
      SELECT * FROM trustee_register WHERE id = ${id}
    `

    if (!result.length) {
      return NextResponse.json({ error: 'Trustee not found' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (err) {
    console.error('Trustee GET by ID error:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await directorGuard()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
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
      status,
      conflict_of_interest_declaration,
      notes,
    } = body

    const result = await sql`
      UPDATE trustee_register
      SET
        full_name = COALESCE(${full_name || null}, full_name),
        email = ${email === undefined ? 'email' : email || null},
        phone = ${phone === undefined ? 'phone' : phone || null},
        date_of_birth = ${date_of_birth === undefined ? 'date_of_birth' : date_of_birth || null},
        appointment_date = COALESCE(${appointment_date || null}, appointment_date),
        term_end_date = ${term_end_date === undefined ? 'term_end_date' : term_end_date || null},
        position_title = ${position_title === undefined ? 'position_title' : position_title || null},
        appointment_type = COALESCE(${appointment_type || null}, appointment_type),
        nominating_org = ${nominating_org === undefined ? 'nominating_org' : nominating_org || null},
        status = COALESCE(${status || null}, status),
        conflict_of_interest_declaration = ${conflict_of_interest_declaration || null},
        notes = ${notes === undefined ? 'notes' : notes || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (!result.length) {
      return NextResponse.json({ error: 'Trustee not found' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (err) {
    console.error('Trustee PUT error:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await directorGuard()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const result = await sql`
      DELETE FROM trustee_register WHERE id = ${id}
      RETURNING id
    `

    if (!result.length) {
      return NextResponse.json({ error: 'Trustee not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Trustee DELETE error:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
