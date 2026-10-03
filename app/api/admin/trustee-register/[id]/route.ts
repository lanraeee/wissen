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
        email = COALESCE(${email || null}, email),
        phone = COALESCE(${phone || null}, phone),
        date_of_birth = COALESCE(${date_of_birth || null}, date_of_birth),
        appointment_date = COALESCE(${appointment_date || null}, appointment_date),
        term_end_date = COALESCE(${term_end_date || null}, term_end_date),
        position_title = COALESCE(${position_title || null}, position_title),
        appointment_type = COALESCE(${appointment_type || null}, appointment_type),
        nominating_org = COALESCE(${nominating_org || null}, nominating_org),
        status = COALESCE(${status || null}, status),
        conflict_of_interest_declaration = COALESCE(${conflict_of_interest_declaration || null}, conflict_of_interest_declaration),
        notes = COALESCE(${notes || null}, notes),
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
