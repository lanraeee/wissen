import type { Metadata } from 'next'
import sql from '@/lib/db'

export const metadata: Metadata = { title: 'Users · Admin · Wissen-Haus' }

export default async function AdminUsers() {
  const users = await sql`
    SELECT u.id, u.first_name, u.last_name, u.email, u.membership_expiry, u.created_at,
      (SELECT COUNT(*) FROM course_progress cp WHERE cp.user_id = u.id) AS modules_done,
      (SELECT COUNT(*) FROM certificates c WHERE c.user_id = u.id) AS certs
    FROM users u ORDER BY u.created_at DESC LIMIT 100
  `

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Users</h1>
        <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>{users.length} most recent members shown.</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9f7f3' }}>
              {['Name', 'Email', 'Modules', 'Certs', 'Premium', 'Joined'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0ece4' }}>
                <td style={{ padding: '10px 16px', fontSize: '.9rem', fontWeight: 500 }}>{u.first_name as string} {u.last_name as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{u.email as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem', textAlign: 'center' }}>{u.modules_done as number}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem', textAlign: 'center' }}>{u.certs as number}</td>
                <td style={{ padding: '10px 16px', fontSize: '.82rem' }}>
                  {u.membership_expiry ? (
                    <span style={{ background: '#1a3c2e', color: '#f4f0e7', borderRadius: 99, padding: '2px 8px', fontSize: '.7rem', fontWeight: 600 }}>Premium</span>
                  ) : (
                    <span style={{ color: '#8a9a8f' }}>Free</span>
                  )}
                </td>
                <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#8a9a8f' }}>{new Date(u.created_at as string).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
