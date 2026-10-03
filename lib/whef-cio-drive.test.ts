import { describe, it, expect } from 'vitest'
import { buildMultipart, driveConfigured } from './whef-cio-drive'

describe('whef-cio drive backup', () => {
  it('builds a multipart/related body with metadata then raw bytes', async () => {
    const bytes = new TextEncoder().encode('%PDF-binary\u0000data').buffer
    const text = await buildMultipart({ name: 'a.pdf', parents: ['F'] }, bytes, 'application/pdf', 'B').text()
    expect(text).toBe('--B\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{"name":"a.pdf","parents":["F"]}\r\n--B\r\nContent-Type: application/pdf\r\n\r\n%PDF-binary\u0000data\r\n--B--')
  })

  it('is only configured when all three OAuth credentials are present', () => {
    const keys = ['GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_SECRET', 'GOOGLE_DRIVE_REFRESH_TOKEN', 'GOOGLE_DRIVE_FOLDER_ID']
    const saved = keys.map(k => process.env[k])
    keys.forEach(k => delete process.env[k])
    expect(driveConfigured()).toBe(false)
    keys.slice(0, 2).forEach(k => (process.env[k] = 'x'))
    expect(driveConfigured()).toBe(false)
    process.env[keys[2]] = 'x'
    expect(driveConfigured()).toBe(true)
    keys.forEach((k, i) => { if (saved[i] === undefined) delete process.env[k]; else process.env[k] = saved[i] })
  })
})
