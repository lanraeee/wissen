'use client'

import { useState, useEffect, useCallback } from 'react'
import RevokeCert from '@/components/admin/RevokeCert'
import IssueCert from '@/components/admin/IssueCert'

interface Cert {
  id: string
  certificate_id: string
  course_id: string
  issued_at: string
  first_name: string
  last_name: string
  email: string
}

interface Progress {
  course_id: string
  module_id: number
  completed_at: string
  first_name: string
  last_name: string
  email: string
}

interface Learner {
  first_name: string
  last_name: string
  email: string
  courses: number
  modules: number
  certs: number
}

interface CoursesData { certs: Cert[]; progress: Progress[]; byUser: Learner[] }

export default function AdminCourses() {
  const [data, setData] = useState<CoursesData>({ certs: [], progress: [], byUser: [] })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/courses-data')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const { certs, progress, byUser } = data

  const th = (label: string) => (
    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc' }}>{label}</th>
  )
  const section = (title: string, sub: string) => (
    <h3 style={{ margin: '0 0 14px', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f' }}>
      {title} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— {sub}</span>
    </h3>
  )

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>Loading…</div>

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Courses &amp; Certificates</h1>
        <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>{certs.length} certificates · {progress.length} module completions · {byUser.length} active learners</p>
      </div>

      <IssueCert onRefresh={load} />

      {/* Learner summary */}
      {section('Learners', `${byUser.length} users with progress`)}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden', marginBottom: 36 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f9f7f3' }}>{[th('Name'), th('Email'), th('Courses'), th('Modules'), th('Certs')]}</tr></thead>
          <tbody>
            {byUser.length === 0 && <tr><td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: '#8a9a8f' }}>No learners yet.</td></tr>}
            {byUser.map((u, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0ece4' }}>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{u.first_name} {u.last_name}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{u.email}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>{u.courses}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>{u.modules}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>{u.certs}</td>
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
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{c.first_name} {c.last_name}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{c.email}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem' }}>{c.course_id}</td>
                <td style={{ padding: '10px 16px', fontSize: '.78rem', fontFamily: 'monospace', color: '#8a9a8f' }}>{c.certificate_id}</td>
                <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#8a9a8f' }}>{new Date(c.issued_at).toLocaleDateString('en-GB')}</td>
                <td style={{ padding: '10px 16px' }}>
                  <RevokeCert id={c.id} name={`${c.first_name} ${c.last_name}`} onRefresh={load} />
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
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{p.first_name} {p.last_name}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem', color: '#3a4a3f' }}>{p.email}</td>
                <td style={{ padding: '10px 16px', fontSize: '.85rem' }}>{p.course_id}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>{p.module_id}</td>
                <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#8a9a8f' }}>{new Date(p.completed_at).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
