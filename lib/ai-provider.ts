import type { AiProvider } from '@/lib/ai-settings-shared'

// One place both agents call the model through, so the choice of provider is a
// setting rather than a rewrite.
//
// Vercel's AI Gateway exposes the SAME Anthropic Messages API -- same request
// body, same response shape, tools included -- so switching is three
// differences and nothing else:
//
//   endpoint   api.anthropic.com/v1/messages  ->  ai-gateway.vercel.sh/v1/messages
//   auth       x-api-key: KEY                 ->  Authorization: Bearer KEY
//   model      claude-sonnet-5                ->  anthropic/claude-sonnet-5
//
// That is why this is a plain fetch and not the AI SDK: adding a dependency
// and rewriting both agents to buy a switch we can express in ten lines would
// be a poor trade in a codebase this deliberately lean.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/messages'

export type ProviderConfig = {
  url: string
  headers: Record<string, string>
  /** The provider actually used, after falling back. */
  provider: AiProvider
}

/**
 * The gateway namespaces models by provider; Anthropic direct does not. Rather
 * than making someone re-type the model field when they flip the switch, the
 * prefix is added or stripped to match wherever the request is going.
 */
export function normaliseModel(model: string, provider: AiProvider): string {
  const bare = model.includes('/') ? model.slice(model.indexOf('/') + 1) : model
  return provider === 'vercel' ? `anthropic/${bare}` : bare
}

export function providerKey(provider: AiProvider): string | undefined {
  if (provider === 'vercel') {
    // OIDC is issued automatically to functions running on Vercel, so the
    // gateway works in production without a key being set by hand -- but not
    // locally, which is worth knowing when it works deployed and not on a
    // laptop.
    return process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
  }
  return process.env.ANTHROPIC_API_KEY
}

/**
 * Resolves where a request should go. Returns null when the chosen provider
 * has no usable credential AND neither does the other one -- a caller with
 * null must not spend, and must say why.
 *
 * If the chosen provider is unusable but the other is configured, it falls
 * back rather than failing: an agent that answers through the other route is
 * better than one that silently stops, and the returned `provider` says which
 * was actually used so the caller can report it honestly.
 */
export function resolveProvider(preferred: AiProvider): ProviderConfig | null {
  const order: AiProvider[] = preferred === 'vercel'
    ? ['vercel', 'anthropic']
    : ['anthropic', 'vercel']

  for (const provider of order) {
    const key = providerKey(provider)
    if (!key) continue
    return provider === 'vercel'
      ? {
          url: GATEWAY_URL,
          provider,
          headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        }
      : {
          url: ANTHROPIC_URL,
          provider,
          headers: {
            'content-type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
          },
        }
  }
  return null
}

/** Sends a Messages API request through the resolved provider. */
export async function callMessages(
  config: ProviderConfig,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(config.url, {
    method: 'POST',
    headers: config.headers,
    body: JSON.stringify({
      ...body,
      model: normaliseModel(String(body.model ?? ''), config.provider),
    }),
  })
}
