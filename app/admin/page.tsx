import type { Metadata } from 'next'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = { title: 'Admin · Wissen-Haus' }

async function getStats() {
  const [users, certs, progress, opps, subs, streak] = await Promise.all([
    sql`SELECT COUNT(*) AS c FROM users`,
    sql`SELECT COUNT(*) AS c FROM certificates`,
    sql`SELECT COUNT(DISTINCT user_id) AS c FROM course_progress`,
    sql`SELECT COUNT(*) AS c FROM opportunities`,
    sql`SELECT type, status, COUNT(*) AS c FROM submissions GROUP BY type, status`,
    sql`SELECT COUNT(*) AS c FROM visit_streaks WHERE last_visit = CURRENT_DATE`,
  ])
  const subMap: Record<string, number> = {}
  const pendingMap: Record<string, number> = {}
  for (const r of subs) {
    const key = r.type as string
    subMap[key] = (subMap[key] ?? 0) + Number(r.c)
    if (!r.status || r.status === 'pending') pendingMap[key] = (pendingMap[key] ?? 0) + Number(r.c)
  }
  return {
    users: Number(users[0].c),
    certificates: Number(certs[0].c),
    learners: Number(progress[0].c),
    opportunities: Number(opps[0].c),
    todayActive: Number(streak[0].c),
    contact: subMap.contact ?? 0,
    volunteer: subMap.volunteer ?? 0,
    partner: subMap.partner ?? 0,
    donation: subMap.donation ?? 0,
    pendingContact: pendingMap.contact ?? 0,
    pendingVolunteer: pendingMap.volunteer ?? 0,
    pendingPartner: pendingMap.partner ?? 0,
  }
}

async function getRecentUsers() {
  return sql`SELECT first_name, last_name, email, created_at FROM users ORDER BY created_at DESC LIMIT 6`
}

async function getRecentSubmissions() {
  return sql`SELECT type, name, email, status, created_at FROM submissions ORDER BY created_at DESC LIMIT 6`
}

export default async function AdminDashboard() {
  const [stats, recentUsers, recentSubs, session] = await Promise.all([
    getStats(), getRecentUsers(), getRecentSubmissions(), getSession(),
  ])

  const card = (label: string, value: number | string, sub?: string, href?: string, badge?: string) => (
    <a href={href ?? '#'} style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', textDecoration: 'none', display: 'block', transition: 'box-shadow .15s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 6 }}>{label}</div>
        {badge && <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 99, padding: '1px 7px', fontSize: '.68rem', fontWeight: 700 }}>{badge} pending</span>}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1a2e24', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '.78rem', color: '#8a9a8f', marginTop: 4 }}>{sub}</div>}
    </a>
  )

  const STATUS_DOT: Record<string, string> = { pending: '#f59e0b', reviewed: '#10b981', actioned: '#3b82f6' }

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Dashboard</h1>
        <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>Welcome back, {session?.name?.split(' ')[0]}. {stats.todayActive > 0 && `${stats.todayActive} members active today.`}</p>
      </div>

      <h3 style={{ margin: '0 0 12px', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f' }}>Community</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 32 }}>
        {card('Registered Users', stats.users, 'Total members', '/admin/users')}
        {card('Active Learners', stats.learners, 'Started a course', '/admin/courses')}
        {card('Certificates', stats.certificates, 'Issued to date', '/admin/courses')}
        {card('Opportunities', stats.opportunities, 'Live listings', '/admin/opportunities')}
      </div>

      <h3 style={{ margin: '0 0 12px', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f' }}>Submissions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 32 }}>
        {card('Contact Forms', stats.contact, undefined, '/admin/submissions?type=contact', stats.pendingContact > 0 ? String(stats.pendingContact) : undefined)}
        {card('Volunteer Apps', stats.volunteer, undefined, '/admin/submissions?type=volunteer', stats.pendingVolunteer > 0 ? String(stats.pendingVolunteer) : undefined)}
        {card('Partner Inquiries', stats.partner, undefined, '/admin/submissions?type=partner', stats.pendingPartner > 0 ? String(stats.pendingPartner) : undefined)}
        {card('Donations', stats.donation, undefined, '/admin/submissions?type=donation')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent signups */}
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f' }}>Recent Signups</h3>
          <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
            {recentUsers.map((u, i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: i < recentUsers.length - 1 ? '1px solid #f0ece4' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{u.first_name as string} {u.last_name as string}</div>
                  <div style={{ fontSize: '.78rem', color: '#8a9a8f' }}>{u.email as string}</div>
                </div>
                <div style={{ fontSize: '.75rem', color: '#8a9a8f' }}>{new Date(u.created_at as string).toLocaleDateString('en-GB')}</div>
              </div>
            ))}
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f0ece4' }}>
              <a href="/admin/users" style={{ fontSize: '.82rem', color: '#1a3c2e', fontWeight: 600 }}>View all users →</a>
            </div>
          </div>
        </div>

        {/* Recent submissions */}
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f' }}>Recent Submissions</h3>
          <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
            {recentSubs.map((s, i) => {
              const status = (s.status as string) || 'pending'
              return (
                <div key={i} style={{ padding: '12px 16px', borderBottom: i < recentSubs.length - 1 ? '1px solid #f0ece4' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_DOT[status] ?? STATUS_DOT.pending, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{s.name as string}</span>
                      <span style={{ fontSize: '.72rem', background: '#f0ece4', borderRadius: 4, padding: '1px 6px', textTransform: 'capitalize' }}>{s.type as string}</span>
                    </div>
                    <div style={{ fontSize: '.78rem', color: '#8a9a8f', marginLeft: 15 }}>{s.email as string}</div>
                  </div>
                  <div style={{ fontSize: '.75rem', color: '#8a9a8f' }}>{new Date(s.created_at as string).toLocaleDateString('en-GB')}</div>
                </div>
              )
            })}
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f0ece4' }}>
              <a href="/admin/submissions" style={{ fontSize: '.82rem', color: '#1a3c2e', fontWeight: 600 }}>View all submissions →</a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ marginTop: 28 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            ['Edit Careers Roles', '/admin/content?tab=careers'],
            ['Edit Policy Timeline', '/admin/content?tab=policy'],
            ['Edit Founder Bio', '/admin/content?tab=founder'],
            ['Manage Threads', '/admin/content?tab=threads'],
            ['Site Settings', '/admin/settings'],
          ].map(([label, href]) => (
            <a key={href} href={href} style={{ padding: '8px 16px', borderRadius: 8, fontSize: '.83rem', fontWeight: 600, background: '#fff', color: '#1a3c2e', textDecoration: 'none', border: '1px solid #e8e4dc', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
