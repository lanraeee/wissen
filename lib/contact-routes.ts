// Where a contact-form message goes. The browser sends only a topic key, never
// an address, so no inbox address needs to appear in the page HTML. The
// addresses live here, server-side, and are used only to deliver the message.

export const CONTACT_TOPICS = ['general', 'partnership', 'volunteer'] as const
export type ContactTopic = (typeof CONTACT_TOPICS)[number]

export const CONTACT_INBOX: Record<ContactTopic, string> = {
  general: 'info@wissenhaus.org',
  partnership: 'partnership@wissenhaus.org',
  volunteer: 'volunteer@wissenhaus.org',
}

export const CONTACT_TOPIC_LABEL: Record<ContactTopic, string> = {
  general: 'General enquiry',
  partnership: 'Partnership',
  volunteer: 'Volunteering',
}

export function isContactTopic(value: unknown): value is ContactTopic {
  return typeof value === 'string' && (CONTACT_TOPICS as readonly string[]).includes(value)
}
