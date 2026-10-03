// Client-safe brand helpers. The brand is two admin-editable settings (Admin →
// Settings → General): the display name ("Wissen-Haus") and the descriptor
// shown beside it ("Empowerment Foundation"). Everywhere the site's own copy
// says the default brand, brandify() swaps in the configured one at read time,
// so a rename takes effect on the next request with no redeploy.

export interface Brand { name: string; descriptor: string }

export const DEFAULT_BRAND: Brand = { name: 'Wissen-Haus', descriptor: 'Empowerment Foundation' }
export const BRAND_MAX = 60

const clean = (v: unknown, fallback: string, allowEmpty: boolean) => {
  if (typeof v !== 'string') return fallback
  const t = v.replace(/[\r\n<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, BRAND_MAX)
  return t || (allowEmpty ? '' : fallback)
}

/** Reads brand_name / brand_descriptor from a saved site_settings value. An empty name falls back to the default; an empty descriptor is allowed (name only). */
export function brandFromSettings(settings: unknown): Brand {
  const s = (settings && typeof settings === 'object' ? settings : {}) as Record<string, unknown>
  const name = clean(s.brand_name, DEFAULT_BRAND.name, false)
  const descriptor = 'brand_descriptor' in s ? clean(s.brand_descriptor, DEFAULT_BRAND.descriptor, true) : DEFAULT_BRAND.descriptor
  return { name, descriptor }
}

export const fullName = (b: Brand) => (b.descriptor ? `${b.name} ${b.descriptor}` : b.name)

const FULL_DEFAULT = /Wissen-Haus Empowerment Foundation/g
const SHORT_DEFAULT = /Wissen-Haus/g

/** Replaces the built-in brand in a string. No-op for the default brand. */
export function brandify(text: string, brand: Brand): string {
  if (brand.name === DEFAULT_BRAND.name && brand.descriptor === DEFAULT_BRAND.descriptor) return text
  return text
    .replace(FULL_DEFAULT, () => fullName(brand))
    .replace(SHORT_DEFAULT, () => brand.name)
}

/** brandify over every string in a plain object/array tree (used for metadata). */
export function brandifyDeep<T>(value: T, brand: Brand): T {
  if (typeof value === 'string') return brandify(value, brand) as unknown as T
  if (Array.isArray(value)) return value.map(v => brandifyDeep(v, brand)) as unknown as T
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, brandifyDeep(v, brand)])) as T
  }
  return value
}
