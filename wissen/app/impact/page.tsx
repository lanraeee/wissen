import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Impact · Wissen-Haus',
  description: 'Real stories from the Wissen-Haus community — students and mentors who have changed their trajectory.',
}

const TESTIMONIALS = [
  { name: 'Adaeze Obi', role: 'SS3 Student, Ibadan', quote: 'Before Wissen-Haus, I had no idea what I wanted to do after school. The Trade Fair changed everything. I met a product designer who looked exactly like me, doing work I\'d never heard of. I applied for an internship the same week.' },
  { name: 'Emeka Nwosu', role: 'Graduate, University of Ibadan', quote: 'The soft skills course helped me write a CV that actually got responses. Within three months of graduating I had my first remote job. I genuinely don\'t think that happens without Wissen-Haus.' },
  { name: 'Fatima Aliyu', role: 'Final Year, Accounting', quote: 'The scholarship database alone was worth joining. I applied to four scholarships I found through the community hub. Two came back to me. One of them is fully funding my master\'s degree.' },
  { name: 'Kola Adegoke', role: 'Data Analyst, Lagos', quote: 'I was a biology graduate with no clue how to pivot. My mentor through Wissen-Haus spent six months helping me build a portfolio. I\'m now working as a data analyst for a company in the UK — remotely from Lagos.' },
]

export default function ImpactPage() {
  return (
    <>
      <section className="section section--tight panel-dark" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow eyebrow--light">Impact</span>
            <h1 className="display-lg mt-s" style={{ color: '#fff' }}>Real results. Real people. Real change.</h1>
            <p className="lead mt-m" style={{ color: 'rgba(244,240,231,.78)' }}>Our impact is measured in careers launched, scholarships won, and communities transformed.</p>
          </div>
          <div className="stats mt-l stagger">
            <div className="stat"><div className="num" style={{ color: 'var(--gold)' }} data-count="500" data-suffix="+">500+</div><div className="lbl" style={{ color: 'rgba(244,240,231,.65)' }}>Students Reached</div></div>
            <div className="stat"><div className="num" style={{ color: 'var(--gold)' }} data-count="30" data-suffix="+">30+</div><div className="lbl" style={{ color: 'rgba(244,240,231,.65)' }}>Mentors Involved</div></div>
            <div className="stat"><div className="num" style={{ color: 'var(--gold)' }} data-count="15" data-suffix="+">15+</div><div className="lbl" style={{ color: 'rgba(244,240,231,.65)' }}>School Partnerships</div></div>
            <div className="stat"><div className="num" style={{ color: 'var(--gold)' }} data-count="1" data-suffix="">1</div><div className="lbl" style={{ color: 'rgba(244,240,231,.65)' }}>Year Since Launch</div></div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">Testimonials</span>
            <h2>In their own words.</h2>
          </div>
          <div className="grid grid-2">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className="testi reveal" data-d={i % 2 as unknown as string}>
                <p>&ldquo;{t.quote}&rdquo;</p>
                <div className="testi__who">
                  <div className="testi__av">{t.name.charAt(0)}</div>
                  <div>
                    <div className="testi__name">{t.name}</div>
                    <div className="testi__role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section panel-dark">
        <div className="wrap center">
          <span className="quote-mark reveal">&ldquo;</span>
          <p className="quote-lg reveal" style={{ color: '#fff', maxWidth: '22ch', marginInline: 'auto' }}>The search for real results is over at last.</p>
          <div className="mt-m reveal" data-d="1">
            <div className="testi__name" style={{ color: 'var(--gold)' }}>Chidi Okoro</div>
            <div className="testi__role">Senior Secondary Student &amp; Volunteer</div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>Be the next success story.</h2>
            <p className="lead">Join the community and access everything you need to launch your career.</p>
            <div className="cta-actions">
              <Link href="/login" className="btn btn--light btn--lg">Join Free</Link>
              <Link href="/impact-content" className="btn btn--outline-light btn--lg">More stories</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
