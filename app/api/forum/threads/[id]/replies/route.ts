import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params
  const replies = await sql`
    SELECT id, author_name, body, created_at
    FROM forum_replies WHERE thread_id = ${id}
    ORDER BY created_at ASC
  `
  return NextResponse.json(replies)
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sign in to reply' }, { status: 401 })

  const { id } = await params
  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 400 })
  if (body.length > 2000) return NextResponse.json({ error: 'Reply too long' }, { status: 400 })

  const [thread] = await sql`SELECT id FROM forum_threads WHERE id = ${id}`
  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  const [reply] = await sql`
    INSERT INTO forum_replies (thread_id, user_id, author_name, body)
    VALUES (${id}, ${session.id}, ${session.name}, ${body.trim()})
    RETURNING id, author_name, body, created_at
  `
  await sql`UPDATE forum_threads SET reply_count = reply_count + 1, updated_at = NOW() WHERE id = ${id}`

  return NextResponse.json(reply, { status: 201 })
}
