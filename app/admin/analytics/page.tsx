import type { Metadata } from 'next'
import sql from '@/lib/db'

export const metadata: Metadata = { title: 'Analytics · Wissen-Haus Admin' }

async function getOverview() {
  const [today, week, month, sessions] = await Promise.all([
    sql`SELECT COUNT(*) AS c FROM page_views WHERE created_at >= NOW() - INTERVAL '1 day'`,
    sql`SELECT COUNT(*) AS c FROM page_views WHERE created_at >= NOW() - INTERVAL '7 days'`,
    sql`SELECT COUNT(*) AS c FROM page_views WHERE created_at >= NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(DISTINCT session_id) AS c FROM page_views WHERE created_at >= NOW() - INTERVAL '30 days'`,
  ])
  return {
    today: Number(today[0].c),
    week: Number(week[0].c),
    month: Number(month[0].c),
    sessions: Number(sessions[0].c),
  }
}

async function getTopPages() {
  return sql`
    SELECT pathname, COUNT(*) AS views
    FROM page_views
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY pathname
    ORDER BY views DESC
    LIMIT 15
  `
}

async function getReferrers() {
  return sql`
    SELECT
      COALESCE(NULLIF(referrer, ''), 'Direct') AS referrer,
      COUNT(*) AS views
    FROM page_views
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY referrer
    ORDER BY views DESC
    LIMIT 10
  `
}

async function getCountries() {
  return sql`
    SELECT
      COALESCE(NULLIF(country, ''), 'Unknown') AS country,
      COUNT(*) AS views
    FROM page_views
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY country
    ORDER BY views DESC
    LIMIT 10
  `
}

async function getDevices() {
  return sql`
    SELECT device_type, COUNT(*) AS views
    FROM page_views
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY device_type
    ORDER BY views DESC
  `
}

async function getBrowsers() {
  return sql`
    SELECT browser, COUNT(*) AS views
    FROM page_views
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY browser
    ORDER BY views DESC
  `
}

async function getUTMSources() {
  return sql`
    SELECT utm_source, COUNT(*) AS views
    FROM page_views
    WHERE created_at >= NOW() - INTERVAL '30 days'
      AND utm_source IS NOT NULL
    GROUP BY utm_source
    ORDER BY views DESC
    LIMIT 10
  `
}

async function getRecentViews() {
  return sql`
    SELECT pathname, referrer, country, city, device_type, browser, created_at
    FROM page_views
    ORDER BY created_at DESC
    LIMIT 50
  `
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{ flex: 1, height: 6, background: '#f0ece4', borderRadius: 99 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#1a3c2e', borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: '.78rem', color: '#8a9a8f', width: 36, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 12px', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f' }}>{title}</h3>
      {children}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden', ...style }}>
      {children}
    </div>
  )
}

function RowList({ rows, maxVal }: { rows: { label: string; value: number }[]; maxVal: number }) {
  return (
    <Card>
      {rows.map((r, i) => (
        <div key={i} style={{ padding: '10px 16px', borderBottom: i < rows.length - 1 ? '1px solid #f0ece4' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '.84rem', flex: '0 0 auto', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1a2e24' }} title={r.label}>{r.label}</span>
          <Bar value={r.value} max={maxVal} />
        </div>
      ))}
      {rows.length === 0 && (
        <div style={{ padding: '20px 16px', fontSize: '.84rem', color: '#8a9a8f' }}>No data yet</div>
      )}
    </Card>
  )
}

export default async function AnalyticsPage() {
  const [overview, topPages, referrers, countries, devices, browsers, utmSources, recent] = await Promise.all([
    getOverview(), getTopPages(), getReferrers(), getCountries(),
    getDevices(), getBrowsers(), getUTMSources(), getRecentViews(),
  ])

  const statCard = (label: string, value: number | string, sub: string) => (
    <div style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      <div style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1a2e24', lineHeight: 1 }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: '.78rem', color: '#8a9a8f', marginTop: 4 }}>{sub}</div>
    </div>
  )

  const pageMax = topPages.length > 0 ? Number(topPages[0].views) : 1
  const refMax = referrers.length > 0 ? Number(referrers[0].views) : 1
  const countryMax = countries.length > 0 ? Number(countries[0].views) : 1
  const deviceMax = devices.length > 0 ? Number(devices[0].views) : 1
  const browserMax = browsers.length > 0 ? Number(browsers[0].views) : 1
  const utmMax = utmSources.length > 0 ? Number(utmSources[0].views) : 1

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Analytics</h1>
        <p style={{ margin: 0, color: '#8a9a8f', fontSize: '.88rem' }}>Visitor traffic — your data, stored in your database.</p>
      </div>

      <Section title="Overview">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 32 }}>
          {statCard('Views Today', overview.today, 'last 24 hours')}
          {statCard('Views (7 days)', overview.week, 'last 7 days')}
          {statCard('Views (30 days)', overview.month, 'last 30 days')}
          {statCard('Unique Sessions', overview.sessions, 'last 30 days')}
        </div>
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <Section title="Top Pages (30 days)">
          <RowList
            rows={topPages.map(r => ({ label: r.pathname as string, value: Number(r.views) }))}
            maxVal={pageMax}
          />
        </Section>

        <Section title="Referrers (30 days)">
          <RowList
            rows={referrers.map(r => ({ label: r.referrer as string, value: Number(r.views) }))}
            maxVal={refMax}
          />
        </Section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <Section title="Countries (30 days)">
          <RowList
            rows={countries.map(r => ({ label: r.country as string, value: Number(r.views) }))}
            maxVal={countryMax}
          />
        </Section>

        <Section title="Devices (30 days)">
          <RowList
            rows={devices.map(r => ({ label: (r.device_type as string) ?? 'Unknown', value: Number(r.views) }))}
            maxVal={deviceMax}
          />
        </Section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <Section title="Browsers (30 days)">
          <RowList
            rows={browsers.map(r => ({ label: (r.browser as string) ?? 'Unknown', value: Number(r.views) }))}
            maxVal={browserMax}
          />
        </Section>

        <Section title="UTM Sources (30 days)">
          {utmSources.length > 0 ? (
            <RowList
              rows={utmSources.map(r => ({ label: r.utm_source as string, value: Number(r.views) }))}
              maxVal={utmMax}
            />
          ) : (
            <Card>
              <div style={{ padding: '20px 16px', fontSize: '.84rem', color: '#8a9a8f' }}>
                No UTM-tagged traffic yet. Add <code style={{ background: '#f0ece4', padding: '1px 4px', borderRadius: 3 }}>?utm_source=</code> to your links.
              </div>
            </Card>
          )}
        </Section>
      </div>

      <Section title="Recent Visits">
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f0ece4' }}>
                  {['Page', 'Referrer', 'Country', 'City', 'Device', 'Browser', 'Time'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '.72rem', letterSpacing: '.06em', textTransform: 'uppercase', color: '#8a9a8f', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i} style={{ borderBottom: i < recent.length - 1 ? '1px solid #f0ece4' : 'none' }}>
                    <td style={{ padding: '9px 14px', color: '#1a2e24', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.pathname as string}>{r.pathname as string}</td>
                    <td style={{ padding: '9px 14px', color: '#8a9a8f', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={(r.referrer as string) ?? ''}>{(r.referrer as string) || '—'}</td>
                    <td style={{ padding: '9px 14px', color: '#8a9a8f' }}>{(r.country as string) || '—'}</td>
                    <td style={{ padding: '9px 14px', color: '#8a9a8f' }}>{(r.city as string) || '—'}</td>
                    <td style={{ padding: '9px 14px', color: '#8a9a8f', textTransform: 'capitalize' }}>{(r.device_type as string) || '—'}</td>
                    <td style={{ padding: '9px 14px', color: '#8a9a8f' }}>{(r.browser as string) || '—'}</td>
                    <td style={{ padding: '9px 14px', color: '#8a9a8f', whiteSpace: 'nowrap' }}>
                      {new Date(r.created_at as string).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '20px 14px', color: '#8a9a8f' }}>No visits recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>
    </>
  )
}
