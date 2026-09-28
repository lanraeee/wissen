import Image from 'next/image'
import Link from 'next/link'
import { PARTNER_SCHOLARSHIPS } from '@/lib/partner-scholarships'

/** Cards for scholarships/free-access programmes Wissen-Haus offers directly through its own partners. */
export default function PartnerScholarshipsGrid() {
  if (PARTNER_SCHOLARSHIPS.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-60)' }}>
        <p>No partner scholarships are open right now. Check back soon!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-3">
      {PARTNER_SCHOLARSHIPS.map(p => (
        <article key={p.name} className="card reveal">
          <div className="card__body">
            <div style={{ height: 40, display: 'flex', alignItems: 'center', marginBottom: '.2rem' }}>
              <Image src={p.logo} alt={p.name} width={140} height={40} style={{ objectFit: 'contain', objectPosition: 'left' }} />
            </div>
            <h3 className="h4">{p.name}</h3>
            <p>{p.description}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '.4rem', flexWrap: 'wrap' }}>
              <Link href={p.applyHref} className="textlink">
                {p.applyLabel}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <Link href={p.infoHref} className="textlink" style={{ color: 'var(--ink-60)' }}>
                Learn more
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
