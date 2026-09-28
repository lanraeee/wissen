// The catalog of every transactional email template the site sends, used by
// both lib/email.ts (which renders {{var}}-templated defaultSubject/
// defaultBody against an optional admin override in email_templates -- see
// lib/email-render.ts) and the admin "Email Templates" tab (which lists,
// edits and previews them).
//
// Editing a template in the admin panel never changes which variables are
// available -- only the copy and layout around the {{tokens}} listed in
// `variables`. Some of those tokens are pre-rendered HTML fragments (e.g.
// {{nameField}} is a whole label+value row) rather than raw values, so they
// can be repositioned or removed but not partially edited from inside the
// token itself.

import { field, fieldText, fieldPre, fieldMono, fields, mailtoLink, replyButton } from './email-shell'

export const EMAIL_CATEGORIES = [
  'Account & Security',
  'Donations',
  'Career Fair',
  'Courses & Certificates',
  'User Confirmations',
  'Admin Notifications',
] as const

export type EmailCategory = (typeof EMAIL_CATEGORIES)[number]

export interface EmailTemplateInfo {
  id: string
  name: string
  category: EmailCategory
  recipient: 'User' | 'Admin'
  variables: string[]
  defaultSubject: string
  defaultBody: string
  trigger: string
  source: string
  sampleVars: Record<string, string>
}

const SITE_URL = 'https://wissenhaus.org'

export const EMAIL_TEMPLATES: EmailTemplateInfo[] = [
  {
    id: 'welcome', name: 'Welcome Email', category: 'Account & Security', recipient: 'User',
    variables: ['firstNameRaw', 'firstName'],
    defaultSubject: 'Welcome to Wissen-Haus, {{firstNameRaw}} 🌱',
    defaultBody: `<span class="badge">Welcome</span>
<h2>You're in, {{firstName}}!</h2>
<p>Thank you for joining the Wissen-Haus community — a space built to help young Africans and diaspora changemakers discover their path, build real skills, and access global opportunities.</p>
<p>Here's what you can do now:</p>
<ul>
  <li>Take free certificate courses in the <strong>Learning Library</strong></li>
  <li>Browse remote jobs, internships &amp; scholarships in the <strong>Opportunity Hub</strong></li>
  <li>Connect with peers and mentors in the <strong>Community Hub</strong></li>
</ul>
<a href="https://wissenhaus.org/community" class="btn">Explore the Community →</a>
<div class="divider"></div>
<p style="font-size:.85rem;color:#8a9a8f">If you have any questions, reply to this email or reach us at <a href="mailto:info@wissenhaus.org" style="color:#1a3c2e">info@wissenhaus.org</a>.</p>`,
    trigger: 'Sent when a new user creates an account.',
    source: 'sendWelcomeEmail',
    sampleVars: { firstNameRaw: 'Ada', firstName: 'Ada' },
  },
  {
    id: 'password-reset', name: 'Password Reset', category: 'Account & Security', recipient: 'User',
    variables: ['firstName', 'resetUrl'],
    defaultSubject: 'Reset your Wissen-Haus password',
    defaultBody: `<span class="badge">Password Reset</span>
<h2>Hi {{firstName}},</h2>
<p>We received a request to reset your Wissen-Haus password. Click the button below to choose a new one. This link expires in 1 hour.</p>
<a href="{{resetUrl}}" class="btn">Reset your password →</a>
<p style="font-size:.85rem;color:#8a9a8f">If you didn't request this, you can safely ignore this email — your password will not be changed.</p>`,
    trigger: 'Sent when a user requests a password reset, or an admin triggers one from the Users tab.',
    source: 'sendPasswordResetEmail',
    sampleVars: { firstName: 'Ada', resetUrl: `${SITE_URL}/reset-password?token=sample` },
  },
  {
    id: 'temp-password', name: 'Admin-Issued Temporary Password', category: 'Account & Security', recipient: 'User',
    variables: ['firstName', 'tempPasswordField', 'loginUrl'],
    defaultSubject: 'Your Wissen-Haus temporary password',
    defaultBody: `<span class="badge">Password Reset</span>
<h2>Hi {{firstName}},</h2>
<p>A Wissen-Haus admin has reset your password on your behalf. Use the temporary password below to log in, then change it right away.</p>
{{tempPasswordField}}
<a href="{{loginUrl}}" class="btn">Log in →</a>
<p style="font-size:.85rem;color:#8a9a8f">If you didn't request this, please contact us immediately at <a href="mailto:info@wissenhaus.org" style="color:#1a3c2e">info@wissenhaus.org</a>.</p>`,
    trigger: 'Sent when an admin sets a temporary password for a user from the Users tab.',
    source: 'sendTempPasswordEmail',
    sampleVars: { firstName: 'Ada', tempPasswordField: fieldMono('Temporary password', 'xK7-mP2q9zRt', '1.1rem'), loginUrl: `${SITE_URL}/login` },
  },
  {
    id: 'password-changed', name: 'Password Changed', category: 'Account & Security', recipient: 'User',
    variables: ['firstName'],
    defaultSubject: 'Your Wissen-Haus password was changed',
    defaultBody: `<span class="badge">Security Alert</span>
<h2>Hi {{firstName}},</h2>
<p>This confirms that your Wissen-Haus account password was just changed. If this was you, no action is needed.</p>
<p style="font-size:.85rem;color:#8a9a8f">If you didn't make this change, please contact us immediately at <a href="mailto:info@wissenhaus.org" style="color:#1a3c2e">info@wissenhaus.org</a>.</p>`,
    trigger: 'Sent right after a password reset completes successfully.',
    source: 'sendPasswordChangedEmail',
    sampleVars: { firstName: 'Ada' },
  },
  {
    id: 'donation-receipt', name: 'Donation Receipt', category: 'Donations', recipient: 'User',
    variables: ['firstName', 'amountField', 'refField', 'certBtn'],
    defaultSubject: 'Donation received — thank you, {{firstNameRaw}}!',
    defaultBody: `<span class="badge">Donation Confirmed</span>
<h2>Thank you for your gift, {{firstName}}!</h2>
<p>Your generous donation has been received. Every naira (and pound) goes directly toward empowering young people across Africa and the diaspora.</p>
{{amountField}}
{{refField}}
{{certBtn}}
<div class="divider"></div>
<p>Your support helps us run free Career Clarity Fairs, mentorship programmes and global exposure events for students who need it most.</p>
<a href="https://wissenhaus.org/impact" class="btn">See our impact →</a>`,
    trigger: 'Sent once a donation is confirmed, with a certificate link when one applies.',
    source: 'sendDonationReceipt',
    sampleVars: {
      firstNameRaw: 'Ada', firstName: 'Ada',
      amountField: field('Amount', '<strong>₦50,000.00</strong>'),
      refField: fieldMono('Reference', 'WH-DON-SAMPLE123'),
      certBtn: '<a href="' + SITE_URL + '/donate/receipt/sample" class="btn">View &amp; print your donation certificate →</a>',
    },
  },
  {
    id: 'bank-transfer-instructions', name: 'Bank Transfer Instructions', category: 'Donations', recipient: 'User',
    variables: ['firstName', 'accountNameField', 'bankField', 'accountNumberField', 'extraRows', 'referenceField', 'instructionsPara', 'detailsUrl'],
    defaultSubject: 'Your bank transfer details — {{formatted}} to Wissen-Haus',
    defaultBody: `<span class="badge">Awaiting Transfer</span>
<h2>Thank you, {{firstName}} — here are your transfer details.</h2>
<p>You've chosen to give <strong>{{formatted}}</strong> by bank transfer. Please send it to the account below, quoting your reference so we can match your gift to your receipt.</p>
{{accountNameField}}
{{bankField}}
{{accountNumberField}}
{{extraRows}}
{{referenceField}}
{{instructionsPara}}
<div class="divider"></div>
<p>Once you've sent the transfer, let us know so we can watch for it:</p>
<a href="{{detailsUrl}}" class="btn">Confirm you've sent the transfer →</a>
<p style="font-size:.82rem;color:#8a9a8f">We'll email your official receipt and donation certificate as soon as the funds clear into our account.</p>`,
    trigger: 'Sent when a donor chooses bank transfer, before funds are confirmed.',
    source: 'sendBankTransferInstructions',
    sampleVars: {
      firstName: 'Ada', formatted: '₦50,000.00',
      accountNameField: field('Account Name', '<strong>Wissen-Haus Empowerment Foundation</strong>'),
      bankField: fieldText('Bank', 'Sample Bank Plc'),
      accountNumberField: field('Account Number (NGN)', '<span style="font-family:monospace;font-size:1.05rem;letter-spacing:.04em"><strong>0123456789</strong></span>'),
      extraRows: '',
      referenceField: field('Your Reference', '<span style="font-family:monospace;font-size:1rem"><strong>WH-REF-SAMPLE</strong></span>'),
      instructionsPara: '',
      detailsUrl: `${SITE_URL}/donate/bank-transfer/sample`,
    },
  },
  {
    id: 'fair-registration-confirmation', name: 'Career Fair Registration Confirmation', category: 'Career Fair', recipient: 'User',
    variables: ['firstName', 'eventTitle', 'fieldsHtml', 'boothsBlock', 'guideUrl'],
    defaultSubject: "You're registered — {{eventTitleRaw}}",
    defaultBody: `<span class="badge">Registration Confirmed</span>
<h2>See you there, {{firstName}}!</h2>
<p>You're registered for <strong>{{eventTitle}}</strong>.</p>
{{fieldsHtml}}
{{boothsBlock}}
<a href="{{guideUrl}}" class="btn">View your personal booth guide →</a>
<p style="font-size:.85rem;color:#8a9a8f">Bring this email or the link above with you — it's your check-in reference at the door.</p>`,
    trigger: 'Sent immediately after someone registers for a Career Clarity Fair.',
    source: 'sendFairRegistrationConfirmation',
    sampleVars: {
      firstName: 'Ada', eventTitle: 'Career Clarity Fair — Lagos', eventTitleRaw: 'Career Clarity Fair — Lagos',
      fieldsHtml: fields([['Date', 'Saturday, 15 November 2026'], ['Time', '10:00 AM'], ['Location', 'Landmark Centre, Lagos']]),
      boothsBlock: '<div class="divider"></div><p><strong>Booths picked for you:</strong> based on what you told us, start with Tech &amp; Data, Creative Industries.</p>',
      guideUrl: `${SITE_URL}/career-clarity-fair/checkin/sample`,
    },
  },
  {
    id: 'fair-checkin-reminder', name: 'Career Fair Check-In Reminder', category: 'Career Fair', recipient: 'User',
    variables: ['firstName', 'eventTitle', 'fieldsHtml', 'guideUrl'],
    defaultSubject: 'Reminder — {{eventTitleRaw}} is coming up',
    defaultBody: `<span class="badge">See You Soon</span>
<h2>Hi {{firstName}}, don't forget!</h2>
<p>You're registered for <strong>{{eventTitle}}</strong>.</p>
{{fieldsHtml}}
<a href="{{guideUrl}}" class="btn">View your booth guide &amp; check in →</a>
<p style="font-size:.85rem;color:#8a9a8f">Show this link at the door so we can check you in quickly.</p>`,
    trigger: 'Sent to registrants ahead of a fair via an admin-triggered bulk reminder send.',
    source: 'sendFairCheckinReminder',
    sampleVars: {
      firstName: 'Ada', eventTitle: 'Career Clarity Fair — Lagos', eventTitleRaw: 'Career Clarity Fair — Lagos',
      fieldsHtml: fields([['Date', 'Saturday, 15 November 2026'], ['Time', '10:00 AM'], ['Location', 'Landmark Centre, Lagos']]),
      guideUrl: `${SITE_URL}/career-clarity-fair/checkin/sample`,
    },
  },
  {
    id: 'certificate', name: 'Course Certificate', category: 'Courses & Certificates', recipient: 'User',
    variables: ['firstName', 'courseName', 'certIdField'],
    defaultSubject: "🎓 You've earned your {{courseNameRaw}} certificate!",
    defaultBody: `<span class="badge">Certificate Earned</span>
<h2>Congratulations, {{firstName}}! 🎓</h2>
<p>You've successfully completed <strong>{{courseName}}</strong> and earned your Wissen-Haus certificate.</p>
{{certIdField}}
<p>Share this achievement with your network — it's a real credential that shows commitment to your career development.</p>
<a href="https://wissenhaus.org/courses" class="btn">Explore more courses →</a>`,
    trigger: 'Sent when a course is completed and a certificate is issued, whether self-service or admin-issued.',
    source: 'sendCertificateEmail',
    sampleVars: { firstName: 'Ada', courseName: 'Career Readiness 101', courseNameRaw: 'Career Readiness 101', certIdField: fieldMono('Certificate ID', 'WH-SAMPLE-A1B2C3D4') },
  },
  {
    id: 'contact-confirmation', name: 'Contact Form Confirmation', category: 'User Confirmations', recipient: 'User',
    variables: ['firstName'],
    defaultSubject: 'We got your message, {{firstNameRaw}} — Wissen-Haus',
    defaultBody: `<span class="badge">Message Received</span>
<h2>Thanks for reaching out, {{firstName}}!</h2>
<p>We've received your message and will get back to you within 2–3 working days.</p>
<p>In the meantime, explore what we're building:</p>
<a href="https://wissenhaus.org" class="btn">Visit Wissen-Haus →</a>`,
    trigger: 'Sent to whoever submits the public contact form.',
    source: 'sendContactConfirmation',
    sampleVars: { firstNameRaw: 'Ada', firstName: 'Ada' },
  },
  {
    id: 'volunteer-confirmation', name: 'Volunteer Application Confirmation', category: 'User Confirmations', recipient: 'User',
    variables: ['firstName', 'role'],
    defaultSubject: 'Application received, {{firstNameRaw}} — Wissen-Haus',
    defaultBody: `<span class="badge">Application Received</span>
<h2>Thank you, {{firstName}}!</h2>
<p>We've received your volunteer application for the <strong>{{role}}</strong> role.</p>
<p>Our team reviews applications within 5 working days. We'll be in touch soon!</p>
<a href="https://wissenhaus.org/volunteer" class="btn">Learn more about volunteering →</a>`,
    trigger: 'Sent to whoever submits the volunteer application form.',
    source: 'sendVolunteerConfirmation',
    sampleVars: { firstNameRaw: 'Ada', firstName: 'Ada', role: 'Mentor' },
  },
  {
    id: 'partner-confirmation', name: 'Partnership Inquiry Confirmation', category: 'User Confirmations', recipient: 'User',
    variables: ['firstName'],
    defaultSubject: 'Thanks for reaching out, {{firstNameRaw}} — Wissen-Haus',
    defaultBody: `<span class="badge">Inquiry Received</span>
<h2>Thank you, {{firstName}}!</h2>
<p>We've received your partnership inquiry and someone from our team will be in touch within 5 working days to discuss next steps.</p>
<a href="https://wissenhaus.org/partner" class="btn">Learn more about partnering with us →</a>`,
    trigger: 'Sent to whoever submits the partnership inquiry form.',
    source: 'sendPartnerConfirmation',
    sampleVars: { firstNameRaw: 'Ada', firstName: 'Ada' },
  },
  {
    id: 'contact-notification', name: 'Contact Form Notification', category: 'Admin Notifications', recipient: 'Admin',
    variables: ['nameField', 'emailField', 'subjectField', 'messageField', 'replyBtn'],
    defaultSubject: '[Contact] {{subjectLine}} — from {{nameRaw}}',
    defaultBody: `<span class="badge">New Contact</span>
<h2>New message received</h2>
{{nameField}}
{{emailField}}
{{subjectField}}
{{messageField}}
{{replyBtn}}`,
    trigger: 'Sent to admins whenever the contact form is submitted.',
    source: 'sendContactNotification',
    sampleVars: {
      nameRaw: 'Ada Lovelace', subjectLine: 'Question about volunteering',
      nameField: fieldText('Name', 'Ada Lovelace'), emailField: field('Email', mailtoLink('ada@example.com')),
      subjectField: fieldText('Subject', 'Question about volunteering'),
      messageField: fieldPre('Message', "Hi, I'd love to learn more about your mentorship programme."),
      replyBtn: replyButton('ada@example.com', 'Ada Lovelace'),
    },
  },
  {
    id: 'volunteer-notification', name: 'Volunteer Application Notification', category: 'Admin Notifications', recipient: 'Admin',
    variables: ['nameField', 'emailField', 'roleField', 'messageField', 'replyBtn'],
    defaultSubject: '[Volunteer] New application — {{nameRaw}} ({{roleRaw}})',
    defaultBody: `<span class="badge">Volunteer Application</span>
<h2>New volunteer application</h2>
{{nameField}}
{{emailField}}
{{roleField}}
{{messageField}}
{{replyBtn}}`,
    trigger: 'Sent to admins on a new volunteer application.',
    source: 'sendVolunteerNotification',
    sampleVars: {
      nameRaw: 'Ada Lovelace', roleRaw: 'Mentor',
      nameField: fieldText('Name', 'Ada Lovelace'), emailField: field('Email', mailtoLink('ada@example.com')),
      roleField: fieldText('Role', 'Mentor'), messageField: fieldPre('Message', "I'd love to mentor students interested in engineering."),
      replyBtn: replyButton('ada@example.com', 'Ada Lovelace'),
    },
  },
  {
    id: 'donation-notification', name: 'Donation Notification', category: 'Admin Notifications', recipient: 'Admin',
    variables: ['donorField', 'emailField', 'amountField', 'providerField', 'refField'],
    defaultSubject: '[Donation] {{formatted}} from {{nameRaw}} via {{providerRaw}}',
    defaultBody: `<span class="badge">New Donation</span>
<h2>New donation received</h2>
{{donorField}}
{{emailField}}
{{amountField}}
{{providerField}}
{{refField}}`,
    trigger: 'Sent to admins whenever a donation is received.',
    source: 'sendDonationNotification',
    sampleVars: {
      nameRaw: 'Ada Lovelace', providerRaw: 'Paystack', formatted: '₦50,000.00',
      donorField: fieldText('Donor', 'Ada Lovelace'), emailField: field('Email', mailtoLink('ada@example.com')),
      amountField: field('Amount', '<strong>₦50,000.00</strong>'), providerField: fieldText('Provider', 'Paystack'),
      refField: fieldMono('Reference', 'WH-DON-SAMPLE123'),
    },
  },
  {
    id: 'bank-transfer-notification', name: 'Bank Transfer Notification', category: 'Admin Notifications', recipient: 'Admin',
    variables: ['donorField', 'emailField', 'amountField', 'refField', 'badge', 'heading', 'message', 'bankTransfersUrl'],
    defaultSubject: '{{subjectLine}}',
    defaultBody: `<span class="badge">{{badge}}</span>
<h2>{{heading}}</h2>
{{donorField}}
{{emailField}}
{{amountField}}
{{refField}}
<div class="divider"></div>
<p>{{message}}</p>
<a href="{{bankTransfersUrl}}" class="btn">Open bank transfers →</a>`,
    trigger: 'Sent to admins when a donor pledges a bank transfer, and again when they mark it sent.',
    source: 'sendBankTransferNotification',
    sampleVars: {
      subjectLine: '[Bank Transfer] ₦50,000.00 pledged by Ada Lovelace',
      badge: 'New Bank Transfer Pledge', heading: 'A donor has chosen to give by bank transfer',
      message: "No action needed yet. You'll get another email when the donor marks the transfer as sent.",
      donorField: fieldText('Donor', 'Ada Lovelace'), emailField: field('Email', mailtoLink('ada@example.com')),
      amountField: field('Amount', '<strong>₦50,000.00</strong>'), refField: fieldMono('Reference', 'WH-REF-SAMPLE'),
      bankTransfersUrl: `${SITE_URL}/admin/submissions?type=bank_transfer`,
    },
  },
  {
    id: 'partner-notification', name: 'Partnership Inquiry Notification', category: 'Admin Notifications', recipient: 'Admin',
    variables: ['nameField', 'emailField', 'orgField', 'messageField', 'replyBtn'],
    defaultSubject: '[Partner] Inquiry from {{orgRaw}} — {{nameRaw}}',
    defaultBody: `<span class="badge">Partnership Inquiry</span>
<h2>New partnership inquiry</h2>
{{nameField}}
{{emailField}}
{{orgField}}
{{messageField}}
{{replyBtn}}`,
    trigger: 'Sent to admins on a new partnership inquiry.',
    source: 'sendPartnerNotification',
    sampleVars: {
      nameRaw: 'Ada Lovelace', orgRaw: 'Sample Org Ltd',
      nameField: fieldText('Name', 'Ada Lovelace'), emailField: field('Email', mailtoLink('ada@example.com')),
      orgField: fieldText('Organisation', 'Sample Org Ltd'), messageField: fieldPre('Message', "We'd love to explore a partnership."),
      replyBtn: replyButton('ada@example.com', 'Ada Lovelace'),
    },
  },
  {
    id: 'testimonial-notification', name: 'Testimonial Submitted', category: 'Admin Notifications', recipient: 'Admin',
    variables: ['fieldsHtml', 'quoteField'],
    defaultSubject: '[Testimonial] New story from {{nameRaw}} awaiting review',
    defaultBody: `<span class="badge">Pending Review</span>
<h2>New impact story submitted</h2>
{{fieldsHtml}}
{{quoteField}}
<a href="https://wissenhaus.org/admin/testimonials" class="btn">Review in admin →</a>`,
    trigger: 'Sent to admins when a testimonial is submitted for moderation.',
    source: 'sendTestimonialNotification',
    sampleVars: {
      nameRaw: 'Ada Lovelace',
      fieldsHtml: fields([['Name', 'Ada Lovelace'], ['Role', 'Alumna']]),
      quoteField: fieldPre('Quote', 'Wissen-Haus completely changed how I approached my career search.'),
    },
  },
  {
    id: 'fair-registration-notification', name: 'Career Fair Registration Notification', category: 'Admin Notifications', recipient: 'Admin',
    variables: ['nameField', 'emailField', 'phoneField', 'schoolField', 'eventField'],
    defaultSubject: '[Career Fair] New registration — {{nameRaw}} ({{eventTitleRaw}})',
    defaultBody: `<span class="badge">New Registration</span>
<h2>New Career Fair registration</h2>
{{nameField}}
{{emailField}}
{{phoneField}}
{{schoolField}}
{{eventField}}`,
    trigger: 'Sent to admins on a new Career Clarity Fair registration.',
    source: 'sendFairRegistrationNotification',
    sampleVars: {
      nameRaw: 'Ada Lovelace', eventTitleRaw: 'Career Clarity Fair — Lagos',
      nameField: fieldText('Name', 'Ada Lovelace'), emailField: field('Email', mailtoLink('ada@example.com')),
      phoneField: fieldText('Phone', '+234 800 000 0000'), schoolField: fieldText('School', 'Sample University'),
      eventField: fieldText('Event', 'Career Clarity Fair — Lagos'),
    },
  },
]

export const EMAIL_TEMPLATES_BY_ID: Record<string, EmailTemplateInfo> = Object.fromEntries(
  EMAIL_TEMPLATES.map(t => [t.id, t])
)
