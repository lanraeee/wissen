import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'
import { logActivity } from '@/lib/audit-log'

const IdSchema = z.object({ id: z.string().trim().min(1).max(100) })

export async function GET(req: NextRequest) {
  if (!await adminGuard()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const params = new URL(req.url).searchParams
  const type = params.get('type') || 'contact'
  const rows = await sql`
    SELECT id, type, name, email, phone, data, status, created_at
    FROM submissions
    WHERE type = ${type}
    ORDER BY created_at DESC
    LIMIT 200
  `
  return NextResponse.json(rows)
}

export async function DELETE(req: NextRequest) {
  const session = await adminGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await parseBody(req, IdSchema)
  if (error) return error
  await sql`DELETE FROM submissions WHERE id = ${data.id}`
  logActivity(session, 'submission.delete', { targetType: 'submission', targetId: data.id })
  return NextResponse.json({ success: true })
}
