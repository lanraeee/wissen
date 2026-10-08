import { NextResponse } from 'next/server'
import { sectionWriteGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import { getResource, parseBody, updateRow, deleteRow, dbErrorResponse, UUID_RE } from '@/lib/whf-cio'

type Ctx = { params: Promise<{ resource: string; id: string }> }

// See app/api/admin/whf-cio/[resource]/route.ts's guard() for who this
// admits and why the two keys below get translated.
const SECTION_KEY_FOR_RESOURCE: Record<string, string> = { declarations: 'conflicts', fixed_costs: 'costs' }
function guard(resource: string) {
  return sectionWriteGuard(`whf_cio.${SECTION_KEY_FOR_RESOURCE[resource] ?? resource}`)
}

export async function PUT(request: Request, { params }: Ctx) {
  const { resource, id } = await params
  const session = await guard(resource)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

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
  const { resource, id } = await params
  const session = await guard(resource)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

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
