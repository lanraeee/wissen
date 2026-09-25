import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Shared building blocks for API route body schemas.
export const zEmail = z.string().trim().min(1).max(255).email()
export const zName = z.string().trim().min(1).max(100)
export const zShortText = z.string().trim().min(1).max(200)
export const zMessage = z.string().trim().max(5000).optional()
export const zLongText = z.string().trim().min(1).max(5000)

/**
 * Parses and validates a request body against a Zod schema.
 * Returns { data } on success, or { error } — a 400 NextResponse ready to
 * return directly — on failure (including malformed JSON).
 */
export async function parseBody<T extends z.ZodTypeAny>(
  req: NextRequest,
  schema: T
): Promise<{ data: z.infer<T>; error?: undefined } | { data?: undefined; error: NextResponse }> {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return { error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  }

  const result = schema.safeParse(json)
  if (!result.success) {
    const first = result.error.issues[0]
    const field = first?.path.join('.')
    const message = field ? `${field}: ${first.message}` : first?.message ?? 'Invalid request body'
    return { error: NextResponse.json({ error: message }, { status: 400 }) }
  }

  return { data: result.data }
}
