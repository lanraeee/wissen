import type { Metadata } from 'next'
import sql from '@/lib/db'

export const metadata: Metadata = { title: 'Submissions · Admin · Wissen-Haus' }

const TYPES = ['contact', 'volunteer', 'partner', 'donation']

export default async function AdminSubmissions({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = 'contact' } = await searchParams
  const activeType = TYPES.includes(type) ? type : 'contact'

  const rows = await sql`
    SELECT id, type, data, created_at FROM submissions
    WHERE type = ${activeType}
    ORDER BY created_at DESC LIMIT 100
  `

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Submissions</h1>
        <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>{rows.length} records</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TYPES.map(t => (
          <a key={t} href={`/admin/submissions?type=${t}`} style={{
            padding: '6px 16px', borderRadius: 99, fontSize: '.82rem', fontWeight: 600,
            background: activeType === t ? '#1a3c2e' : '#fff',
            color: activeType === t ? '#f4f0e7' : '#3a4a3f',
            textDecoration: 'none', border: '1px solid #e8e4dc',
            textTransform: 'capitalize',
          }}>{t}</a>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 10, padding: '32px', textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>
            No {activeType} submissions yet.
          </div>
        )}
        {rows.map((row, i) => {
          const data = row.data as Record<string, string>
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{data.name || data.email}</div>
                <div style={{ fontSize: '.78rem', color: '#8a9a8f' }}>{new Date(row.created_at as string).toLocaleString('en-GB')}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                {Object.entries(data).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f' }}>{k}</div>
                    <div style={{ fontSize: '.88rem', color: '#1a2e24', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{v}</div>
                  </div>
                ))}
              </div>
              {data.email && (
                <div style={{ marginTop: 14 }}>
                  <a href={`mailto:${data.email}`} style={{ fontSize: '.82rem', fontWeight: 600, color: '#1a3c2e' }}>Reply →</a>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
