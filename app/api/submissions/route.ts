import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import sql from '@/lib/db'
import { parseBody, zEmail, zName } from '@/lib/validation'
import { log } from '@/lib/logger'

const SubmissionSchema = z.object({
  type: z.string().trim().min(1).max(50),
  name: zName,
  email: zEmail,
  phone: z.string().trim().max(30).optional(),
}).catchall(z.unknown()).refine(
  body => JSON.stringify(body).length <= 20_000,
  { message: 'Request body too large' }
)

export async function POST(req: NextRequest) {
  try {
    const { data, error } = await parseBody(req, SubmissionSchema)
    if (error) return error
    const { type, name, email, phone, ...rest } = data

    await sql`
      INSERT INTO submissions (type, name, email, phone, data)
      VALUES (${type}, ${name}, ${email}, ${phone ?? null}, ${JSON.stringify(rest)})
    `

    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('submissions', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
