import { Resend } from 'resend'
import { esc, firstNameOf, formatMoney, field, fieldText, fieldPre, fields, fieldMono, mailtoLink, replyButton, shell } from './email-shell'
import { renderTemplate } from './email-render'
import { EMAIL_TEMPLATES_BY_ID } from './email-catalog'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  return _resend
}

// Resend's SDK never throws on API-level failures (invalid/unverified sender
// domain, rate limits, bad recipient, etc.) — it resolves with { data, error }.
// Every call site here expects a rejected promise on failure (that's what
// their try/catch blocks are written against), so surface .error as a thrown
// Error instead of silently returning a "successful" response with no data.
type ResendResult = Awaited<ReturnType<Resend['emails']['send']>>
type SendEmailPayload = Parameters<Resend['emails']['send']>[0]
async function sendEmail(payload: SendEmailPayload): Promise<ResendResult> {
  // FROM is an unmonitored sending address, so replies need somewhere real to
  // land by default. Call sites that set their own replyTo (e.g. replying to
  // whoever submitted a form) override this.
  const result = await getResend().emails.send({ replyTo: 'info@wissenhaus.org', ...payload })
  if (result.error) throw new Error(`Resend: ${result.error.name} — ${result.error.message}`)
  return result
}

const FROM = 'Wissen-Haus <noreply@noreply.wissenhaus.org>'
// `||` (not `??`): FOUNDER_EMAIL is set to an empty string in some
// environments, and `??` only falls back on null/undefined, not "" -- which
// left every admin notification silently failing with a Resend "Invalid
// `to` field" error. lib/admin-guard.ts and app/admin/layout.tsx already
// read the same var with `||` for this reason.
// Admin notifications go to every director/admin inbox, not just the
// primary one -- mirrors lib/admin-guard.ts's DIRECTOR_EMAILS list.
const ADMIN_EMAILS = Array.from(new Set([
  process.env.FOUNDER_EMAIL || 'director@wissenhaus.org',
  'wissenhaus@outlook.com',
]))

// Every send function below follows the same shape: compute a `vars` object
// (escaping anything untrusted, exactly as before), then hand it to
// renderTemplate() along with this template's built-in default subject/body.
// renderTemplate() uses an admin-saved override from the email_templates
// table when one exists, else these defaults -- see lib/email-catalog.ts for
// the full defaults (kept there, not duplicated here, so the admin editor's
// "current" and "default" states can never drift from what actually sends).
function defaultsFor(id: string) {
  const t = EMAIL_TEMPLATES_BY_ID[id]
  return { subject: t.defaultSubject, body: t.defaultBody }
}

// ─── Welcome email ──────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  const firstNameRaw = name.split(' ')[0]
  const { subject, html } = await renderTemplate('welcome', { firstNameRaw, firstName: firstNameOf(name) }, defaultsFor('welcome'))
  return sendEmail({ from: FROM, to, subject, html })
}

// ─── Contact form notification (to admin) ──────────────────────────────────
export async function sendContactNotification(data: {
  name: string; email: string; subject: string; message: string
}) {
  const vars = {
    nameRaw: data.name, subjectLine: data.subject,
    nameField: fieldText('Name', data.name),
    emailField: field('Email', mailtoLink(data.email)),
    subjectField: fieldText('Subject', data.subject),
    messageField: fieldPre('Message', data.message),
    replyBtn: replyButton(data.email, data.name),
  }
  const { subject, html } = await renderTemplate('contact-notification', vars, defaultsFor('contact-notification'))
  return sendEmail({ from: FROM, to: ADMIN_EMAILS, replyTo: data.email, subject, html })
}

// ─── Contact confirmation (to user) ────────────────────────────────────────
export async function sendContactConfirmation(to: string, name: string) {
  const vars = { firstNameRaw: name.split(' ')[0], firstName: firstNameOf(name) }
  const { subject, html } = await renderTemplate('contact-confirmation', vars, defaultsFor('contact-confirmation'))
  return sendEmail({ from: FROM, to, subject, html })
}

// ─── Volunteer application (to admin) ──────────────────────────────────────
export async function sendVolunteerNotification(data: {
  name: string; email: string; role: string; message: string
}) {
  const vars = {
    nameRaw: data.name, roleRaw: data.role,
    nameField: fieldText('Name', data.name),
    emailField: field('Email', mailtoLink(data.email)),
    roleField: fieldText('Role', data.role),
    messageField: fieldPre('Message', data.message),
    replyBtn: replyButton(data.email, data.name),
  }
  const { subject, html } = await renderTemplate('volunteer-notification', vars, defaultsFor('volunteer-notification'))
  return sendEmail({ from: FROM, to: ADMIN_EMAILS, replyTo: data.email, subject, html })
}

// ─── Volunteer confirmation (to user) ──────────────────────────────────────
export async function sendVolunteerConfirmation(to: string, name: string, role: string) {
  const vars = { firstNameRaw: name.split(' ')[0], firstName: firstNameOf(name), role: esc(role) }
  const { subject, html } = await renderTemplate('volunteer-confirmation', vars, defaultsFor('volunteer-confirmation'))
  return sendEmail({ from: FROM, to, subject, html })
}

// ─── Donation receipt ───────────────────────────────────────────────────────
export async function sendDonationReceipt(to: string, name: string, amount: number, currency: string, ref: string, certUrl?: string) {
  const formatted = formatMoney(amount, currency)
  const vars = {
    firstNameRaw: name.split(' ')[0], firstName: firstNameOf(name),
    amountField: field('Amount', `<strong>${formatted}</strong>`),
    refField: fieldMono('Reference', ref),
    certBtn: certUrl ? `<a href="${esc(certUrl)}" class="btn">View &amp; print your donation certificate →</a>` : '',
  }
  const { subject, html } = await renderTemplate('donation-receipt', vars, defaultsFor('donation-receipt'))
  return sendEmail({ from: FROM, to, subject, html })
}

// ─── Donation notification (to admin) ──────────────────────────────────────
export async function sendDonationNotification(data: {
  name: string; email: string; amount: number; currency: string; ref: string; provider: string
}) {
  const formatted = formatMoney(data.amount, data.currency)
  const vars = {
    nameRaw: data.name, providerRaw: data.provider, formatted,
    donorField: fieldText('Donor', data.name),
    emailField: field('Email', mailtoLink(data.email)),
    amountField: field('Amount', `<strong>${formatted}</strong>`),
    providerField: fieldText('Provider', data.provider),
    refField: fieldMono('Reference', data.ref),
  }
  const { subject, html } = await renderTemplate('donation-notification', vars, defaultsFor('donation-notification'))
  return sendEmail({ from: FROM, to: ADMIN_EMAILS, subject, html })
}

// ─── Bank transfer instructions (to donor) ──────────────────────────────────
// Sent as soon as a donor completes the donation form choosing bank transfer.
// This is NOT a receipt — no money has been received yet. The real receipt and
// certificate go out via sendDonationReceipt once an admin confirms the money
// landed.
export async function sendBankTransferInstructions(opts: {
  to: string
  name: string
  amount: number
  currency: string
  reference: string
  detailsUrl: string
  accountName: string
  bankName: string
  accountNumber: string
  extras?: Array<{ label: string; value: string }>
  instructions?: string
}) {
  const formatted = formatMoney(opts.amount, opts.currency)
  const extraRows = fields((opts.extras ?? []).map(e => e.value && [e.label, esc(e.value)]))
  const vars = {
    firstName: firstNameOf(opts.name), formatted,
    accountNameField: field('Account Name', `<strong>${esc(opts.accountName)}</strong>`),
    bankField: fieldText('Bank', opts.bankName),
    accountNumberField: field(`Account Number (${opts.currency})`, `<span style="font-family:monospace;font-size:1.05rem;letter-spacing:.04em"><strong>${esc(opts.accountNumber)}</strong></span>`),
    extraRows,
    referenceField: field('Your Reference', `<span style="font-family:monospace;font-size:1rem"><strong>${esc(opts.reference)}</strong></span>`),
    instructionsPara: opts.instructions ? `<p style="font-size:.88rem">${esc(opts.instructions)}</p>` : '',
    detailsUrl: esc(opts.detailsUrl),
  }
  const { subject, html } = await renderTemplate('bank-transfer-instructions', vars, defaultsFor('bank-transfer-instructions'))
  return sendEmail({ from: FROM, to: opts.to, subject, html })
}

// ─── Bank transfer notification (to admin) ──────────────────────────────────
export async function sendBankTransferNotification(data: {
  name: string
  email: string
  amount: number
  currency: string
  reference: string
  stage: 'pledged' | 'declared_sent'
}) {
  const formatted = formatMoney(data.amount, data.currency)
  const declared = data.stage === 'declared_sent'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'

  const vars = {
    nameRaw: data.name, formatted,
    subjectLine: declared
      ? `[Action] ${formatted} bank transfer marked as sent by ${data.name}`
      : `[Bank Transfer] ${formatted} pledged by ${data.name}`,
    badge: declared ? 'Awaiting Your Confirmation' : 'New Bank Transfer Pledge',
    heading: declared ? `${esc(data.name)} says the transfer has been sent` : 'A donor has chosen to give by bank transfer',
    message: declared
      ? 'Check the account for this reference. Once the money has landed, confirm it in the dashboard — that issues the donor\'s receipt and certificate automatically.'
      : 'No action needed yet. You\'ll get another email when the donor marks the transfer as sent.',
    donorField: fieldText('Donor', data.name),
    emailField: field('Email', mailtoLink(data.email)),
    amountField: field('Amount', `<strong>${formatted}</strong>`),
    refField: fieldMono('Reference', data.reference),
    bankTransfersUrl: esc(siteUrl) + '/admin/submissions?type=bank_transfer',
  }
  const { subject, html } = await renderTemplate('bank-transfer-notification', vars, defaultsFor('bank-transfer-notification'))
  return sendEmail({ from: FROM, to: ADMIN_EMAILS, replyTo: data.email, subject, html })
}

// ─── Certificate email ──────────────────────────────────────────────────────
export async function sendCertificateEmail(to: string, name: string, courseName: string, certId: string) {
  const vars = {
    firstName: firstNameOf(name), courseName: esc(courseName), courseNameRaw: courseName,
    certIdField: fieldMono('Certificate ID', certId),
  }
  const { subject, html } = await renderTemplate('certificate', vars, defaultsFor('certificate'))
  return sendEmail({ from: FROM, to, subject, html })
}

// ─── Partner inquiry (to admin) ────────────────────────────────────────────
export async function sendPartnerNotification(data: {
  name: string; email: string; organisation: string; message: string
}) {
  const vars = {
    nameRaw: data.name, orgRaw: data.organisation,
    nameField: fieldText('Name', data.name),
    emailField: field('Email', mailtoLink(data.email)),
    orgField: fieldText('Organisation', data.organisation),
    messageField: fieldPre('Message', data.message),
    replyBtn: replyButton(data.email, data.name),
  }
  const { subject, html } = await renderTemplate('partner-notification', vars, defaultsFor('partner-notification'))
  return sendEmail({ from: FROM, to: ADMIN_EMAILS, replyTo: data.email, subject, html })
}

// ─── Partner confirmation (to inquirer) ────────────────────────────────────
export async function sendPartnerConfirmation(to: string, name: string) {
  const vars = { firstNameRaw: name.split(' ')[0], firstName: firstNameOf(name) }
  const { subject, html } = await renderTemplate('partner-confirmation', vars, defaultsFor('partner-confirmation'))
  return sendEmail({ from: FROM, to, subject, html })
}

// ─── Testimonial submitted for moderation (to admin) ───────────────────────
export async function sendTestimonialNotification(data: { name: string; role: string | null; quote: string }) {
  const vars = {
    nameRaw: data.name,
    fieldsHtml: fields([['Name', esc(data.name)], data.role && ['Role', esc(data.role)]]),
    quoteField: fieldPre('Quote', data.quote),
  }
  const { subject, html } = await renderTemplate('testimonial-notification', vars, defaultsFor('testimonial-notification'))
  return sendEmail({ from: FROM, to: ADMIN_EMAILS, subject, html })
}

// ─── Password reset request (to user) ──────────────────────────────────────
export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const vars = { firstName: firstNameOf(name), resetUrl: esc(resetUrl) }
  const { subject, html } = await renderTemplate('password-reset', vars, defaultsFor('password-reset'))
  return sendEmail({ from: FROM, to, subject, html })
}

// ─── Admin-issued temporary password ───────────────────────────────────────
export async function sendTempPasswordEmail(to: string, name: string, tempPassword: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  const vars = {
    firstName: firstNameOf(name),
    tempPasswordField: fieldMono('Temporary password', tempPassword, '1.1rem'),
    loginUrl: esc(siteUrl) + '/login',
  }
  const { subject, html } = await renderTemplate('temp-password', vars, defaultsFor('temp-password'))
  return sendEmail({ from: FROM, to, subject, html })
}

// ─── Password changed confirmation (to user) ───────────────────────────────
export async function sendPasswordChangedEmail(to: string, name: string) {
  const vars = { firstName: firstNameOf(name) }
  const { subject, html } = await renderTemplate('password-changed', vars, defaultsFor('password-changed'))
  return sendEmail({ from: FROM, to, subject, html })
}

// ─── Career Fair registration confirmation (to attendee) ───────────────────
export async function sendFairRegistrationConfirmation(opts: {
  to: string; name: string; eventTitle: string
  eventDate: string | null; eventTime: string | null; eventLocation: string | null
  guideUrl: string; recommendedBooths: string[]
}) {
  const dateLine = opts.eventDate ? new Date(opts.eventDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : null
  const vars = {
    firstName: firstNameOf(opts.name), eventTitle: esc(opts.eventTitle), eventTitleRaw: opts.eventTitle,
    fieldsHtml: fields([
      dateLine && ['Date', dateLine],
      opts.eventTime && ['Time', esc(opts.eventTime)],
      opts.eventLocation && ['Location', esc(opts.eventLocation)],
    ]),
    boothsBlock: opts.recommendedBooths.length > 0
      ? `<div class="divider"></div><p><strong>Booths picked for you:</strong> based on what you told us, start with ${esc(opts.recommendedBooths.join(', '))}.</p>`
      : '',
    guideUrl: esc(opts.guideUrl),
  }
  const { subject, html } = await renderTemplate('fair-registration-confirmation', vars, defaultsFor('fair-registration-confirmation'))
  return sendEmail({ from: FROM, to: opts.to, subject, html })
}

// ─── Career Fair registration notification (to admin) ──────────────────────
export async function sendFairRegistrationNotification(data: {
  name: string; email: string; phone: string; school: string; eventTitle: string
}) {
  const vars = {
    nameRaw: data.name, eventTitleRaw: data.eventTitle,
    nameField: fieldText('Name', data.name),
    emailField: field('Email', mailtoLink(data.email)),
    phoneField: data.phone ? fieldText('Phone', data.phone) : '',
    schoolField: fieldText('School', data.school),
    eventField: fieldText('Event', data.eventTitle),
  }
  const { subject, html } = await renderTemplate('fair-registration-notification', vars, defaultsFor('fair-registration-notification'))
  return sendEmail({ from: FROM, to: ADMIN_EMAILS, replyTo: data.email, subject, html })
}

// ─── Career Fair check-in reminder (to attendee, admin-triggered bulk send) ─
export async function sendFairCheckinReminder(opts: {
  to: string; name: string; eventTitle: string
  eventDate: string | null; eventTime: string | null; eventLocation: string | null
  guideUrl: string
}) {
  const dateLine = opts.eventDate ? new Date(opts.eventDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : null
  const vars = {
    firstName: firstNameOf(opts.name), eventTitle: esc(opts.eventTitle), eventTitleRaw: opts.eventTitle,
    fieldsHtml: fields([
      dateLine && ['Date', dateLine],
      opts.eventTime && ['Time', esc(opts.eventTime)],
      opts.eventLocation && ['Location', esc(opts.eventLocation)],
    ]),
    guideUrl: esc(opts.guideUrl),
  }
  const { subject, html } = await renderTemplate('fair-checkin-reminder', vars, defaultsFor('fair-checkin-reminder'))
  return sendEmail({ from: FROM, to: opts.to, subject, html })
}

// ─── Newsletter campaigns (admin-composed, sent to the subscriber list) ────
// Campaign/template content is full HTML+CSS the admin writes directly (see
// components/admin/newsletter/*) -- wrapped in the same shell() as every
// other email so it carries the Wissen-Haus header/footer, but otherwise
// passed through untouched.
export async function sendNewsletterEmail(to: string, subject: string, bodyHtml: string, unsubscribeUrl: string) {
  return sendEmail({
    from: FROM,
    to,
    subject,
    html: shell(`
      ${bodyHtml}
      <div class="divider"></div>
      <p style="font-size:.78rem;color:#8a9a8f">You're receiving this because you're subscribed to Wissen-Haus updates. <a href="${esc(unsubscribeUrl)}" style="color:#8a9a8f;text-decoration:underline">Unsubscribe</a></p>
    `),
  })
}
