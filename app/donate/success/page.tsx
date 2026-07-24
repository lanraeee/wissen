import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Thank You · Wissen-Haus',
  description: 'Your donation to Wissen-Haus has been received. Thank you for empowering Nigerian youth.',
}

export default function DonateSuccess() {
  return (
    <section className="section" style={{ paddingTop: 'clamp(64px,8vw,120px)', minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
      <div className="wrap" style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: '50%', background: '#e8f4ec', marginBottom: '1.5rem' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1a3c2e" strokeWidth="2.2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="display-lg" style={{ marginBottom: '1rem' }}>Thank you for giving.</h1>
        <p className="lead" style={{ maxWidth: '38ch', margin: '0 auto 2rem', color: 'var(--ink-60)' }}>
          Your donation is on its way to changing a young Nigerian&apos;s life. A receipt has been sent to your email.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/impact" className="btn">See Our Impact</Link>
          <Link href="/" className="btn btn--ghost">Back to Home</Link>
        </div>
        <p style={{ marginTop: '2rem', fontSize: '.82rem', color: 'var(--ink-60)' }}>
          Questions? Email <a href="mailto:info@wissenhaus.org" style={{ color: 'inherit', fontWeight: 600 }}>info@wissenhaus.org</a>
        </p>
      </div>
    </section>
  )
}
