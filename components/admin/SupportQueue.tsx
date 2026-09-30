'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Ticket = {
  id: string
  reference: string
  subject: string
  requester_name: string
  requester_email: string | null
  channel: 'form' | 'chat'
  status: 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high'
  assigned_email: string | null
  ai_handled: boolean
  escalated: boolean
  last_activity: string
  message_count: number
}

const FILTERS = ['open', 'pending', 'resolved', 'closed', 'all'] as const

const STATUS_COLOUR: Record<string, string> = {
  open: '#b8860b', pending: '#1d4ed8', resolved: '#1a6b3c', closed: '#6b7280',
}

export default function SupportQueue() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filter, setFilter] = useState<typeof FILTERS[number]>('open')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/support?status=${filter}`)
      const data = await res.json()
      setTickets(data.tickets ?? [])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 16px', borderRadius: 99, fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
            background: filter === f ? '#1a3c2e' : '#fff',
            color: filter === f ? '#f4f0e7' : '#3a4a3f',
            border: '1px solid #e8e4dc', textTransform: 'capitalize',
          }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <p className="admin-page-desc">Loading…</p>
      ) : tickets.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 10, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <p className="admin-page-desc" style={{ margin: 0 }}>No {filter === 'all' ? '' : filter} tickets.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {tickets.map(t => (
            <Link key={t.id} href={`/admin/support/${encodeURIComponent(t.reference)}`} style={{
              display: 'block', background: '#fff', borderRadius: 10, padding: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,.06)', textDecoration: 'none', color: 'inherit',
              borderLeft: `3px solid ${t.priority === 'high' ? '#a33' : 'transparent'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '.95rem' }}>{t.subject}</strong>
                <span style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: STATUS_COLOUR[t.status] }}>
                  {t.status}
                </span>
                {t.channel === 'chat' && <span style={{ fontSize: '.7rem', color: '#6b7a70' }}>💬 chat</span>}
                {t.ai_handled && !t.escalated && <span style={{ fontSize: '.7rem', color: '#1a6b3c' }}>answered by assistant</span>}
                {t.escalated && <span style={{ fontSize: '.7rem', color: '#a33', fontWeight: 700 }}>needs a human</span>}
                <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: '#6b7a70' }}>
                  {new Date(t.last_activity).toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: '.8rem', color: '#6b7a70', marginTop: 5 }}>
                <code>{t.reference}</code> · {t.requester_name}
                {t.requester_email ? ` · ${t.requester_email}` : ' · no email'}
                {` · ${t.message_count} message${t.message_count === 1 ? '' : 's'}`}
                {t.assigned_email ? ` · assigned to ${t.assigned_email}` : ''}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
