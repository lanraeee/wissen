// A reference catalog of every transactional email template defined in
// lib/email.ts, for the admin "Email Templates" tab. This is metadata only
// (not a live preview) -- kept separate from lib/email.ts on purpose, so
// browsing the catalog can never risk the email-sending code itself.

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
  subject: string
  trigger: string
  source: string
}

export const EMAIL_TEMPLATES: EmailTemplateInfo[] = [
  {
    id: 'welcome', name: 'Welcome Email', category: 'Account & Security', recipient: 'User',
    subject: 'Welcome to Wissen-Haus, {firstName} 🌱',
    trigger: 'Sent when a new user creates an account.',
    source: 'sendWelcomeEmail',
  },
  {
    id: 'password-reset', name: 'Password Reset', category: 'Account & Security', recipient: 'User',
    subject: 'Reset your Wissen-Haus password',
    trigger: 'Sent when a user requests a password reset, or an admin triggers one from the Users tab.',
    source: 'sendPasswordResetEmail',
  },
  {
    id: 'temp-password', name: 'Admin-Issued Temporary Password', category: 'Account & Security', recipient: 'User',
    subject: 'Your Wissen-Haus temporary password',
    trigger: 'Sent when an admin sets a temporary password for a user from the Users tab.',
    source: 'sendTempPasswordEmail',
  },
  {
    id: 'password-changed', name: 'Password Changed', category: 'Account & Security', recipient: 'User',
    subject: 'Your Wissen-Haus password was changed',
    trigger: 'Sent right after a password reset completes successfully.',
    source: 'sendPasswordChangedEmail',
  },
  {
    id: 'donation-receipt', name: 'Donation Receipt', category: 'Donations', recipient: 'User',
    subject: 'Donation received — thank you, {firstName}!',
    trigger: 'Sent once a donation is confirmed, with a certificate link when one applies.',
    source: 'sendDonationReceipt',
  },
  {
    id: 'bank-transfer-instructions', name: 'Bank Transfer Instructions', category: 'Donations', recipient: 'User',
    subject: 'Your bank transfer details — {amount} to Wissen-Haus',
    trigger: 'Sent when a donor chooses to give by bank transfer, before funds are confirmed.',
    source: 'sendBankTransferInstructions',
  },
  {
    id: 'fair-registration-confirmation', name: 'Career Fair Registration Confirmation', category: 'Career Fair', recipient: 'User',
    subject: "You're registered — {eventTitle}",
    trigger: 'Sent immediately after someone registers for a Career Clarity Fair.',
    source: 'sendFairRegistrationConfirmation',
  },
  {
    id: 'fair-checkin-reminder', name: 'Career Fair Check-In Reminder', category: 'Career Fair', recipient: 'User',
    subject: 'Reminder — {eventTitle} is coming up',
    trigger: 'Sent to registrants ahead of a fair via an admin-triggered bulk reminder send.',
    source: 'sendFairCheckinReminder',
  },
  {
    id: 'certificate', name: 'Course Certificate', category: 'Courses & Certificates', recipient: 'User',
    subject: "🎓 You've earned your {courseName} certificate!",
    trigger: 'Sent when a course is completed and a certificate is issued, whether self-service or admin-issued.',
    source: 'sendCertificateEmail',
  },
  {
    id: 'contact-confirmation', name: 'Contact Form Confirmation', category: 'User Confirmations', recipient: 'User',
    subject: 'We got your message, {firstName} — Wissen-Haus',
    trigger: 'Sent to whoever submits the public contact form.',
    source: 'sendContactConfirmation',
  },
  {
    id: 'volunteer-confirmation', name: 'Volunteer Application Confirmation', category: 'User Confirmations', recipient: 'User',
    subject: 'Application received, {firstName} — Wissen-Haus',
    trigger: 'Sent to whoever submits the volunteer application form.',
    source: 'sendVolunteerConfirmation',
  },
  {
    id: 'partner-confirmation', name: 'Partnership Inquiry Confirmation', category: 'User Confirmations', recipient: 'User',
    subject: 'Thanks for reaching out, {firstName} — Wissen-Haus',
    trigger: 'Sent to whoever submits the partnership inquiry form.',
    source: 'sendPartnerConfirmation',
  },
  {
    id: 'contact-notification', name: 'Contact Form Notification', category: 'Admin Notifications', recipient: 'Admin',
    subject: '[Contact] {subject} — from {name}',
    trigger: 'Sent to admins whenever the contact form is submitted.',
    source: 'sendContactNotification',
  },
  {
    id: 'volunteer-notification', name: 'Volunteer Application Notification', category: 'Admin Notifications', recipient: 'Admin',
    subject: '[Volunteer] New application — {name} ({role})',
    trigger: 'Sent to admins on a new volunteer application.',
    source: 'sendVolunteerNotification',
  },
  {
    id: 'donation-notification', name: 'Donation Notification', category: 'Admin Notifications', recipient: 'Admin',
    subject: '[Donation] {amount} from {name} via {provider}',
    trigger: 'Sent to admins whenever a donation is received.',
    source: 'sendDonationNotification',
  },
  {
    id: 'bank-transfer-notification', name: 'Bank Transfer Notification', category: 'Admin Notifications', recipient: 'Admin',
    subject: '[Bank Transfer] {amount} pledged by {name} / [Action] marked as sent',
    trigger: 'Sent to admins when a donor pledges a bank transfer, and again when they mark it sent.',
    source: 'sendBankTransferNotification',
  },
  {
    id: 'partner-notification', name: 'Partnership Inquiry Notification', category: 'Admin Notifications', recipient: 'Admin',
    subject: '[Partner] Inquiry from {organisation} — {name}',
    trigger: 'Sent to admins on a new partnership inquiry.',
    source: 'sendPartnerNotification',
  },
  {
    id: 'testimonial-notification', name: 'Testimonial Submitted', category: 'Admin Notifications', recipient: 'Admin',
    subject: '[Testimonial] New story from {name} awaiting review',
    trigger: 'Sent to admins when a testimonial is submitted for moderation.',
    source: 'sendTestimonialNotification',
  },
  {
    id: 'fair-registration-notification', name: 'Career Fair Registration Notification', category: 'Admin Notifications', recipient: 'Admin',
    subject: '[Career Fair] New registration — {name} ({eventTitle})',
    trigger: 'Sent to admins on a new Career Clarity Fair registration.',
    source: 'sendFairRegistrationNotification',
  },
]
