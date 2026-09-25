import { NextRequest, NextResponse } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { logActivity } from '@/lib/audit-log'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await sql`DELETE FROM certificates WHERE id = ${id}`
  logActivity(session, 'certificate.revoke', { targetType: 'certificate', targetId: id })
  return NextResponse.json({ success: true })
}
