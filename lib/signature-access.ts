import { masterAdminGuard, userAdminGuard, sectionGuard } from './admin-guard'
import type { UserPayload } from './auth'

// Pages where a saved signature can be applied or captured. A trustee with
// read access to any of them may keep their own signatures.
const SIGNATURE_SECTIONS = ['whf_cio.trustee_declarations', 'whf_cio.constitution', 'whf_cio.meetings', 'settings']

/** Returns the session plus whether it may see every owner's signatures (master admin only). */
export async function signaturesGuard(): Promise<{ session: UserPayload; all: boolean } | null> {
  const master = await masterAdminGuard()
  if (master) return { session: master, all: true }
  const admin = await userAdminGuard()
  if (admin) return { session: admin, all: false }
  for (const key of SIGNATURE_SECTIONS) {
    const s = await sectionGuard(key)
    if (s) return { session: s, all: false }
  }
  return null
}
