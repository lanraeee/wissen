'use client'

export default function PrintReceiptButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 22px', background: '#0F2D1D', color: '#fff',
        border: 'none', borderRadius: 8, fontSize: '.85rem', fontWeight: 600, cursor: 'pointer',
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      Print / Save PDF
    </button>
  )
}
