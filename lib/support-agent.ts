import sql from '@/lib/db'
import { log } from '@/lib/logger'
import { getAiSettings } from '@/lib/ai-settings'
import { searchKnowledgeBase } from '@/lib/knowledge-base'

const API_URL = 'https://api.anthropic.com/v1/messages'

// Fallback ceiling on Anthropic calls per calendar month. The live value is
// admin-editable (Settings -> AI); this is what applies if those settings
// cannot be read. A foundation pays this bill, so the failure mode of a loop
// or an abusive session must be "the agent stops answering", never "the card
// keeps being charged".
export const MONTHLY_CALL_CAP = 1500

// Cap on the grounding context. site_content holds some very large values --
// founder_bio is ~410 KB and team_members ~137 KB, both mostly base64 image
// data -- so context is assembled from an allowlist of small text keys and
// then truncated anyway. Never widen this to "all of site_content".
const CONTEXT_CHAR_BUDGET = 12_000

const CONTEXT_KEYS = [
  'foundation_details',
  'site_settings',
  'page_copy_about',
  'page_copy_career_clarity_fair',
  'page_copy_donate',
  'partner_scholarships',
  'partners',
  'careers_roles',
  'careers_internships',
  'policy_papers',
]

export function isAgentConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

async function callsThisMonth(): Promise<number> {
  const rows = await sql`SELECT calls FROM ai_usage WHERE month = ${currentMonth()}`
  return rows[0]?.calls ?? 0
}

async function recordUsage(inputTokens: number, outputTokens: number) {
  await sql`
    INSERT INTO ai_usage (month, calls, input_tokens, output_tokens, updated_at)
    VALUES (${currentMonth()}, 1, ${inputTokens}, ${outputTokens}, NOW())
    ON CONFLICT (month) DO UPDATE SET
      calls = ai_usage.calls + 1,
      input_tokens = ai_usage.input_tokens + ${inputTokens},
      output_tokens = ai_usage.output_tokens + ${outputTokens},
      updated_at = NOW()
  `
}

// Strips embedded images and other binary payloads before anything reaches the
// model. Some CMS values carry data: URIs inline; sending those would burn the
// context window on pixels and could push real content out of it.
// Takes `unknown` on purpose: JSON.stringify returns undefined (not a string)
// for undefined input, so a site_content row with a null value would otherwise
// crash the whole chat turn on a cosmetic step.
function stripBinary(value: unknown): string {
  const text = JSON.stringify(value)
  if (typeof text !== 'string') return ''
  return text
    .replace(/data:[a-z/+-]+;base64,[A-Za-z0-9+/=]+/gi, '[image]')
    .replace(/\s+/g, ' ')
    .trim()
}

async function buildContext(): Promise<string> {
  let rows: { key: string; value: unknown }[] = []
  try {
    rows = await sql`
      SELECT key, value FROM site_content WHERE key = ANY(${CONTEXT_KEYS})
    ` as { key: string; value: unknown }[]
  } catch (err) {
    log.warn('support agent', 'could not load grounding context', { error: String(err) })
    return ''
  }

  let out = ''
  for (const row of rows) {
    const body = stripBinary(row.value)
    if (!body) continue
    const chunk = `\n## ${row.key}\n${body}`
    // `continue`, not `break`: site_content rows come back in no particular
    // order, so one oversized value used to drop every key after it from the
    // agent's context -- silently, and differently on each deploy.
    if (out.length + chunk.length > CONTEXT_CHAR_BUDGET) continue
    out += chunk
  }
  return out
}

const SYSTEM_PROMPT = `You are the support assistant for Wissen-Haus Empowerment Foundation, a non-profit that equips African youth and the diaspora with skills, mentorship and opportunities. You are speaking with a visitor on the Wissen-Haus website.

ANSWER ONLY FROM THE CONTEXT PROVIDED BELOW.
If the context does not contain the answer, do not guess -- escalate to a human instead.

Hard rules, no exceptions:
- NEVER give bank account details, payment instructions, or any way to send money. If someone asks how to donate, tell them to use the Donate page on the website and escalate if they need more.
- Wissen-Haus NEVER asks anyone for money in exchange for scholarship access, applications, or places. If a visitor says they were asked to pay for any of these, tell them clearly that this is not how Wissen-Haus operates and escalate immediately.
- NEVER promise or imply a scholarship, place, award or outcome. Applications are assessed; you cannot predict results.
- NEVER invent deadlines, amounts, eligibility rules or dates. If you are not certain from the context, escalate.
- NEVER give legal, medical, immigration or financial advice.
- Do not collect personal data beyond what the visitor volunteers. Never ask for passwords, card numbers or government ID.

Style: warm, plain and brief -- two or three short sentences is usually right. Your audience is mostly young people in Nigeria and the diaspora, often on a phone and a slow connection. No jargon.

Escalate (set "escalate": true) when: the visitor asks for a human, the context does not answer the question, the topic is money, a complaint, safeguarding, or anything about someone's specific application status.

Respond ONLY with a JSON object of this exact shape:
{"reply": "<what to say to the visitor>", "escalate": <true or false>}`

// Coerces a support thread into the shape the Messages API accepts:
// non-empty content, alternating roles, first message from the user.
// Consecutive same-role turns are merged rather than dropped, so nothing the
// visitor said is lost from the context.
export function normaliseTurns(
  history: { author_type: string; body: string }[],
): { role: 'user' | 'assistant'; content: string }[] {
  const out: { role: 'user' | 'assistant'; content: string }[] = []

  for (const m of history) {
    const content = (m.body ?? '').trim()
    if (!content) continue // an empty content block is itself a 400
    const role = m.author_type === 'visitor' ? 'user' as const : 'assistant' as const
    const last = out[out.length - 1]
    if (last && last.role === role) last.content += '\n\n' + content
    else out.push({ role, content })
  }

  // Must open with the user. An assistant-first thread (the agent greeted
  // first, or a staff note landed before any visitor message) is rejected.
  while (out.length && out[0].role === 'assistant') out.shift()
  return out
}

// What this visitor has asked before, by email. Context retention without a
// second model call: the agent stops asking someone to re-explain themselves
// across conversations, and can say "you asked about this last week".
// Excludes the current ticket so the live thread is not duplicated.
async function recallVisitor(email: string | null | undefined, ticketId: string | null | undefined): Promise<string> {
  if (!email) return ''
  try {
    const rows = await sql`
      SELECT t.reference, t.subject, t.created_at, t.status,
             (SELECT m.body FROM ticket_messages m
               WHERE m.ticket_id = t.id AND m.author_type IN ('staff','ai') AND m.internal = FALSE
               ORDER BY m.created_at DESC LIMIT 1) AS last_reply
      FROM support_tickets t
      WHERE lower(t.requester_email) = lower(${email})
        AND (${ticketId}::uuid IS NULL OR t.id <> ${ticketId}::uuid)
      ORDER BY t.created_at DESC
      LIMIT 3
    ` as { reference: string; subject: string; created_at: string; status: string; last_reply: string | null }[]

    if (!rows.length) return ''
    const lines = rows.map(r =>
      `- ${new Date(r.created_at).toISOString().slice(0, 10)} (${r.status}): "${r.subject}"`
      + (r.last_reply ? ` — we replied: ${r.last_reply.slice(0, 200)}` : ' — no reply yet'))
    return "\n\n# THIS VISITOR'S EARLIER CONVERSATIONS\n"
      + 'Use these for continuity. Do not repeat questions they have already answered.\n'
      + lines.join('\n')
  } catch {
    return ''
  }
}

export type AgentResult =
  | { status: 'ok'; reply: string; escalate: boolean }
  | { status: 'unavailable'; reason: 'not_configured' | 'cap_reached' | 'error' }

export async function answerSupportQuestion(
  history: { author_type: string; body: string }[],
  question: string,
  opts: { visitorEmail?: string | null; ticketId?: string | null } = {},
): Promise<AgentResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { status: 'unavailable', reason: 'not_configured' }

  const settings = await getAiSettings()
  if (!settings.supportEnabled) return { status: 'unavailable', reason: 'not_configured' }

  try {
    if (await callsThisMonth() >= settings.monthlyCallCap) {
      log.warn('support agent', 'monthly call cap reached', { cap: settings.monthlyCallCap })
      return { status: 'unavailable', reason: 'cap_reached' }
    }
  } catch {
    // If the ledger cannot be read we cannot prove we are under the cap, so
    // we do not spend. Failing closed on a billing guard is the safe default.
    return { status: 'unavailable', reason: 'error' }
  }

  const [baseContext, kbHits, memory] = await Promise.all([
    buildContext(),
    // Retrieved per question, so the agent sees the parts of the knowledge
    // base that actually bear on what was asked rather than a fixed excerpt.
    searchKnowledgeBase(question),
    recallVisitor(opts.visitorEmail, opts.ticketId),
  ])

  const context = [
    baseContext,
    kbHits.length
      ? '\n\n# KNOWLEDGE BASE\n'
        + kbHits.map(k => `## ${k.title}\n${k.body}`).join('\n\n')
      : '',
    memory,
  ].filter(Boolean).join('')

  // Only the last few turns: a support chat rarely needs more, and an
  // unbounded history is an unbounded per-call cost.
  //
  // normaliseTurns is not cosmetic. The Messages API requires roles to
  // alternate and the first message to be from the user, and a real support
  // thread breaks both: a visitor often sends two messages before anyone
  // replies, and a thread can open with an assistant line. Either shape is a
  // 400, which is what took the agent down in production -- it failed soft,
  // so every chat silently handed off to a human instead.
  // The question is normalised WITH the history, not appended after it: if
  // the last stored turn is also from the visitor, appending would produce
  // two consecutive user messages -- the same 400 by another route.
  const turns = normaliseTurns([
    ...history.slice(-20),
    { author_type: 'visitor', body: question },
  ])
  if (!turns.length) return { status: 'unavailable', reason: 'error' }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: settings.supportModel,
        max_tokens: 600,
        // Admin-supplied notes are APPENDED to the guardrails, never
        // substituted for them: SYSTEM_PROMPT's hard rules (no payment
        // details, no promised scholarships, no invented deadlines) stay in
        // code precisely so nobody can edit them away from the admin panel.
        system: `${SYSTEM_PROMPT}\n\n# CONTEXT\n${context}`
          + (settings.supportExtraContext ? `\n\n# NOTES FROM THE TEAM\n${settings.supportExtraContext}` : ''),
        messages: [
          ...turns,
          // Prefilling the opening brace forces the JSON shape instead of a
          // prose preamble we would then have to parse around.
          { role: 'assistant', content: '{' },
        ],
      }),
    })

    if (!res.ok) {
      // The body carries the reason; the status alone does not. Logging only
      // the status is why a 400 here cost a deploy and a production test to
      // diagnose.
      const detail = await res.text().catch(() => '')
      log.error('support agent', new Error(`Anthropic ${res.status}: ${detail.slice(0, 500)}`))
      return { status: 'unavailable', reason: 'error' }
    }

    const data = await res.json()
    await recordUsage(data.usage?.input_tokens ?? 0, data.usage?.output_tokens ?? 0)

    const text = '{' + (data.content?.[0]?.text ?? '')
    const parsed = JSON.parse(text) as { reply?: string; escalate?: boolean }
    if (!parsed.reply) return { status: 'unavailable', reason: 'error' }

    return { status: 'ok', reply: parsed.reply, escalate: parsed.escalate === true }
  } catch (err) {
    log.error('support agent', err)
    return { status: 'unavailable', reason: 'error' }
  }
}
