'use client'

import { usePathname } from 'next/navigation'
import { NAV_ICONS } from './AdminIcons'

export const NAV = [
  ['Dashboard', '/admin'],
  ['Analytics', '/admin/analytics'],
  ['Users', '/admin/users'],
  ['Submissions', '/admin/submissions'],
  ['Opportunities', '/admin/opportunities'],
  ['Courses & Certs', '/admin/courses'],
  ['Donation Projects', '/admin/projects'],
  ['Career Fair', '/admin/career-fair'],
  ['Testimonials', '/admin/testimonials'],
  ['Content', '/admin/content'],
  ['Settings', '/admin/settings'],
] as const

export function isNavActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
}

export default function AdminNav() {
  const pathname = usePathname()
  return (
    <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
      {NAV.map(([label, href]) => {
        const active = isNavActive(pathname, href)
        const Icon = NAV_ICONS[href]
        return (
          <a
            key={href}
            href={href}
            className="admin-nav-link"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              ...(active ? { background: 'rgba(244,240,231,.12)', color: '#f4f0e7', fontWeight: 700 } : undefined),
            }}
          >
            <Icon size={17} />
            {label}
          </a>
        )
      })}
    </nav>
  )
}
