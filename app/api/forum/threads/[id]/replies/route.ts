import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'

type Ctx = { params: Promise<{ id: string }> }

const ReplySchema = z.object({
  body: z.string().trim().min(1).max(2000),
})

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
  const { data, error } = await parseBody(req, ReplySchema)
  if (error) return error
  const { body } = data

  const [thread] = await sql`SELECT id FROM forum_threads WHERE id = ${id}`
  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  const [reply] = await sql`
    INSERT INTO forum_replies (thread_id, user_id, author_name, body)
    VALUES (${id}, ${session.id}, ${session.name}, ${body})
    RETURNING id, author_name, body, created_at
  `
  await sql`UPDATE forum_threads SET reply_count = reply_count + 1, updated_at = NOW() WHERE id = ${id}`

  return NextResponse.json(reply, { status: 201 })
}
