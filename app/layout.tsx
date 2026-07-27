import type { Metadata } from 'next'
import './globals.css'
import SiteShell from '@/components/SiteShell'
import sql from '@/lib/db'

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let loaderEnabled = true
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = 'site_settings'`
    const val = rows[0]?.value as { loader_enabled?: boolean } | undefined
    if (val?.loader_enabled === false) loaderEnabled = false
  } catch {
    // keep default
  }

  return (
    <html lang="en">
      <body>
        <SiteShell loaderEnabled={loaderEnabled}>{children}</SiteShell>
      </body>
    </html>
  )
}
