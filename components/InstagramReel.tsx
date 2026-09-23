'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

const REEL_URL = 'https://www.instagram.com/reel/DaGV76FIV2u/'
const EMBED_URL = 'https://www.instagram.com/reel/DaGV76FIV2u/embed/'

export default function InstagramReel() {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const loadedRef = useRef(false)

  // The embed can be blocked or slow. If it never signals load, keep the
  // poster and show an explicit failure state instead of a black box.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!loadedRef.current) setFailed(true)
    }, 6000)
    return () => clearTimeout(t)
  }, [])

  const onLoad = () => {
    loadedRef.current = true
    setFailed(false)
    setLoaded(true)
  }

  return (
    <div className="reel-frame">
      {/* Permanent poster: the frame is never a bare black box, even if the
          embed loads blank or not at all. */}
      <Image
        className="reel-frame__img"
        src="/img/community.jpg"
        alt="Wissen-Haus students and mentors"
        fill
        sizes="380px"
        style={{ objectFit: 'cover' }}
      />
      <iframe
        src={EMBED_URL}
        title="Wissen-Haus on Instagram"
        loading="lazy"
        scrolling="no"
        allow="encrypted-media; clipboard-write"
        className={loaded ? 'is-loaded' : ''}
        onLoad={onLoad}
      />
      <a
        href={REEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`reel-frame__poster${loaded ? ' is-hidden' : ''}`}
        aria-label="Watch the Wissen-Haus reel on Instagram"
      >
        <span className="reel-frame__play" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </span>
        <span className="reel-frame__caption">
          {failed ? 'Reel unavailable right now — watch on Instagram' : 'Watch the reel'}
        </span>
      </a>
      <span className="reel-frame__ring" />
    </div>
  )
}
