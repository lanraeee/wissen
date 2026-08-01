import type { Metadata } from 'next'
import Link from 'next/link'
import StreakBadge from '@/components/StreakBadge'
import ThreadsClient from '@/components/ThreadsClient'
import sql from '@/lib/db'

export const metadata: Metadata = {
  title: 'Discussion Threads · Wissen-Haus Community',
  description: 'Discuss, share wins, ask questions — the Wissen-Haus community discussion board.',
}

interface WAPost { text: string; date: string; image?: string }
interface WAChannel { url: string; name: string; description: string; posts: WAPost[] }

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
)

async function getWAChannel(): Promise<WAChannel | null> {
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = 'whatsapp_channel'`
    if (rows[0]?.value) return rows[0].value as WAChannel
  } catch {}
  return null
}

async function getThreads() {
  try {
    return await sql`
      SELECT id, title, tag, reply_count, pinned, created_at, author_name
      FROM forum_threads
      ORDER BY pinned DESC, created_at DESC
      LIMIT 30
    `
  } catch { return [] }
}

function formatWADate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ago(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const TAG_COLOR: Record<string, string> = {
  Jobs: '#1d4ed8', Education: '#7c3aed', Tech: '#0891b2',
  Scholarships: '#b45309', Career: '#15803d', Finance: '#c026d3',
  Discussion: '#6b7280', General: '#6b7280',
}

const TAGS = ['All', 'Jobs', 'Education', 'Tech', 'Scholarships', 'Career', 'Finance', 'Discussion']

export default async function ThreadsPage() {
  const [threads, wa] = await Promise.all([getThreads(), getWAChannel()])
  const hasPosts = (wa?.posts?.length ?? 0) > 0
  const channelUrl = wa?.url || 'https://whatsapp.com/channel/'

  return (
    <>
      <StreakBadge />
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">

          <div className="head-row mb-l reveal">
            <div className="section-head">
              <span className="eyebrow">Community Hub · Threads</span>
              <h1 className="display-lg mt-s">Discussion Board</h1>
              <p className="lead mt-s">Ask questions, share wins, and learn from the community.</p>
            </div>
          </div>

          {/* WhatsApp join banner */}
          <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="reveal"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '1rem', flexWrap: 'wrap',
              background: 'linear-gradient(135deg, #075E54 0%, #128C7E 100%)',
              borderRadius: 'var(--radius)', padding: '20px 28px',
              marginBottom: '2rem', textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(7,94,84,0.18)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                {WA_ICON}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>{wa?.name ?? 'Wissen-Haus'} on WhatsApp</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '.82rem', marginTop: 3 }}>{wa?.description ?? 'Career tips, opportunities and community updates — straight from the team.'}</div>
              </div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#fff', padding: '10px 20px', borderRadius: 99, fontSize: '.85rem', fontWeight: 700, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              {WA_ICON} Follow Channel
            </span>
          </a>

          {/* Thread board */}
          <div className="reveal">
            <ThreadsClient threads={threads as never} tags={TAGS} tagColors={TAG_COLOR} ago={ago} channelUrl={channelUrl} />
          </div>

          {/* WhatsApp channel feed */}
          {hasPosts && (
            <div style={{ marginTop: '3rem' }} className="reveal">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>{WA_ICON}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{wa?.name ?? 'Wissen-Haus'}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--ink-60)' }}>WhatsApp Channel · recent updates</div>
                </div>
                <a href={channelUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', fontSize: '.78rem', fontWeight: 600, color: '#128C7E', textDecoration: 'none', border: '1px solid #25D366', borderRadius: 99, padding: '4px 14px' }}>View channel</a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 560 }}>
                {wa!.posts.map((post, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '0 16px 16px 16px', padding: '12px 16px', maxWidth: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      {post.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.image} alt="" style={{ width: '100%', maxWidth: 340, height: 'auto', maxHeight: 220, objectFit: 'cover', borderRadius: 10, marginBottom: 10, display: 'block' }} />
                      )}
                      <p style={{ margin: 0, fontSize: '.88rem', lineHeight: 1.6, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{post.text}</p>
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        <span style={{ fontSize: '.68rem', color: 'var(--ink-60)' }}>{formatWADate(post.date)}</span>
                        <svg viewBox="0 0 18 11" fill="none" width="14" height="9" aria-hidden="true">
                          <path d="M1 5.5l4 4L17 1" stroke="#53bdeb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 5.5l4 4" stroke="#53bdeb" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <a href={channelUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: '1.5rem', background: '#25D366', color: '#fff', padding: '10px 20px', borderRadius: 99, fontSize: '.85rem', fontWeight: 700, textDecoration: 'none' }}>
                {WA_ICON} Follow for more updates
              </a>
            </div>
          )}

        </div>
      </section>
    </>
  )
}
