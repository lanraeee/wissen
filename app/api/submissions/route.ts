import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, name, email, phone, ...rest } = body

    if (!type || !name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await sql`
      INSERT INTO submissions (type, name, email, phone, data)
      VALUES (${type}, ${name}, ${email}, ${phone ?? null}, ${JSON.stringify(rest)})
    `

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[submissions]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
