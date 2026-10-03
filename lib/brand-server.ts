import { getSiteContent } from './site-content'
import { DEFAULT_BRAND, brandFromSettings, type Brand } from './brand'

export * from './brand'

/** Current brand (cached; revalidated the moment Settings is saved). Never throws. */
export async function getBrand(): Promise<Brand> {
  try {
    return brandFromSettings(await getSiteContent<unknown>('site_settings'))
  } catch {
    // A failed brand lookup must never block a page render or an email send.
    return DEFAULT_BRAND
  }
}
