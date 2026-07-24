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

interface FounderContent {
  name: string
  role: string
  quote: string
  paragraphs: string[]
}

const DEFAULT_FOUNDER: FounderContent = {
  name: 'Benz Olagbaye',
  role: 'Founder & Executive Director',
  quote: 'I grew up watching brilliant young minds in Nigeria with unlimited potential, yet they had limited access to the right guidance, mentorship, and opportunities.',
  paragraphs: [
    'Benz founded Wissen-Haus after recognising that the gap between Nigerian youth and global opportunity was not a talent problem — it was an access problem. He built this foundation to change that, one young person at a time.',
    'He has personally mentored over 50 young people, and leads every programme with the same conviction that started it all: that where you grow up should never be a ceiling on where you can go.',
  ],
}

const DEFAULT_MEMBERS: TeamMember[] = []

const GROUP_LABELS: Record<TeamMember['group'], { label: string; role: string }> = {
  leadership: { label: 'Leadership', role: 'Core Team' },
  advisor: { label: 'Advisory Board', role: 'Strategy & Governance' },
  mentor: { label: 'Mentors', role: 'Career & Industry' },
  volunteer: { label: 'Volunteers', role: 'Programmes & Operations' },
}

const VALUES = [
  { label: 'We show up', body: 'For every student, every event, every early morning — the team shows up before the spotlight does.' },
  { label: 'We work behind the scenes', body: 'The best work at Wissen-Haus is done quietly — in planning docs, mentor calls, and preparation that nobody sees but everyone feels.' },
  { label: 'We grow together', body: "Nobody has all the answers. We learn from the students we serve, the mentors we work with, and each other." },
]

const LINKEDIN_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
)

async function getData(): Promise<{ founder: FounderContent; members: TeamMember[] }> {
  try {
    const [founderRows, memberRows] = await Promise.all([
      sql`SELECT value FROM site_content WHERE key = 'founder_bio'`,
      sql`SELECT value FROM site_content WHERE key = 'team_members'`,
    ])
    return {
      founder: founderRows[0]?.value ? { ...DEFAULT_FOUNDER, ...(founderRows[0].value as Partial<FounderContent>) } : DEFAULT_FOUNDER,
      members: memberRows[0]?.value ? (memberRows[0].value as TeamMember[]) : DEFAULT_MEMBERS,
    }
  } catch {
    return { founder: DEFAULT_FOUNDER, members: DEFAULT_MEMBERS }
  }
}

export default async function TeamPage() {
  const { founder, members } = await getData()

  const grouped = (['leadership', 'advisor', 'mentor', 'volunteer'] as TeamMember['group'][])
    .map(g => ({ group: g, items: members.filter(m => m.group === g) }))
    .filter(g => g.items.length > 0)

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

      {/* Founder */}
      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">Leadership</span>
            <h2>Where it starts.</h2>
          </div>
          <div className="founder">
            <div className="founder__media reveal--left">
              <div className="founder__cap">
                <b>{founder.name}</b>
                <span>{founder.role}</span>
              </div>
              <Image src="/img/Benzz.jpg" alt={`${founder.name}, ${founder.role}`} fill style={{ objectFit: 'cover', objectPosition: 'center 22%' }} />
            </div>
            <div className="founder__body reveal--right">
              <span className="quote-mark">&ldquo;</span>
              <p className="founder__lead">{founder.quote}</p>
              {founder.paragraphs.slice(0, 2).map((p, i) => <p key={i}>{p}</p>)}
              <div className="founder__sign">
                <span className="founder__name">{founder.name}</span>
                <span className="founder__role">{founder.role}</span>
              </div>
              <div style={{ marginTop: '2rem' }}>
                <Link href="/founder" className="btn btn--ghost">Full profile &rarr;</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic team members */}
      {grouped.length > 0 && (
        <section className="section section--tight panel-muted">
          <div className="wrap">
            {grouped.map(({ group, items }) => (
              <div key={group} style={{ marginBottom: '3rem' }}>
                <div className="section-head mb-l reveal">
                  <span className="eyebrow">{GROUP_LABELS[group].role}</span>
                  <h2>{GROUP_LABELS[group].label}</h2>
                </div>
                <div className="grid grid-3">
                  {items.map((m, i) => (
                    <div key={m.name} className="card reveal" data-d={i % 3 > 0 ? String(i % 3) : undefined}>
                      <div className="card__body">
                        <div style={{
                          width: 52, height: 52, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #0F2D1D, #1a4a2e)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 800, color: '#B8952A',
                          letterSpacing: '-0.02em', flexShrink: 0,
                        }}>
                          {m.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <h3 style={{ fontSize: '1rem', marginBottom: '.15rem' }}>{m.name}</h3>
                        <div style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--green-700)', marginBottom: '.75rem' }}>
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
                  ))}
                </div>
              </div>
            ))}
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
              We&#39;re always looking for people who believe what we believe. Whether you mentor, volunteer,
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
