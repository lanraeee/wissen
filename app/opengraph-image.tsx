import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Wissen-Haus Youth Empowerment Foundation'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0F2D1D',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '64px 72px',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Gold top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: 'linear-gradient(90deg, #B8952A 0%, #D4AF5A 50%, #B8952A 100%)',
            display: 'flex',
          }}
        />

        {/* Top: wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 8 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#B8952A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F2D1D',
              fontWeight: 900,
              fontSize: 28,
              letterSpacing: -1,
              flexShrink: 0,
            }}
          >
            WH
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 26, letterSpacing: 0.5, lineHeight: 1.2, display: 'flex' }}>
              Wissen-Haus
            </span>
            <span style={{ color: 'rgba(184,149,42,0.85)', fontWeight: 400, fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', display: 'flex' }}>
              Youth Empowerment Foundation
            </span>
          </div>
        </div>

        {/* Main text block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              color: '#ffffff',
              fontSize: 58,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -1,
              display: 'flex',
              flexWrap: 'wrap',
              maxWidth: 900,
            }}
          >
            Empowering Nigerian Youth
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 26,
              lineHeight: 1.4,
              display: 'flex',
              maxWidth: 760,
            }}
          >
            Practical skills, mentorship and global exposure — bridging the skills gap across Nigeria.
          </div>
        </div>

        {/* Bottom: stats + URL */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', gap: 48 }}>
            {[
              ['500+', 'Students Reached'],
              ['12+', 'Career Pathways'],
              ['Ibadan', 'Nigeria'],
            ].map(([num, label]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ color: '#B8952A', fontSize: 28, fontWeight: 800, lineHeight: 1, display: 'flex' }}>{num}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', display: 'flex' }}>{label}</span>
              </div>
            ))}
          </div>
          <span style={{ color: 'rgba(184,149,42,0.6)', fontSize: 18, letterSpacing: 1, display: 'flex' }}>
            wissenhaus.org
          </span>
        </div>

        {/* Bottom gold bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: '#B8952A',
            opacity: 0.4,
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
