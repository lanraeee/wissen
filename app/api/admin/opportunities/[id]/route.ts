import { NextRequest, NextResponse } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await sql`DELETE FROM opportunities WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
