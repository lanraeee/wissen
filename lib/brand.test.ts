import { describe, expect, it } from 'vitest'
import { DEFAULT_BRAND, brandFromSettings, brandify, brandifyDeep, fullName } from './brand'

const B = { name: 'Acme', descriptor: 'Trust' }

describe('brand', () => {
  it('defaults when nothing or junk is saved', () => {
    expect(brandFromSettings(null)).toEqual(DEFAULT_BRAND)
    expect(brandFromSettings({ brand_name: '   ' })).toEqual(DEFAULT_BRAND)
    expect(brandFromSettings({ brand_name: 5 })).toEqual(DEFAULT_BRAND)
  })
  it('allows an empty descriptor but not an empty name', () => {
    expect(brandFromSettings({ brand_name: 'Acme', brand_descriptor: '' })).toEqual({ name: 'Acme', descriptor: '' })
    expect(fullName({ name: 'Acme', descriptor: '' })).toBe('Acme')
  })
  it('strips markup and limits length', () => {
    expect(brandFromSettings({ brand_name: '<b>Acme</b>\n' }).name).toBe('b Acme /b')
    expect(brandFromSettings({ brand_name: 'x'.repeat(200) }).name.length).toBe(60)
  })
  it('replaces the full and short default names', () => {
    expect(brandify('Wissen-Haus Empowerment Foundation runs Wissen-Haus', B)).toBe('Acme Trust runs Acme')
    expect(brandify('The Wissen-Haus journey', { name: 'Acme', descriptor: '' })).toBe('The Acme journey')
  })
  it('does not treat replacement text specially', () => {
    expect(brandify('Wissen-Haus', { name: "A$&B$1", descriptor: '' })).toBe('A$&B$1')
  })
  it('is a no-op for the default brand and leaves other spellings alone', () => {
    expect(brandify('Wissen-Haus', DEFAULT_BRAND)).toBe('Wissen-Haus')
    expect(brandify('Wissen Haus Foundation', B)).toBe('Wissen Haus Foundation')
  })
  it('maps nested metadata', () => {
    expect(brandifyDeep({ a: ['Wissen-Haus'], n: 1, u: new URL('https://x.org') }, B)).toMatchObject({ a: ['Acme'], n: 1 })
  })
})
