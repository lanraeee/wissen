import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Our Team · Wissen-Haus',
  description: 'Meet the people who hold Wissen-Haus together — the founder, advisors, mentors, and volunteers building something that matters.',
}

export interface TeamMember {
  name: string
  role: string
  group: 'leadership' | 'advisor' | 'mentor' | 'volunteer'
  bio: string
  linkedin?: string
}

const GROUP_META: Record<TeamMember['group'], { heading: string; eyebrow: string }> = {
  leadership: { heading: 'Leadership', eyebrow: 'Core Team' },
  advisor:    { heading: 'Advisory Board', eyebrow: 'Strategy & Governance' },
  mentor:     { heading: 'Mentors', eyebrow: 'Career & Industry' },
  volunteer:  { heading: 'Volunteers', eyebrow: 'Programmes & Operations' },
}

const VALUES = [
  { label: 'We show up', body: 'For every student, every event, every early morning — the team shows up before the spotlight does.' },
  { label: 'We work behind the scenes', body: 'The best work at Wissen-Haus is done quietly — in planning docs, mentor calls, and preparation that nobody sees but everyone feels.' },
  { label: 'We grow together', body: "Nobody has all the answers. We learn from the students we serve, the mentors we work with, and each other." },
]

const LINKEDIN_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
)

async function getMembers(): Promise<TeamMember[]> {
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = 'team_members'`
    if (rows[0]?.value) return rows[0].value as TeamMember[]
  } catch {}
  return []
}

function MemberCard({ m, delay }: { m: TeamMember; delay?: number }) {
  const initials = m.name.split(' ').map(n => n[0]).slice(0, 2).join('')
  return (
    <div className="card reveal" data-d={delay ? String(delay) : undefined}>
      <div className="card__body">
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #0F2D1D, #1a4a2e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1rem', fontSize: '1.15rem', fontWeight: 800,
          color: '#B8952A', letterSpacing: '-0.02em', flexShrink: 0,
        }}>
          {initials}
        </div>
        <h3 style={{ fontSize: '1rem', marginBottom: '.15rem' }}>{m.name}</h3>
        <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--green-700)', marginBottom: '.75rem' }}>
          {m.role}
        </div>
        <p style={{ fontSize: '.88rem', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{m.bio}</p>
        {m.linkedin && (
          <a href={m.linkedin} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: '.75rem', color: 'var(--green-700)', fontSize: '.8rem', fontWeight: 600 }}>
            {LINKEDIN_ICON} LinkedIn
          </a>
        )}
      </div>
    </div>
  )
}

export default async function TeamPage() {
  const members = await getMembers()

  const grouped = (['leadership', 'advisor', 'mentor', 'volunteer'] as TeamMember['group'][])
    .map(g => ({ group: g, items: members.filter(m => m.group === g) }))
    .filter(g => g.items.length > 0)

  const hasMembers = members.length > 0

  return (
    <>
      {/* Hero */}
      <section className="section section--tight panel-dark" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="eyebrow eyebrow--light">Our Team</span>
              <h1 className="display-lg mt-s" style={{ color: '#fff' }}>
                The people who hold everything together.
              </h1>
              <p className="lead mt-m" style={{ color: 'rgba(244,240,231,.78)' }}>
                Wissen-Haus runs on the belief that young Nigerians deserve better. Every person on this
                team holds that belief — and turns it into something real, every single day.
              </p>
              <div className="cta-actions mt-l">
                <Link href="/volunteer" className="btn btn--light btn--lg">Join the team</Link>
                <Link href="/about/story" className="btn btn--outline-light btn--lg">Our story</Link>
              </div>
            </div>
            <div className="split__media reveal" data-d="1" style={{ borderRadius: 16, overflow: 'hidden' }}>
              <Image src="/img/about-hero.jpg" alt="Wissen-Haus team and students" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      {/* Founder card — always shown, compact */}
      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">Leadership</span>
            <h2>Where it starts.</h2>
          </div>

          <div className="grid grid-3">
            {/* Founder — static card */}
            <div className="card reveal" style={{ position: 'relative' }}>
              <div className="card__body">
                <div style={{ position: 'relative', width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', marginBottom: '1rem', flexShrink: 0 }}>
                  <Image src="/img/Benzz.jpg" alt="Benz Olagbaye" fill style={{ objectFit: 'cover', objectPosition: 'center 20%' }} />
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '.15rem' }}>Benz Olagbaye</h3>
                <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--green-700)', marginBottom: '.75rem' }}>
                  Founder &amp; Executive Director
                </div>
                <p style={{ fontSize: '.88rem', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 1rem' }}>
                  Benz founded Wissen-Haus after seeing firsthand that Nigeria&apos;s youth gap is not a talent problem — it&apos;s an access problem. He has personally mentored over 50 young people and leads every programme with that conviction.
                </p>
                <Link href="/founder" style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--green-700)' }}>
                  Full profile &rarr;
                </Link>
              </div>
            </div>

            {/* DB leadership members */}
            {grouped.find(g => g.group === 'leadership')?.items.map((m, i) => (
              <MemberCard key={m.name} m={m} delay={i + 1} />
            ))}
          </div>
        </div>
      </section>

      {/* Remaining groups */}
      {grouped.filter(g => g.group !== 'leadership').length > 0 && (
        <section className="section section--tight panel-muted">
          <div className="wrap">
            {grouped.filter(g => g.group !== 'leadership').map(({ group, items }) => (
              <div key={group} style={{ marginBottom: '3rem' }}>
                <div className="section-head mb-l reveal">
                  <span className="eyebrow">{GROUP_META[group].eyebrow}</span>
                  <h2>{GROUP_META[group].heading}</h2>
                </div>
                <div className="grid grid-3">
                  {items.map((m, i) => <MemberCard key={m.name} m={m} delay={i % 3 > 0 ? i % 3 : undefined} />)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state nudge */}
      {!hasMembers && (
        <section className="section section--tight panel-muted">
          <div className="wrap">
            <div className="section-head center reveal">
              <span className="eyebrow">The Wider Team</span>
              <h2>Advisors, mentors &amp; volunteers.</h2>
              <p className="lead mt-m">
                Wissen-Haus is powered by a growing network of industry mentors, advisors and
                on-the-ground volunteers. Team profiles coming soon.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Values */}
      <section className="section">
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="eyebrow">How We Work</span>
              <h2 className="mt-s">The culture behind the cause.</h2>
              <p className="lead mt-m">
                There is no Wissen-Haus without the people inside it. These are the three things every
                team member — paid or volunteer — carries with them.
              </p>
            </div>
            <div className="reveal" data-d="1">
              {VALUES.map((v, i) => (
                <div key={v.label} style={{
                  borderTop: '1px solid var(--line)',
                  paddingTop: '1.25rem', paddingBottom: '1.25rem',
                  borderBottom: i === VALUES.length - 1 ? '1px solid var(--line)' : undefined,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: '.7rem', color: 'var(--green-700)', minWidth: 24 }}>0{i + 1}</span>
                    <div>
                      <strong style={{ display: 'block', marginBottom: '.35rem' }}>{v.label}</strong>
                      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '.92rem', lineHeight: 1.6 }}>{v.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section--tight">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>Want to be part of this?</h2>
            <p className="lead">
              We&apos;re always looking for people who believe what we believe. Whether you mentor, volunteer,
              advise, or give — there is a place for you here.
            </p>
            <div className="cta-actions">
              <Link href="/volunteer" className="btn btn--light btn--lg">Volunteer with us</Link>
              <Link href="/contact" className="btn btn--outline-light btn--lg">Get in touch</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
