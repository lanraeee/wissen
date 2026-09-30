import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

// Serving a voice note needs the note's own id, which is a v4 UUID and is only
// ever handed out inside a ticket thread the reader could already see -- the
// same capability model as the ticket reference itself. Nothing here leaks a
// listing, so an id that is not held cannot be walked to.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const rows = await sql`SELECT mime_type, bytes FROM voice_notes WHERE id = ${id}`
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = rows[0].bytes as Buffer
  return new NextResponse(new Uint8Array(body), {
    headers: {
      'Content-Type': rows[0].mime_type as string,
      'Content-Length': String(body.length),
      // Immutable: a voice note's bytes never change once recorded.
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  })
}
