import sql from '@/lib/db'
import { log } from '@/lib/logger'

export type KbEntry = {
  id: string
  source: 'server' | 'answer'
  source_key: string | null
  title: string
  body: string
  status: 'active' | 'pending' | 'archived'
  approved_by: string | null
  created_at: string
  updated_at: string
}

// Same reason as lib/support-agent.ts: some site_content values are hundreds
// of kilobytes of base64 image data. Strip it, collapse whitespace, and cap
// what any single entry can contribute.
const MAX_BODY = 6_000

function clean(value: unknown): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  if (typeof text !== 'string') return ''
  return text
    .replace(/data:[a-z/+-]+;base64,[A-Za-z0-9+/=]+/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[{}"[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_BODY)
}

// Rebuilds every 'server' entry from live data. Deliberately does NOT touch
// 'answer' entries -- those were written by staff and are the only thing here
// a rebuild could destroy that could not be regenerated.
export async function rebuildKnowledgeBase(): Promise<{ written: number; skipped: number }> {
  const entries: { key: string; title: string; body: string }[] = []

  // Site content: everything textual, by key. The oversized media-heavy keys
  // are excluded rather than truncated -- a truncated blob of base64 is not
  // knowledge, it is noise that crowds out real answers.
  try {
    const rows = await sql`
      SELECT key, value FROM site_content
      WHERE key NOT IN ('founder_bio', 'team_members', 'bank_transfer_details', 'ai_settings')
    ` as { key: string; value: unknown }[]
    for (const r of rows) {
      const body = clean(r.value)
      if (body.length > 40) entries.push({ key: `content:${r.key}`, title: r.key.replace(/_/g, ' '), body })
    }
  } catch (err) { log.warn('kb rebuild', 'site_content unavailable', { error: String(err) }) }

  // Opportunities: summarised per type rather than one entry per listing.
  // 448 individual rows would swamp retrieval, and a visitor asking "do you
  // have jobs" wants the shape of what is on offer, not row 217.
  const totals: Record<string, number> = {}
  try {
    const totalRows = await sql`
      SELECT type, COUNT(*)::int AS n FROM opportunities
      WHERE expires_at IS NULL OR expires_at > NOW() GROUP BY type
    ` as { type: string; n: number }[]
    for (const t of totalRows) totals[t.type] = t.n
  } catch { /* falls back to the sampled count */ }

  try {
    const rows = await sql`
      SELECT type, COUNT(*)::int AS n,
             STRING_AGG(title, '; ' ORDER BY date_posted DESC NULLS LAST) AS titles
      FROM (
        SELECT type, title, date_posted,
               ROW_NUMBER() OVER (PARTITION BY type ORDER BY date_posted DESC NULLS LAST) AS rn
        FROM opportunities
        WHERE expires_at IS NULL OR expires_at > NOW()
      ) ranked
      WHERE rn <= 25
      GROUP BY type
    ` as { type: string; n: number; titles: string }[]
    for (const r of rows) {
      entries.push({
        key: `opportunities:${r.type}`,
        title: `${r.type} opportunities currently listed`,
        // r.n counts only the sampled rows, so the real total is fetched
        // separately below -- reporting 25 when 448 are live would be a
        // number the agent then repeats to visitors.
        body: clean(`${totals[r.type] ?? r.n} ${r.type} opportunities are live on the Community Hub right now, updated daily. A sample of the most recent: ${r.titles}`),
      })
    }
  } catch (err) { log.warn('kb rebuild', 'opportunities unavailable', { error: String(err) }) }

  // Career fair dates. This is the single most-asked support question, and the
  // answer lives in fair_events -- not in the page copy, which is why the
  // agent could not answer "what date is the fair" even though the date was
  // sitting in the database. Published and upcoming only: a draft is not a
  // commitment and a past date is not an answer.
  try {
    const rows = await sql`
      SELECT title, school, location, event_date, event_time, description
      FROM fair_events
      WHERE status = 'published' AND (event_date IS NULL OR event_date >= CURRENT_DATE)
      ORDER BY event_date NULLS LAST
      LIMIT 10
    ` as { title: string; school: string | null; location: string | null; event_date: string | null; event_time: string | null; description: string | null }[]

    if (rows.length) {
      const lines = rows.map(r => {
        const when = r.event_date
          ? new Date(r.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
          : 'date to be confirmed'
        return `${r.title}: ${when}${r.event_time ? `, ${r.event_time}` : ''}`
          + `${r.location ? `, at ${r.location}` : ''}${r.school ? ` (${r.school})` : ''}`
          + `${r.description ? `. ${r.description}` : ''}`
      })
      entries.push({
        key: 'fair:upcoming',
        title: 'Career Clarity Fair — upcoming dates',
        body: clean(`Upcoming Career Clarity Fair events, free for students to attend. ${lines.join(' ')}`),
      })
    }
  } catch (err) { log.warn('kb rebuild', 'fair_events unavailable', { error: String(err) }) }

  // Courses, from the CMS rather than a hardcoded list.
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = 'courses'` as { value: unknown }[]
    const courses = (rows[0]?.value ?? []) as { title?: string; description?: string; tagline?: string }[]
    if (Array.isArray(courses)) {
      for (const c of courses) {
        if (!c?.title) continue
        entries.push({
          key: `course:${c.title}`,
          title: `Course: ${c.title}`,
          body: clean(`${c.title}. ${c.tagline ?? ''} ${c.description ?? ''}`),
        })
      }
    }
  } catch (err) { log.warn('kb rebuild', 'courses unavailable', { error: String(err) }) }

  let written = 0
  let skipped = 0
  for (const e of entries) {
    if (!e.body || e.body.length < 40) { skipped++; continue }
    try {
      await sql`
        INSERT INTO kb_entries (source, source_key, title, body, status, updated_at)
        VALUES ('server', ${e.key}, ${e.title}, ${e.body}, 'active', NOW())
        ON CONFLICT (source_key) WHERE source = 'server'
        DO UPDATE SET title = ${e.title}, body = ${e.body}, status = 'active', updated_at = NOW()
      `
      written++
    } catch (err) {
      skipped++
      log.warn('kb rebuild', 'entry failed', { key: e.key, error: String(err) })
    }
  }

  // Server entries whose source disappeared are archived, not deleted, so a
  // bad rebuild is recoverable and an entry's history survives.
  try {
    const keys = entries.map(e => e.key)
    await sql`
      UPDATE kb_entries SET status = 'archived', updated_at = NOW()
      WHERE source = 'server' AND status = 'active' AND NOT (source_key = ANY(${keys}))
    `
  } catch (err) { log.warn('kb rebuild', 'archive sweep failed', { error: String(err) }) }

  return { written, skipped }
}

// Full-text search over active entries only.
//
// The terms are OR-ed, not AND-ed, and that is the whole trick. plainto_tsquery
// builds an AND of every lexeme, so a visitor's sentence only matches an entry
// containing ALL of its words -- "how do I get a datacamp scholarship" and
// "when is the next career clarity fair happening in Ibadan" both returned
// nothing against a knowledge base that plainly answers them. Recall comes
// from OR; precision comes from ts_rank ordering the hits.
//
// plainto_tsquery still does the parsing, so the visitor's text is never
// interpolated into a tsquery expression -- it is sanitised into lexemes
// first, and only the operators between them are rewritten. NULLIF guards the
// empty case: a question of pure stopwords yields an empty query, and
// to_tsquery('') raises a syntax error rather than returning nothing.
export async function searchKnowledgeBase(question: string, limit = 6): Promise<KbEntry[]> {
  const q = question.trim().slice(0, 500)
  if (!q) return []
  try {
    return await sql`
      WITH parsed AS (
        SELECT to_tsquery('english',
          NULLIF(replace(plainto_tsquery('english', ${q})::text, '&', '|'), '')
        ) AS tsq
      )
      SELECT k.id, k.source, k.source_key, k.title, k.body, k.status,
             k.approved_by, k.created_at, k.updated_at
      FROM kb_entries k, parsed
      WHERE parsed.tsq IS NOT NULL
        AND k.status = 'active'
        AND k.search @@ parsed.tsq
      ORDER BY ts_rank(k.search, parsed.tsq) DESC
      LIMIT ${limit}
    ` as KbEntry[]
  } catch (err) {
    log.warn('kb search', 'failed', { error: String(err) })
    return []
  }
}

// A staff reply to a question the agent could not answer becomes a PENDING
// entry. It is invisible to the agent until a human approves it -- the whole
// point of the review step is that an answer correct for one person is not
// automatically correct for everyone.
export async function proposeAnswerEntry(question: string, answer: string, reference: string) {
  const title = question.trim().slice(0, 160)
  const body = `Question: ${question.trim()}\n\nAnswer: ${answer.trim()}`
  if (title.length < 8 || answer.trim().length < 20) return
  try {
    await sql`
      INSERT INTO kb_entries (source, source_key, title, body, status)
      VALUES ('answer', ${`ticket:${reference}`}, ${title}, ${body.slice(0, MAX_BODY)}, 'pending')
    `
  } catch (err) {
    log.warn('kb propose', 'failed', { error: String(err) })
  }
}
