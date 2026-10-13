// Where a contact-form message goes. The browser sends only a topic key, never
// an address, so no inbox address needs to appear in the page HTML.
//
// The inbox for each topic is edited in Admin > Settings > Contact Details
// (stored in the contact_details record). The values below are only the
// fallback used when that field is blank or is not an email address.

export const CONTACT_TOPICS = ['general', 'partnership', 'volunteer'] as const
export type ContactTopic = (typeof CONTACT_TOPICS)[number]

// The field on the contact_details record that holds each topic's inbox.
export const CONTACT_INBOX_FIELD: Record<ContactTopic, 'inbox_general' | 'inbox_partnership' | 'inbox_volunteer'> = {
  general: 'inbox_general',
  partnership: 'inbox_partnership',
  volunteer: 'inbox_volunteer',
}

export const DEFAULT_CONTACT_INBOX: Record<ContactTopic, string> = {
  general: 'info@wissenhaus.org',
  partnership: 'partners@wissenhaus.org',
  volunteer: 'volunteers@wissenhaus.org',
}

export const CONTACT_TOPIC_LABEL: Record<ContactTopic, string> = {
  general: 'General enquiry',
  partnership: 'Partnership',
  volunteer: 'Volunteering',
}

export function isContactTopic(value: unknown): value is ContactTopic {
  return typeof value === 'string' && (CONTACT_TOPICS as readonly string[]).includes(value)
}

/** The inbox a topic delivers to: the admin-set value, else the default. */
export function inboxFor(
  topic: ContactTopic,
  details: { inbox_general?: unknown; inbox_partnership?: unknown; inbox_volunteer?: unknown },
): string {
  const configured = details[CONTACT_INBOX_FIELD[topic]]
  if (typeof configured === 'string') {
    const trimmed = configured.trim()
    if (trimmed.includes('@')) return trimmed
  }
  return DEFAULT_CONTACT_INBOX[topic]
}
