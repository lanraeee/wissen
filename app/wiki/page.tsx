import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Wissen-Haus · Encyclopedia Entry',
  description: 'An encyclopedic overview of the Wissen-Haus Youth Empowerment Foundation — its history, programmes, and mission to bridge the skills gap in Nigeria.',
  openGraph: {
    title: 'Wissen-Haus Youth Empowerment Foundation — Overview',
    description: 'An encyclopedic overview of the Wissen-Haus Youth Empowerment Foundation — its history, programmes, and mission to bridge the skills gap in Nigeria.',
    url: 'https://www.wissenhaus.org/wiki',
    images: [{ url: '/wiki/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wissen-Haus Youth Empowerment Foundation — Overview',
    description: 'An encyclopedic overview of the Wissen-Haus Youth Empowerment Foundation — its history, programmes, and mission to bridge the skills gap in Nigeria.',
    images: ['/wiki/opengraph-image'],
  },
}

const TOC = [
  { id: 'background', label: 'Background' },
  { id: 'programmes', label: 'Programmes' },
  { id: 'policy', label: 'Policy Research' },
  { id: 'involvement', label: 'Volunteer & Partnership' },
  { id: 'references', label: 'References' },
]

const REFS = [
  { id: 1, label: 'Wissen-Haus Youth Empowerment Foundation', url: 'https://www.wissenhaus.org' },
  { id: 2, label: 'Our Story – Wissen-Haus', url: 'https://www.wissenhaus.org/about/story' },
  { id: 3, label: 'Career Clarity Trade Fair – Wissen-Haus', url: 'https://www.wissenhaus.org/career-clarity-trade-fair' },
  { id: 4, label: 'Opportunity Blueprint – Wissen-Haus', url: 'https://www.wissenhaus.org/opportunity-blueprint' },
  { id: 5, label: 'Impact Content – Wissen-Haus', url: 'https://www.wissenhaus.org/impact-content' },
  { id: 6, label: 'Community Hub – Wissen-Haus', url: 'https://www.wissenhaus.org/community' },
  { id: 7, label: 'Career Pathways Assessment – Wissen-Haus', url: 'https://www.wissenhaus.org/career-pathways' },
  { id: 8, label: 'Policy Research – Wissen-Haus', url: 'https://www.wissenhaus.org/policy-research' },
  { id: 9, label: 'Volunteer – Wissen-Haus', url: 'https://www.wissenhaus.org/volunteer' },
]

function Ref({ n }: { n: number }) {
  return (
    <sup>
      <a href={`#ref-${n}`} style={{ color: '#1a3c2e', textDecoration: 'none', fontWeight: 600 }}>
        [{n}]
      </a>
    </sup>
  )
}

export default function WikiPage() {
  return (
    <div style={{ background: '#fefcf5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(20px,4vw,40px)' }}>

        {/* Header */}
        <div style={{ borderBottom: '2px solid #1a3c2e', paddingBottom: 12, marginBottom: 24 }}>
          <div style={{ fontSize: '.72rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 6 }}>
            Foundation Overview
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, color: '#0f2d1d', lineHeight: 1.1 }}>
            Wissen-Haus Youth Empowerment Foundation
          </h1>
          <p style={{ margin: '10px 0 0', color: '#4a5a4f', fontSize: '.95rem' }}>
            Non-profit organisation · Ibadan, Oyo State, Nigeria · Est. 2025
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 40, alignItems: 'start' }}>

          {/* Article body */}
          <article style={{ color: '#1a2e24', lineHeight: 1.8, fontSize: '.97rem' }}>

            <p>
              <strong>Wissen-Haus Youth Empowerment Foundation</strong> is a Nigerian non-profit organisation based in{' '}
              <a href="https://en.wikipedia.org/wiki/Ibadan" target="_blank" rel="noopener noreferrer" style={{ color: '#1a3c2e' }}>Ibadan</a>,{' '}
              <a href="https://en.wikipedia.org/wiki/Oyo_State" target="_blank" rel="noopener noreferrer" style={{ color: '#1a3c2e' }}>Oyo State</a>, focused on bridging the skills gap among young people in Nigeria through career guidance, mentorship, and access to global opportunities. The foundation was established with a mission to equip Nigerian youth with practical knowledge and exposure needed for economic independence.<Ref n={1} />
            </p>

            {/* TOC */}
            <div style={{ background: '#f0ece4', border: '1px solid #ddd9d0', borderRadius: 8, padding: '16px 20px', margin: '24px 0', display: 'inline-block', minWidth: 200 }}>
              <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: 10 }}>Contents</div>
              <ol style={{ margin: 0, padding: '0 0 0 18px', fontSize: '.88rem' }}>
                {TOC.map((t, i) => (
                  <li key={t.id} style={{ marginBottom: 4 }}>
                    <a href={`#${t.id}`} style={{ color: '#1a3c2e', textDecoration: 'none' }}>
                      {i + 1}. {t.label}
                    </a>
                  </li>
                ))}
              </ol>
            </div>

            {/* 1. Background */}
            <h2 id="background" style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid #ddd9d0', paddingBottom: 6, marginTop: 32, color: '#0f2d1d' }}>
              1. Background
            </h2>
            <p>
              The foundation operates under the belief that many Nigerian youths lack access to structured career guidance and exposure to opportunities available to their global peers. Wissen-Haus was founded by <Link href="/founder" style={{ color: '#1a3c2e' }}>Benz Olagbaye</Link>, who serves as its director, with the aim of addressing this gap through structured programmes, a digital learning platform, and community-based engagements. The organisation has reported reaching over 500 students across Ibadan.<Ref n={2} />
            </p>
            <p>
              The name <em>Wissen-Haus</em> draws from the German word <em>Wissen</em>, meaning "knowledge", and <em>Haus</em>, meaning "house" — reflecting the organisation's vision of being a house of knowledge for Nigerian youth.
            </p>

            {/* 2. Programmes */}
            <h2 id="programmes" style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid #ddd9d0', paddingBottom: 6, marginTop: 32, color: '#0f2d1d' }}>
              2. Programmes
            </h2>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 20, color: '#1a2e24' }}>
              2.1 Career Clarity Trade Fair
            </h3>
            <p>
              The Career Clarity Trade Fair is a flagship event designed for secondary school students across Nigeria. It brings together professionals from various industries to expose students to career options and pathways available after secondary education.<Ref n={3} />
            </p>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 20, color: '#1a2e24' }}>
              2.2 Opportunity Blueprint
            </h3>
            <p>
              The Opportunity Blueprint is a podcast produced by the foundation. It provides guidance on scholarships, internships, grants, and other opportunities available to Nigerian youth locally and internationally.<Ref n={4} />
            </p>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 20, color: '#1a2e24' }}>
              2.3 Impact Content
            </h3>
            <p>
              Impact Content is the foundation's social-impact storytelling initiative, documenting stories of youth transformation and community development to inspire broader engagement with its mission.<Ref n={5} />
            </p>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 20, color: '#1a2e24' }}>
              2.4 Community Hub and Learning Library
            </h3>
            <p>
              The foundation operates an online Community Hub offering free courses, toolkits, and an Opportunity Hub that aggregates scholarships, jobs, and grants relevant to Nigerian youth. Members who complete courses are issued digital certificates.<Ref n={6} />
            </p>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 20, color: '#1a2e24' }}>
              2.5 Career Assessment Tools
            </h3>
            <p>
              Wissen-Haus provides two self-assessment tools: the Career Pathways Assessment, which generates a personalised career roadmap, and the Career Assessment Accelerator, a ten-question quiz mapping users to one of twelve career profiles.<Ref n={7} />
            </p>

            {/* 3. Policy Research */}
            <h2 id="policy" style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid #ddd9d0', paddingBottom: 6, marginTop: 32, color: '#0f2d1d' }}>
              3. Policy Research
            </h2>
            <p>
              The foundation conducts and publishes policy research relevant to youth employment, skills development, and education in Nigeria, contributing to public discourse on human capital development.<Ref n={8} />
            </p>

            {/* 4. Volunteer & Partnership */}
            <h2 id="involvement" style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid #ddd9d0', paddingBottom: 6, marginTop: 32, color: '#0f2d1d' }}>
              4. Volunteer &amp; Partnership Initiatives
            </h2>
            <p>
              Wissen-Haus actively recruits volunteers to serve as mentors and engages institutional partners including schools, businesses, and civil society organisations. It accepts donations to support its free-to-access programmes.<Ref n={9} />
            </p>

            {/* References */}
            <h2 id="references" style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid #ddd9d0', paddingBottom: 6, marginTop: 32, color: '#0f2d1d' }}>
              References
            </h2>
            <ol style={{ paddingLeft: 20, fontSize: '.88rem', color: '#4a5a4f' }}>
              {REFS.map(r => (
                <li key={r.id} id={`ref-${r.id}`} style={{ marginBottom: 6 }}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1a3c2e' }}>
                    {r.label}
                  </a>
                </li>
              ))}
            </ol>

            {/* Wikipedia note */}
            <div style={{ marginTop: 40, background: '#f0ece4', borderLeft: '4px solid #1a3c2e', borderRadius: '0 8px 8px 0', padding: '14px 18px', fontSize: '.85rem', color: '#4a5a4f' }}>
              This page is also being submitted as a draft article to{' '}
              <a href="https://en.wikipedia.org/wiki/Wikipedia:Articles_for_creation" target="_blank" rel="noopener noreferrer" style={{ color: '#1a3c2e' }}>
                Wikipedia&rsquo;s Articles for Creation
              </a>. Once published, a link to the Wikipedia article will appear here.
            </div>
          </article>

          {/* Sidebar infobox */}
          <aside style={{ position: 'sticky', top: 100 }}>
            <div style={{ background: '#fff', border: '1px solid #ddd9d0', borderRadius: 10, overflow: 'hidden', fontSize: '.84rem' }}>
              <div style={{ background: '#1a3c2e', color: '#f4f0e7', padding: '12px 16px', fontWeight: 700, fontSize: '.9rem' }}>
                Wissen-Haus
              </div>
              {[
                ['Type', 'Non-profit foundation'],
                ['Founded', '2025'],
                ['Founder', 'Benz Olagbaye'],
                ['Headquarters', 'Ibadan, Oyo State, Nigeria'],
                ['Focus', 'Youth empowerment, career guidance, skills development'],
                ['Reach', '500+ students'],
                ['Website', 'wissenhaus.org'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', borderBottom: '1px solid #f0ece4' }}>
                  <span style={{ padding: '9px 12px', fontWeight: 600, color: '#4a5a4f', background: '#fafaf7', borderRight: '1px solid #f0ece4' }}>{label}</span>
                  <span style={{ padding: '9px 12px', color: '#1a2e24' }}>
                    {label === 'Website'
                      ? <a href="https://www.wissenhaus.org" target="_blank" rel="noopener noreferrer" style={{ color: '#1a3c2e' }}>wissenhaus.org</a>
                      : value}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, background: '#fff', border: '1px solid #ddd9d0', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: 10, color: '#0f2d1d' }}>See also</div>
              {[
                ['/programmes', 'All Programmes'],
                ['/founder', 'Meet the Founder'],
                ['/policy-research', 'Policy Research'],
                ['/community', 'Community Hub'],
                ['/about/story', 'Our Story'],
              ].map(([href, label]) => (
                <Link key={href} href={href} style={{ display: 'block', color: '#1a3c2e', padding: '4px 0', fontSize: '.84rem' }}>
                  {label as string} →
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
