import { getSiteContent } from './site-content'
import { POLICY_DEFAULTS } from './policy-doc-defaults'
import { brandify, brandFromSettings } from './brand'
import { coerceSections, policyContentKey, withIds, type PolicySection } from './policy-doc'

/** Saved sections for a policy page, or the built-in text if none are saved / the saved value is unusable. The configured brand replaces the built-in one in either case. */
export async function getPolicySections(slug: string): Promise<PolicySection[]> {
  const [saved, settings] = await Promise.all([
    getSiteContent<unknown>(policyContentKey(slug)),
    getSiteContent<unknown>('site_settings'),
  ])
  const brand = brandFromSettings(settings)
  const sections = coerceSections(saved) ?? withIds(POLICY_DEFAULTS[slug] ?? [])
  return sections.map(s => ({ ...s, title: brandify(s.title, brand), body: brandify(s.body, brand) }))
}
