import { NextResponse } from 'next/server'
import { directorGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import { getResource, parseBody, listRows, insertRow, dbErrorResponse } from '@/lib/whef-cio'

type Ctx = { params: Promise<{ resource: string }> }

export async function GET(_: Request, { params }: Ctx) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { resource } = await params
  const res = getResource(resource)
  if (!res) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    return NextResponse.json(await listRows(res))
  } catch (err) {
    log.error('whef-cio', err, { resource })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}

export async function POST(request: Request, { params }: Ctx) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { resource } = await params
  const res = getResource(resource)
  if (!res) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => null)
  const parsed = parseBody(res, body, false)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    const row = await insertRow(res, parsed.values)
    await logActivity(session, `whef_cio.${resource}.create`, { targetType: `cio_${resource}`, targetId: row.id })
    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    log.error('whef-cio', err, { resource })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}
