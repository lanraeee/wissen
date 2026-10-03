import { ImageResponse } from 'next/og'
import sql from '@/lib/db'
import { DEFAULT_BRAND, brandFromSettings, brandify, type Brand } from '@/lib/brand'
import { ogSiteContentKeyFor, type OgCopy } from '@/lib/og-shared'
import { ogSchemaFor } from '@/lib/og-schema'

// The shared 1200x630 share card. Both /opengraph-image (site-wide default) and
// /api/og (per-page, driven by the Open Graph tab) render through here so they
// can never drift apart. Edge-safe: no node-only imports.

export const OG_SIZE = { width: 1200, height: 630 }

// ImageResponse hard-defaults to `public, immutable, max-age=31536000`, which
// the CDN and every crawler take literally -- a Settings or Open Graph edit
// would never show. A short max-age keeps crawlers from hammering it while a
// change is visible within minutes (the page URLs also carry a content hash,
// so a changed card is a new URL and refetches immediately).
export const OG_CACHE = 'public, max-age=300, s-maxage=300, must-revalidate'

export interface StatItem { count: string; suffix: string; label: string }

const FALLBACK_EYEBROW = 'Africa & the Diaspora · Est. 2025'
const FALLBACK_STATS: StatItem[] = [
  { count: '500', suffix: '+', label: 'Students' },
  { count: '30', suffix: '+', label: 'Mentors' },
  { count: '15', suffix: '+', label: 'Schools' },
]
const FALLBACK_SUB = 'Practical career guidance, mentorship and global exposure for young Africans and the diaspora.'

export interface CardData { brand: Brand; tagline: string; eyebrow: string; stats: StatItem[] }

// Best-effort: the card must always render something on-brand even if the DB
// is briefly unreachable from the edge, so every field falls back to a default.
export async function loadCardData(): Promise<CardData> {
  try {
    const [settingsRow, statsRow, heroRow] = await Promise.all([
      sql`SELECT value FROM site_content WHERE key = 'site_settings'`,
      sql`SELECT value FROM site_content WHERE key = 'homepage_stats'`,
      sql`SELECT value FROM site_content WHERE key = 'homepage_hero_slides'`,
    ])
    const tagline = (settingsRow[0]?.value as { tagline?: string } | undefined)?.tagline
    const stats = statsRow[0]?.value as StatItem[] | undefined
    const slides = heroRow[0]?.value as { eyebrow?: string }[] | undefined
    return {
      brand: brandFromSettings(settingsRow[0]?.value),
      tagline: tagline || 'Empowering Youth, Shaping Futures',
      eyebrow: slides?.[0]?.eyebrow || FALLBACK_EYEBROW,
      stats: Array.isArray(stats) && stats.length >= 3 ? stats.slice(0, 3) : FALLBACK_STATS,
    }
  } catch {
    return { brand: DEFAULT_BRAND, tagline: 'Empowering Youth, Shaping Futures', eyebrow: FALLBACK_EYEBROW, stats: FALLBACK_STATS }
  }
}

/** Saved (else default) Open Graph copy for one page, brand applied -- the same text the page's <meta> tags use. */
export async function loadPageCopy(slug: string, brand: Brand): Promise<Pick<OgCopy, 'ogTitle' | 'description'> | null> {
  const schema = ogSchemaFor(slug)
  if (!schema) return null
  let saved: Partial<OgCopy> | undefined
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = ${ogSiteContentKeyFor(slug)}`
    saved = rows[0]?.value as Partial<OgCopy> | undefined
  } catch { /* defaults */ }
  const pick = (v: unknown, d: string) => brandify((typeof v === 'string' && v.trim()) || d, brand)
  return { ogTitle: pick(saved?.ogTitle, schema.defaultOgTitle), description: pick(saved?.description, schema.defaultDescription) }
}

export async function loadLogo(): Promise<string | null> {
  try {
    const buf = await fetch('https://www.wissenhaus.org/img/logo.png').then(r => r.arrayBuffer())
    return `data:image/png;base64,${Buffer.from(buf).toString('base64')}`
  } catch { return null }
}

export interface CardProps {
  data: CardData
  logoDataUrl: string | null
  /** Page-specific text; omitted for the site-wide card (tagline + standard blurb). */
  page?: { title: string; description: string }
}

export function renderCard({ data, logoDataUrl, page }: CardProps) {
  const { brand, eyebrow, stats } = data
  const brandName = brand.name
  const descriptor = brand.descriptor.toUpperCase()
  let line1: string, line2: string, sub: string, headlineSize: number
  if (page) {
    const t = page.title.trim().slice(0, 90)
    line1 = t; line2 = ''
    headlineSize = t.length <= 26 ? 56 : t.length <= 48 ? 44 : 36
    sub = page.description.trim().slice(0, 180)
  } else {
    const [a, b] = data.tagline.split(',').map(s => s.trim())
    line1 = a || 'Empowering Youth'; line2 = b || 'Shaping Futures'
    headlineSize = 56
    sub = FALLBACK_SUB
  }
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left panel — deep green */}
        <div
          style={{
            width: 420,
            height: '100%',
            background: 'linear-gradient(160deg, #0F2D1D 0%, #1a4a2e 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '56px 48px',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {/* Gold vertical rule on the right edge */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 4,
              height: '100%',
              background: 'linear-gradient(180deg, transparent, #B8952A 20%, #D4AF5A 50%, #B8952A 80%, transparent)',
              display: 'flex',
            }}
          />

          {/* Logo */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: '4px solid #B8952A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 28,
              overflow: 'hidden',
              background: '#0F2D1D',
              boxShadow: '0 0 0 8px rgba(184,149,42,0.15)',
              flexShrink: 0,
            }}
          >
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoDataUrl} width={112} height={112} style={{ borderRadius: '50%', objectFit: 'cover' }} alt="" />
            ) : (
              <span style={{ color: '#B8952A', fontSize: 42, fontWeight: 900, display: 'flex' }}>WH</span>
            )}
          </div>

          {/* Wordmark */}
          <span
            style={{
              color: '#ffffff',
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 0.5,
              lineHeight: 1.1,
              textAlign: 'center',
              display: 'flex',
              marginBottom: 8,
            }}
          >
            {brandName}
          </span>
          <span
            style={{
              color: '#B8952A',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: 'uppercase',
              textAlign: 'center',
              display: 'flex',
              lineHeight: 1.4,
            }}
          >
            {descriptor}
          </span>

          {/* Divider */}
          <div
            style={{
              width: 48,
              height: 2,
              background: '#B8952A',
              borderRadius: 2,
              margin: '24px auto 0',
              opacity: 0.6,
              display: 'flex',
            }}
          />
        </div>

        {/* Right panel — ivory/cream */}
        <div
          style={{
            flex: 1,
            background: '#FEFCF5',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '52px 56px',
            position: 'relative',
          }}
        >
          {/* Gold top bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              background: 'linear-gradient(90deg, #B8952A, #D4AF5A, #B8952A)',
              display: 'flex',
            }}
          />

          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <div style={{ width: 28, height: 2, background: '#B8952A', display: 'flex', borderRadius: 2 }} />
            <span
              style={{
                color: '#B8952A',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: 'uppercase',
                display: 'flex',
              }}
            >
              {eyebrow}
            </span>
          </div>

          {/* Main headline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                color: '#0F2D1D',
                fontSize: headlineSize,
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: -1.5,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ display: 'flex' }}>{line1}</span>
              {line2 && <span style={{ display: 'flex', color: '#B8952A' }}>{line2}</span>}
            </div>
            <p
              style={{
                color: '#4a5a4f',
                fontSize: 18,
                lineHeight: 1.5,
                margin: 0,
                display: 'flex',
                maxWidth: 480,
              }}
            >
              {sub}
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 32 }}>
              {stats.map(s => [`${s.count}${s.suffix}`, s.label] as const).map(([num, label]) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span
                    style={{
                      color: '#0F2D1D',
                      fontSize: 30,
                      fontWeight: 800,
                      lineHeight: 1,
                      display: 'flex',
                    }}
                  >
                    {num}
                  </span>
                  <span
                    style={{
                      color: '#9aaa9f',
                      fontSize: 11,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      display: 'flex',
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <span
              style={{
                color: '#B8952A',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 1,
                display: 'flex',
                opacity: 0.8,
              }}
            >
              wissenhaus.org
            </span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, headers: { 'Cache-Control': OG_CACHE } }
  )
}
