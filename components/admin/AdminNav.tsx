'use client'

import { usePathname } from 'next/navigation'

const NAV = [
  ['Dashboard', '/admin'],
  ['Analytics', '/admin/analytics'],
  ['Users', '/admin/users'],
  ['Submissions', '/admin/submissions'],
  ['Opportunities', '/admin/opportunities'],
  ['Courses & Certs', '/admin/courses'],
  ['Content', '/admin/content'],
  ['Settings', '/admin/settings'],
]

export default function AdminNav() {
  const pathname = usePathname()
  return (
    <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
      {NAV.map(([label, href]) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
        return (
          <a
            key={href}
            href={href}
            className="admin-nav-link"
            style={active ? {
              background: 'rgba(244,240,231,.12)',
              color: '#f4f0e7',
              fontWeight: 700,
            } : undefined}
          >
            {label}
          </a>
        )
      })}
    </nav>
  )
}
