import sql from '@/lib/db'
import { log } from '@/lib/logger'

const MODEL = 'claude-sonnet-5'
const API_URL = 'https://api.anthropic.com/v1/messages'

// Hard ceiling on Anthropic calls per calendar month, counted server-side
// before every request. A foundation pays this bill, so the failure mode of a
// loop or an abusive session must be "the agent stops answering", never "the
// card keeps being charged". Raise it deliberately, not reflexively.
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
    if (out.length + chunk.length > CONTEXT_CHAR_BUDGET) break
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

export type AgentResult =
  | { status: 'ok'; reply: string; escalate: boolean }
  | { status: 'unavailable'; reason: 'not_configured' | 'cap_reached' | 'error' }

export async function answerSupportQuestion(
  history: { author_type: string; body: string }[],
  question: string,
): Promise<AgentResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { status: 'unavailable', reason: 'not_configured' }

  try {
    if (await callsThisMonth() >= MONTHLY_CALL_CAP) {
      log.warn('support agent', 'monthly call cap reached', { cap: MONTHLY_CALL_CAP })
      return { status: 'unavailable', reason: 'cap_reached' }
    }
  } catch {
    // If the ledger cannot be read we cannot prove we are under the cap, so
    // we do not spend. Failing closed on a billing guard is the safe default.
    return { status: 'unavailable', reason: 'error' }
  }

  const context = await buildContext()

  // Only the last few turns: a support chat rarely needs more, and an
  // unbounded history is an unbounded per-call cost.
  const turns = history.slice(-8).map(m => ({
    role: m.author_type === 'visitor' ? 'user' as const : 'assistant' as const,
    content: m.body,
  }))

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: `${SYSTEM_PROMPT}\n\n# CONTEXT\n${context}`,
        messages: [
          ...turns,
          { role: 'user', content: question },
          // Prefilling the opening brace forces the JSON shape instead of a
          // prose preamble we would then have to parse around.
          { role: 'assistant', content: '{' },
        ],
      }),
    })

    if (!res.ok) {
      log.error('support agent', new Error(`Anthropic ${res.status}`))
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
