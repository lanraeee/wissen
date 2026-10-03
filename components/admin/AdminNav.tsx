'use client'

import { usePathname } from 'next/navigation'
import { canAccessAdminPath, type AdminRole } from '@/lib/admin-access'
import { NAV_ICONS } from './AdminIcons'
import NavBadge from './NavBadge'
import { useSubmissionsBadge } from './useSubmissionsBadge'

export const NAV = [
  ['Dashboard', '/admin'],
  ['Analytics', '/admin/analytics'],
  ['AI Agent', '/admin/ai'],
  ['Knowledge Base', '/admin/knowledge'],
  ['Activity Log', '/admin/activity'],
  ['Users', '/admin/users'],
  ['Support', '/admin/support'],
  ['Contact', '/admin/contact'],
  ['Volunteers', '/admin/volunteer'],
  ['Partners', '/admin/partner'],
  ['Donations', '/admin/donations'],
  ['Bank Transfers', '/admin/bank-transfers'],
  ['Scholarships', '/admin/scholarships'],
  ['Opportunities', '/admin/opportunities'],
  ['Courses & Certs', '/admin/courses'],
  ['Donation Projects', '/admin/projects'],
  ['Career Fair', '/admin/career-fair'],
  ['Testimonials', '/admin/testimonials'],
  ['Content', '/admin/content'],
  ['Content Approvals', '/admin/content-approvals'],
  ['WHF-CIO Records', '/admin/whf-cio'],
  ['Newsletter', '/admin/newsletter'],
  ['Email Templates', '/admin/email-templates'],
  ['Settings', '/admin/settings'],
] as const

// Maps a nav href to its key in useSubmissionsBadge()'s pending-counts
// object (app/api/admin/inbox-counts). Donations/Opportunities/etc. have no
// pending-triage concept, so they're simply absent here -- no badge shown.
export const BADGE_KEYS: Record<string, string> = {
  '/admin/support': 'support',
  '/admin/contact': 'contact',
  '/admin/volunteer': 'volunteer',
  '/admin/partner': 'partner',
  '/admin/bank-transfers': 'bank_transfer',
  '/admin/scholarships': 'scholarship',
  '/admin/content-approvals': 'content_approval',
  '/admin/knowledge': 'kb_pending',
}

export function isNavActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
}

export default function AdminNav({ role, canUseAgent }: { role: AdminRole; canUseAgent: boolean }) {
  const pathname = usePathname()
  const counts = useSubmissionsBadge()

  return (
    <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
      {NAV.filter(([, href]) => canAccessAdminPath(role, href, canUseAgent)).map(([label, href]) => {
        const active = isNavActive(pathname, href)
        const Icon = NAV_ICONS[href]
        const badgeKey = BADGE_KEYS[href]
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
            {badgeKey && <NavBadge count={counts[badgeKey] ?? 0} style={{ marginLeft: 'auto' }} />}
          </a>
        )
      })}
    </nav>
  )
}
