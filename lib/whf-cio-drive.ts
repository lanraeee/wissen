import { get } from '@vercel/blob'
import sql from './db'
import { log } from './logger'
import { blobAccess } from './whf-cio-files'

// Asynchronous backup of uploaded CIO documents to Google Drive. Vercel Blob stays the source of truth;
// a failed or unconfigured backup never affects an upload.
//
// Uses an OAuth refresh token (not a service account): service accounts have no Drive storage quota of
// their own, so uploads into an ordinary user folder fail. The refresh token acts as the Drive owner.
//   GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN  (scope: drive.file)
//   GOOGLE_DRIVE_FOLDER_ID  optional override. With the narrow drive.file scope the app can only write to
//                           folders it created itself, so by default it finds or creates "WHF-CIO Backup".

export function driveConfigured(): boolean {
  return !!(process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_CLIENT_SECRET && process.env.GOOGLE_DRIVE_REFRESH_TOKEN)
}

export function buildMultipart(metadata: Record<string, unknown>, bytes: ArrayBuffer, contentType: string, boundary: string): Blob {
  return new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`,
    bytes,
    `\r\n--${boundary}--`,
  ])
}

async function accessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  })
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string }
  if (!res.ok || !data.access_token) throw new Error(`Drive token request failed: ${data.error ?? res.status}`)
  return data.access_token
}

const FOLDER_NAME = 'WHF-CIO Backup'
let folderId: string | undefined

async function backupFolder(token: string): Promise<string> {
  if (process.env.GOOGLE_DRIVE_FOLDER_ID) return process.env.GOOGLE_DRIVE_FOLDER_ID
  if (folderId) return folderId
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const q = encodeURIComponent(`name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`)
  const found = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&pageSize=1`, { headers })
  const foundData = (await found.json().catch(() => ({}))) as { files?: { id: string }[]; error?: { message?: string } }
  if (!found.ok) throw new Error(`Drive folder lookup failed: ${foundData.error?.message ?? found.status}`)
  if (foundData.files?.[0]) return (folderId = foundData.files[0].id)
  const created = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST', headers, body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  })
  const createdData = (await created.json().catch(() => ({}))) as { id?: string; error?: { message?: string } }
  if (!created.ok || !createdData.id) throw new Error(`Drive folder creation failed: ${createdData.error?.message ?? created.status}`)
  return (folderId = createdData.id)
}

export type BackupStatus = 'synced' | 'failed' | 'disabled'

export async function backupDocument(id: string): Promise<BackupStatus> {
  if (!driveConfigured()) {
    await sql`UPDATE cio_documents SET drive_status = 'disabled' WHERE id = ${id} AND drive_status <> 'synced'`
    return 'disabled'
  }
  try {
    const rows = await sql`SELECT blob_path, file_name, content_type FROM cio_documents WHERE id = ${id}`
    if (!rows.length) return 'failed'

    const blob = await get(rows[0].blob_path as string, { access: blobAccess() })
    if (!blob || blob.statusCode !== 200 || !blob.stream) throw new Error('File missing from Blob storage')
    const bytes = await new Response(blob.stream).arrayBuffer()

    const token = await accessToken()
    const parent = await backupFolder(token)
    const boundary = `whf${Date.now().toString(36)}`
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
      body: buildMultipart({ name: rows[0].file_name, parents: [parent] }, bytes, (rows[0].content_type as string) || 'application/octet-stream', boundary),
    })
    const data = (await res.json().catch(() => ({}))) as { id?: string; error?: { message?: string } }
    if (!res.ok || !data.id) throw new Error(`Drive upload failed: ${data.error?.message ?? res.status}`)

    await sql`UPDATE cio_documents SET drive_status = 'synced', drive_file_id = ${data.id} WHERE id = ${id}`
    return 'synced'
  } catch (err) {
    log.error('whf-cio-drive', err, { id })
    await sql`UPDATE cio_documents SET drive_status = 'failed' WHERE id = ${id} AND drive_status <> 'synced'`.catch(() => {})
    return 'failed'
  }
}
