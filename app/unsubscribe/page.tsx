import Link from 'next/link'
import sql from '@/lib/db'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export const metadata = { title: 'Unsubscribe — Wissen-Haus' }

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams

  let outcome: 'invalid' | 'unsubscribed' = 'invalid'
  if (token) {
    const [row] = await sql`
      UPDATE newsletter_subscribers SET status = 'unsubscribed', unsubscribed_at = NOW()
      WHERE unsubscribe_token = ${token}
      RETURNING id
    `
    if (row) outcome = 'unsubscribed'
  }

  return (
    <section style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        {outcome === 'unsubscribed' ? (
          <>
            <h1 style={{ fontSize: '1.5rem', color: '#1a2e24', marginBottom: 12 }}>You&apos;ve been unsubscribed</h1>
            <p style={{ color: '#5a5a4a' }}>You won&apos;t receive any more Wissen-Haus newsletter emails. You can resubscribe any time.</p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: '1.5rem', color: '#8B1A1A', marginBottom: 12 }}>Link not recognised</h1>
            <p style={{ color: '#5a5a4a' }}>This unsubscribe link is invalid or has already been used.</p>
          </>
        )}
        <Link href="/" className="btn" style={{ marginTop: 20, display: 'inline-block' }}>Back to Wissen-Haus</Link>
      </div>
    </section>
  )
}
