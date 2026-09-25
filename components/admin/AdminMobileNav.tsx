'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { NAV, isNavActive } from './AdminNav'
import { NAV_ICONS, MoreIcon, CloseIcon, MenuIcon } from './AdminIcons'

// The four most-reached-for sections get a permanent bottom-tab slot (mobile
// app pattern -- Dashboard/Users/Submissions/Content are what a small-team
// admin checks daily); everything else lives behind "More", opened as a
// bottom sheet rather than a fifth+ tab that would cramp the bar.
const PRIMARY_HREFS = ['/admin', '/admin/submissions', '/admin/users', '/admin/content']
const PRIMARY = NAV.filter(([, href]) => PRIMARY_HREFS.includes(href))
const OVERFLOW = NAV.filter(([, href]) => !PRIMARY_HREFS.includes(href))

function pageTitle(pathname: string): string {
  const match = NAV.find(([, href]) => isNavActive(pathname, href))
  return match?.[0] ?? 'Admin'
}

export default function AdminMobileNav({ email }: { email: string }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const overflowActive = OVERFLOW.some(([, href]) => isNavActive(pathname, href))

  return (
    <>
      {/* Top bar: menu, current page title, avatar -- app-shell chrome, mobile only */}
      <header className="admin-topbar">
        <button className="admin-topbar__btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <MenuIcon size={22} />
        </button>
        <span className="admin-topbar__title">{pageTitle(pathname)}</span>
        <div className="admin-topbar__avatar" title={email}>{email[0]?.toUpperCase()}</div>
      </header>

      {/* Bottom tab bar -- mobile only */}
      <nav className="admin-bottom-nav" aria-label="Admin sections">
        {PRIMARY.map(([label, href]) => {
          const Icon = NAV_ICONS[href]
          const active = isNavActive(pathname, href)
          return (
            <a key={href} href={href} className={`admin-bottom-nav__item${active ? ' active' : ''}`}>
              <Icon size={21} />
              <span>{label === 'Donation Projects' ? 'Projects' : label}</span>
            </a>
          )
        })}
        <button
          className={`admin-bottom-nav__item${overflowActive ? ' active' : ''}`}
          onClick={() => setMoreOpen(true)}
        >
          <MoreIcon size={21} />
          <span>More</span>
        </button>
      </nav>

      {/* Full nav drawer (from the top-bar menu button) */}
      {drawerOpen && (
        <div className="admin-sheet-backdrop" onClick={e => { if (e.target === e.currentTarget) setDrawerOpen(false) }}>
          <div className="admin-drawer">
            <div className="admin-drawer__head">
              <div>
                <div style={{ fontWeight: 700, fontSize: '.9rem' }}>Wissen-Haus</div>
                <div style={{ fontSize: '.72rem', color: 'rgba(244,240,231,.5)' }}>Admin Panel</div>
              </div>
              <button className="admin-topbar__btn" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <CloseIcon size={20} />
              </button>
            </div>
            <nav style={{ padding: '8px 12px', flex: 1, overflowY: 'auto' }}>
              {NAV.map(([label, href]) => {
                const Icon = NAV_ICONS[href]
                const active = isNavActive(pathname, href)
                return (
                  <a
                    key={href} href={href} className="admin-nav-link"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, ...(active ? { background: 'rgba(244,240,231,.12)', color: '#f4f0e7', fontWeight: 700 } : undefined) }}
                  >
                    <Icon size={18} />
                    {label}
                  </a>
                )
              })}
            </nav>
            <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(244,240,231,.12)', fontSize: '.78rem', color: 'rgba(244,240,231,.45)' }}>
              {email}
            </div>
          </div>
        </div>
      )}

      {/* "More" bottom sheet (from the bottom-tab More button) */}
      {moreOpen && (
        <div className="admin-sheet-backdrop" onClick={e => { if (e.target === e.currentTarget) setMoreOpen(false) }}>
          <div className="admin-more-sheet">
            <div className="admin-more-sheet__handle" />
            <div className="admin-more-sheet__grid">
              {OVERFLOW.map(([label, href]) => {
                const Icon = NAV_ICONS[href]
                const active = isNavActive(pathname, href)
                return (
                  <a key={href} href={href} className={`admin-more-sheet__item${active ? ' active' : ''}`}>
                    <Icon size={22} />
                    <span>{label}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
