import type { Metadata } from 'next'
import StreakBadge from '@/components/StreakBadge'
import sql from '@/lib/db'

export const metadata: Metadata = {
  title: 'Discussion Threads · Wissen-Haus Community',
  description: 'Discuss, share wins, ask questions — the Wissen-Haus community discussion board.',
}

interface Thread { title: string; author: string; replies: number; tag: string }

const DEFAULT_THREADS: Thread[] = [
  { title: 'How do I get my first remote job with no experience?', author: 'Adaeze O.', replies: 12, tag: 'Jobs' },
  { title: "Share your JAMB score and what you studied — let's see the range!", author: 'Kola A.', replies: 34, tag: 'Education' },
  { title: 'Best free resources to learn Python in 2025', author: 'Emeka N.', replies: 8, tag: 'Tech' },
  { title: "I got a scholarship! Here's what I learned from the application process", author: 'Fatima A.', replies: 21, tag: 'Scholarships' },
  { title: 'Anyone else using AI tools to improve their CV?', author: 'Seun B.', replies: 15, tag: 'Career' },
  { title: 'Is Lagos really necessary for a tech career in Nigeria?', author: 'Yusuf I.', replies: 27, tag: 'Discussion' },
]

async function getThreads(): Promise<Thread[]> {
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = 'community_threads'`
    if (rows[0]?.value) return rows[0].value as Thread[]
  } catch {}
  return DEFAULT_THREADS
}

export default async function ThreadsPage() {
  const threads = await getThreads()

  return (
    <>
      <StreakBadge />
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="head-row mb-l reveal">
            <div className="section-head">
              <span className="eyebrow">Community Hub · Threads</span>
              <h1 className="display-lg mt-s">Discussion Threads</h1>
              <p className="lead mt-s">Ask questions, share wins, and learn from the community.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {threads.map((thread, i) => (
              <div key={i} style={{ background: 'var(--paper)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', marginBottom: '.4rem', flexWrap: 'wrap' }}>
                    <span className="tl-tag">{thread.tag}</span>
                  </div>
                  <h3 className="h4">{thread.title}</h3>
                  <p style={{ fontSize: '.85rem', color: 'var(--ink-60)', marginTop: '.3rem' }}>By {thread.author}</p>
                </div>
                <div style={{ textAlign: 'center', minWidth: 60 }}>
                  <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--green-800)' }}>{thread.replies}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--ink-60)', fontFamily: 'var(--ff-mono)', letterSpacing: '.08em', textTransform: 'uppercase' }}>replies</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem', padding: '2rem', background: 'var(--green-50)', borderRadius: 'var(--radius)', border: '1px solid var(--green-100)' }} className="reveal">
            <h3 style={{ marginBottom: '.5rem' }}>Full discussion board coming soon.</h3>
            <p style={{ color: 'var(--ink-60)', marginBottom: '1.2rem' }}>We&#39;re building a proper community forum. In the meantime, join our WhatsApp community to discuss with peers.</p>
            <a href="https://chat.whatsapp.com/wissenhaus" target="_blank" rel="noopener noreferrer" className="btn">Join WhatsApp Community</a>
          </div>
        </div>
      </section>
    </>
  )
}
