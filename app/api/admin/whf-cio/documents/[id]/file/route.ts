import { NextResponse } from 'next/server'
import { get } from '@vercel/blob'
import { directorGuard } from '@/lib/admin-guard'
import { log } from '@/lib/logger'
import sql from '@/lib/db'
import { UUID_RE } from '@/lib/whf-cio'
import { blobAccess, contentDisposition } from '@/lib/whf-cio-files'

type Ctx = { params: Promise<{ id: string }> }

// Files are served only through this route so the director check applies to every download,
// whichever access mode the Blob store uses.
export async function GET(_: Request, { params }: Ctx) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const rows = await sql`SELECT blob_path, file_name, content_type FROM cio_documents WHERE id = ${id}`
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const result = await get(rows[0].blob_path as string, { access: blobAccess() })
    if (!result || result.statusCode !== 200 || !result.stream) return NextResponse.json({ error: 'File not found in storage' }, { status: 404 })

    return new Response(result.stream, {
      headers: {
        'Content-Type': (rows[0].content_type as string) || 'application/octet-stream',
        'Content-Disposition': contentDisposition(rows[0].file_name as string),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    log.error('whf-cio', err, { route: 'documents file', id })
    return NextResponse.json({ error: 'Could not retrieve file' }, { status: 500 })
  }
}
