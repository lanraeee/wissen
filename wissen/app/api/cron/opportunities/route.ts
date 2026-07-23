import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'
const GENERIC_UA = 'Mozilla/5.0 (compatible; WissenHaus/1.0)'

const NIGERIA_KEYWORDS = ['nigeria', 'nigerian']
const AFRICA_KEYWORDS = ['africa', 'sub-saharan', 'pan-african', 'pan africa']
const WORLDWIDE_KEYWORDS = ['anywhere', 'worldwide', 'world wide', 'global', 'any location', 'any timezone', 'no location restriction', 'international', 'open to all countries']
const HYBRID_RELOCATE_RE = /\b(hybrid|on-?site|in-office|relocat\w*)\b/i
const EXCLUDE_COUNTRY_KEYWORDS = ['us only', 'u.s. only', 'usa only', 'us-based', 'u.s.-based', 'us residents', 'us residents only', 'us citizens only', 'united states only', 'must be based in the us', 'must reside in the us', 'eu only', 'eu residents', 'eu-based', 'european union only', 'europe only', 'uk only', 'uk-based', 'u.k.-based', 'united kingdom only', 'canada only', 'canadian residents', 'australia only', 'germany only', 'netherlands only', 'ireland only', 'india only', 'philippines only', 'south africa only', 'kenya only', 'ghana only', 'egypt only']

function stripHtml(html: string) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim()
}

function normalizeUrl(url: string) {
  if (!url) return ''
  return url.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').split('?')[0].split('#')[0]
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
}

function matchAny(text: string, keywords: string[]) {
  const lower = text.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

function checkEligibility(text: string): { code: string; label: string } | null {
  if (!text) return null
  const lower = text.toLowerCase()
  if (HYBRID_RELOCATE_RE.test(lower)) return null
  if (matchAny(lower, NIGERIA_KEYWORDS)) return { code: 'nigeria', label: 'Open to Nigeria' }
  if (matchAny(lower, AFRICA_KEYWORDS)) return { code: 'africa', label: 'Open to Africa' }
  if (matchAny(lower, WORLDWIDE_KEYWORDS)) return { code: 'worldwide', label: 'Open Worldwide' }
  if (matchAny(lower, EXCLUDE_COUNTRY_KEYWORDS)) return null
  return null
}

function generateId(source: string, title: string, company: string) {
  const seed = `${source}-${slugify(title)}-${slugify(company)}`
  return seed.slice(0, 60).replace(/-+$/, '')
}

function extractXmlTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i'))
  return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : ''
}

interface OppItem {
  type: string
  source: string
  id: string
  title: string
  company: string | null
  url: string
  datePosted: string | null
  firstSeenAt: string
  expiresAt: string | null
  eligibility: string
  eligibilityLabel: string
  tags: string[]
}

async function fetchRemoteOK(): Promise<OppItem[]> {
  try {
    const res = await fetch('https://remoteok.com/api', { headers: { 'User-Agent': GENERIC_UA } })
    if (!res.ok) throw new Error(`RemoteOK: ${res.status}`)
    const data = await res.json()
    const items = data.slice(1).filter((job: Record<string, unknown>) => job.position)
    return items.map((job: Record<string, unknown>) => {
      const combined = `${job.position || ''} ${job.location || ''} ${((job.tags as string[]) || []).join(' ')} ${stripHtml((job.description as string) || '')}`.toLowerCase()
      let elig = checkEligibility(combined)
      if (!elig && !(job.location as string)?.trim()) elig = { code: 'unrestricted', label: 'Open Worldwide' }
      if (!elig) return null
      return {
        type: 'job', source: 'remoteok',
        id: job.id ? `remoteok-${job.id}` : generateId('remoteok', job.position as string, job.company as string),
        title: job.position as string, company: job.company as string,
        url: (job.apply_url || job.url) as string,
        datePosted: job.date ? (job.date as string).split('T')[0] : new Date().toISOString().split('T')[0],
        firstSeenAt: new Date().toISOString(), expiresAt: null,
        eligibility: elig.code, eligibilityLabel: elig.label,
        tags: ((job.tags as string[]) || []).slice(0, 2)
      }
    }).filter(Boolean)
  } catch (e) { console.error('RemoteOK error:', e); return [] }
}

async function fetchWeWorkRemotely(): Promise<OppItem[]> {
  try {
    const res = await fetch('https://weworkremotely.com/remote-jobs.rss', { headers: { 'User-Agent': GENERIC_UA } })
    if (!res.ok) throw new Error(`WWR: ${res.status}`)
    const xml = await res.text()
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || []
    return items.map(item => {
      const title = extractXmlTag(item, 'title')
      const region = extractXmlTag(item, 'region').toLowerCase()
      const country = extractXmlTag(item, 'country').toLowerCase()
      const description = extractXmlTag(item, 'description')
      const pubDate = extractXmlTag(item, 'pubDate')
      const expiresAt = extractXmlTag(item, 'expires_at')
      const link = extractXmlTag(item, 'link')
      if (HYBRID_RELOCATE_RE.test(description.toLowerCase())) return null
      let elig: { code: string; label: string } | null = null
      if (matchAny(region, WORLDWIDE_KEYWORDS)) elig = { code: 'worldwide', label: 'Open Worldwide' }
      else if (matchAny(region, NIGERIA_KEYWORDS)) elig = { code: 'nigeria', label: 'Open to Nigeria' }
      else if (matchAny(region, AFRICA_KEYWORDS)) elig = { code: 'africa', label: 'Open to Africa' }
      else if (region && matchAny(region, EXCLUDE_COUNTRY_KEYWORDS)) return null
      else if (!region && !country) elig = { code: 'unrestricted', label: 'Open Worldwide' }
      else return null
      if (!elig) return null
      let datePosted = new Date().toISOString().split('T')[0]
      try { datePosted = new Date(pubDate).toISOString().split('T')[0] } catch {}
      let expiryDate: string | null = null
      if (expiresAt) try { expiryDate = new Date(expiresAt).toISOString() } catch {}
      return {
        type: 'job', source: 'weworkremotely',
        id: `wwr-${slugify(title)}-${slugify(extractXmlTag(item, 'company'))}`,
        title, company: extractXmlTag(item, 'company'), url: link,
        datePosted, firstSeenAt: new Date().toISOString(), expiresAt: expiryDate,
        eligibility: elig.code, eligibilityLabel: elig.label,
        tags: extractXmlTag(item, 'category').split(',').map(s => s.trim()).slice(0, 2)
      }
    }).filter(Boolean) as OppItem[]
  } catch (e) { console.error('WeWorkRemotely error:', e); return [] }
}

async function fetchHimalayas(): Promise<OppItem[]> {
  try {
    const res = await fetch('https://himalayas.app/jobs/api', { headers: { 'User-Agent': GENERIC_UA } })
    if (!res.ok) throw new Error(`Himalayas: ${res.status}`)
    const { jobs } = await res.json()
    if (!Array.isArray(jobs)) return []
    return jobs.map((job: Record<string, unknown>) => {
      if (stripHtml(`${job.description}${job.excerpt}`).match(HYBRID_RELOCATE_RE)) return null
      const restrictions = (job.locationRestrictions as string[]) || []
      let elig: { code: string; label: string } | null = null
      if (restrictions.length === 0) elig = { code: 'unrestricted', label: 'Open Worldwide' }
      else if (restrictions.includes('Nigeria')) elig = { code: 'nigeria', label: 'Open to Nigeria' }
      else if (restrictions.includes('Africa')) elig = { code: 'africa', label: 'Open to Africa' }
      else return null
      let datePosted = new Date().toISOString().split('T')[0]
      try { datePosted = new Date((job.pubDate as number) * 1000).toISOString().split('T')[0] } catch {}
      let expiryDate: string | null = null
      if (job.expiryDate) try { expiryDate = new Date((job.expiryDate as number) * 1000).toISOString() } catch {}
      const isInternship = /intern(ship)?/i.test((job.employmentType as string) || '') || /intern(ship)?/i.test((job.title as string) || '')
      return {
        type: isInternship ? 'internship' : 'job', source: 'himalayas',
        id: (job.guid as string) || generateId('himalayas', job.title as string, job.companyName as string),
        title: job.title as string, company: job.companyName as string,
        url: job.applicationLink as string,
        datePosted, firstSeenAt: new Date().toISOString(), expiresAt: expiryDate,
        eligibility: elig.code, eligibilityLabel: elig.label,
        tags: ((job.categories as string[]) || []).slice(0, 2)
      }
    }).filter(Boolean) as OppItem[]
  } catch (e) { console.error('Himalayas error:', e); return [] }
}

async function fetchArbeitnow(): Promise<OppItem[]> {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', { headers: { 'User-Agent': GENERIC_UA } })
    if (!res.ok) throw new Error(`Arbeitnow: ${res.status}`)
    const { data } = await res.json()
    if (!Array.isArray(data)) return []
    return data.filter((job: Record<string, unknown>) => job.remote === true).map((job: Record<string, unknown>) => {
      const combined = `${job.title || ''} ${job.location || ''} ${((job.tags as string[]) || []).join(' ')} ${stripHtml((job.description as string) || '')}`.toLowerCase()
      let elig = checkEligibility(combined)
      if (!elig && !(job.location as string)?.trim()) elig = { code: 'unrestricted', label: 'Open Worldwide' }
      if (!elig) return null
      let datePosted = new Date().toISOString().split('T')[0]
      try { datePosted = new Date((job.created_at as number) * 1000).toISOString().split('T')[0] } catch {}
      const isInternship = /intern(ship)?/i.test(((job.job_types as string[])?.[0]) || '') || /intern(ship)?/i.test((job.title as string) || '')
      return {
        type: isInternship ? 'internship' : 'job', source: 'arbeitnow',
        id: (job.slug as string) || generateId('arbeitnow', job.title as string, job.company_name as string),
        title: job.title as string, company: job.company_name as string, url: job.url as string,
        datePosted, firstSeenAt: new Date().toISOString(), expiresAt: null,
        eligibility: elig.code, eligibilityLabel: elig.label,
        tags: ((job.tags as string[]) || []).slice(0, 2)
      }
    }).filter(Boolean) as OppItem[]
  } catch (e) { console.error('Arbeitnow error:', e); return [] }
}

async function fetchDevpost(): Promise<OppItem[]> {
  try {
    const allHackathons: Record<string, unknown>[] = []
    for (let page = 1; page <= 6; page++) {
      const res = await fetch(`https://devpost.com/api/hackathons?status[]=open&page=${page}`, { headers: { 'User-Agent': BROWSER_UA } })
      if (!res.ok) break
      const { hackathons, meta } = await res.json()
      if (!hackathons?.length) break
      allHackathons.push(...hackathons)
      if (meta?.total_count && allHackathons.length >= meta.total_count) break
    }
    return allHackathons.filter((h: Record<string, unknown>) => (h.displayed_location as Record<string, unknown>)?.location === 'Online').map(h => {
      let datePosted = new Date().toISOString().split('T')[0]
      try {
        const [start] = ((h.submission_period_dates as string) || '').split(' - ')
        datePosted = new Date(start).toISOString().split('T')[0]
      } catch {}
      return {
        type: 'competition', source: 'devpost',
        id: `devpost-${h.id}`,
        title: h.title as string, company: h.organization_name as string, url: h.url as string,
        datePosted, firstSeenAt: new Date().toISOString(), expiresAt: null,
        eligibility: 'worldwide', eligibilityLabel: 'Open Worldwide',
        tags: ((h.themes as Array<{name:string}>) || []).map(t => t.name).slice(0, 2)
      }
    })
  } catch (e) { console.error('Devpost error:', e); return [] }
}

async function fetchScholarshipsForAfricans(): Promise<OppItem[]> {
  try {
    const res = await fetch('https://scholarshipsforafricans.com/rss.xml', { headers: { 'User-Agent': GENERIC_UA } })
    if (!res.ok) throw new Error(`SFA: ${res.status}`)
    const xml = await res.text()
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || []
    return items.map(item => {
      const title = extractXmlTag(item, 'title')
      const description = extractXmlTag(item, 'description')
      const link = extractXmlTag(item, 'link')
      const catMatches = item.match(/<category>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/category>/g) || []
      const categories = catMatches.map(m => extractXmlTag(m, 'category')).filter(Boolean)
      const combined = `${title} ${description}`.toLowerCase()
      let elig = { code: 'africa', label: 'Open to Africa' }
      if (matchAny(combined, NIGERIA_KEYWORDS)) elig = { code: 'nigeria', label: 'Open to Nigeria' }
      else if (matchAny(combined, ['open to all nationalities', 'international students', 'worldwide', 'any nationality'])) elig = { code: 'worldwide', label: 'Open Worldwide' }
      return {
        type: 'scholarship', source: 'scholarshipsforafricans',
        id: `sfa-${slugify(title)}`, title, company: 'N/A', url: link,
        datePosted: null, firstSeenAt: new Date().toISOString(), expiresAt: null,
        eligibility: elig.code, eligibilityLabel: elig.label,
        tags: categories.slice(0, 2)
      }
    }).filter(Boolean) as OppItem[]
  } catch (e) { console.error('ScholarshipsForAfricans error:', e); return [] }
}

function shouldPrune(item: OppItem, now: Date) {
  if (item.expiresAt) try { if (new Date(item.expiresAt) < now) return true } catch {}
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ref = item.datePosted || item.firstSeenAt
  if (ref) try { if (new Date(ref) < cutoff) return true } catch {}
  return false
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [remoteOK, wwr, himalayas, arbeitnow, devpost, scholarships] = await Promise.all([
      fetchRemoteOK(), fetchWeWorkRemotely(), fetchHimalayas(),
      fetchArbeitnow(), fetchDevpost(), fetchScholarshipsForAfricans()
    ])

    const allNew = [...remoteOK, ...wwr, ...himalayas, ...arbeitnow, ...devpost, ...scholarships]
    const sourceOrder: Record<string, number> = { himalayas: 1, weworkremotely: 2, arbeitnow: 3, remoteok: 4, devpost: 5, scholarshipsforafricans: 6 }

    const merged = new Map<string, OppItem>()
    allNew.forEach(item => {
      const pk = normalizeUrl(item.url)
      const sk = `${item.type}|${slugify(item.title)}|${slugify(item.company || '')}`
      const key = pk || sk
      if (!key) return
      const existing = merged.get(key)
      if (!existing) { merged.set(key, item) }
      else {
        const newOrder = sourceOrder[item.source] || 99
        const existOrder = sourceOrder[existing.source] || 99
        if (newOrder < existOrder) merged.set(key, item)
      }
    })

    const now = new Date()
    let items = Array.from(merged.values()).filter(item => !shouldPrune(item, now))

    // Upsert into DB
    let upserted = 0
    for (const item of items) {
      await sql`
        INSERT INTO opportunities (id, type, source, title, company, url, date_posted, first_seen_at, expires_at, eligibility, eligibility_label, tags, updated_at)
        VALUES (
          ${item.id}, ${item.type}, ${item.source}, ${item.title}, ${item.company},
          ${item.url}, ${item.datePosted ?? null}, ${item.firstSeenAt},
          ${item.expiresAt ?? null}, ${item.eligibility}, ${item.eligibilityLabel},
          ${item.tags}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          company = EXCLUDED.company,
          url = EXCLUDED.url,
          date_posted = EXCLUDED.date_posted,
          expires_at = EXCLUDED.expires_at,
          eligibility = EXCLUDED.eligibility,
          eligibility_label = EXCLUDED.eligibility_label,
          tags = EXCLUDED.tags,
          updated_at = NOW()
      `
      upserted++
    }

    // Prune old records from DB
    await sql`
      DELETE FROM opportunities
      WHERE (expires_at IS NOT NULL AND expires_at < NOW())
      OR (date_posted IS NOT NULL AND date_posted < NOW() - INTERVAL '30 days')
      OR (date_posted IS NULL AND first_seen_at < NOW() - INTERVAL '30 days')
    `

    return NextResponse.json({ success: true, upserted, total: items.length })
  } catch (err) {
    console.error('[cron/opportunities]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Also support GET for Vercel cron (which sends GET)
export async function GET(req: NextRequest) {
  return POST(req)
}
