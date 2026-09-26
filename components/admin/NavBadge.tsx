// A small red count pill for nav items with pending work -- caps the
// displayed number at 99+ so it never stretches a nav row.
export default function NavBadge({ count, style }: { count: number; style?: React.CSSProperties }) {
  if (count <= 0) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 16, height: 16, padding: '0 4px', borderRadius: 99,
      background: '#dc2626', color: '#fff', fontSize: '.62rem', fontWeight: 700,
      lineHeight: 1, ...style,
    }}>
      {count > 99 ? '99+' : count}
    </span>
  )
}
