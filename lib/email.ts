import { Resend } from 'resend'
import { brandify, getBrand } from './brand-server'
import { esc, firstNameOf, formatMoney, field, fieldText, fieldPre, fields, fieldMono, mailtoLink, replyButton, shell } from './email-shell'
import { renderTemplate } from './email-render'
import { EMAIL_TEMPLATES_BY_ID } from './email-catalog'
import { getContactDetails } from './contact-details'

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
  const brand = await getBrand()
  const details = await getContactDetails()
  const branded = {
    ...payload,
    ...(typeof payload.subject === 'string' ? { subject: brandify(payload.subject, brand) } : {}),
    ...(typeof payload.from === 'string' ? { from: brandify(payload.from, brand) } : {}),
    ...(typeof payload.html === 'string' ? { html: brandify(payload.html.replace(/(<h1>Wissen-Haus<\/h1>\s*)<p>Empowerment Foundation<\/p>/, (_, h) => `${h}<p>${brand.descriptor}</p>`), brand) } : {}),
  } as SendEmailPayload
  const result = await getResend().emails.send({ replyTo: details.support_email, ...branded })
  if (result.error) throw new Error(`Resend: ${result.error.name} — ${result.error.message}`)
  return result
}

const FROM = 'Wissen-Haus <noreply@noreply.wissenhaus.org>'

// Admin notification emails are now fetched from contact_details via
// getContactDetails(), which is called in each send function that needs them.

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
  const details = await getContactDetails()
  const vars = {
    nameRaw: data.name, subjectLine: data.subject,
    nameField: fieldText('Name', data.name),
    emailField: field('Email', mailtoLink(data.email)),
    subjectField: fieldText('Subject', data.subject),
    messageField: fieldPre('Message', data.message),
    replyBtn: replyButton(data.email, data.name),
  }
  const { subject, html } = await renderTemplate('contact-notification', vars, defaultsFor('contact-notification'))
  return sendEmail({ from: FROM, to: details.admin_emails, replyTo: data.email, subject, html })
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
  const details = await getContactDetails()
  const vars = {
    nameRaw: data.name, roleRaw: data.role,
    nameField: fieldText('Name', data.name),
    emailField: field('Email', mailtoLink(data.email)),
    roleField: fieldText('Role', data.role),
    messageField: fieldPre('Message', data.message),
    replyBtn: replyButton(data.email, data.name),
  }
  const { subject, html } = await renderTemplate('volunteer-notification', vars, defaultsFor('volunteer-notification'))
  return sendEmail({ from: FROM, to: details.admin_emails, replyTo: data.email, subject, html })
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
  const details = await getContactDetails()
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
  return sendEmail({ from: FROM, to: details.admin_emails, subject, html })
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
  const details = await getContactDetails()
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
    bankTransfersUrl: esc(siteUrl) + '/admin/bank-transfers',
  }
  const { subject, html } = await renderTemplate('bank-transfer-notification', vars, defaultsFor('bank-transfer-notification'))
  return sendEmail({ from: FROM, to: details.admin_emails, replyTo: data.email, subject, html })
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
  const details = await getContactDetails()
  const vars = {
    nameRaw: data.name, orgRaw: data.organisation,
    nameField: fieldText('Name', data.name),
    emailField: field('Email', mailtoLink(data.email)),
    orgField: fieldText('Organisation', data.organisation),
    messageField: fieldPre('Message', data.message),
    replyBtn: replyButton(data.email, data.name),
  }
  const { subject, html } = await renderTemplate('partner-notification', vars, defaultsFor('partner-notification'))
  return sendEmail({ from: FROM, to: details.admin_emails, replyTo: data.email, subject, html })
}

// ─── Partner confirmation (to inquirer) ────────────────────────────────────
export async function sendPartnerConfirmation(to: string, name: string) {
  const vars = { firstNameRaw: name.split(' ')[0], firstName: firstNameOf(name) }
  const { subject, html } = await renderTemplate('partner-confirmation', vars, defaultsFor('partner-confirmation'))
  return sendEmail({ from: FROM, to, subject, html })
}

// ─── Testimonial submitted for moderation (to admin) ───────────────────────
export async function sendTestimonialNotification(data: { name: string; role: string | null; quote: string }) {
  const details = await getContactDetails()
  const vars = {
    nameRaw: data.name,
    fieldsHtml: fields([['Name', esc(data.name)], data.role && ['Role', esc(data.role)]]),
    quoteField: fieldPre('Quote', data.quote),
  }
  const { subject, html } = await renderTemplate('testimonial-notification', vars, defaultsFor('testimonial-notification'))
  return sendEmail({ from: FROM, to: details.admin_emails, subject, html })
}

// ─── Email address confirmation (to user) ──────────────────────────────────
export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  const vars = { firstName: firstNameOf(name), verifyUrl: esc(verifyUrl) }
  const { subject, html } = await renderTemplate('verify-email', vars, defaultsFor('verify-email'))
  return sendEmail({ from: FROM, to, subject, html })
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
  const details = await getContactDetails()
  const vars = {
    nameRaw: data.name, eventTitleRaw: data.eventTitle,
    nameField: fieldText('Name', data.name),
    emailField: field('Email', mailtoLink(data.email)),
    phoneField: data.phone ? fieldText('Phone', data.phone) : '',
    schoolField: fieldText('School', data.school),
    eventField: fieldText('Event', data.eventTitle),
  }
  const { subject, html } = await renderTemplate('fair-registration-notification', vars, defaultsFor('fair-registration-notification'))
  return sendEmail({ from: FROM, to: details.admin_emails, replyTo: data.email, subject, html })
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

// ─── DataCamp scholarship application confirmation (to applicant) ──────────
export async function sendScholarshipConfirmation(to: string, name: string) {
  const vars = { firstNameRaw: name.split(' ')[0], firstName: firstNameOf(name) }
  const { subject, html } = await renderTemplate('scholarship-confirmation', vars, defaultsFor('scholarship-confirmation'))
  return sendEmail({ from: FROM, to, subject, html })
}

// ─── DataCamp scholarship application notification (to admin) ──────────────
export async function sendScholarshipNotification(data: {
  name: string; email: string; score: number; redFlags: string[]; goalsEssay: string; whyApplyingEssay: string
}) {
  const details = await getContactDetails()
  const vars = {
    nameRaw: data.name, scoreRaw: String(data.score),
    nameField: fieldText('Name', data.name),
    emailField: field('Email', mailtoLink(data.email)),
    scoreField: fieldText('Score', `${data.score} / 100`),
    redFlagsField: fieldText('Red flags', data.redFlags.length > 0 ? data.redFlags.join(', ') : 'None'),
    goalsField: fieldPre('What they hope to achieve', data.goalsEssay),
    whyApplyingField: fieldPre('Why they are applying', data.whyApplyingEssay),
    replyBtn: replyButton(data.email, data.name),
  }
  const { subject, html } = await renderTemplate('scholarship-notification', vars, defaultsFor('scholarship-notification'))
  return sendEmail({ from: FROM, to: details.admin_emails, replyTo: data.email, subject, html })
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

// ─── Support tickets ────────────────────────────────────────────────────────
// These deliberately reuse sendEmail/FROM above rather than building their
// own sender, and fetch admin_emails from getContactDetails() for the same
// reason every other admin notification does.
//
// Unlike the other transactional mail here these are not yet in
// EMAIL_TEMPLATES_BY_ID, so they are not admin-editable. Worth adding when
// the wording settles.

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.wissenhaus.org'

type TicketLike = {
  reference: string
  subject: string
  requester_name: string
  requester_email: string | null
}

export async function sendTicketOpened(ticket: TicketLike) {
  if (!ticket.requester_email) return
  const url = `${SITE_URL}/support/${encodeURIComponent(ticket.reference)}`
  return sendEmail({
    from: FROM,
    to: ticket.requester_email,
    replyTo: 'info@wissenhaus.org',
    subject: `We've got your message — ${ticket.reference}`,
    html: shell(`
      <h2>Thanks, ${esc(firstNameOf(ticket.requester_name))} — we've got it.</h2>
      <p>Someone from the Wissen-Haus team will reply as soon as they can. You can follow the conversation any time using the link below.</p>
      ${fieldMono('Your reference', esc(ticket.reference))}
      ${field('Subject', esc(ticket.subject))}
      <p style="margin-top:20px"><a href="${esc(url)}" style="background:#1a3c2e;color:#f4f0e7;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">View your ticket</a></p>
      <p style="font-size:.8rem;color:#8a9a8f;margin-top:18px">This conversation is locked to your email address. If you open the link on another device we&rsquo;ll email you a code to confirm it&rsquo;s you.</p>
    `),
  })
}

export async function notifyStaffNewTicket(ticket: TicketLike, body: string) {
  const details = await getContactDetails()
  const url = `${SITE_URL}/admin/support/${encodeURIComponent(ticket.reference)}`
  return sendEmail({
    from: FROM,
    to: details.admin_emails,
    replyTo: ticket.requester_email ?? details.support_email,
    subject: `New support ticket: ${ticket.subject} (${ticket.reference})`,
    html: shell(`
      <h2>New support ticket</h2>
      ${fields([
        ['Reference', esc(ticket.reference)],
        ['From', esc(ticket.requester_name)],
        ticket.requester_email ? ['Email', esc(ticket.requester_email)] : null,
        ['Subject', esc(ticket.subject)],
      ])}
      ${fieldPre('Message', esc(body))}
      <p style="margin-top:20px"><a href="${esc(url)}" style="background:#1a3c2e;color:#f4f0e7;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Open in admin</a></p>
    `),
  })
}

export async function notifyStaffReply(ticket: TicketLike, body: string) {
  const details = await getContactDetails()
  const url = `${SITE_URL}/admin/support/${encodeURIComponent(ticket.reference)}`
  return sendEmail({
    from: FROM,
    to: details.admin_emails,
    replyTo: ticket.requester_email ?? details.support_email,
    subject: `Reply on ${ticket.reference}: ${ticket.subject}`,
    html: shell(`
      <h2>${esc(ticket.requester_name)} replied</h2>
      ${fieldPre('Message', esc(body))}
      <p style="margin-top:20px"><a href="${esc(url)}" style="background:#1a3c2e;color:#f4f0e7;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Open in admin</a></p>
    `),
  })
}

export async function sendStaffReplyToRequester(ticket: TicketLike, body: string) {
  if (!ticket.requester_email) return
  const details = await getContactDetails()
  const url = `${SITE_URL}/support/${encodeURIComponent(ticket.reference)}`
  return sendEmail({
    from: FROM,
    to: ticket.requester_email,
    replyTo: details.support_email,
    subject: `Re: ${ticket.subject} (${ticket.reference})`,
    html: shell(`
      <h2>Hi ${esc(firstNameOf(ticket.requester_name))},</h2>
      ${fieldPre('', esc(body))}
      <p style="margin-top:20px"><a href="${esc(url)}" style="background:#1a3c2e;color:#f4f0e7;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Reply to this</a></p>
    `),
  })
}

export async function sendTicketAccessLink(ticket: TicketLike, token: string) {
  if (!ticket.requester_email) return
  const details = await getContactDetails()
  const url = `${SITE_URL}/api/support/tickets/${encodeURIComponent(ticket.reference)}/access?t=${encodeURIComponent(token)}`
  return sendEmail({
    from: FROM,
    to: ticket.requester_email,
    replyTo: details.support_email,
    subject: `Open your conversation — ${ticket.reference}`,
    html: shell(`
      <h2>Hi ${esc(firstNameOf(ticket.requester_name))},</h2>
      <p>Someone asked to open this conversation. If that was you, use the button below.</p>
      ${field('Subject', esc(ticket.subject))}
      ${fieldMono('Reference', esc(ticket.reference))}
      <p style="margin-top:20px"><a href="${esc(url)}" style="background:#1a3c2e;color:#f4f0e7;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Open my conversation</a></p>
      <p style="font-size:.8rem;color:#8a9a8f;margin-top:18px">This link works for 30 minutes and only from this email address. If you didn&rsquo;t ask for it, you can ignore this — nobody can read your conversation without it.</p>
    `),
  })
}

// ─── Safeguarding concern received (to the safeguarding team + directors) ──
// Deliberately carries no details of the concern: email is forwarded, synced
// to phones and read over shoulders. The reader signs in to see the record.
export async function notifySafeguardingTeam(opts: { to: string[]; reference: string; sourceLabel: string; urgent: boolean }) {
  const details = await getContactDetails()
  const url = `${SITE_URL}/admin/whf-cio?tab=safeguarding`
  return sendEmail({
    from: FROM,
    to: Array.from(new Set([...opts.to, ...details.admin_emails])),
    subject: `${opts.urgent ? 'URGENT: ' : ''}Safeguarding concern received — ${opts.reference}`,
    html: shell(`
      <span class="badge">Safeguarding</span>
      <h2>A safeguarding concern has been logged.</h2>
      ${opts.urgent ? '<p><strong>The reporter said someone may be in immediate danger.</strong></p>' : ''}
      ${fieldMono('Reference', opts.reference)}
      ${fieldText('Received through', opts.sourceLabel)}
      <p>The details are in the incident log, which only directors and the designated safeguarding team can open.</p>
      <p style="margin-top:20px"><a href="${esc(url)}" style="background:#1a3c2e;color:#f4f0e7;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Open the incident log</a></p>
    `),
  })
}

// ─── Recurring giving (monthly pledges attached to volunteer/partner forms) ─
// These are not yet in EMAIL_TEMPLATES_BY_ID, same as the support-ticket
// emails above -- worth adding once the wording settles.

// Sent right after a volunteer/partner application submits, if they chose
// bank transfer: Stripe donors are redirected straight into Checkout at
// submit time, so there's no separate "finish setting up" step for them.
export async function sendRecurringGivingSetupReminder(opts: {
  to: string; name: string; amount: number; detailsUrl: string
}) {
  const vars = {
    firstName: firstNameOf(opts.name),
    amountField: field('Monthly amount', `<strong>${formatMoney(opts.amount, 'NGN')} / month</strong>`),
    detailsUrl: esc(opts.detailsUrl),
  }
  return sendEmail({
    from: FROM,
    to: opts.to,
    subject: 'Finish setting up your monthly gift',
    html: shell(`
      <h2>Hi ${esc(vars.firstName)},</h2>
      <p>Thanks for applying — we just need one more thing: your monthly giving commitment isn't set up yet.</p>
      ${vars.amountField}
      <p style="margin-top:20px"><a href="${vars.detailsUrl}" style="background:#1a3c2e;color:#f4f0e7;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Finish setting it up</a></p>
    `),
  })
}

// A cycle's transfer is due (bank transfer method, recurring). Sent by the
// cron in app/api/cron/recurring-giving/route.ts.
export async function sendRecurringGivingDueReminder(opts: {
  to: string; name: string; amount: number; detailsUrl: string
}) {
  const firstName = firstNameOf(opts.name)
  return sendEmail({
    from: FROM,
    to: opts.to,
    subject: 'Your monthly gift is due',
    html: shell(`
      <h2>Hi ${esc(firstName)},</h2>
      <p>This month's transfer for your recurring gift is due.</p>
      ${field('Monthly amount', `<strong>${formatMoney(opts.amount, 'NGN')}</strong>`)}
      <p style="margin-top:20px"><a href="${esc(opts.detailsUrl)}" style="background:#1a3c2e;color:#f4f0e7;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">View transfer details</a></p>
    `),
  })
}

// Admin confirmed a recurring bank-transfer cycle landed, or a Stripe
// subscription just activated -- either way, the pledge is now 'active'.
export async function sendRecurringGivingConfirmed(opts: {
  to: string; name: string; amount: number; nextDueAt: string | null
}) {
  const firstName = firstNameOf(opts.name)
  const nextLine = opts.nextDueAt
    ? `<p>Your next gift is due around ${esc(new Date(opts.nextDueAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))}.</p>`
    : ''
  return sendEmail({
    from: FROM,
    to: opts.to,
    subject: 'Your monthly gift is confirmed — thank you',
    html: shell(`
      <h2>Hi ${esc(firstName)}, thank you.</h2>
      <p>Your recurring gift of <strong>${formatMoney(opts.amount, 'NGN')}/month</strong> is confirmed.</p>
      ${nextLine}
    `),
  })
}

// Admin-triggered: a volunteer/partner applicant hasn't followed through on
// the giving step they started, and an admin wants to nudge that one person
// specifically (distinct from the automated cron reminder above).
export async function sendRecurringGivingFollowUp(opts: {
  to: string; name: string; amount: number; detailsUrl: string; note?: string
}) {
  const firstName = firstNameOf(opts.name)
  return sendEmail({
    from: FROM,
    to: opts.to,
    subject: 'Following up on your monthly gift',
    html: shell(`
      <h2>Hi ${esc(firstName)},</h2>
      <p>We wanted to follow up on the monthly gift you started setting up.</p>
      ${field('Monthly amount', `<strong>${formatMoney(opts.amount, 'NGN')}</strong>`)}
      ${opts.note ? `<p>${esc(opts.note)}</p>` : ''}
      <p style="margin-top:20px"><a href="${esc(opts.detailsUrl)}" style="background:#1a3c2e;color:#f4f0e7;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Continue</a></p>
    `),
  })
}

// Admin-composed broadcast pointing a list of volunteer/partner applicants at
// a specific donation project. One send per recipient so each gets a plain
// to: field (no exposed recipient list), same convention as the newsletter
// sender in lib/newsletter.ts.
export async function sendDonationRequestBroadcast(opts: {
  to: string; name: string; projectTitle: string; projectUrl: string; message?: string
}) {
  const firstName = firstNameOf(opts.name)
  return sendEmail({
    from: FROM,
    to: opts.to,
    subject: `Support ${opts.projectTitle}`,
    html: shell(`
      <h2>Hi ${esc(firstName)},</h2>
      ${opts.message ? `<p>${esc(opts.message)}</p>` : `<p>We're raising support for <strong>${esc(opts.projectTitle)}</strong> and wanted to invite you to be part of it.</p>`}
      <p style="margin-top:20px"><a href="${esc(opts.projectUrl)}" style="background:#1a3c2e;color:#f4f0e7;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">${esc(opts.projectTitle)} →</a></p>
    `),
  })
}

// ─── Recurring giving declared (to admin) ──────────────────────────────────
export async function notifyAdminRecurringDeclared(data: {
  name: string; email: string; amount: number; reference: string
}) {
  const details = await getContactDetails()
  return sendEmail({
    from: FROM,
    to: details.admin_emails,
    subject: `[Monthly Giving] ${data.name} says this month's transfer is sent`,
    html: shell(`
      <h2>${esc(data.name)} says the transfer has been sent</h2>
      ${fieldText('Donor', data.name)}
      ${field('Email', mailtoLink(data.email))}
      ${field('Monthly amount', `<strong>${formatMoney(data.amount, 'NGN')}</strong>`)}
      ${fieldMono('Reference', data.reference)}
      <p style="margin-top:20px"><a href="${esc(SITE_URL)}/admin/giving" style="background:#1a3c2e;color:#f4f0e7;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Open Giving admin</a></p>
    `),
  })
}
