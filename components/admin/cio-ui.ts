export const inp = { padding: '7px 10px', fontSize: '.85rem', border: '1px solid #d0ccc4', borderRadius: 6, width: '100%', boxSizing: 'border-box' as const }
export const lbl = { display: 'block', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#8a9a8f', marginBottom: 4 }
export const btn = (bg: string, color = '#fff') => ({ padding: '6px 16px', borderRadius: 6, fontSize: '.78rem', fontWeight: 600, background: bg, color, border: 'none', cursor: 'pointer' } as const)
export const th = { padding: '10px', textAlign: 'left' as const, fontWeight: 600, color: '#0F2D1D' }
export const td = { padding: '10px', verticalAlign: 'top' as const }

/** API dates arrive as ISO timestamps; <input type=date> needs YYYY-MM-DD. */
export const dateInput = (v: unknown) => (v ? String(v).slice(0, 10) : '')

export function fmtDate(v: unknown) {
  if (!v) return '—'
  const d = new Date(`${String(v).slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export type Row = Record<string, unknown> & { id: string }
