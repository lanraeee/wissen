import { loadCardData, loadLogo, loadPageCopy, renderCard } from '@/lib/og-card'
import { ogSchemaFor } from '@/lib/og-schema'
import { adminGuard } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

/**
 * Per-page share card. `?slug=` picks a page registered in lib/og-schema.ts and
 * renders its saved (or default) share title and description. `t` and `d` are
 * optional text overrides used only by the admin Open Graph preview so unsaved
 * edits show up live. They are honoured only for a signed-in admin -- otherwise
 * anyone could mint a card in the foundation's branding with arbitrary text.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams
  const slug = q.get('slug') ?? ''
  const [logoDataUrl, data] = await Promise.all([loadLogo(), loadCardData()])
  if (!ogSchemaFor(slug)) return renderCard({ data, logoDataUrl })
  const saved = await loadPageCopy(slug, data.brand)
  const override = q.has('t') || q.has('d') ? await adminGuard() : null
  const title = (override ? (q.get('t') ?? '').slice(0, 90) : '') || saved?.ogTitle || ''
  const description = (override ? (q.get('d') ?? '').slice(0, 300) : '') || saved?.description || ''
  return renderCard({ data, logoDataUrl, page: { title, description } })
}
