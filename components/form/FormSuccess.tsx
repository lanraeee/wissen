interface FormSuccessProps {
  title: string
  message: string
  /** Matches the submitting form's outer className so spacing/width stay consistent. */
  className?: string
}

/** The checkmark + heading + message shown once a public form submits successfully. */
export function FormSuccess({ title, message, className = 'form' }: FormSuccessProps) {
  return (
    <div className={className} style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', padding: '2.5rem' }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--green-800,#1a3c2e)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
      <h3 style={{ marginTop: '1rem' }}>{title}</h3>
      <p style={{ color: 'var(--ink-60)', marginTop: '.5rem' }}>{message}</p>
    </div>
  )
}

export function FormError({ error }: { error: string }) {
  return <p style={{ color: '#c0392b', fontSize: '.875rem', margin: '-.5rem 0 .75rem' }}>{error}</p>
}
