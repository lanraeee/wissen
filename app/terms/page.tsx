import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'
import { getPageCopy } from '@/lib/page-copy'
import { getPolicySections } from '@/lib/policy-doc-server'
import PolicyDocument from '@/components/PolicyDocument'
import { TERMS_SCHEMA } from '@/lib/page-copy-schema'
import Link from 'next/link'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getOgCopy(ogSchemaFor('terms')!))
}

export default async function TermsPage() {
  const [c, sections] = await Promise.all([getPageCopy(TERMS_SCHEMA), getPolicySections('terms')])
  return (
    <div style={{ background: '#fefcf5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(20px,4vw,40px)' }}>

        <div style={{ borderBottom: '2px solid #1a3c2e', paddingBottom: 12, marginBottom: 24 }}>
          <div style={{ fontSize: '.72rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 6 }}>
            Legal
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, color: '#0f2d1d', lineHeight: 1.1 }}>
            {c.title}
          </h1>
          <p style={{ margin: '10px 0 0', color: '#4a5a4f', fontSize: '.95rem' }}>
            Last updated: {c.lastUpdated}
          </p>
        </div>

        <article style={{ color: '#1a2e24', lineHeight: 1.75, fontSize: '.96rem' }}>

          <p>{c.intro}</p>

          <PolicyDocument sections={sections} />

          <div style={{ marginTop: 40, background: '#f0ece4', borderLeft: '4px solid #1a3c2e', borderRadius: '0 8px 8px 0', padding: '14px 18px', fontSize: '.85rem', color: '#4a5a4f' }}>
            See also our <Link href="/privacy" style={{ color: '#1a3c2e' }}>Privacy Policy</Link>.
          </div>
        </article>
      </div>
    </div>
  )
}
