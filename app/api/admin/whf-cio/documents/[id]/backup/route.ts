import { NextResponse } from 'next/server'
import { directorGuard } from '@/lib/admin-guard'
import { UUID_RE } from '@/lib/whf-cio'
import { backupDocument, driveConfigured } from '@/lib/whf-cio-drive'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_: Request, { params }: Ctx) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!driveConfigured()) return NextResponse.json({ error: 'Google Drive backup is not configured' }, { status: 503 })

  const status = await backupDocument(id)
  return status === 'synced'
    ? NextResponse.json({ drive_status: status })
    : NextResponse.json({ error: 'Backup to Google Drive failed — see server logs', drive_status: status }, { status: 502 })
}

export const maxDuration = 60
