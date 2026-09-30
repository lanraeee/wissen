import { NextResponse } from 'next/server'
import { directorGuard } from '@/lib/admin-guard'
import { getAiSettings } from '@/lib/ai-settings'
import { resolveProvider, normaliseModel, callMessages } from '@/lib/ai-provider'

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

  const settings = await getAiSettings()
  const provider = resolveProvider(settings.provider)

  if (!provider) {
    return NextResponse.json({
      keyPresent: false,
      ok: false,
      chose: settings.provider,
      detail: settings.provider === 'vercel'
        ? 'Neither AI_GATEWAY_API_KEY nor ANTHROPIC_API_KEY is set in this environment. A Vercel variable scoped to Production only is absent from Preview and local development.'
        : 'Neither ANTHROPIC_API_KEY nor AI_GATEWAY_API_KEY is set in this environment. A Vercel variable scoped to Production only is absent from Preview and local development.',
    })
  }

  // Naming which route was actually taken matters: resolveProvider falls back
  // when the preferred one has no credential, so "it works" can be true of a
  // provider the admin did not choose.
  const usedFallback = provider.provider !== settings.provider
  const model = normaliseModel(settings.supportModel, provider.provider)

  try {
    const res = await callMessages(provider, {
      model: settings.supportModel,
      max_tokens: 1,
      messages: [{ role: 'user', content: 'hi' }],
    })

    if (res.ok) {
      return NextResponse.json({
        keyPresent: true, ok: true, chose: settings.provider,
        used: provider.provider, usedFallback, model,
        detail: `${provider.provider === 'vercel' ? 'Vercel AI Gateway' : 'Anthropic'} responded successfully.`,
      })
    }

    const body = await res.json().catch(() => ({}))
    return NextResponse.json({
      keyPresent: true, ok: false, chose: settings.provider,
      used: provider.provider, usedFallback, model,
      status: res.status,
      // The provider's own error type/message, which is what actually says
      // whether the credential is rejected or the model name is wrong.
      errorType: body?.error?.type ?? null,
      detail: body?.error?.message ?? `${provider.provider} returned ${res.status}.`,
    })
  } catch (err) {
    return NextResponse.json({
      keyPresent: true, ok: false, chose: settings.provider,
      used: provider.provider, usedFallback, model,
      detail: `Could not reach ${provider.provider}: ${err instanceof Error ? err.message : String(err)}`,
    })
  }
}
