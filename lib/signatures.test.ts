import { describe, it, expect } from 'vitest'
import { isValidSignatureImage, cleanSignatureName, MAX_SIGNATURE_BYTES } from './signatures'

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAX+XDSwAAAABJRU5ErkJggg=='

describe('isValidSignatureImage', () => {
  it('accepts a PNG data URL', () => expect(isValidSignatureImage(PNG)).toBe(true))
  it('rejects other formats, URLs and markup', () => {
    expect(isValidSignatureImage('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false)
    expect(isValidSignatureImage('https://evil.example/x.png')).toBe(false)
    expect(isValidSignatureImage('data:image/png;base64,"><script>')).toBe(false)
    expect(isValidSignatureImage(null)).toBe(false)
  })
  it('rejects base64 that is not a PNG', () => {
    expect(isValidSignatureImage('data:image/png;base64,AAAAAAAAAAAA')).toBe(false)
  })
  it('rejects oversize images', () => {
    expect(isValidSignatureImage(PNG + 'A'.repeat(MAX_SIGNATURE_BYTES))).toBe(false)
  })
})

describe('cleanSignatureName', () => {
  it('trims, collapses whitespace and caps length', () => {
    expect(cleanSignatureName('  My   sig ')).toBe('My sig')
    expect(cleanSignatureName('x'.repeat(200))).toHaveLength(80)
    expect(cleanSignatureName(5)).toBe('')
  })
})
