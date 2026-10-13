// Server-side read of the footer content. The shape and defaults live in
// footer-content-shared.ts so the admin editor can use them too.
import { getSiteContent } from './site-content'
import { FOOTER_CONTENT_KEY, normalizeFooterContent, type FooterContent } from './footer-content-shared'

export async function getFooterContent(): Promise<FooterContent> {
  const stored = await getSiteContent<unknown>(FOOTER_CONTENT_KEY)
  return normalizeFooterContent(stored)
}
