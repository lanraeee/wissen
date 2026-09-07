import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import sql from '@/lib/db'
import DonateWidget from '@/components/DonateWidget'

type Project = {
  id: number
  slug: string
  title: string
  subtitle: string | null
  status: string
  event_name: string | null
  event_date: string | null
  event_location: string | null
  event_time: string | null
  campaign_start: string | null
  campaign_end: string | null
  goal_ngn: number
  raised_ngn: number
  donor_count: number
  hero_desc: string | null
  partnership_name: string | null
  partnership_desc: string | null
  highlights: Array<{ label: string; value: string }>
  what_funded: Array<{ item: string; amount: string }>
  impact_points: string[]
  faq: Array<{ q: string; a: string }>
}

async function getProject(slug: string): Promise<Project | null> {
  try {
    const rows = await sql`
      SELECT * FROM donation_projects WHERE slug = ${slug} AND status = 'published' LIMIT 1
    `
    return (rows[0] as Project) ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = await getProject(slug)
  if (!p) return { title: 'Not Found · Wissen-Haus' }
  return {
    title: `${p.title} · Wissen-Haus`,
    description: p.subtitle ?? p.hero_desc?.slice(0, 160) ?? 'A Wissen-Haus donation drive.',
  }
}

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 18, height: 18 }}>
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ width: 16, height: 16, flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function daysLeft(campaign_end: string | null): number {
  if (!campaign_end) return 0
  const diff = new Date(campaign_end).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatDate(d: string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function DonationProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await getProject(slug)
  if (!p) notFound()

  const left = daysLeft(p.campaign_end)
  const pct = p.goal_ngn > 0 ? Math.min(100, Math.round((p.raised_ngn / p.goal_ngn) * 100)) : 0
  const totalBudget = p.what_funded.reduce((sum, w) => {
    const n = parseInt(w.amount.replace(/[^\d]/g, ''), 10)
    return sum + (isNaN(n) ? 0 : n)
  }, 0)

  return (
    <>
      {/* ── Hero ── */}
      <section className="section section--tight panel-dark" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr min(380px,42%)', gap: 'clamp(40px,6vw,72px)', alignItems: 'center' }}>
            <div className="reveal">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                <span className="eyebrow eyebrow--light">Donation Drive</span>
                {left > 0 && (
                  <span style={{ background: 'var(--red)', color: '#fff', fontFamily: 'var(--ff-mono)', fontSize: '.65rem', letterSpacing: '.14em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 99 }}>
                    {left} days to go
                  </span>
                )}
                {left === 0 && p.campaign_end && (
                  <span style={{ background: '#6b7280', color: '#fff', fontFamily: 'var(--ff-mono)', fontSize: '.65rem', letterSpacing: '.14em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 99 }}>
                    Campaign closed
                  </span>
                )}
              </div>
              <h1 className="display-lg" style={{ color: '#fff', lineHeight: .95, marginBottom: '1rem' }}>
                {p.title}
              </h1>
              {p.subtitle && (
                <p style={{ color: 'var(--gold)', fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '.75rem' }}>
                  {p.subtitle}
                </p>
              )}
              {p.hero_desc && (
                <p className="lead" style={{ color: 'rgba(244,240,231,.78)', maxWidth: 540 }}>
                  {p.hero_desc}
                </p>
              )}
              <div className="hero-cta mt-l">
                <a href="#give" className="btn btn--light btn--lg">Donate now {ARROW}</a>
                {p.event_name && <a href="#event" className="btn btn--outline-light btn--lg">About the event</a>}
              </div>
            </div>

            {/* Stats panel */}
            <div className="reveal" data-d="1" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 'var(--radius-lg)', padding: 'clamp(24px,4vw,36px)' }}>
              {/* Progress bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '.68rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Campaign progress</div>
                <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,.15)', overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'var(--gold)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: '1rem', color: '#fff' }}>₦{p.raised_ngn.toLocaleString()} raised</span>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '.7rem', color: 'rgba(255,255,255,.5)' }}>of ₦{p.goal_ngn.toLocaleString()} · {pct}%</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(p.highlights?.length ? p.highlights : []).map(({ label, value }, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: '1.5rem', color: i % 2 === 0 ? 'var(--gold)' : '#fff', lineHeight: 1 }}>{value}</div>
                    <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, color: '#fff', fontSize: '.9rem', marginTop: 3 }}>{label}</div>
                  </div>
                ))}
                {p.donor_count > 0 && (
                  <div>
                    <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: '1.5rem', color: '#fff', lineHeight: 1 }}>{p.donor_count}</div>
                    <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, color: '#fff', fontSize: '.9rem', marginTop: 3 }}>Donors so far</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      {/* ── Event details ── */}
      {(p.event_name || p.event_date || p.event_location) && (
        <section className="section section--tight" id="event">
          <div className="wrap">
            <div className="section-head mb-l reveal">
              <span className="eyebrow">The Event</span>
              <h2>{p.event_name ?? p.title}</h2>
            </div>
            <div className="grid grid-3">
              {p.event_date && (
                <div className="feature reveal">
                  <div className="feature__ic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  </div>
                  <h3>Date</h3>
                  <p>{formatDate(p.event_date)}{p.event_time ? ` · ${p.event_time}` : ''}</p>
                </div>
              )}
              {p.event_location && (
                <div className="feature reveal" data-d="1">
                  <div className="feature__ic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="10" r="3" /><path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 14-8 14S4 15.25 4 10a8 8 0 0 1 8-8z" /></svg>
                  </div>
                  <h3>Location</h3>
                  <p>{p.event_location}</p>
                </div>
              )}
              {p.impact_points?.length > 0 && (
                <div className="feature reveal" data-d="2">
                  <div className="feature__ic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                  </div>
                  <h3>Impact</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {p.impact_points.map((pt, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '.9rem', color: 'var(--ink-60)' }}>
                        <span style={{ color: 'var(--green-600)', marginTop: 2 }}>{CHECK}</span>{pt}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Partnership ── */}
      {(p.partnership_name || p.partnership_desc) && (
        <section className="section section--tight" style={{ background: 'var(--cream-2)' }}>
          <div className="wrap">
            <div className="section-head mb-l reveal">
              <span className="eyebrow">Featured Partnership</span>
              <h2>{p.partnership_name}</h2>
            </div>
            <div className="reveal" style={{ background: 'var(--green-800)', borderRadius: 'var(--radius-lg)', padding: 'clamp(28px,5vw,48px)', maxWidth: 780 }}>
              <p style={{ color: 'rgba(244,240,231,.78)', lineHeight: 1.7, fontSize: '1.05rem' }}>{p.partnership_desc}</p>
            </div>
          </div>
        </section>
      )}

      {/* ── What funds cover ── */}
      {p.what_funded?.length > 0 && (
        <section className="section section--tight">
          <div className="wrap">
            <div className="section-head mb-l reveal">
              <span className="eyebrow">What You Fund</span>
              <h2>Where your gift goes.</h2>
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden', maxWidth: 700 }}>
              {p.what_funded.map((w, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: 16, padding: '14px 20px',
                  borderBottom: i < p.what_funded.length - 1 ? '1px solid var(--line)' : 'none',
                  background: i % 2 === 0 ? '#fff' : 'var(--cream)',
                }}>
                  <span style={{ color: 'var(--ink-60)', fontSize: '.9rem', lineHeight: 1.4 }}>{w.item}</span>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 600, fontSize: '.88rem', color: 'var(--green-800)', whiteSpace: 'nowrap' }}>{w.amount}</span>
                </div>
              ))}
              {totalBudget > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--green-800)' }}>
                  <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Total campaign target</span>
                  <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: '1.1rem', color: 'var(--gold)' }}>₦{totalBudget.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Donate ── */}
      <section className="section" id="give" style={{ background: 'var(--cream-2)' }}>
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">Give Now</span>
            <h2>Make your contribution.</h2>
            <p className="lead mt-m" style={{ maxWidth: 540, marginInline: 'auto' }}>
              Nigerian supporters give via Paystack. International supporters via Stripe. Every gift counts.
            </p>
          </div>
          <div className="card reveal" style={{ padding: 'clamp(24px,4vw,48px)', maxWidth: 640, margin: '0 auto' }}>
            <DonateWidget />
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }} className="reveal">
            <p style={{ color: 'var(--ink-60)', marginBottom: '.75rem', fontSize: '.9rem' }}>Corporate sponsorships and named partnerships available.</p>
            <a href="mailto:director@wissenhaus.org?subject=Donation Drive — Sponsorship Enquiry" className="textlink">
              Email director@wissenhaus.org {ARROW}
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      {p.faq?.length > 0 && (
        <section className="section section--tight">
          <div className="wrap" style={{ maxWidth: 760 }}>
            <div className="section-head center mb-l reveal">
              <span className="eyebrow">Questions</span>
              <h2>Frequently asked.</h2>
            </div>
            <div>
              {p.faq.map((item, i) => (
                <div key={i} className="reveal" style={{ borderBottom: '1px solid var(--line)', paddingBlock: 24 }}>
                  <h4 style={{ color: 'var(--green-800)', marginBottom: 10, fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3 }}>{item.q}</h4>
                  <p style={{ color: 'var(--ink-60)', lineHeight: 1.65, fontSize: '.95rem' }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ── */}
      <section className="section section--tight" style={{ background: 'var(--cream-2)' }}>
        <div className="wrap">
          <div className="cta-band reveal" style={{ textAlign: 'center' }}>
            <h2>{left > 0 ? `${left} days remaining.` : 'Campaign completed.'}</h2>
            <p className="lead mt-m" style={{ maxWidth: 480, marginInline: 'auto' }}>
              {left > 0
                ? `Join the ${p.donor_count} people who have already invested in the next generation.`
                : 'Thank you to everyone who contributed to this campaign.'}
            </p>
            <div className="cta-actions mt-l">
              <a href="#give" className="btn btn--light btn--lg">Donate now {ARROW}</a>
              <Link href="/partner" className="btn btn--outline-light btn--lg">Corporate partnerships</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
