import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteContent } from '@/lib/site-content'
import { getPageCopy } from '@/lib/page-copy'
import { WIKI_SCHEMA } from '@/lib/page-copy-schema'
import { getPolicySections } from '@/lib/policy-doc-server'
import { pageMetadata } from '@/lib/seo'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'
import { parseInline, parsePairs, safeHref } from '@/lib/policy-doc'
import PolicyDocument, { Markup, Runs } from '@/components/PolicyDocument'
import type { TeamMember } from '@/app/team/page'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getOgCopy(ogSchemaFor('wiki')!))
}

// Fallback shown only if no one has entered team members via /admin/content yet.
const FALLBACK_PERSONNEL = [
  {
    name: 'Benz Olagbaye',
    role: 'Founder & Executive Director',
    group: 'Leadership',
    note: 'Founded Wissen-Haus after identifying Nigeria\'s youth gap as an access problem rather than a talent deficit. Has personally mentored over 50 young people.',
    href: '/founder',
  },
  { name: 'Lanre', role: 'IT Operations Consultant', group: 'Volunteer', note: null, href: null },
  { name: 'Gbemisola', role: 'Programme Manager', group: 'Volunteer', note: null, href: null },
  { name: 'Damola', role: 'Business Operations Manager', group: 'Volunteer', note: null, href: null },
  { name: 'Ope', role: 'Programme Co-ordinator', group: 'Volunteer', note: null, href: null },
  { name: 'Zaki', role: 'Programme Co-ordinator', group: 'Volunteer', note: null, href: null },
]

const GROUP_LABEL: Record<TeamMember['group'], string> = {
  leadership: 'Leadership',
  advisor: 'Advisory Board',
  mentor: 'Mentor',
  team_member: 'Team Member',
  volunteer: 'Volunteer',
}

async function getPersonnel() {
  const members = await getSiteContent<TeamMember[]>('team_members')
  if (members && members.length > 0) {
    return members.map(m => ({
      name: m.name,
      role: m.role,
      group: GROUP_LABEL[m.group] ?? m.group,
      note: m.group === 'leadership' ? m.bio : null,
      href: /founder/i.test(m.role) ? '/founder' : null,
    }))
  }
  return FALLBACK_PERSONNEL
}

export default async function WikiPage() {
  const [PERSONNEL, c, sections] = await Promise.all([getPersonnel(), getPageCopy(WIKI_SCHEMA), getPolicySections('wiki')])
  const refs = parsePairs(c.references).map(([label, url], i) => ({ id: i + 1, label, url: safeHref(url) }))
  const infobox = parsePairs(c.infobox)
  const seeAlso = parsePairs(c.seeAlso).filter(([, href]) => safeHref(href))

  const personnel = (
    <>
      <div style={{ overflow: 'auto', marginBottom: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem', minWidth: 480 }}>
          <thead>
            <tr style={{ background: '#f0ece4' }}>
              {['Name', 'Role', 'Group'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '.75rem', letterSpacing: '.08em', textTransform: 'uppercase', color: '#4a5a4f', border: '1px solid #ddd9d0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERSONNEL.map((p, i) => (
              <tr key={p.name} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf7' }}>
                <td style={{ padding: '9px 12px', border: '1px solid #ddd9d0', fontWeight: 600 }}>
                  {p.href ? <Link href={p.href} style={{ color: '#1a3c2e' }}>{p.name}</Link> : p.name}
                </td>
                <td style={{ padding: '9px 12px', border: '1px solid #ddd9d0', color: '#1a2e24' }}>{p.role}</td>
                <td style={{ padding: '9px 12px', border: '1px solid #ddd9d0', color: '#4a5a4f' }}>{p.group}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {PERSONNEL.filter(p => p.note).map(p => (
        <p key={p.name} style={{ fontSize: '.86rem', color: '#4a5a4f', marginTop: 8 }}>
          <strong>{p.name}</strong> — {p.note}
        </p>
      ))}
    </>
  )

  return (
    <div style={{ background: '#fefcf5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(20px,4vw,40px)' }}>

        {/* Header */}
        <div style={{ borderBottom: '2px solid #1a3c2e', paddingBottom: 12, marginBottom: 24 }}>
          <div style={{ fontSize: '.72rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 6 }}>
            {c.eyebrow}
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, color: '#0f2d1d', lineHeight: 1.1 }}>
            {c.title}
          </h1>
          <p style={{ margin: '10px 0 0', color: '#4a5a4f', fontSize: '.95rem' }}>
            {c.subtitle}
          </p>
        </div>

        <div className="wiki-layout" style={{ gap: 40, alignItems: 'start' }}>

          {/* Article body */}
          <article style={{ color: '#1a2e24', lineHeight: 1.8, fontSize: '.97rem' }}>

            <Markup text={c.intro} />

            <PolicyDocument variant="wiki" sections={sections} slots={{ personnel }} tocExtra={[{ id: 'references', label: c.referencesHeading }]} />

            {/* References */}
            <h2 id="references" style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid #ddd9d0', paddingBottom: 6, marginTop: 32, color: '#0f2d1d' }}>
              {c.referencesHeading}
            </h2>
            <ol style={{ paddingLeft: 20, fontSize: '.88rem', color: '#4a5a4f' }}>
              {refs.map(r => (
                <li key={r.id} id={`ref-${r.id}`} style={{ marginBottom: 6 }}>
                  {r.url
                    ? <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1a3c2e' }}>{r.label}</a>
                    : r.label}
                </li>
              ))}
            </ol>

            {/* Wikipedia note */}
            <div style={{ marginTop: 40, background: '#f0ece4', borderLeft: '4px solid #1a3c2e', borderRadius: '0 8px 8px 0', padding: '14px 18px', fontSize: '.85rem', color: '#4a5a4f' }}>
              <Runs runs={parseInline(c.wikipediaNote)} />
            </div>
          </article>

          {/* Sidebar infobox */}
          <aside style={{ position: 'sticky', top: 100 }}>
            <div style={{ background: '#fff', border: '1px solid #ddd9d0', borderRadius: 10, overflow: 'hidden', fontSize: '.84rem' }}>
              <div style={{ background: '#1a3c2e', color: '#f4f0e7', padding: '12px 16px', fontWeight: 700, fontSize: '.9rem' }}>
                {c.infoboxTitle}
              </div>
              {infobox.map(([label, value]) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', borderBottom: '1px solid #f0ece4' }}>
                  <span style={{ padding: '9px 12px', fontWeight: 600, color: '#4a5a4f', background: '#fafaf7', borderRight: '1px solid #f0ece4' }}>{label}</span>
                  <span style={{ padding: '9px 12px', color: '#1a2e24' }}><Runs runs={parseInline(value)} /></span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, background: '#fff', border: '1px solid #ddd9d0', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: 10, color: '#0f2d1d' }}>{c.seeAlsoHeading}</div>
              {seeAlso.map(([label, href]) => (
                <Link key={href} href={href} style={{ display: 'block', color: '#1a3c2e', padding: '4px 0', fontSize: '.84rem' }}>
                  {label} →
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
