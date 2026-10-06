// Guards the lib/email.ts <-> lib/email-catalog.ts contract: every send
// function computes a `vars` object and hands it to renderTemplate(), which
// fills {{tokens}} in that template's default subject/body. A typo in either
// the vars object or the catalog's {{token}} name doesn't throw -- fillVars()
// silently substitutes '' for an unknown key -- so the only way to catch it
// is to actually render every template and check nothing was left both
// unfilled (a literal "{{" surviving) and nothing silently went blank that
// shouldn't have.

const sqlMock = vi.fn()
vi.mock('./db', () => ({ default: (...args: unknown[]) => sqlMock(...args) }))

const sendMock = vi.fn()
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: (...args: unknown[]) => sendMock(...args) }
  },
}))

import * as email from './email'

describe('every transactional email renders its default template with no leftover {{tokens}}', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sqlMock.mockResolvedValue([]) // no admin override saved -- use built-in defaults
    sendMock.mockResolvedValue({ data: { id: 'test' }, error: null })
  })

  function sent() {
    expect(sendMock).toHaveBeenCalledTimes(1)
    const payload = sendMock.mock.calls[0][0] as { subject: string; html: string }
    return payload
  }

  function assertFullyRendered(payload: { subject: string; html: string }) {
    expect(payload.subject).not.toContain('{{')
    expect(payload.html).not.toContain('{{')
  }

  it('sendWelcomeEmail', async () => {
    await email.sendWelcomeEmail('ada@example.com', 'Ada Lovelace')
    assertFullyRendered(sent())
  })

  it('sendContactNotification', async () => {
    await email.sendContactNotification({ name: 'Ada Lovelace', email: 'ada@example.com', subject: 'Hi', message: 'Hello there' })
    assertFullyRendered(sent())
  })

  it('sendContactConfirmation', async () => {
    await email.sendContactConfirmation('ada@example.com', 'Ada Lovelace')
    assertFullyRendered(sent())
  })

  it('sendVolunteerNotification', async () => {
    await email.sendVolunteerNotification({ name: 'Ada Lovelace', email: 'ada@example.com', role: 'Mentor', message: 'I want to help' })
    assertFullyRendered(sent())
  })

  it('sendVolunteerConfirmation', async () => {
    await email.sendVolunteerConfirmation('ada@example.com', 'Ada Lovelace', 'Mentor')
    assertFullyRendered(sent())
  })

  it('sendDonationReceipt (with certificate)', async () => {
    await email.sendDonationReceipt('ada@example.com', 'Ada Lovelace', 50000, 'NGN', 'WH-REF-1', 'https://wissenhaus.org/donate/receipt/1')
    assertFullyRendered(sent())
  })

  it('sendDonationReceipt (without certificate)', async () => {
    await email.sendDonationReceipt('ada@example.com', 'Ada Lovelace', 50000, 'NGN', 'WH-REF-1')
    assertFullyRendered(sent())
  })

  it('sendDonationNotification', async () => {
    await email.sendDonationNotification({ name: 'Ada Lovelace', email: 'ada@example.com', amount: 50000, currency: 'NGN', ref: 'WH-REF-1', provider: 'Paystack' })
    assertFullyRendered(sent())
  })

  it('sendBankTransferInstructions', async () => {
    await email.sendBankTransferInstructions({
      to: 'ada@example.com', name: 'Ada Lovelace', amount: 50000, currency: 'NGN', reference: 'WH-REF-1',
      detailsUrl: 'https://wissenhaus.org/donate/bank-transfer/1', accountName: 'Wissen-Haus', bankName: 'Sample Bank', accountNumber: '0123456789',
      extras: [{ label: 'Sort Code', value: '12-34-56' }], instructions: 'Please include the reference.',
    })
    assertFullyRendered(sent())
  })

  it('sendBankTransferNotification (pledged)', async () => {
    await email.sendBankTransferNotification({ name: 'Ada Lovelace', email: 'ada@example.com', amount: 50000, currency: 'NGN', reference: 'WH-REF-1', stage: 'pledged' })
    assertFullyRendered(sent())
  })

  it('sendBankTransferNotification (declared_sent)', async () => {
    await email.sendBankTransferNotification({ name: 'Ada Lovelace', email: 'ada@example.com', amount: 50000, currency: 'NGN', reference: 'WH-REF-1', stage: 'declared_sent' })
    assertFullyRendered(sent())
  })

  it('sendCertificateEmail', async () => {
    await email.sendCertificateEmail('ada@example.com', 'Ada Lovelace', 'Career Readiness 101', 'WH-CERT-1')
    assertFullyRendered(sent())
  })

  it('sendPartnerNotification', async () => {
    await email.sendPartnerNotification({ name: 'Ada Lovelace', email: 'ada@example.com', organisation: 'Sample Org', message: 'Interested in partnering' })
    assertFullyRendered(sent())
  })

  it('sendPartnerConfirmation', async () => {
    await email.sendPartnerConfirmation('ada@example.com', 'Ada Lovelace')
    assertFullyRendered(sent())
  })

  it('sendTestimonialNotification (with role)', async () => {
    await email.sendTestimonialNotification({ name: 'Ada Lovelace', role: 'Alumna', quote: 'Wissen-Haus changed everything.' })
    assertFullyRendered(sent())
  })

  it('sendTestimonialNotification (no role)', async () => {
    await email.sendTestimonialNotification({ name: 'Ada Lovelace', role: null, quote: 'Wissen-Haus changed everything.' })
    assertFullyRendered(sent())
  })

  it('sendVerificationEmail', async () => {
    await email.sendVerificationEmail('ada@example.com', 'Ada Lovelace', 'https://wissenhaus.org/verify-email?token=abc')
    assertFullyRendered(sent())
  })

  it('sendPasswordResetEmail', async () => {
    await email.sendPasswordResetEmail('ada@example.com', 'Ada Lovelace', 'https://wissenhaus.org/reset-password?token=abc')
    assertFullyRendered(sent())
  })

  it('sendTempPasswordEmail', async () => {
    await email.sendTempPasswordEmail('ada@example.com', 'Ada Lovelace', 'xK7-mP2q9zRt')
    assertFullyRendered(sent())
  })

  it('sendPasswordChangedEmail', async () => {
    await email.sendPasswordChangedEmail('ada@example.com', 'Ada Lovelace')
    assertFullyRendered(sent())
  })

  it('sendFairRegistrationConfirmation (with booths)', async () => {
    await email.sendFairRegistrationConfirmation({
      to: 'ada@example.com', name: 'Ada Lovelace', eventTitle: 'Career Clarity Fair — Lagos',
      eventDate: '2026-11-15', eventTime: '10:00 AM', eventLocation: 'Landmark Centre, Lagos',
      guideUrl: 'https://wissenhaus.org/career-clarity-fair/checkin/1', recommendedBooths: ['Tech & Data', 'Creative Industries'],
    })
    assertFullyRendered(sent())
  })

  it('sendFairRegistrationConfirmation (no booths, no date)', async () => {
    await email.sendFairRegistrationConfirmation({
      to: 'ada@example.com', name: 'Ada Lovelace', eventTitle: 'Career Clarity Fair — Lagos',
      eventDate: null, eventTime: null, eventLocation: null,
      guideUrl: 'https://wissenhaus.org/career-clarity-fair/checkin/1', recommendedBooths: [],
    })
    assertFullyRendered(sent())
  })

  it('sendFairRegistrationNotification (with phone)', async () => {
    await email.sendFairRegistrationNotification({ name: 'Ada Lovelace', email: 'ada@example.com', phone: '+2348000000000', school: 'Sample University', eventTitle: 'Career Clarity Fair — Lagos' })
    assertFullyRendered(sent())
  })

  it('sendFairRegistrationNotification (no phone)', async () => {
    await email.sendFairRegistrationNotification({ name: 'Ada Lovelace', email: 'ada@example.com', phone: '', school: 'Sample University', eventTitle: 'Career Clarity Fair — Lagos' })
    assertFullyRendered(sent())
  })

  it('sendFairCheckinReminder', async () => {
    await email.sendFairCheckinReminder({
      to: 'ada@example.com', name: 'Ada Lovelace', eventTitle: 'Career Clarity Fair — Lagos',
      eventDate: '2026-11-15', eventTime: '10:00 AM', eventLocation: 'Landmark Centre, Lagos',
      guideUrl: 'https://wissenhaus.org/career-clarity-fair/checkin/1',
    })
    assertFullyRendered(sent())
  })

  it('sendNewsletterEmail', async () => {
    await email.sendNewsletterEmail('ada@example.com', 'This month at Wissen-Haus', '<p>Hello!</p>', 'https://wissenhaus.org/unsubscribe?token=abc')
    assertFullyRendered(sent())
  })
})

describe('an admin-saved override replaces the default without needing every var', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sendMock.mockResolvedValue({ data: { id: 'test' }, error: null })
  })

  it('uses the override subject/html verbatim (after substitution) instead of the built-in default', async () => {
    sqlMock.mockResolvedValueOnce([{ subject: 'Custom subject for {{firstName}}', html: '<p>Custom body for {{firstName}}</p>' }])
    await email.sendPasswordChangedEmail('ada@example.com', 'Ada Lovelace')
    const payload = sendMock.mock.calls[0][0] as { subject: string; html: string }
    expect(payload.subject).toBe('Custom subject for Ada')
    expect(payload.html).toContain('Custom body for Ada')
  })
})

describe('every email carries the header and footer built from the admin contact details', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sendMock.mockResolvedValue({ data: { id: 'test' }, error: null })
  })

  // Answers site_content lookups by key, the way lib/email-render.ts asks for them.
  function storeWith(store: Record<string, unknown>) {
    sqlMock.mockImplementation((_strings: TemplateStringsArray, ...values: unknown[]) => {
      const key = values[0]
      return Promise.resolve(typeof key === 'string' && key in store ? [{ value: store[key] }] : [])
    })
  }

  function html() {
    return (sendMock.mock.calls[0][0] as { html: string }).html
  }

  it('shows both offices, the contact email and every legal link', async () => {
    storeWith({
      contact_details: {
        primary_email: 'hello@example.org',
        address_nigeria: '1 Ring Road, Ibadan', phone_nigeria: '+234 800 000 0000',
        address_uk: '10 High Street, London', phone_uk: '+44 20 0000 0000',
      },
    })
    await email.sendPartnerConfirmation('ada@example.com', 'Ada Lovelace')
    const out = html()
    expect(out).toContain('1 Ring Road, Ibadan')
    expect(out).toContain('10 High Street, London')
    expect(out).toContain('href="tel:+442000000000"')
    expect(out).toContain('mailto:hello@example.org')
    for (const path of ['/privacy', '/terms', '/safeguarding', '/transparency/ledger', '/contact']) {
      expect(out).toContain(`${path}"`)
    }
    expect(out).toContain('/img/email-logo.png')
    expect(out).not.toContain('Unsubscribe')
  })

  it('leaves out an office with no address or phone', async () => {
    storeWith({ contact_details: { address_uk: '', phone_uk: '' } })
    await email.sendWelcomeEmail('ada@example.com', 'Ada Lovelace')
    expect(html()).not.toContain('United Kingdom')
    expect(html()).toContain('Nigeria')
  })

  it('uses the configured brand in the header', async () => {
    storeWith({ site_settings: { brand_name: 'Acme', brand_descriptor: 'Trust' } })
    await email.sendWelcomeEmail('ada@example.com', 'Ada Lovelace')
    expect(html()).toContain('<h1>Acme</h1>')
    expect(html()).toContain('<p>Trust</p>')
  })

  it('puts the unsubscribe link in the footer of bulk mail', async () => {
    storeWith({})
    await email.sendDonationRequestBroadcast({
      to: 'ada@example.com', name: 'Ada Lovelace', projectTitle: 'Laptops for Learners',
      projectUrl: 'https://wissenhaus.org/donate/laptops', unsubscribeUrl: 'https://wissenhaus.org/unsubscribe?token=abc',
    })
    expect(html()).toContain('href="https://wissenhaus.org/unsubscribe?token=abc">Unsubscribe</a>')
  })
})
