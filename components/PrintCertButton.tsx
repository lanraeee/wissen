'use client'

export default function PrintCertButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn"
      style={{ background: 'var(--green-800)', borderColor: 'var(--green-800)' }}
    >
      Print Certificate
    </button>
  )
}
