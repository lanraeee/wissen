import { OG_SIZE, loadCardData, loadLogo, loadPageCopy, renderCard } from '@/lib/og-card'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const alt = 'Wissen-Haus Empowerment Foundation — Encyclopedia Overview'
export const size = OG_SIZE
export const contentType = 'image/png'

// Kept so links already shared with /wiki/opengraph-image keep working. The wiki's
// share text now lives in Settings → Open Graph like every other page, and this
// route renders that same card.
export default async function Image() {
  const [logoDataUrl, data] = await Promise.all([loadLogo(), loadCardData()])
  const saved = await loadPageCopy('wiki', data.brand)
  return renderCard({ data, logoDataUrl, page: saved ? { title: saved.ogTitle, description: saved.description } : undefined })
}
