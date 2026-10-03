'use client'

import { usePathname } from 'next/navigation'
import Navigation from '@/components/Navigation'
import ScrollEffects from '@/components/ScrollEffects'
import PageLoader from '@/components/PageLoader'
import LiveChat from '@/components/support/LiveChat'
import type { Brand } from '@/lib/brand'

export default function SiteShell({ children, footer, brand }: { children: React.ReactNode; footer: React.ReactNode; brand: Brand }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  if (isAdmin) return <>{children}</>

  return (
    <>
      <PageLoader />
      <Navigation brand={brand} />
      <main id="main">{children}</main>
      {footer}
      <ScrollEffects />
      {/* Sits inside this branch, so it never renders over the admin panel --
          staff answer tickets in the queue, not through the visitor widget.
          It is also left off the ticket pages themselves, where the thread on
          the page already is the conversation. */}
      {!pathname.startsWith('/support') && <LiveChat />}
    </>
  )
}
