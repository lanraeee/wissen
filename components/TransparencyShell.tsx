import Link from 'next/link'

// Shared frame for the two public /transparency pages, so they read as one
// section with a switch between them.
export default function TransparencyShell({ active, title, intro, children }: {
  active: 'ledger' | 'costs'
  title: string
  intro: React.ReactNode
  children: React.ReactNode
}) {
  const tab = (key: 'ledger' | 'costs', href: string, label: string) => (
    <Link href={href} style={{
      padding: '6px 16px', borderRadius: 99, fontSize: '.85rem', fontWeight: 600, textDecoration: 'none',
      background: active === key ? '#1a3c2e' : '#fff', color: active === key ? '#f4f0e7' : '#1a3c2e', border: '1px solid #d8d2c4',
    }}>{label}</Link>
  )
  return (
    <div style={{ background: '#fefcf5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,40px)' }}>
        <div style={{ borderBottom: '2px solid #1a3c2e', paddingBottom: 12, marginBottom: 20 }}>
          <div style={{ fontSize: '.72rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 6 }}>
            Transparency
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, color: '#0f2d1d', lineHeight: 1.1 }}>{title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {tab('ledger', '/transparency/ledger', 'Financial ledger')}
          {tab('costs', '/transparency/costs', 'Operational fixed costs')}
        </div>
        <div style={{ color: '#4a5a4f', fontSize: '.95rem', lineHeight: 1.7, marginBottom: 28 }}>{intro}</div>
        {children}
      </div>
    </div>
  )
}
