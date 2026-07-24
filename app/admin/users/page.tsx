'use client'

import { useState, useEffect, useCallback } from 'react'
import UserActions from '@/components/admin/UserActions'

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  membership_expiry: string | null
  modules_done: number
  certs: number
  created_at: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data.users ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = users.filter(u =>
    !search || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Users</h1>
          <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>{total} total members</p>
        </div>
        <input
          placeholder="Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d0ccc4', fontSize: '.88rem', width: 220 }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8a9a8f' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(u => (
            <div key={u.id} style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.95rem' }}>{u.first_name} {u.last_name}</div>
                  <div style={{ fontSize: '.83rem', color: '#3a4a3f', marginTop: 2 }}>{u.email}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: '.75rem', color: '#8a9a8f' }}>{u.modules_done} modules · {u.certs} certs</span>
                    {u.membership_expiry ? (
                      <span style={{ background: '#1a3c2e', color: '#f4f0e7', borderRadius: 99, padding: '1px 8px', fontSize: '.7rem', fontWeight: 600 }}>Premium · expires {new Date(u.membership_expiry).toLocaleDateString('en-GB')}</span>
                    ) : (
                      <span style={{ fontSize: '.75rem', color: '#8a9a8f' }}>Free</span>
                    )}
                    <span style={{ fontSize: '.75rem', color: '#8a9a8f' }}>Joined {new Date(u.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>
                <UserActions user={u} onRefresh={load} />
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#8a9a8f' }}>No users found.</div>}
        </div>
      )}
    </>
  )
}
