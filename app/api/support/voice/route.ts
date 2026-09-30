import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// 60 seconds of opus is roughly 180 KB; 2 MB leaves generous headroom for
// browsers that fall back to a fatter codec while still being small enough
// that Postgres is a reasonable home for it. The client also caps recording
// length -- this is the server-side backstop, not the only limit.
const MAX_BYTES = 2 * 1024 * 1024

const ALLOWED_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg']

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('audio')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No audio supplied' }, { status: 400 })
    }

    // The browser appends codec parameters (audio/webm;codecs=opus), so match
    // on the base type rather than the whole header.
    const mime = (file.type || '').split(';')[0].trim().toLowerCase()
    if (!ALLOWED_TYPES.includes(mime)) {
      return NextResponse.json({ error: 'Unsupported audio format' }, { status: 415 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'That recording is too long' }, { status: 413 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const durationRaw = Number(form.get('durationMs'))
    const duration = Number.isFinite(durationRaw) && durationRaw > 0 ? Math.round(durationRaw) : null

    const [row] = await sql`
      INSERT INTO voice_notes (mime_type, bytes, duration_ms)
      VALUES (${mime}, ${buffer}, ${duration})
      RETURNING id
    `
    return NextResponse.json({ id: row.id })
  } catch (err) {
    log.error('voice note upload', err)
    return NextResponse.json({ error: 'Could not save that recording' }, { status: 500 })
  }
}
