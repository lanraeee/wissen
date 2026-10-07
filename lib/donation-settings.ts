import { getSiteContent } from './site-content'

export interface DonationSettings {
  // Offers Zeffy as a third choice alongside Card (Stripe) and Bank
  // Transfer -- the donor picks, nothing is forced on them. This matters
  // because Zeffy can't process Naira cards reliably (see the admin note):
  // forcing one processor site-wide risked quietly breaking payment for
  // whichever audience that processor doesn't serve.
  zeffy_enabled: boolean
  // Fallback Zeffy form (the data-form-url value) for pages with no
  // project-specific one of their own -- the generic /donate page, mainly.
  // A project's own donation_projects.zeffy_form_url always wins over this
  // when both exist.
  zeffy_general_form_url: string
}

const DEFAULTS: DonationSettings = {
  zeffy_enabled: false,
  zeffy_general_form_url: '',
}

export async function getDonationSettings(): Promise<DonationSettings> {
  const stored = await getSiteContent<Partial<DonationSettings>>('donation_settings')
  return { ...DEFAULTS, ...stored }
}
