'use client'

import { useState } from 'react'

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  membership_expiry: string | null
}

const btn = (bg: string, color = '#fff') => ({
  padding: '4px 10px', borderRadius: 6, fontSize: '.72rem', fontWeight: 600,
  background: bg, color, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const,
})

const ROLE_COLORS: Record<string, string> = {
  admin: '#1a3c2e',
  editor: '#1d4ed8',
  user: '',
}

export default function UserActions({ user, onRefresh, isDirector }: { user: User; onRefresh: () => void; isDirector: boolean }) {
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ first_name: user.first_name, last_name: user.last_name, email: user.email })

  async function act(action: string, extra?: object) {
    setBusy(true)
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    setBusy(false)
    onRefresh()
  }

  async function del() {
    if (!confirm(`Delete ${user.first_name} ${user.last_name}? This cannot be undone.`)) return
    setBusy(true)
    await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    setBusy(false)
    onRefresh()
  }

  async function save() {
    await act('update', form)
    setEditing(false)
  }

  if (editing) return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
        style={{ padding: '3px 6px', fontSize: '.8rem', border: '1px solid #d0ccc4', borderRadius: 4, width: 90 }} />
      <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
        style={{ padding: '3px 6px', fontSize: '.8rem', border: '1px solid #d0ccc4', borderRadius: 4, width: 90 }} />
      <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        style={{ padding: '3px 6px', fontSize: '.8rem', border: '1px solid #d0ccc4', borderRadius: 4, width: 160 }} />
      <button style={btn('#1a3c2e')} onClick={save} disabled={busy}>Save</button>
      <button style={btn('#e8e4dc', '#3a4a3f')} onClick={() => setEditing(false)}>Cancel</button>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {user.role !== 'user' && (
        <span style={{ background: ROLE_COLORS[user.role] ?? '#6b7280', color: '#fff', borderRadius: 99, padding: '1px 8px', fontSize: '.7rem', fontWeight: 600, textTransform: 'capitalize' }}>
          {user.role}
        </span>
      )}
      {isDirector && (
        <select
          value={user.role ?? 'user'}
          onChange={e => act('set_role', { role: e.target.value })}
          disabled={busy}
          style={{ padding: '3px 6px', fontSize: '.75rem', border: '1px solid #d0ccc4', borderRadius: 4, background: '#fff', cursor: 'pointer' }}
        >
          <option value="user">User</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
      )}
      <button style={btn('#e8e4dc', '#3a4a3f')} onClick={() => setEditing(true)} disabled={busy}>Edit</button>
      {user.membership_expiry ? (
        <button style={btn('#b45309')} onClick={() => act('revoke_premium')} disabled={busy}>Revoke Premium</button>
      ) : (
        <button style={btn('#1a3c2e')} onClick={() => act('grant_premium')} disabled={busy}>Grant Premium</button>
      )}
      <button style={btn('#dc2626')} onClick={del} disabled={busy}>Delete</button>
    </div>
  )
}
