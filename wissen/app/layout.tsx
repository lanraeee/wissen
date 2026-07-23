import type { Metadata } from 'next'
import './globals.css'
import SiteShell from '@/components/SiteShell'

export const metadata: Metadata = {
  title: 'Wissen-Haus Youth Empowerment Foundation',
  description: 'Bridging the skills gap in Nigeria — practical guidance, mentorship and global exposure for economic independence.',
  icons: { icon: '/img/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
