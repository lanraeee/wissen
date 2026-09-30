import { NextResponse } from 'next/server'
import { directorGuard } from '@/lib/admin-guard'
import { getAiSettings } from '@/lib/ai-settings'

export const dynamic = 'force-dynamic'

// "Is the AI actually working?" is otherwise unanswerable from the outside:
// both agents fail soft by design, so a missing key, a rejected key and a
// model name the account cannot use all look identical to a visitor -- the
// chat just hands off to a human. Usage is only recorded after a SUCCESSFUL
// response, so an empty ai_usage table does not distinguish them either.
//
// This makes one minimal call and reports what actually came back. Director
// only, and it never returns the key itself -- only whether one is present
// and what Anthropic said about it.
export async function GET() {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const key = process.env.ANTHROPIC_API_KEY
  const settings = await getAiSettings()

  if (!key) {
    return NextResponse.json({
      keyPresent: false,
      ok: false,
      detail: 'ANTHROPIC_API_KEY is not set in this environment. Note that a Vercel variable scoped to Production only is absent from Preview and local development.',
    })
  }

  // Shape problems that produce a confusing 401: a value pasted with quotes
  // or trailing whitespace is a common one and worth naming explicitly.
  const malformed = key !== key.trim() || /^["']|["']$/.test(key)

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: settings.supportModel,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    })

    if (res.ok) {
      return NextResponse.json({
        keyPresent: true, keyLooksMalformed: malformed, model: settings.supportModel,
        ok: true, detail: 'Anthropic responded successfully.',
      })
    }

    const body = await res.json().catch(() => ({}))
    return NextResponse.json({
      keyPresent: true,
      keyLooksMalformed: malformed,
      model: settings.supportModel,
      ok: false,
      status: res.status,
      // Anthropic's own error type/message, which is what actually says
      // whether the key is rejected or the model name is wrong.
      errorType: body?.error?.type ?? null,
      detail: body?.error?.message ?? `Anthropic returned ${res.status}.`,
    })
  } catch (err) {
    return NextResponse.json({
      keyPresent: true, keyLooksMalformed: malformed, ok: false,
      detail: `Could not reach Anthropic: ${err instanceof Error ? err.message : String(err)}`,
    })
  }
}
