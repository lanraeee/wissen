import type { Metadata } from 'next'
import sql from '@/lib/db'
import RevokeCert from '@/components/admin/RevokeCert'

export const metadata: Metadata = { title: 'Courses & Certificates · Admin · Wissen-Haus' }

export default async function AdminCourses() {
  const [certs, progress, byUser] = await Promise.all([
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
    sql`
      SELECT u.first_name, u.last_name, u.email,
        COUNT(DISTINCT cp.course_id)::int AS courses,
        COUNT(cp.id)::int AS modules,
        COUNT(DISTINCT c.id)::int AS certs
      FROM users u
      LEFT JOIN course_progress cp ON cp.user_id = u.id
      LEFT JOIN certificates c ON c.user_id = u.id
      GROUP BY u.id, u.first_name, u.last_name, u.email
      HAVING COUNT(cp.id) > 0
      ORDER BY modules DESC
      LIMIT 100
    `,
  ])

  const th = (label: string) => (
    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc' }}>{label}</th>
  )
  const section = (title: string, sub: string) => (
    <h3 style={{ margin: '0 0 14px', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f' }}>
      {title} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— {sub}</span>
    </h3>
  )

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Courses &amp; Certificates</h1>
        <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>{certs.length} certificates · {progress.length} module completions · {byUser.length} active learners</p>
      </div>

      {/* Learner summary */}
      {section('Learners', `${byUser.length} users with progress`)}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden', marginBottom: 36 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f9f7f3' }}>{[th('Name'), th('Email'), th('Courses'), th('Modules'), th('Certs')]}</tr></thead>
          <tbody>
            {byUser.length === 0 && <tr><td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: '#8a9a8f' }}>No learners yet.</td></tr>}
            {byUser.map((u, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0ece4' }}>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{u.first_name as string} {u.last_name as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{u.email as string}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>{u.courses as number}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>{u.modules as number}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>{u.certs as number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Certificates */}
      {section('Certificates Issued', `${certs.length} total`)}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden', marginBottom: 36 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f9f7f3' }}>{[th('User'), th('Email'), th('Course'), th('Certificate ID'), th('Issued'), th('')]}</tr></thead>
          <tbody>
            {certs.length === 0 && <tr><td colSpan={6} style={{ padding: '24px 16px', textAlign: 'center', color: '#8a9a8f' }}>No certificates issued yet.</td></tr>}
            {certs.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0ece4' }}>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{c.first_name as string} {c.last_name as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{c.email as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem' }}>{c.course_id as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.78rem', fontFamily: 'monospace', color: '#8a9a8f' }}>{c.certificate_id as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#8a9a8f' }}>{new Date(c.issued_at as string).toLocaleDateString('en-GB')}</td>
                <td style={{ padding: '10px 16px' }}>
                  <RevokeCert id={c.id as string} name={`${c.first_name} ${c.last_name}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Module progress */}
      {section('Recent Module Completions', `${progress.length} entries`)}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f9f7f3' }}>{[th('User'), th('Email'), th('Course'), th('Module'), th('Completed')]}</tr></thead>
          <tbody>
            {progress.length === 0 && <tr><td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: '#8a9a8f' }}>No progress recorded yet.</td></tr>}
            {progress.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0ece4' }}>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{p.first_name as string} {p.last_name as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{p.email as string}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem' }}>{p.course_id as string}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>{p.module_id as number}</td>
                <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#8a9a8f' }}>{new Date(p.completed_at as string).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
