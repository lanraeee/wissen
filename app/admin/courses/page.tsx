import type { Metadata } from 'next'
import sql from '@/lib/db'

export const metadata: Metadata = { title: 'Courses & Certificates · Admin · Wissen-Haus' }

export default async function AdminCourses() {
  const [certs, progress] = await Promise.all([
    sql`
      SELECT c.id, c.certificate_id, c.course_id, c.issued_at,
        u.first_name, u.last_name, u.email
      FROM certificates c
      JOIN users u ON u.id = c.user_id
      ORDER BY c.issued_at DESC LIMIT 200
    `,
    sql`
      SELECT cp.course_id, cp.module_id, cp.completed_at,
        u.first_name, u.last_name, u.email
      FROM course_progress cp
      JOIN users u ON u.id = cp.user_id
      ORDER BY cp.completed_at DESC LIMIT 200
    `,
  ])

  const th = (label: string) => (
    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc' }}>{label}</th>
  )

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Courses &amp; Certificates</h1>
        <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>{certs.length} certificates · {progress.length} module completions</p>
      </div>

      <h3 style={{ margin: '0 0 14px', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f' }}>Certificates Issued</h3>
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden', marginBottom: 36 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9f7f3' }}>
              {[th('User'), th('Email'), th('Course'), th('Certificate ID'), th('Issued')]}
            </tr>
          </thead>
          <tbody>
            {certs.length === 0 && (
              <tr><td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>No certificates yet.</td></tr>
            )}
            {certs.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0ece4' }}>
                <td style={{ padding: '10px 16px', fontSize: '.9rem', fontWeight: 500 }}>{c.first_name as string} {c.last_name as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{c.email as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem' }}>{c.course_id as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.78rem', fontFamily: 'monospace', color: '#8a9a8f' }}>{c.certificate_id as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#8a9a8f' }}>{new Date(c.issued_at as string).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ margin: '0 0 14px', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f' }}>Recent Module Completions</h3>
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9f7f3' }}>
              {[th('User'), th('Email'), th('Course'), th('Module'), th('Completed')]}
            </tr>
          </thead>
          <tbody>
            {progress.length === 0 && (
              <tr><td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>No progress recorded yet.</td></tr>
            )}
            {progress.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0ece4' }}>
                <td style={{ padding: '10px 16px', fontSize: '.9rem', fontWeight: 500 }}>{p.first_name as string} {p.last_name as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{p.email as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem' }}>{p.course_id as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem', textAlign: 'center' }}>{p.module_id as number}</td>
                <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#8a9a8f' }}>{new Date(p.completed_at as string).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
