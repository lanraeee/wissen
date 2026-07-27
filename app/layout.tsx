import type { Metadata } from 'next'
import './globals.css'
import SiteShell from '@/components/SiteShell'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.wissenhaus.org'),
  title: {
    default: 'Wissen-Haus Youth Empowerment Foundation',
    template: '%s · Wissen-Haus',
  },
  description: 'Bridging the skills gap in Nigeria — practical guidance, mentorship and global exposure for economic independence. 500+ students reached across Ibadan.',
  keywords: ['youth empowerment Nigeria', 'career guidance Nigeria', 'skills gap Nigeria', 'Ibadan youth foundation', 'mentorship Nigeria', 'Wissen-Haus'],
  authors: [{ name: 'Wissen-Haus Youth Empowerment Foundation' }],
  creator: 'Wissen-Haus Youth Empowerment Foundation',
  publisher: 'Wissen-Haus Youth Empowerment Foundation',
  icons: { icon: '/img/logo.png', apple: '/img/logo.png' },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://www.wissenhaus.org',
    siteName: 'Wissen-Haus Youth Empowerment Foundation',
    title: 'Wissen-Haus Youth Empowerment Foundation',
    description: 'Bridging the skills gap in Nigeria — practical guidance, mentorship and global exposure for economic independence.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Wissen-Haus Youth Empowerment Foundation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wissen-Haus Youth Empowerment Foundation',
    description: 'Bridging the skills gap in Nigeria — practical guidance, mentorship and global exposure for economic independence.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteShell>{children}</SiteShell>
        <Analytics />
      </body>
    </html>
  )
}
