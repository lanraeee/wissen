import { NextResponse } from 'next/server'
import { directorGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import { getResource, parseBody, updateRow, deleteRow, dbErrorResponse, UUID_RE } from '@/lib/whf-cio'

type Ctx = { params: Promise<{ resource: string; id: string }> }

export async function PUT(request: Request, { params }: Ctx) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { resource, id } = await params
  const res = getResource(resource)
  if (!res || !UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => null)
  const parsed = parseBody(res, body, true)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    const row = await updateRow(res, id, parsed.values)
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await logActivity(session, `whf_cio.${resource}.update`, { targetType: `cio_${resource}`, targetId: id })
    return NextResponse.json(row)
  } catch (err) {
    log.error('whf-cio', err, { resource, id })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { resource, id } = await params
  const res = getResource(resource)
  if (!res || !UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    if (!(await deleteRow(res, id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await logActivity(session, `whf_cio.${resource}.delete`, { targetType: `cio_${resource}`, targetId: id })
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('whf-cio', err, { resource, id })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}
