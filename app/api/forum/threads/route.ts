import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import { parseBody } from '@/lib/validation'

const TAGS = ['Jobs', 'Education', 'Tech', 'Scholarships', 'Career', 'Finance', 'Discussion', 'General']

const ThreadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  tag: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tag = searchParams.get('tag')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20
  const offset = (page - 1) * limit

  const rows = tag
    ? await sql`
        SELECT t.id, t.title, t.body, t.tag, t.reply_count, t.pinned, t.created_at, t.author_name
        FROM forum_threads t
        WHERE t.tag = ${tag}
        ORDER BY t.pinned DESC, t.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    : await sql`
        SELECT t.id, t.title, t.body, t.tag, t.reply_count, t.pinned, t.created_at, t.author_name
        FROM forum_threads t
        ORDER BY t.pinned DESC, t.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `

  const [{ count }] = tag
    ? await sql`SELECT COUNT(*)::int AS count FROM forum_threads WHERE tag = ${tag}`
    : await sql`SELECT COUNT(*)::int AS count FROM forum_threads`

  return NextResponse.json({ threads: rows, total: count, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sign in to post' }, { status: 401 })

  const { data, error } = await parseBody(req, ThreadSchema)
  if (error) return error
  const { title, body, tag } = data
  const safeTag = tag && TAGS.includes(tag) ? tag : 'Discussion'

  const [thread] = await sql`
    INSERT INTO forum_threads (user_id, author_name, title, body, tag)
    VALUES (${session.id}, ${session.name}, ${title}, ${body}, ${safeTag})
    RETURNING id, title, tag, reply_count, pinned, created_at, author_name
  `
  return NextResponse.json(thread, { status: 201 })
}
