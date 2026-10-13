import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_CONTACT_INBOX, CONTACT_TOPICS, CONTACT_TOPIC_LABEL, inboxFor, isContactTopic } from './contact-routes'

const ROOT = join(__dirname, '..')

describe('contact routing', () => {
  it('has a default inbox for each topic', () => {
    expect(DEFAULT_CONTACT_INBOX).toEqual({
      general: 'info@wissenhaus.org',
      partnership: 'partners@wissenhaus.org',
      volunteer: 'volunteers@wissenhaus.org',
    })
  })

  it('uses the inbox set in admin for each topic', () => {
    const details = {
      inbox_general: 'hello@example.org',
      inbox_partnership: 'deals@example.org',
      inbox_volunteer: 'people@example.org',
    }
    expect(inboxFor('general', details)).toBe('hello@example.org')
    expect(inboxFor('partnership', details)).toBe('deals@example.org')
    expect(inboxFor('volunteer', details)).toBe('people@example.org')
  })

  it('trims whitespace around an admin-set inbox', () => {
    expect(inboxFor('general', { inbox_general: '  hello@example.org  ' })).toBe('hello@example.org')
  })

  it('falls back to the default when a field is blank, missing or not an address', () => {
    expect(inboxFor('partnership', { inbox_partnership: '' })).toBe('partners@wissenhaus.org')
    expect(inboxFor('volunteer', { inbox_volunteer: '   ' })).toBe('volunteers@wissenhaus.org')
    expect(inboxFor('general', {})).toBe('info@wissenhaus.org')
    expect(inboxFor('general', { inbox_general: 'not an address' })).toBe('info@wissenhaus.org')
  })

  it('gives every topic a label', () => {
    for (const topic of CONTACT_TOPICS) expect(CONTACT_TOPIC_LABEL[topic]).toBeTruthy()
  })

  it('accepts only known topics', () => {
    expect(isContactTopic('partnership')).toBe(true)
    expect(isContactTopic('admin')).toBe(false)
    expect(isContactTopic(undefined)).toBe(false)
  })
})

// Regression guard: the public contact page and form must not print an inbox
// address or a mailto link. Spam harvesters read the rendered HTML.
describe('contact page exposes no addresses', () => {
  for (const file of ['app/contact/page.tsx', 'components/ContactForm.tsx']) {
    it(`${file} has no mailto links or inbox addresses`, () => {
      const source = readFileSync(join(ROOT, file), 'utf8')
      expect(source).not.toMatch(/mailto:/)
      expect(source).not.toMatch(/@wissenhaus\.org/)
      expect(source).not.toMatch(/primary_email|admin_emails/)
    })
  }
})
