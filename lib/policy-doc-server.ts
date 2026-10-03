import { getSiteContent } from './site-content'
import { POLICY_DEFAULTS } from './policy-doc-defaults'
import { coerceSections, policyContentKey, withIds, type PolicySection } from './policy-doc'

/** Saved sections for a policy page, or the built-in text if none are saved / the saved value is unusable. */
export async function getPolicySections(slug: string): Promise<PolicySection[]> {
  const saved = await getSiteContent<unknown>(policyContentKey(slug))
  return coerceSections(saved) ?? withIds(POLICY_DEFAULTS[slug] ?? [])
}
