import type { Metadata } from 'next'
import './globals.css'
import SiteShell from '@/components/SiteShell'
import Footer from '@/components/Footer'
import AnalyticsTracker from '@/components/AnalyticsTracker'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.wissenhaus.org'),
  title: {
    default: 'Wissen-Haus Youth Empowerment Foundation',
    template: '%s · Wissen-Haus',
  },
  description: 'Bridging the skills gap for African youth and the diaspora — practical guidance, mentorship and global exposure for economic independence. Founded in Ibadan, Nigeria, now reaching young people across Africa and internationally, including the UK.',
  keywords: ['youth empowerment Africa', 'career guidance Nigeria', 'skills gap Africa', 'African diaspora youth', 'Ibadan youth foundation', 'mentorship Nigeria UK', 'Wissen-Haus'],
  authors: [{ name: 'Wissen-Haus Youth Empowerment Foundation' }],
  creator: 'Wissen-Haus Youth Empowerment Foundation',
  publisher: 'Wissen-Haus Youth Empowerment Foundation',
  icons: {
    icon: [
      { url: '/img/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/img/logo.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: { url: '/img/logo.png', sizes: '180x180', type: 'image/png' },
    shortcut: '/img/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://www.wissenhaus.org',
    siteName: 'Wissen-Haus Youth Empowerment Foundation',
    title: 'Wissen-Haus Youth Empowerment Foundation',
    description: 'Bridging the skills gap for African youth and the diaspora — practical guidance, mentorship and global exposure for economic independence.',
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
    description: 'Bridging the skills gap for African youth and the diaspora — practical guidance, mentorship and global exposure for economic independence.',
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
        <AnalyticsTracker />
        <SiteShell footer={<Footer />}>{children}</SiteShell>
      </body>
    </html>
  )
}
