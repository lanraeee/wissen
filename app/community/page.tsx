import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import Link from 'next/link'
import Image from 'next/image'
import OpportunityGrid from '@/components/OpportunityGrid'
import PartnerScholarshipsGrid from '@/components/PartnerScholarshipsGrid'
import StreakBadge from '@/components/StreakBadge'
import TestimonialForm from '@/components/TestimonialForm'
import { getSiteContent } from '@/lib/site-content'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'
import type { PartnerScholarship } from '@/lib/partner-scholarships'

interface Thread { title: string; author: string; replies: number; tag: string }

const TAG_COLOR: Record<string, string> = {
  Jobs: '#1d4ed8', Education: '#7c3aed', Tech: '#0891b2',
  Scholarships: '#b45309', Career: '#15803d', Discussion: '#6b7280',
  Community: '#c026d3', Opportunities: '#0f766e',
}

async function getThreads(): Promise<Thread[]> {
  return (await getSiteContent<Thread[]>('community_threads')) ?? []
}

// Each tab gets its own title, description and canonical. Without this all six
// URLs shared the hub's card, which reads to a crawler as one page duplicated
// six times -- exactly the duplicate-content problem that made the four
// standalone pages worth keeping before the merge. The canonical points at the
// tab's own URL so each is indexed on its own terms, with /community?tab=all
// collapsing onto the bare /community.
export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ tab?: string }> }
): Promise<Metadata> {
  const { tab: rawTab } = await searchParams
  const tab = resolveTab(rawTab)
  const canonical = tab === 'all' ? '/community' : `/community?tab=${tab}`
  return pageMetadata({
    ...await getOgCopy(ogSchemaFor(TAB_OG_SLUG[tab])!),
    alternates: { canonical },
  })
}

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// The Opportunity Hub used to be four standalone pages (/jobs, /internships,
// /scholarships, /competitions) plus a section here that linked out to them --
// the same grid, the same brand, split across five URLs. They are now tabs on
// this page, and those four paths 301 here (see next.config.mjs). `partners`
// carries the Wissen-Haus partner scholarships that lived on /scholarships.
const OPPORTUNITY_TABS = [
  { key: 'all', label: 'All', type: undefined },
  { key: 'scholarships', label: 'Scholarships', type: 'scholarship' },
  { key: 'jobs', label: 'Jobs', type: 'job' },
  { key: 'internships', label: 'Internships', type: 'internship' },
  { key: 'competitions', label: 'Competitions', type: 'competition' },
  { key: 'wissenhaus-partners', label: 'Wissen-Haus Partners', type: undefined },
] as const

type TabKey = typeof OPPORTUNITY_TABS[number]['key']

// Slug of the admin-editable OG entry backing each tab (lib/og-schema.ts).
// The first four kept the slugs they used as standalone pages so copy already
// saved in the admin survived the merge.
const TAB_OG_SLUG: Record<TabKey, string> = {
  all: 'community',
  scholarships: 'scholarships',
  jobs: 'jobs',
  internships: 'internships',
  competitions: 'competitions',
  'wissenhaus-partners': 'community-partners',
}

function resolveTab(raw: string | undefined): TabKey {
  return OPPORTUNITY_TABS.some(t => t.key === raw) ? raw as TabKey : 'all'
}

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: rawTab } = await searchParams
  const tab = resolveTab(rawTab)
  const active = OPPORTUNITY_TABS.find(t => t.key === tab)!

  const threads = await getThreads()
  const partners = tab === 'wissenhaus-partners'
    ? (await getSiteContent<PartnerScholarship[]>('partner_scholarships')) ?? []
    : []

  return (
    <>
      <StreakBadge />

      {/* HERO */}
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="eyebrow">Community Hub</span>
              <h1 className="display-lg mt-s">Where Nigerian youth grow, together.</h1>
              <p className="lead mt-m">Scholarships, internships, mentorship, courses and a community feed—everything a young changemaker needs, in one place.</p>
            </div>
            <div className="split__media reveal" data-d="1">
              <Image src="/img/community.jpg" alt="Wissen-Haus community members collaborating" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      {/* NAV PILLS */}
      <section className="section section--tight" style={{ padding: 'clamp(24px,3vw,40px) 0' }}>
        <div className="wrap">
          <div className="pillrow mb-l">
            <Link className="p p--active" href="#opportunities">Opportunity Hub</Link>
            <Link className="p" href="#learning">Learning Library</Link>
            <Link className="p" href="#discussions">Discussion Threads</Link>
            <Link className="p" href="#share-story">Share Your Story</Link>
          </div>
        </div>
      </section>

      {/* OPPORTUNITY HUB */}
      <section className="section" id="opportunities">
        <div className="wrap">
          <div className="section-head mb-m reveal">
            <span className="eyebrow">Opportunity Hub</span>
            <h2>Scholarships, internships, jobs &amp; grants, curated for Nigerian youth.</h2>
          </div>
          {/* No `reveal` on these: they are navigation, and reveal's opacity:0
              is only cleared by an observer keyed on pathname -- switching tab
              changes only the query string, so the new pills would stay
              invisible until a full reload. */}
          <div className="pillrow mb-l">
            {OPPORTUNITY_TABS.map(t => (
              <Link key={t.key} href={`/community?tab=${t.key}#opportunities`} className={`p${tab === t.key ? ' active' : ''}`}>
                {t.label}
              </Link>
            ))}
          </div>
          {tab === 'wissenhaus-partners'
            ? <PartnerScholarshipsGrid partners={partners} />
            : <OpportunityGrid type={active.type} showFilter={true} />}
        </div>
      </section>

      {/* LEARNING LIBRARY */}
      <section className="section panel-dark" id="learning">
        <div className="wrap">
          <div className="section-head mb-m reveal">
            <span className="eyebrow eyebrow--light">Learning Library</span>
            <h2>Free courses, guides &amp; toolkits to build career-ready skills.</h2>
          </div>
          <div className="pillrow mb-l reveal" data-d="1">
            <Link className="p p--active" href="/courses">Browse All Courses</Link>
          </div>
          <div className="grid grid-3">
            <article className="card reveal">
              <div className="card__body">
                <span className="card__num" style={{ color: 'var(--green-800)' }}>CERTIFICATE COURSE</span>
                <h3>Career Launch Blueprint</h3>
                <p>Everything you need to know before graduating. CV writing, interviewing, networking, and your 5-year plan.</p>
                <Link href="/courses/career-launch" className="textlink">Start the course {ARROW}</Link>
              </div>
            </article>
            <article className="card reveal" data-d="1">
              <div className="card__body">
                <span className="card__num" style={{ color: 'var(--green-800)' }}>FREE COURSE</span>
                <h3>Soft Skills for the Modern Workplace</h3>
                <p>Communication, teamwork, problem solving, and professional presentation — the skills every employer wants.</p>
                <Link href="/courses/soft-skills" className="textlink">Start for free {ARROW}</Link>
              </div>
            </article>
            <article className="card reveal" data-d="2">
              <div className="card__body">
                <span className="card__num" style={{ color: 'var(--green-800)' }}>CERTIFICATE COURSE</span>
                <h3>AI for Everyone</h3>
                <p>Learn to use AI tools to enhance your work, productivity and career prospects — no coding required.</p>
                <Link href="/courses/ai" className="textlink">Start the course {ARROW}</Link>
              </div>
            </article>
          </div>
          <div className="hero-cta mt-l reveal">
            <Link href="/courses" className="btn btn--light">View all courses</Link>
          </div>
        </div>
      </section>

      {/* DISCUSSION THREADS */}
      <section className="section" id="discussions">
        <div className="wrap">
          <div className="section-head mb-m reveal">
            <span className="eyebrow">Discussion Threads</span>
            <h2>Ask questions, share wins, learn from each other.</h2>
          </div>
          {threads.length > 0 ? (
            <div className="grid grid-3">
              {threads.map((t, i) => (
                <Link key={i} href="/community/threads" className="card reveal" data-d={(i % 3 || undefined) as unknown as string}>
                  <div className="card__body">
                    <span className="card__num" style={{ color: TAG_COLOR[t.tag] ?? '#6b7280' }}>{t.tag.toUpperCase()}</span>
                    <h3 style={{ marginTop: '.4rem' }}>{t.title}</h3>
                    <p style={{ color: 'var(--ink-60)' }}>{t.author} · {t.replies} {t.replies === 1 ? 'reply' : 'replies'}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="lead">Be the first to start a discussion.</p>
          )}
          <div className="hero-cta mt-l reveal">
            <Link href="/community/threads" className="btn btn--lg">View all discussions {ARROW}</Link>
          </div>
        </div>
      </section>

      {/* YOUR JOURNEY STEPS */}
      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">Your Journey</span>
            <h2>Four steps to economic independence.</h2>
          </div>
          <div className="steps">
            <div className="step reveal">
              <div className="step__n">01</div>
              <h4>Discover your path</h4>
              <p>Use our career assessment to find work that fits your personality, values and skills.</p>
            </div>
            <div className="step reveal" data-d="1">
              <div className="step__n">02</div>
              <h4>Build your skills</h4>
              <p>Take free certificate courses. Download guides. Practise with real templates.</p>
            </div>
            <div className="step reveal" data-d="2">
              <div className="step__n">03</div>
              <h4>Grab opportunities</h4>
              <p>Apply to scholarships, internships, remote jobs, and competitions you actually qualify for.</p>
            </div>
            <div className="step reveal" data-d="3">
              <div className="step__n">04</div>
              <h4>Give back</h4>
              <p>Share your wins, mentor others, and keep the cycle of empowerment going.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SHARE YOUR STORY */}
      <section className="section" id="share-story">
        <div className="wrap" style={{ maxWidth: 640 }}>
          <div className="section-head mb-m reveal">
            <span className="eyebrow">Your Impact Story</span>
            <h2>Share what Wissen-Haus has meant for you.</h2>
            <p className="lead mt-s">Your story could inspire the next student. Approved stories are featured on our homepage.</p>
          </div>
          <div className="reveal" data-d="1">
            <TestimonialForm />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section--tight">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>Ready to take your career seriously?</h2>
            <p className="lead">Use the career assessment to find your direction, then build your plan from there.</p>
            <div className="cta-actions">
              <Link href="/career-assessment" className="btn btn--light btn--lg">Take the Assessment</Link>
              <Link href="/courses" className="btn btn--outline-light btn--lg">Browse Courses</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
