import type { Metadata } from 'next'
import sql from '@/lib/db'

export const metadata: Metadata = { title: 'Opportunities · Admin · Wissen-Haus' }

export default async function AdminOpportunities() {
  const opps = await sql`
    SELECT id, title, company, type, location, deadline, created_at
    FROM opportunities ORDER BY created_at DESC LIMIT 100
  `

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Opportunities</h1>
        <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>{opps.length} listings. Auto-refreshed nightly via cron.</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9f7f3' }}>
              {['Title', 'Company', 'Type', 'Location', 'Deadline', 'Added'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {opps.map((o, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0ece4' }}>
                <td style={{ padding: '10px 16px', fontSize: '.88rem', fontWeight: 500 }}>{o.title as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{o.company as string}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ background: '#f0ece4', borderRadius: 99, padding: '2px 8px', fontSize: '.72rem', fontWeight: 600, textTransform: 'capitalize' }}>{o.type as string}</span>
                </td>
                <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#8a9a8f' }}>{o.location as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#8a9a8f' }}>{o.deadline ? new Date(o.deadline as string).toLocaleDateString('en-GB') : '—'}</td>
                <td style={{ padding: '10px 16px', fontSize: '.8rem', color: '#8a9a8f' }}>{new Date(o.created_at as string).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {opps.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>No opportunities yet. They load nightly via cron.</div>
        )}
      </div>
    </>
  )
}
