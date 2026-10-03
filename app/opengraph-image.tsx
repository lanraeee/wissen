import { OG_SIZE, loadCardData, loadLogo, renderCard } from '@/lib/og-card'

export const runtime = 'edge'
// Forces a re-run on every request; the Cache-Control set in renderCard is what
// actually keeps the CDN and crawlers from freezing the card (see lib/og-card).
export const dynamic = 'force-dynamic'
export const alt = 'Wissen-Haus Empowerment Foundation'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  const [logoDataUrl, data] = await Promise.all([loadLogo(), loadCardData()])
  return renderCard({ data, logoDataUrl })
}
