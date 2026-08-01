import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params
  const [thread] = await sql`
    SELECT id, title, body, tag, reply_count, pinned, created_at, author_name
    FROM forum_threads WHERE id = ${id}
  `
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(thread)
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await getSession()
  if (!session || (session.role !== 'admin' && session.role !== 'director'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await sql`DELETE FROM forum_threads WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
