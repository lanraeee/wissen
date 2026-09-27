'use client'

import { useState, useEffect } from 'react'

interface EmailTemplateInfo {
  id: string
  name: string
  category: string
  recipient: 'User' | 'Admin'
  subject: string
  trigger: string
  source: string
}

const CATEGORY_COLORS: Record<string, string> = {
  'Account & Security': '#1a3c2e',
  'Donations': '#B8952A',
  'Career Fair': '#1d4ed8',
  'Courses & Certificates': '#7c3aed',
  'User Confirmations': '#0891b2',
  'Admin Notifications': '#b45309',
}

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplateInfo[] | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch('/api/admin/email-templates').then(r => r.json()).then(data => {
      setTemplates(data.templates ?? [])
      setCategories(data.categories ?? [])
    })
  }, [])

  const filtered = (templates ?? []).filter(t => !filter || t.category === filter)

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-page-title">Email Templates</h1>
        <p className="admin-page-desc">
          Every transactional email the site sends, in one place — what it&apos;s called, who receives it, and what triggers it. Reference only; templates themselves live in code (lib/email.ts).
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('')}
          style={{
            padding: '5px 12px', borderRadius: 99, fontSize: '.78rem', fontWeight: 600, border: '1px solid #d0ccc4', cursor: 'pointer',
            background: filter === '' ? '#1a3c2e' : '#fff', color: filter === '' ? '#fff' : '#3a4a3f',
          }}
        >
          All ({templates?.length ?? 0})
        </button>
        {categories.map(c => {
          const count = (templates ?? []).filter(t => t.category === c).length
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              style={{
                padding: '5px 12px', borderRadius: 99, fontSize: '.78rem', fontWeight: 600, border: '1px solid #d0ccc4', cursor: 'pointer',
                background: filter === c ? (CATEGORY_COLORS[c] ?? '#1a3c2e') : '#fff', color: filter === c ? '#fff' : '#3a4a3f',
              }}
            >
              {c} ({count})
            </button>
          )
        })}
      </div>

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'auto' }}>
        {templates === null ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>No templates in this category.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                {['Template', 'Category', 'To', 'Subject', 'Trigger', 'Source'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8a9a8f', borderBottom: '1px solid #e8e4dc', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td style={{ padding: '10px 16px', fontSize: '.85rem', fontWeight: 600, color: '#1a2e24' }}>{t.name}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ background: (CATEGORY_COLORS[t.category] ?? '#6b7280') + '22', color: CATEGORY_COLORS[t.category] ?? '#6b7280', borderRadius: 99, padding: '2px 10px', fontSize: '.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {t.category}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '.8rem', color: '#8a9a8f' }}>{t.recipient}</td>
                  <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#3a4a3f', fontFamily: 'monospace' }}>{t.subject}</td>
                  <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#3a4a3f', maxWidth: 320 }}>{t.trigger}</td>
                  <td style={{ padding: '10px 16px', fontSize: '.78rem', color: '#8a9a8f', fontFamily: 'monospace' }}>{t.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
