import { NextResponse } from 'next/server'
import { sectionGuard, sectionWriteGuard } from '@/lib/admin-guard'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'
import { getResource, parseBody, listRows, insertRow, dbErrorResponse } from '@/lib/whf-cio'

type Ctx = { params: Promise<{ resource: string }> }

// Two of lib/whf-cio.ts's resource keys don't match their tab's name in
// app/admin/whf-cio/page.tsx's TABS (and so in lib/admin-sections.ts's grant
// keys, which follow the tab names since that's what the Access Control
// editor shows): ConflictsTab posts to "declarations", FixedCostsTab posts
// to "fixed_costs". Translate before building the section key, or granting
// "whf_cio.conflicts"/"whf_cio.costs" would silently grant nothing.
const SECTION_KEY_FOR_RESOURCE: Record<string, string> = { declarations: 'conflicts', fixed_costs: 'costs' }

// A director, the master admin, or a trustee specifically granted this
// resource's tab (e.g. "whf_cio.meetings" for the Meetings & Minutes tab --
// see lib/admin-sections.ts). "safeguarding" is never a valid resource here
// at all: that tab's own routes (app/api/admin/whf-cio/safeguarding/**) are
// the only path to it, guarded separately by safeguardingGuard().
function keyFor(resource: string) {
  return `whf_cio.${SECTION_KEY_FOR_RESOURCE[resource] ?? resource}`
}
function readGuard(resource: string) {
  return sectionGuard(keyFor(resource))
}
function writeGuard(resource: string) {
  return sectionWriteGuard(keyFor(resource))
}

export async function GET(_: Request, { params }: Ctx) {
  const { resource } = await params
  const session = await readGuard(resource)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const res = getResource(resource)
  if (!res) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    return NextResponse.json(await listRows(res))
  } catch (err) {
    log.error('whf-cio', err, { resource })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}

export async function POST(request: Request, { params }: Ctx) {
  const { resource } = await params
  const session = await writeGuard(resource)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const res = getResource(resource)
  if (!res) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => null)
  const parsed = parseBody(res, body, false)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    const row = await insertRow(res, parsed.values)
    await logActivity(session, `whf_cio.${resource}.create`, { targetType: `cio_${resource}`, targetId: row.id })
    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    log.error('whf-cio', err, { resource })
    const e = dbErrorResponse(err)
    return NextResponse.json({ error: e.error }, { status: e.status })
  }
}
