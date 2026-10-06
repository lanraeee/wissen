import { getSiteContent } from './site-content'
import type { ContactDetails } from '@/components/admin/ContactDetailsEditor'

const DEFAULTS: ContactDetails = {
  primary_email: 'info@wissenhaus.org',
  admin_emails: ['director@wissenhaus.org', 'wissenhaus@outlook.com'],
  support_email: 'info@wissenhaus.org',
  phone_nigeria: '+234800947736',
  phone_uk: '',
  whatsapp_url: '',
  instagram_url: 'https://www.instagram.com/wissen_haus',
  linkedin_url: 'https://www.linkedin.com/company/wissen-haus-empowerment-foundation',
  twitter_url: '',
  google_business_url: '',
  bing_places_url: '',
  address_nigeria: 'Ibadan, Oyo State, Nigeria',
  address_uk: '',
  tagline: 'Empowering Youth, Shaping Futures',
}

export async function getContactDetails(): Promise<ContactDetails> {
  const stored = await getSiteContent<Partial<ContactDetails>>('contact_details')
  return { ...DEFAULTS, ...stored }
}
