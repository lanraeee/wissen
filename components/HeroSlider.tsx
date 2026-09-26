'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export interface HeroContent {
  eyebrow: string
  headlineLine1: string
  headlineLine2: string
  lead: string
  ctaText: string
  ctaHref: string
  image?: string
}

interface StatItem {
  count: string
  suffix: string
  label: string
}

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const AUTO_ADVANCE_MS = 8000

// Renders the homepage hero as a rotating slider when there's more than one
// slide (managed in /admin/content -> Homepage Hero & Stats). Deliberately
// does NOT use the site's scroll-triggered .reveal/.reveal-words classes --
// those are made visible by a one-time IntersectionObserver/DOM-mutation
// pass in ScrollEffects.tsx that runs once per page load, so a slide
// re-rendered later (auto-advance or a dot click) would never get its
// .in class added and would stay invisible. hero-slide-in is a plain CSS
// keyframe instead, which replays correctly on every slide change.
export default function HeroSlider({ slides, stats }: { slides: HeroContent[]; stats: StatItem[] }) {
  const [index, setIndex] = useState(0)
  const count = slides.length

  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count])

  useEffect(() => {
    if (count <= 1) return
    const timer = setInterval(() => setIndex(i => (i + 1) % count), AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [count])

  const hero = slides[index] ?? slides[0]

  return (
    <section className="hero">
      <span className="blob blob--green" />
      <span className="blob blob--red" />
      <div className="wrap wrap-wide">
        <div className="hero-grid">
          <div className="hero-copy hero-slide-in" key={`copy-${index}`}>
            <span className="eyebrow">{hero.eyebrow}</span>
            <h1 className="display-xl mt-s">{hero.headlineLine1}<br />{hero.headlineLine2}</h1>
            <p className="lead mt-s">{hero.lead}</p>
            <div className="hero-cta mt-s">
              <Link href={hero.ctaHref} className="btn btn--lg mag">
                {hero.ctaText} {ARROW}
              </Link>
            </div>
            {count > 1 && (
              <div className="hero-dots" role="tablist" aria-label="Hero slides">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Show slide ${i + 1} of ${count}`}
                    className={`hero-dot${i === index ? ' active' : ''}`}
                    onClick={() => goTo(i)}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="hero-media tilt hero-slide-in" key={`media-${index}`}>
            <span className="hero-ring hero-ring--1" />
            <span className="hero-ring hero-ring--2" />
            <div className="frame tilt-inner shine">
              <Image src={hero.image || '/img/hero-students.jpg'} alt={hero.headlineLine1} fill style={{ objectFit: 'cover' }} />
            </div>
            <div className="hero-badge hero-badge--tl">
              <span className="n" data-count={stats[0].count} data-suffix={stats[0].suffix}>{stats[0].count}{stats[0].suffix}</span>
              <span className="t">{stats[0].label.toLowerCase()}</span>
            </div>
            <div className="hero-badge hero-badge--br">
              <span className="n" data-count={stats[2].count} data-suffix={stats[2].suffix}>{stats[2].count}{stats[2].suffix}</span>
              <span className="t">{stats[2].label.toLowerCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
