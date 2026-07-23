import type { Metadata } from 'next'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = { title: 'Admin · Wissen-Haus' }

async function getStats() {
  const [users, certs, progress, opps, subs] = await Promise.all([
    sql`SELECT COUNT(*) AS c FROM users`,
    sql`SELECT COUNT(*) AS c FROM certificates`,
    sql`SELECT COUNT(DISTINCT user_id) AS c FROM course_progress`,
    sql`SELECT COUNT(*) AS c FROM opportunities`,
    sql`SELECT type, COUNT(*) AS c FROM submissions GROUP BY type`,
  ])
  const subMap: Record<string, number> = {}
  for (const r of subs) subMap[r.type as string] = Number(r.c)
  return {
    users: Number(users[0].c),
    certificates: Number(certs[0].c),
    learners: Number(progress[0].c),
    opportunities: Number(opps[0].c),
    contact: subMap.contact ?? 0,
    volunteer: subMap.volunteer ?? 0,
    partner: subMap.partner ?? 0,
    donation: subMap.donation ?? 0,
  }
}

async function getRecentUsers() {
  return sql`SELECT first_name, last_name, email, created_at FROM users ORDER BY created_at DESC LIMIT 8`
}

export default async function AdminDashboard() {
  const [stats, recentUsers] = await Promise.all([getStats(), getRecentUsers()])
  const session = await getSession()

  const card = (label: string, value: number | string, sub?: string) => (
    <div style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      <div style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1a2e24', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '.78rem', color: '#8a9a8f', marginTop: 4 }}>{sub}</div>}
    </div>
  )

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Dashboard</h1>
        <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>Welcome back, {session?.name?.split(' ')[0]}.</p>
      </div>

      <h3 style={{ margin: '0 0 14px', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f' }}>Community</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 36 }}>
        {card('Registered Users', stats.users)}
        {card('Active Learners', stats.learners)}
        {card('Certificates Issued', stats.certificates)}
        {card('Opportunities', stats.opportunities)}
      </div>

      <h3 style={{ margin: '0 0 14px', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f' }}>Submissions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 36 }}>
        {card('Contact Forms', stats.contact)}
        {card('Volunteer Apps', stats.volunteer)}
        {card('Partner Inquiries', stats.partner)}
        {card('Donations', stats.donation)}
      </div>

      <h3 style={{ margin: '0 0 14px', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f' }}>Recent Signups</h3>
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9f7f3' }}>
              {['Name', 'Email', 'Joined'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0ece4' }}>
                <td style={{ padding: '10px 16px', fontSize: '.9rem' }}>{u.first_name as string} {u.last_name as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.88rem', color: '#3a4a3f' }}>{u.email as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#8a9a8f' }}>{new Date(u.created_at as string).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '10px 16px', borderTop: '1px solid #f0ece4' }}>
          <a href="/admin/users" style={{ fontSize: '.82rem', color: '#1a3c2e', fontWeight: 600 }}>View all users →</a>
        </div>
      </div>
    </>
  )
}
