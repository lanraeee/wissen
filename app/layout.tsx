import type { Metadata } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import SiteShell from '@/components/SiteShell'
import Footer from '@/components/Footer'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import { getSiteContent } from '@/lib/site-content'

const BASE_METADATA: Metadata = {
  metadataBase: new URL('https://www.wissenhaus.org'),
  // No title template: every page already writes its own full title
  // ("X · Wissen-Haus") rather than just "X", since that's simpler to read
  // at a glance in each page file. A template here would double the suffix.
  title: 'Wissen-Haus Empowerment Foundation',
  description: 'Bridging the skills gap for African youth and the diaspora — practical guidance, mentorship and global exposure for economic independence. Founded in Ibadan, Nigeria, now reaching young people across Africa and internationally, including the UK.',
  keywords: ['youth empowerment Africa', 'career guidance Nigeria', 'skills gap Africa', 'African diaspora youth', 'Ibadan youth foundation', 'mentorship Nigeria UK', 'Wissen-Haus'],
  authors: [{ name: 'Wissen-Haus Empowerment Foundation' }],
  creator: 'Wissen-Haus Empowerment Foundation',
  publisher: 'Wissen-Haus Empowerment Foundation',
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
    siteName: 'Wissen-Haus Empowerment Foundation',
    title: 'Wissen-Haus Empowerment Foundation',
    description: 'Bridging the skills gap for African youth and the diaspora — practical guidance, mentorship and global exposure for economic independence.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Wissen-Haus Empowerment Foundation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wissen-Haus Empowerment Foundation',
    description: 'Bridging the skills gap for African youth and the diaspora — practical guidance, mentorship and global exposure for economic independence.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

// Verification codes are admin-editable (Settings → Business Listings &
// Search Console) rather than env vars, since they only exist once the site
// is actually registered with Search Console / Bing Webmaster Tools, and
// this way pasting one in takes effect immediately, no redeploy needed.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteContent<{ google_site_verification?: string; bing_site_verification?: string }>('site_settings')
  const google = settings?.google_site_verification || undefined
  const bing = settings?.bing_site_verification || undefined
  if (!google && !bing) return BASE_METADATA

  return {
    ...BASE_METADATA,
    verification: {
      ...(google ? { google } : {}),
      ...(bing ? { other: { 'msvalidate.01': bing } } : {}),
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnalyticsTracker />
        <SiteShell footer={<Footer />}>{children}</SiteShell>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
