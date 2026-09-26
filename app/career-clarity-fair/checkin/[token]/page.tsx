import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import sql from '@/lib/db'
import { recommendBooths, type Booth, type AssessmentSnapshot } from '@/lib/career-fair'

interface Props { params: Promise<{ token: string }> }

async function getData(token: string) {
  const [row] = await sql`
    SELECT r.name, r.career_interest, r.assessment_snapshot, r.checked_in, r.checked_in_at,
           e.title AS event_title, e.location, e.event_date, e.event_time, e.booths
    FROM fair_registrations r
    JOIN fair_events e ON e.id = r.event_id
    WHERE r.checkin_token = ${token}
  `
  return row ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const row = await getData(token)
  if (!row) return { title: 'Not Found · Wissen-Haus' }
  return { title: `Your Booth Guide · ${row.event_title as string} · Wissen-Haus` }
}

export default async function CareerFairCheckinPage({ params }: Props) {
  const { token } = await params
  const row = await getData(token)
  if (!row) notFound()

  const allBooths = row.booths as Booth[]
  const recommended = recommendBooths(allBooths, row.career_interest as string | null, row.assessment_snapshot as AssessmentSnapshot[] | null)
  const recommendedIds = new Set(recommended.map(b => b.id))
  const otherBooths = allBooths.filter(b => !recommendedIds.has(b.id))
  const dateLine = row.event_date
    ? new Date(row.event_date as string).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <section className="section" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <div className="section-head center mb-l reveal">
          <span className="eyebrow">{row.event_title as string}</span>
          <h1 className="display-lg mt-s">Hi {(row.name as string).split(' ')[0]}, here&apos;s your guide</h1>
          <p className="lead mt-m">
            {dateLine}{row.event_time ? ` · ${row.event_time}` : ''}{row.location ? ` · ${row.location}` : ''}
          </p>
          <p className="mt-s" style={{ color: row.checked_in ? 'var(--green-800,#1a3c2e)' : 'var(--ink-60)' }}>
            {row.checked_in ? '✓ You are checked in.' : 'Show this page at the door to check in.'}
          </p>
        </div>

        {recommended.length > 0 && (
          <div className="mb-l">
            <h2>Booths picked for you</h2>
            <div className="grid grid-3 mt-m">
              {recommended.map(b => (
                <div key={b.id} className="feature reveal">
                  <h3>{b.name}</h3>
                  <p>{b.description}</p>
                  {b.location && <span className="tag-line">{b.location}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {otherBooths.length > 0 && (
          <div>
            <h2>All other booths</h2>
            <div className="grid grid-3 mt-m">
              {otherBooths.map(b => (
                <div key={b.id} className="feature reveal">
                  <h3>{b.name}</h3>
                  <p>{b.description}</p>
                  {b.location && <span className="tag-line">{b.location}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {allBooths.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--ink-60)' }}>Booths for this fair haven&apos;t been announced yet — check back closer to the date.</p>
        )}

        <div style={{ textAlign: 'center' }} className="mt-l">
          <Link href="/career-clarity-fair" className="btn btn--ghost">← Back to Career Clarity Fair</Link>
        </div>
      </div>
    </section>
  )
}
