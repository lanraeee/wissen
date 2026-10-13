import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONTACT_INBOX, CONTACT_TOPICS, CONTACT_TOPIC_LABEL, isContactTopic } from './contact-routes'

const ROOT = join(__dirname, '..')

describe('contact routing', () => {
  it('routes each topic to its own inbox', () => {
    expect(CONTACT_INBOX).toEqual({
      general: 'info@wissenhaus.org',
      partnership: 'partnership@wissenhaus.org',
      volunteer: 'volunteer@wissenhaus.org',
    })
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
