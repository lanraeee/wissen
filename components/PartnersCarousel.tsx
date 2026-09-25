'use client'

import { useState, useEffect } from 'react'

interface Partner {
  name: string
  logo: string
  logoInverted?: string
  description?: string
  url?: string
}

const FALLBACK_PARTNERS: Partner[] = [
  {
    name: 'DataCamp Donates',
    logo: '/img/partners/datacamp-logo.jpg',
    logoInverted: '/img/partners/datacamp-logo-inverted.png',
    description: '500+ premium data science and AI courses',
    url: '/partners/datacamp',
  },
]

export default function PartnersCarousel({ partners }: { partners?: Partner[] }) {
  const PARTNERS = partners && partners.length > 0 ? partners : FALLBACK_PARTNERS
  const [current, setCurrent] = useState(0)
  const [autoplay, setAutoplay] = useState(true)

  useEffect(() => {
    if (!autoplay || PARTNERS.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % PARTNERS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [autoplay, PARTNERS.length])

  const next = () => {
    setCurrent((c) => (c + 1) % PARTNERS.length)
    setAutoplay(false)
  }

  const prev = () => {
    setCurrent((c) => (c - 1 + PARTNERS.length) % PARTNERS.length)
    setAutoplay(false)
  }

  if (PARTNERS.length === 0) return null
  const active = PARTNERS[Math.min(current, PARTNERS.length - 1)]

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 24 }}>
        {PARTNERS.length > 1 && (
          <button
            onClick={prev}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Previous partner"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 24, height: 24 }}>
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 120,
            padding: '20px',
          }}
        >
          {active.url ? (
            <a
              href={active.url}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                textDecoration: 'none',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.logo}
                alt={active.name}
                style={{
                  maxHeight: 80,
                  maxWidth: 240,
                  objectFit: 'contain',
                  transition: 'opacity 0.3s',
                }}
              />
              {active.description && (
                <p style={{ margin: 0, fontSize: '.9rem', color: 'var(--muted)', textAlign: 'center' }}>
                  {active.description}
                </p>
              )}
            </a>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.logo}
                alt={active.name}
                style={{
                  maxHeight: 80,
                  maxWidth: 240,
                  objectFit: 'contain',
                }}
              />
              {active.description && (
                <p style={{ margin: 0, fontSize: '.9rem', color: 'var(--muted)', textAlign: 'center' }}>
                  {active.description}
                </p>
              )}
            </>
          )}
        </div>

        {PARTNERS.length > 1 && (
          <button
            onClick={next}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Next partner"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 24, height: 24 }}>
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {PARTNERS.length > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          {PARTNERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrent(idx)
                setAutoplay(false)
              }}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: idx === current ? 'var(--green-700)' : '#d0ccc4',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
              aria-label={`Go to partner ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
