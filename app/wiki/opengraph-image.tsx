import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Wissen-Haus Youth Empowerment Foundation — Encyclopedia Overview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const logoSrc = await fetch('https://www.wissenhaus.org/img/logo.png')
    .then((r) => r.arrayBuffer())
    .catch(() => null)

  const logoDataUrl = logoSrc
    ? `data:image/png;base64,${Buffer.from(logoSrc).toString('base64')}`
    : null

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#FEFCF5',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top gold bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #B8952A, #D4AF5A, #B8952A)', display: 'flex' }} />

        {/* Left green sidebar */}
        <div
          style={{
            width: 380,
            height: '100%',
            background: 'linear-gradient(160deg, #0F2D1D 0%, #1a4a2e 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 40px',
            flexShrink: 0,
          }}
        >
          {logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoDataUrl} width={100} height={100} style={{ borderRadius: '50%', objectFit: 'cover', border: '3px solid #B8952A', marginBottom: 20 }} alt="" />
          ) : (
            <span style={{ color: '#B8952A', fontSize: 40, fontWeight: 900, display: 'flex', marginBottom: 20 }}>WH</span>
          )}
          <span style={{ color: '#fff', fontSize: 24, fontWeight: 800, textAlign: 'center', display: 'flex', marginBottom: 6 }}>Wissen-Haus</span>
          <span style={{ color: '#B8952A', fontSize: 10, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center', display: 'flex', lineHeight: 1.5 }}>
            Youth Empowerment{'\n'}Foundation
          </span>
          <div style={{ width: 40, height: 2, background: '#B8952A', borderRadius: 2, margin: '20px auto 0', opacity: 0.6, display: 'flex' }} />
        </div>

        {/* Right content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '52px 56px', gap: 0 }}>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 24, height: 2, background: '#B8952A', display: 'flex', borderRadius: 2 }} />
            <span style={{ color: '#B8952A', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', display: 'flex' }}>
              Foundation Overview
            </span>
          </div>

          <div style={{ color: '#0F2D1D', fontSize: 44, fontWeight: 900, lineHeight: 1.1, letterSpacing: -1, display: 'flex', flexDirection: 'column', marginBottom: 20 }}>
            <span style={{ display: 'flex' }}>Encyclopedic</span>
            <span style={{ display: 'flex', color: '#B8952A' }}>Reference</span>
            <span style={{ display: 'flex' }}>Entry</span>
          </div>

          <p style={{ color: '#4a5a4f', fontSize: 17, lineHeight: 1.5, margin: 0, display: 'flex', maxWidth: 440 }}>
            History, programmes, policy research, and mission of the Wissen-Haus Youth Empowerment Foundation, Ibadan, Nigeria.
          </p>

          <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#1a3c2e', color: '#f4f0e7', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, letterSpacing: 1, display: 'flex' }}>
              wissenhaus.org/wiki
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
