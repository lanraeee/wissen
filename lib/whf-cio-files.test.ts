import { describe, it, expect } from 'vitest'
import { safeFileName, validateUpload, contentDisposition, MAX_UPLOAD_BYTES } from './whf-cio-files'

describe('whf-cio file helpers', () => {
  it('strips paths and unsafe characters from names', () => {
    expect(safeFileName('../../etc/passwd')).toBe('passwd')
    expect(safeFileName('C:\\x\\Signed Constitution (v1).pdf')).toBe('Signed-Constitution-v1.pdf')
    expect(safeFileName('...')).toBe('file')
    expect(safeFileName('')).toBe('file')
  })

  it('validates size and type', () => {
    expect(validateUpload({ size: 10, type: 'application/pdf', name: 'a.pdf' })).toBeNull()
    expect(validateUpload({ size: 0, type: 'application/pdf', name: 'a.pdf' })).toMatch(/empty/)
    expect(validateUpload({ size: MAX_UPLOAD_BYTES + 1, type: 'application/pdf', name: 'a.pdf' })).toMatch(/too large/)
    expect(validateUpload({ size: 10, type: 'text/html', name: 'a.html' })).toMatch(/Only PDF/)
  })

  it('builds a header-safe content disposition', () => {
    const h = contentDisposition('evil"\r\nX-Injected: 1.pdf')
    expect(h).not.toMatch(/[\r\n]/)
    expect(h.startsWith('attachment; filename="')).toBe(true)
  })
})
