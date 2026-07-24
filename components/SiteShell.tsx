'use client'

import { usePathname } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import ScrollEffects from '@/components/ScrollEffects'
import PageLoader from '@/components/PageLoader'

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  if (isAdmin) return <>{children}</>

  return (
    <>
      <PageLoader />
      <Navigation />
      <main id="main">{children}</main>
      <Footer />
      <ScrollEffects />
    </>
  )
}
