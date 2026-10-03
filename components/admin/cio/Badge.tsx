const TONES = { green: ['#dcfce7', '#16a34a'], red: ['#fee2e2', '#dc2626'], amber: ['#fef3c7', '#b45309'], grey: ['#f3f4f6', '#6b7280'] } as const

export default function Badge({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  const [bg, color] = TONES[tone]
  return <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 4, fontSize: '.75rem', fontWeight: 600, background: bg, color }}>{children}</span>
}
