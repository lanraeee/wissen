export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 // Vercel functions reject request bodies over 4.5 MB

export const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

export const LINKED_TYPES = ['constitution', 'registrations', 'trustees', 'meetings', 'policies', 'filings'] as const
export type LinkedType = (typeof LINKED_TYPES)[number]

/** Store access mode. Must match how the Vercel Blob store was created (it cannot be changed afterwards). */
export function blobAccess(): 'public' | 'private' {
  return process.env.WHF_BLOB_ACCESS === 'public' ? 'public' : 'private'
}

export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'file'
  const cleaned = base.normalize('NFKD').replace(/[^\w.\- ]+/g, '').replace(/\s+/g, '-').replace(/^\.+/, '').slice(-120)
  return cleaned || 'file'
}

export function validateUpload(file: { size: number; type: string; name: string }): string | null {
  if (!file.size) return 'The file is empty'
  if (file.size > MAX_UPLOAD_BYTES) return `File is too large (limit ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)`
  if (!ALLOWED_TYPES[file.type]) return 'Only PDF, PNG, JPG and DOCX files are allowed'
  return null
}

/** Keeps a download's filename header safe from quotes and header injection. */
export function contentDisposition(fileName: string): string {
  const ascii = safeFileName(fileName).replace(/"/g, '')
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}
