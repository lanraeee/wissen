import { getSiteContent } from './site-content'

export interface DonationSettings {
  // Which rail the card-payment side of DonateWidget uses. Bank transfer is
  // unaffected either way -- it's a separate rail from both.
  active_processor: 'stripe' | 'zeffy'
  // Fallback Zeffy form (the data-form-url value) for pages with no
  // project-specific one of their own -- the generic /donate page, mainly.
  // A project page's own donation_projects.zeffy_form_url always wins over
  // this when both exist.
  zeffy_general_form_url: string
}

const DEFAULTS: DonationSettings = {
  active_processor: 'stripe',
  zeffy_general_form_url: '',
}

export async function getDonationSettings(): Promise<DonationSettings> {
  const stored = await getSiteContent<Partial<DonationSettings>>('donation_settings')
  return { ...DEFAULTS, ...stored }
}
