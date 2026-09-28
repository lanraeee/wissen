import Link from 'next/link'
import { DEFAULT_PARTNER_SCHOLARSHIPS, type PartnerScholarship } from '@/lib/partner-scholarships'

/**
 * Cards for scholarships/free-access programmes Wissen-Haus offers through
 * its own partners. Falls back to the built-in list until an admin saves
 * one, mirroring PartnersCarousel.
 */
export default function PartnerScholarshipsGrid({ partners }: { partners?: PartnerScholarship[] }) {
  const list = partners && partners.length > 0 ? partners : DEFAULT_PARTNER_SCHOLARSHIPS

  if (list.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-60)' }}>
        <p>No partner scholarships are open right now. Check back soon!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-3">
      {list.map(p => (
        // No `reveal` class: it starts at opacity:0 and is only made visible by
        // the IntersectionObserver in ScrollEffects, which re-runs on pathname
        // change only. Tab switches here change just the query string, so
        // cards rendered that way would never be observed and would stay
        // invisible until a full reload.
        <article key={p.name} className="card">
          <div className="card__body">
            {p.logo && (
              <div style={{ height: 40, display: 'flex', alignItems: 'center', marginBottom: '.2rem' }}>
                {/* Plain <img>: CMS-uploaded logos are data: URLs, which next/image can't optimise. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.logo} alt={p.name} style={{ maxHeight: 40, maxWidth: 160, objectFit: 'contain' }} />
              </div>
            )}
            <h3 className="h4">{p.name}</h3>
            <p>{p.description}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '.4rem', flexWrap: 'wrap' }}>
              {p.applyHref && (
                <Link href={p.applyHref} className="textlink">
                  {p.applyLabel || 'Apply'}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              )}
              {p.infoHref && (
                <Link href={p.infoHref} className="textlink" style={{ color: 'var(--ink-60)' }}>
                  Learn more
                </Link>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
