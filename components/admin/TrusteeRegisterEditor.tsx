'use client'

import { useState, useEffect } from 'react'

interface Trustee {
  id: string
  full_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  appointment_date: string
  term_end_date?: string
  position_title?: string
  appointment_type: 'appointed' | 'ex_officio' | 'nominated'
  nominating_org?: string
  status: 'active' | 'retired' | 'removed' | 'deceased'
  conflict_of_interest_declaration?: Record<string, unknown>
  notes?: string
  created_at?: string
  updated_at?: string
}

const inp = { padding: '7px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }
const s = (bg: string, color = '#fff') => ({ padding: '6px 16px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: bg, color, border: 'none', cursor: 'pointer' } as const)

export default function TrusteeRegisterEditor() {
  const [trustees, setTrustees] = useState<Trustee[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState<Partial<Trustee>>({
    appointment_type: 'appointed',
    status: 'active',
  })

  useEffect(() => {
    loadTrustees()
  }, [])

  async function loadTrustees() {
    try {
      const res = await fetch('/api/admin/trustee-register')
      if (!res.ok) throw new Error('Failed to load trustees')
      const data = await res.json()
      setTrustees(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoaded(true)
    }
  }

  async function saveTrustee() {
    if (!formData.full_name || !formData.appointment_date || !formData.appointment_type) {
      setError('Name, appointment date, and appointment type are required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const url = editingId
        ? `/api/admin/trustee-register/${editingId}`
        : '/api/admin/trustee-register'

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Save failed')
      }

      await loadTrustees()
      setFormData({ appointment_type: 'appointed', status: 'active' })
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    setShowDeleteConfirm(false)
    await executeDeletion()
  }

  async function executeDeletion() {
    if (!editingId) return

    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/trustee-register/${editingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Delete failed')
      }

      await loadTrustees()
      setFormData({ appointment_type: 'appointed', status: 'active' })
      setEditingId(null)
      setShowForm(false)
      setShowDeleteConfirm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(trustee: Trustee) {
    setFormData({
      ...trustee,
      date_of_birth: trustee.date_of_birth?.slice(0, 10),
      appointment_date: trustee.appointment_date?.slice(0, 10),
      term_end_date: trustee.term_end_date?.slice(0, 10),
    })
    setEditingId(trustee.id)
    setShowForm(true)
  }

  function startNew() {
    setFormData({ appointment_type: 'appointed', status: 'active' })
    setEditingId(null)
    setShowForm(true)
  }

  function cancel() {
    setShowForm(false)
    setEditingId(null)
    setFormData({ appointment_type: 'appointed', status: 'active' })
    setError('')
  }

  const appointmentTypeLabel: Record<string, string> = {
    appointed: 'Appointed',
    ex_officio: 'Ex Officio',
    nominated: 'Nominated',
  }

  const statusLabel: Record<string, string> = {
    active: 'Active',
    retired: 'Retired',
    removed: 'Removed',
    deceased: 'Deceased',
  }

  const statusColor: Record<string, string> = {
    active: '#16a34a',
    retired: '#6b7280',
    removed: '#dc2626',
    deceased: '#1f2937',
  }

  if (!loaded) return <div style={{ padding: 24, color: '#8a9a8f' }}>Loading trustees...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Charity Trustee Register</h2>
          <p style={{ margin: 0, fontSize: '.8rem', color: '#8a9a8f' }}>
            Governance record for Wissen-Haus Empowerment Foundation. Only directors can view and manage.
          </p>
        </div>
        <button style={s('#1a3c2e')} onClick={startNew} disabled={showForm}>
          + Add Trustee
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 16, color: '#dc2626', fontSize: '.85rem', background: '#fee2e2', padding: '8px 14px', borderRadius: 7 }}>
          {error}
        </div>
      )}

      {showForm && (
        <div style={{ background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>{editingId ? 'Edit Trustee' : 'Add New Trustee'}</h3>

          <div className="rgrid-2" style={{ gap: 14, marginBottom: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>
                Full Name *
              </label>
              <input
                style={inp}
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. Benz Olagbaye"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>
                Email
              </label>
              <input
                style={inp}
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="director@wissenhaus.org"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>
                Phone
              </label>
              <input
                style={inp}
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+234..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>
                Date of Birth
              </label>
              <input
                style={inp}
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>
                Appointment Date *
              </label>
              <input
                style={inp}
                type="date"
                value={formData.appointment_date || ''}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>
                Term End Date
              </label>
              <input
                style={inp}
                type="date"
                value={formData.term_end_date || ''}
                onChange={(e) => setFormData({ ...formData, term_end_date: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>
                Position Title
              </label>
              <input
                style={inp}
                value={formData.position_title || ''}
                onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                placeholder="e.g. Founder & Executive Director"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>
                Appointment Type *
              </label>
              <select
                style={inp}
                value={formData.appointment_type || 'appointed'}
                onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value as 'appointed' | 'ex_officio' | 'nominated' })}
              >
                <option value="appointed">Appointed</option>
                <option value="ex_officio">Ex Officio</option>
                <option value="nominated">Nominated</option>
              </select>
            </div>

            {formData.appointment_type === 'nominated' && (
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>
                  Nominating Organization
                </label>
                <input
                  style={inp}
                  value={formData.nominating_org || ''}
                  onChange={(e) => setFormData({ ...formData, nominating_org: e.target.value })}
                  placeholder="Organization that nominated this trustee"
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>
                Status
              </label>
              <select
                style={inp}
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'retired' | 'removed' | 'deceased' })}
              >
                <option value="active">Active</option>
                <option value="retired">Retired</option>
                <option value="removed">Removed</option>
                <option value="deceased">Deceased</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 4 }}>
                Notes
              </label>
              <textarea
                style={{ ...inp, minHeight: '80px', fontFamily: 'monospace' }}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            <div>
              {editingId && (
                <button style={s('#dc2626')} onClick={() => setShowDeleteConfirm(true)} disabled={saving}>
                  Delete
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={s('#8a9a8f')} onClick={cancel} disabled={saving}>
                Cancel
              </button>
              <button style={s('#1a3c2e')} onClick={saveTrustee} disabled={saving}>
                {saving ? 'Saving...' : 'Save Trustee'}
              </button>
            </div>
          </div>

          {showDeleteConfirm && (
            <div style={{ marginTop: 16, padding: 12, background: '#fee2e2', border: '1px solid #dc2626', borderRadius: 6 }}>
              <p style={{ margin: '0 0 12px', color: '#991b1b', fontSize: '.9rem', fontWeight: 500 }}>
                Are you sure you want to delete this trustee? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={s('#8a9a8f')} onClick={() => setShowDeleteConfirm(false)} disabled={saving}>
                  Cancel
                </button>
                <button style={s('#dc2626')} onClick={confirmDelete} disabled={saving}>
                  {saving ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trustees Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #d0ccc4', background: '#f5f3f0' }}>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: '#0F2D1D' }}>Name</th>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: '#0F2D1D' }}>Position</th>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: '#0F2D1D' }}>Type</th>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: '#0F2D1D' }}>Appointed</th>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: '#0F2D1D' }}>Term Ends</th>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: '#0F2D1D' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: '#0F2D1D' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trustees.map((trustee) => (
              <tr key={trustee.id} style={{ borderBottom: '1px solid #e8e4dc' }}>
                <td style={{ padding: '10px' }}>
                  <div style={{ fontWeight: 500 }}>{trustee.full_name}</div>
                  <div style={{ fontSize: '.75rem', color: '#8a9a8f' }}>{trustee.email}</div>
                </td>
                <td style={{ padding: '10px' }}>{trustee.position_title || '—'}</td>
                <td style={{ padding: '10px' }}>{appointmentTypeLabel[trustee.appointment_type]}</td>
                <td style={{ padding: '10px', fontSize: '.85rem' }}>
                  {new Date(trustee.appointment_date).toLocaleDateString()}
                </td>
                <td style={{ padding: '10px', fontSize: '.85rem' }}>
                  {trustee.term_end_date ? new Date(trustee.term_end_date).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding: '10px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: '.75rem',
                    fontWeight: 600,
                    background: statusColor[trustee.status] + '20',
                    color: statusColor[trustee.status],
                  }}>
                    {statusLabel[trustee.status]}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button
                    onClick={() => startEdit(trustee)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0F2D1D',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '.8rem',
                      marginRight: '12px',
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {trustees.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: '#8a9a8f', fontSize: '.9rem' }}>
          No trustees registered yet. Click &quot;Add Trustee&quot; to create the first entry.
        </div>
      )}

      {/* Summary Section */}
      <div style={{ marginTop: 32, padding: 20, background: '#fffdf5', border: '1px solid rgba(184,149,42,0.2)', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '.95rem', fontWeight: 600 }}>Register Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, fontSize: '.85rem' }}>
          <div>
            <div style={{ color: '#8a9a8f', marginBottom: 4 }}>Total Trustees</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#0F2D1D' }}>
              {trustees.length}
            </div>
          </div>
          <div>
            <div style={{ color: '#8a9a8f', marginBottom: 4 }}>Active</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#16a34a' }}>
              {trustees.filter((t) => t.status === 'active').length}
            </div>
          </div>
          <div>
            <div style={{ color: '#8a9a8f', marginBottom: 4 }}>Appointments Due</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#dc2626' }}>
              {trustees.filter((t) => {
                if (!t.term_end_date) return false
                const endDate = new Date(t.term_end_date)
                const sixMonthsFromNow = new Date()
                sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
                return endDate <= sixMonthsFromNow && t.status === 'active'
              }).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
