import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

const ADMIN_EMAIL = process.env.FOUNDER_EMAIL || 'director@wissenhaus.org'

async function guard() {
  const s = await getSession()
  if (!s) return null
  const isDirector = s.email === ADMIN_EMAIL
  const hasAccess = isDirector || s.role === 'admin' || s.role === 'editor'
  return hasAccess ? s : null
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await req.json()

  if (body.action === 'grant_premium') {
    const expiry = new Date()
    expiry.setFullYear(expiry.getFullYear() + 1)
    await sql`UPDATE users SET membership_expiry = ${expiry.toISOString()} WHERE id = ${id}`
  } else if (body.action === 'revoke_premium') {
    await sql`UPDATE users SET membership_expiry = NULL WHERE id = ${id}`
  } else if (body.action === 'update') {
    await sql`UPDATE users SET first_name = ${body.first_name}, last_name = ${body.last_name}, email = ${body.email} WHERE id = ${id}`
  } else if (body.action === 'set_role') {
    if (session.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const role = ['user', 'editor', 'admin'].includes(body.role) ? body.role : 'user'
    await sql`UPDATE users SET role = ${role} WHERE id = ${id}`
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await sql`DELETE FROM users WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
