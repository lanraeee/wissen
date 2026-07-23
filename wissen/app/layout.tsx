import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import ScrollEffects from '@/components/ScrollEffects'
import PageLoader from '@/components/PageLoader'

export const metadata: Metadata = {
  title: 'Wissen-Haus Youth Empowerment Foundation',
  description: 'Bridging the skills gap in Nigeria — practical guidance, mentorship and global exposure for economic independence.',
  icons: { icon: '/img/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PageLoader />
        <Navigation />
        <main id="main">{children}</main>
        <Footer />
        <ScrollEffects />
      </body>
    </html>
  )
}
