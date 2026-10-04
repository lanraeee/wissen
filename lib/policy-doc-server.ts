import { getSiteContent } from './site-content'
import { POLICY_DEFAULTS } from './policy-doc-defaults'
import { brandify, brandFromSettings } from './brand'
import { coerceSections, policyContentKey, resolveSections, withIds, type PolicySection } from './policy-doc'

/**
 * Sections for a policy page. Built-in text follows the configured brand; text an
 * editor has typed is shown exactly as typed (so e.g. an "also known as" list of
 * name variants is never rewritten). Unusable saved data falls back to the built-in text.
 */
export async function getPolicySections(slug: string): Promise<PolicySection[]> {
  const [saved, settings] = await Promise.all([
    getSiteContent<unknown>(policyContentKey(slug)),
    getSiteContent<unknown>('site_settings'),
  ])
  const brand = brandFromSettings(settings)
  return resolveSections(coerceSections(saved), withIds(POLICY_DEFAULTS[slug] ?? []), t => brandify(t, brand))
}
