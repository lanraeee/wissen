'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Testimonial {
  id: number
  name: string
  role: string | null
  quote: string
  avatar_url: string | null
  rating: number | null
  featured: boolean
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export default function TestimonialCarousel() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [index, setIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)

  useEffect(() => {
    fetch('/api/testimonials')
      .then(r => r.json())
      .then(d => setItems(d.testimonials || []))
      .catch(() => {})
  }, [])

  const goTo = useCallback((i: number) => {
    if (items.length === 0) return
    const next = (i + items.length) % items.length
    setIndex(next)
    const track = trackRef.current
    if (track) {
      const card = track.children[next] as HTMLElement | undefined
      if (card) track.scrollTo({ left: card.offsetLeft, behavior: 'smooth' })
    }
  }, [items.length])

  useEffect(() => {
    if (items.length < 2) return
    const id = setInterval(() => {
      if (!pausedRef.current) goTo(index + 1)
    }, 6000)
    return () => clearInterval(id)
  }, [index, items.length, goTo])

  if (items.length === 0) return null

  return (
    <div
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
    >
      <div className="tcarousel__track" ref={trackRef}>
        {items.map(t => (
          <div className="testi tcarousel__card" key={t.id}>
            <span className="quote-mark" style={{ fontSize: '3rem' }}>&ldquo;</span>
            {t.rating && (
              <div className="stars" aria-hidden="true">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
            )}
            <p>{t.quote}</p>
            <div className="testi__who">
              <div className="testi__av">
                {t.avatar_url ? <img src={t.avatar_url} alt="" /> : initials(t.name)}
              </div>
              <div>
                <div className="testi__name">{t.name}</div>
                {t.role && <div className="testi__role">{t.role}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="tcarousel__nav">
          <button type="button" aria-label="Previous story" className="tcarousel__arrow" onClick={() => goTo(index - 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="tcarousel__dots">
            {items.map((t, i) => (
              <button
                key={t.id}
                type="button"
                aria-label={`Go to story ${i + 1}`}
                className={`tcarousel__dot${i === index ? ' is-active' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <button type="button" aria-label="Next story" className="tcarousel__arrow" onClick={() => goTo(index + 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      )}
    </div>
  )
}
