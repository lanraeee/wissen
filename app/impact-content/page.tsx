import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import Link from 'next/link'
import sql from '@/lib/db'
import { getPageCopy } from '@/lib/page-copy'
import { IMPACT_CONTENT_SCHEMA } from '@/lib/page-copy-schema'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getOgCopy(ogSchemaFor('impact-content')!))
}

interface Story {
  name: string
  role: string
  desc: string
}

const FALLBACK_STORIES: Story[] = [
  { name: 'Ose Kaye', role: 'Software Engineer', desc: 'From Ibadan to a remote tech job — how Ose built skills that crossed borders.' },
  { name: 'Emeka Nwosu', role: 'Social Entrepreneur', desc: 'The 19-year-old turning agricultural waste into income for his community.' },
  { name: 'Aisha Jarrett', role: 'Medical Student', desc: 'How mentorship helped Aisha navigate the JAMB maze and secure a scholarship.' },
  { name: 'Toyin Adeyemi', role: 'Content Creator', desc: 'Building a digital career from Oyo State — no Instagram following required to start.' },
  { name: 'Chidi Okafor', role: 'Policy Researcher', desc: 'How a secondary school debate club became the first step toward Oxford.' },
  { name: 'Fatima Aliyu', role: 'Finance Analyst', desc: 'Breaking into fintech without a Lagos postcode — Fatima\'s remote-first story.' },
  { name: 'Seun Bello', role: 'Product Designer', desc: 'Self-taught, NYSC posted upcountry, hired internationally — Seun\'s design journey.' },
  { name: 'Ngozi Eze', role: 'Non-Profit Leader', desc: 'Turning grassroots activism into a structured NGO with national reach at 22.' },
  { name: 'Kola Adegoke', role: 'Data Scientist', desc: 'From biology degree to data science — the unconventional pivot that paid off.' },
  { name: 'Blessing Obi', role: 'Startup Founder', desc: 'The ₦50k that became a business — Blessing\'s bootstrapped success story.' },
  { name: 'Yusuf Ibrahim', role: 'Civil Engineer', desc: 'Infrastructure dreams and international study — how Yusuf funded it without loans.' },
]

async function getStories(): Promise<Story[]> {
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = 'impact_stories'`
    const stories = rows[0]?.value
    if (Array.isArray(stories) && stories.length > 0) return stories
  } catch {}
  return FALLBACK_STORIES
}

export default async function ImpactContentPage() {
  const [stories, c] = await Promise.all([getStories(), getPageCopy(IMPACT_CONTENT_SCHEMA)])

  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">{c.heroEyebrow}</span>
            <h1 className="display-lg mt-s">{c.heroTitle}</h1>
            <p className="lead mt-m">{c.heroLead}</p>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="grid grid-3">
            {stories.map((s, i) => (
              <article key={s.name} className="card reveal" data-d={i % 3 as unknown as string}>
                <div className="card__body">
                  <div className="testi__av" style={{ marginBottom: '1rem' }}>
                    {s.name.charAt(0)}
                  </div>
                  <span className="card__num">{s.role}</span>
                  <h3 className="h4" style={{ marginTop: '.4rem' }}>{s.name}</h3>
                  <p>{s.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>{c.ctaTitle}</h2>
            <p className="lead">{c.ctaLead}</p>
            <div className="cta-actions">
              <Link href="/contact" className="btn btn--light btn--lg">{c.ctaBtnText}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
