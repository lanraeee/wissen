import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Wissen-Haus Youth Empowerment Foundation'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  // Load the actual logo
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
            Wissen-Haus
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
            Youth Empowerment{'\n'}Foundation
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
              Ibadan, Nigeria · Est. 2025
            </span>
          </div>

          {/* Main headline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                color: '#0F2D1D',
                fontSize: 52,
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: -1.5,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ display: 'flex' }}>Bridging the</span>
              <span style={{ display: 'flex', color: '#B8952A' }}>Skills Gap</span>
              <span style={{ display: 'flex' }}>in Nigeria.</span>
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
              Practical career guidance, mentorship and global exposure for every young Nigerian.
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 32 }}>
              {[
                ['500+', 'Students'],
                ['30+', 'Mentors'],
                ['15+', 'Schools'],
              ].map(([num, label]) => (
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
    { ...size }
  )
}
