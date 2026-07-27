'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const CHEV = (
  <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const NAV = [
  {
    key: 'about', label: 'About', menu: [
      ['/about/story', 'Our Story', 'The Wissen-Haus journey'],
      ['/founder', 'Meet the Founder', 'Learn about Benz Olagbaye'],
      ['/team', 'Our Team', 'The people who hold it together'],
      ['/contact', 'Contact', 'Get in touch with us'],
    ]
  },
  {
    key: 'programmes', label: 'Programmes', menu: [
      ['/programmes', 'All Programmes', 'The full overview'],
      ['/career-clarity-trade-fair', 'Career Clarity Trade Fair', 'For all secondary school students'],
      ['/opportunity-blueprint', 'Opportunity Blueprint', 'Our flagship podcast'],
      ['/impact-content', 'Impact Content', 'Social-impact storytelling'],
      ['/events', 'Events & Cafés', 'Networking, workshops & more'],
    ]
  },
  {
    key: 'community', label: 'Community', menu: [
      ['/community', 'Community Hub', 'Where youth grow together'],
      ['/community#opportunities', 'Opportunity Hub', 'Scholarships, jobs & grants'],
      ['/community#learning', 'Learning Library', 'Free courses & toolkits'],
    ]
  },
  {
    key: 'careers', label: 'Careers', menu: [
      ['/careers', 'Careers Overview', 'Jobs, internships & opportunities'],
      ['/career-pathways', 'Career Pathways Assessment', 'Get your personalised roadmap'],
      ['/career-assessment', 'Career Assessment Accelerator', '10-question quiz · 12 career profiles'],
    ]
  },
  { key: 'policy', label: 'Policy', href: '/policy-research' },
  {
    key: 'involved', label: 'Get Involved', menu: [
      ['/volunteer', 'Volunteer', 'Mentor & give your time'],
      ['/partner', 'Partner With Us', 'For institutions'],
      ['/donate', 'Donate', 'Fuel the mission'],
    ]
  },
]

const ACTIVE_MAP: Record<string, string> = {
  '/about': 'about',
  '/about/story': 'about',
  '/founder': 'about',
  '/team': 'about',
  '/impact': 'about',
  '/contact': 'about',
  '/programmes': 'programmes',
  '/career-clarity-trade-fair': 'programmes',
  '/events': 'programmes',
  '/opportunity-blueprint': 'programmes',
  '/impact-content': 'programmes',
  '/community': 'community',
  '/jobs': 'community',
  '/internships': 'community',
  '/scholarships': 'community',
  '/competitions': 'community',
  '/careers': 'careers',
  '/career-pathways': 'careers',
  '/career-assessment': 'careers',
  '/policy-research': 'policy',
  '/volunteer': 'involved',
  '/partner': 'involved',
  '/donate': 'involved',
}

export default function Navigation() {
  const pathname = usePathname()
  const activeKey = ACTIVE_MAP[pathname] || ''
  const [menuOpen, setMenuOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Element
      if (!t.closest('.has-menu') && !t.closest('.mobile-menu')) setOpenGroup(null)
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenGroup(null) }
    document.addEventListener('click', handler)
    document.addEventListener('keydown', keyHandler)
    return () => { document.removeEventListener('click', handler); document.removeEventListener('keydown', keyHandler) }
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // close menu on nav
  useEffect(() => {
    setMenuOpen(false)
    setOpenGroup(null)
  }, [pathname])

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="scroll-progress"><ScrollBar /></div>
      <header ref={headerRef} className={`site-header${scrolled ? ' scrolled' : ''}`}>
        <div className="wrap wrap-wide">
          <nav className="nav" aria-label="Primary">
            <Link className="brand" href="/">
              <Image src="/img/logo.png" alt="Wissen-Haus logo" width={40} height={40} />
              <span>Wissen-Haus<small>Youth Empowerment</small></span>
            </Link>

            <ul className="nav-links">
              {NAV.map(item => {
                const isActive = item.key === activeKey
                if ('menu' in item && item.menu) {
                  const open = openGroup === item.key
                  return (
                    <li key={item.key} className="has-menu">
                      <button
                        className={`nav-link${isActive ? ' active' : ''}`}
                        aria-expanded={open}
                        aria-haspopup="true"
                        onClick={e => { e.preventDefault(); setOpenGroup(open ? null : item.key) }}
                      >
                        {item.label} {CHEV}
                      </button>
                      <div className={`mega${open ? ' open' : ''}`}>
                        {item.menu.map(([href, title, desc]) => (
                          <Link key={href} href={href}>
                            <span className="mega-t">{title}</span>
                            <span className="mega-d">{desc}</span>
                          </Link>
                        ))}
                      </div>
                    </li>
                  )
                }
                return (
                  <li key={item.key}>
                    <Link className={`nav-link${isActive ? ' active' : ''}`} href={(item as { href: string }).href}>
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="nav-cta">
              <Link href="/volunteer" className="btn btn--ghost btn--sm">Get Involved</Link>
              <Link href="/donate" className="btn btn--sm">Donate</Link>
            </div>

            <button
              className={`nav-toggle${menuOpen ? ' open' : ''}`}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(v => !v)}
            >
              <span /><span /><span />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} id="mobileMenu">
        <nav>
          {NAV.map(item => {
            if ('menu' in item && item.menu) {
              const open = openGroup === item.key
              return (
                <div key={item.key} className={`m-group${open ? ' open' : ''}`}>
                  <button
                    className="m-acc"
                    aria-expanded={open}
                    onClick={() => setOpenGroup(open ? null : item.key)}
                  >
                    {item.label} {CHEV}
                  </button>
                  <div className="m-panel" style={{ maxHeight: open ? '500px' : '0px' }}>
                    <div className="m-panel-inner">
                      {item.menu.map(([href, title]) => (
                        <Link key={href} href={href}>{title}</Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }
            return (
              <Link key={item.key} className="m-link" href={(item as { href: string }).href}>
                {item.label}
              </Link>
            )
          })}
          <div className="m-cta">
            <Link className="btn btn--outline-light" href="/volunteer">Get Involved</Link>
            <Link className="btn btn--light" href="/donate">Donate</Link>
          </div>
        </nav>
      </div>
    </>
  )
}

function ScrollBar() {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const update = () => {
      const h = document.documentElement
      setWidth((h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) * 100)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  return <span style={{ width: `${width}%` }} />
}
