import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  return _resend
}

const FROM = 'Wissen-Haus <noreply@wissenhaus.org>'
const ADMIN = process.env.FOUNDER_EMAIL ?? 'director@wissenhaus.org'

// â”€â”€â”€ Shared HTML shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function shell(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;padding:0;background:#f4f0e7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a2e24}
  .wrap{max-width:580px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.07)}
  .head{background:#1a3c2e;padding:32px 36px;text-align:center}
  .head h1{margin:0;color:#f4f0e7;font-size:1.1rem;letter-spacing:.08em;text-transform:uppercase;font-weight:600}
  .head p{margin:6px 0 0;color:rgba(244,240,231,.6);font-size:.78rem;letter-spacing:.12em;text-transform:uppercase}
  .body{padding:36px}
  .body h2{margin:0 0 12px;font-size:1.3rem;color:#1a2e24}
  .body p{margin:0 0 14px;line-height:1.65;color:#3a4a3f;font-size:.95rem}
  .body ul{padding-left:18px;margin:0 0 14px}
  .body li{margin-bottom:6px;line-height:1.6;color:#3a4a3f;font-size:.95rem}
  .badge{display:inline-block;background:#1a3c2e;color:#f4f0e7;border-radius:99px;padding:4px 14px;font-size:.75rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:20px}
  .btn{display:inline-block;background:#c0392b;color:#fff!important;text-decoration:none;border-radius:8px;padding:13px 28px;font-weight:700;font-size:.9rem;letter-spacing:.04em;margin:8px 0 20px}
  .divider{height:1px;background:#e8e4dc;margin:24px 0}
  .field{margin-bottom:16px}
  .field .k{font-size:.75rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8a9a8f;margin-bottom:3px}
  .field .v{font-size:.95rem;color:#1a2e24}
  .foot{background:#f4f0e7;padding:24px 36px;text-align:center;font-size:.78rem;color:#8a9a8f;line-height:1.6}
  .foot a{color:#1a3c2e;text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="head">
    <h1>Wissen-Haus</h1>
    <p>Youth Empowerment Foundation</p>
  </div>
  <div class="body">${body}</div>
  <div class="foot">
    Wissen-Haus Youth Empowerment Foundation Â· Ibadan, Nigeria<br/>
    <a href="https://wissenhaus.org">wissenhaus.org</a> Â· <a href="mailto:info@wissenhaus.org">info@wissenhaus.org</a>
  </div>
</div>
</body>
</html>`
}

// â”€â”€â”€ Welcome email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendWelcomeEmail(to: string, name: string) {
  const firstName = name.split(' ')[0]
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Welcome to Wissen-Haus, ${firstName} ðŸŒ±`,
    html: shell(`
      <span class="badge">Welcome</span>
      <h2>You're in, ${firstName}!</h2>
      <p>Thank you for joining the Wissen-Haus community â€” a space built to help young Nigerians discover their path, build real skills, and access global opportunities.</p>
      <p>Here's what you can do now:</p>
      <ul>
        <li>Take free certificate courses in the <strong>Learning Library</strong></li>
        <li>Browse remote jobs, internships &amp; scholarships in the <strong>Opportunity Hub</strong></li>
        <li>Connect with peers and mentors in the <strong>Community Hub</strong></li>
      </ul>
      <a href="https://wissenhaus.org/community" class="btn">Explore the Community â†’</a>
      <div class="divider"></div>
      <p style="font-size:.85rem;color:#8a9a8f">If you have any questions, reply to this email or reach us at <a href="mailto:info@wissenhaus.org" style="color:#1a3c2e">info@wissenhaus.org</a>.</p>
    `),
  })
}

// â”€â”€â”€ Contact form notification (to admin) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendContactNotification(data: {
  name: string; email: string; subject: string; message: string
}) {
  return getResend().emails.send({
    from: FROM,
    to: ADMIN,
    replyTo: data.email,
    subject: `[Contact] ${data.subject} â€” from ${data.name}`,
    html: shell(`
      <span class="badge">New Contact</span>
      <h2>New message received</h2>
      <div class="field"><div class="k">Name</div><div class="v">${data.name}</div></div>
      <div class="field"><div class="k">Email</div><div class="v"><a href="mailto:${data.email}" style="color:#1a3c2e">${data.email}</a></div></div>
      <div class="field"><div class="k">Subject</div><div class="v">${data.subject}</div></div>
      <div class="field"><div class="k">Message</div><div class="v" style="white-space:pre-wrap">${data.message}</div></div>
      <a href="mailto:${data.email}" class="btn">Reply to ${data.name} â†’</a>
    `),
  })
}

// â”€â”€â”€ Contact confirmation (to user) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendContactConfirmation(to: string, name: string) {
  const firstName = name.split(' ')[0]
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `We got your message, ${firstName} â€” Wissen-Haus`,
    html: shell(`
      <span class="badge">Message Received</span>
      <h2>Thanks for reaching out, ${firstName}!</h2>
      <p>We've received your message and will get back to you within 2â€“3 working days.</p>
      <p>In the meantime, explore what we're building:</p>
      <a href="https://wissenhaus.org" class="btn">Visit Wissen-Haus â†’</a>
    `),
  })
}

// â”€â”€â”€ Volunteer application (to admin) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendVolunteerNotification(data: {
  name: string; email: string; role: string; message: string
}) {
  return getResend().emails.send({
    from: FROM,
    to: ADMIN,
    replyTo: data.email,
    subject: `[Volunteer] New application â€” ${data.name} (${data.role})`,
    html: shell(`
      <span class="badge">Volunteer Application</span>
      <h2>New volunteer application</h2>
      <div class="field"><div class="k">Name</div><div class="v">${data.name}</div></div>
      <div class="field"><div class="k">Email</div><div class="v"><a href="mailto:${data.email}" style="color:#1a3c2e">${data.email}</a></div></div>
      <div class="field"><div class="k">Role</div><div class="v">${data.role}</div></div>
      <div class="field"><div class="k">Message</div><div class="v" style="white-space:pre-wrap">${data.message}</div></div>
      <a href="mailto:${data.email}" class="btn">Reply to ${data.name} â†’</a>
    `),
  })
}

// â”€â”€â”€ Volunteer confirmation (to user) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendVolunteerConfirmation(to: string, name: string, role: string) {
  const firstName = name.split(' ')[0]
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Application received, ${firstName} â€” Wissen-Haus`,
    html: shell(`
      <span class="badge">Application Received</span>
      <h2>Thank you, ${firstName}!</h2>
      <p>We've received your volunteer application for the <strong>${role}</strong> role.</p>
      <p>Our team reviews applications within 5 working days. We'll be in touch soon!</p>
      <a href="https://wissenhaus.org/volunteer" class="btn">Learn more about volunteering â†’</a>
    `),
  })
}

// â”€â”€â”€ Donation receipt â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendDonationReceipt(to: string, name: string, amount: number, currency: string, ref: string) {
  const firstName = name.split(' ')[0]
  const formatted = new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount)
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Donation received â€” thank you, ${firstName}!`,
    html: shell(`
      <span class="badge">Donation Confirmed</span>
      <h2>Thank you for your gift, ${firstName}!</h2>
      <p>Your generous donation has been received. Every naira (and pound) goes directly toward empowering young Nigerians.</p>
      <div class="field"><div class="k">Amount</div><div class="v"><strong>${formatted}</strong></div></div>
      <div class="field"><div class="k">Reference</div><div class="v" style="font-family:monospace;font-size:.85rem">${ref}</div></div>
      <div class="divider"></div>
      <p>Your support helps us run free career Trade Fairs, mentorship programmes and global exposure events for students who need it most.</p>
      <a href="https://wissenhaus.org/impact" class="btn">See our impact â†’</a>
    `),
  })
}

// â”€â”€â”€ Donation notification (to admin) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendDonationNotification(data: {
  name: string; email: string; amount: number; currency: string; ref: string; provider: string
}) {
  const formatted = new Intl.NumberFormat('en-NG', { style: 'currency', currency: data.currency }).format(data.amount)
  return getResend().emails.send({
    from: FROM,
    to: ADMIN,
    subject: `[Donation] ${formatted} from ${data.name} via ${data.provider}`,
    html: shell(`
      <span class="badge">New Donation</span>
      <h2>New donation received</h2>
      <div class="field"><div class="k">Donor</div><div class="v">${data.name}</div></div>
      <div class="field"><div class="k">Email</div><div class="v"><a href="mailto:${data.email}" style="color:#1a3c2e">${data.email}</a></div></div>
      <div class="field"><div class="k">Amount</div><div class="v"><strong>${formatted}</strong></div></div>
      <div class="field"><div class="k">Provider</div><div class="v">${data.provider}</div></div>
      <div class="field"><div class="k">Reference</div><div class="v" style="font-family:monospace;font-size:.85rem">${data.ref}</div></div>
    `),
  })
}

// â”€â”€â”€ Certificate email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendCertificateEmail(to: string, name: string, courseName: string, certId: string) {
  const firstName = name.split(' ')[0]
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `ðŸŽ“ You've earned your ${courseName} certificate!`,
    html: shell(`
      <span class="badge">Certificate Earned</span>
      <h2>Congratulations, ${firstName}! ðŸŽ“</h2>
      <p>You've successfully completed <strong>${courseName}</strong> and earned your Wissen-Haus certificate.</p>
      <div class="field"><div class="k">Certificate ID</div><div class="v" style="font-family:monospace;font-size:.85rem">${certId}</div></div>
      <p>Share this achievement with your network â€” it's a real credential that shows commitment to your career development.</p>
      <a href="https://wissenhaus.org/courses" class="btn">Explore more courses â†’</a>
    `),
  })
}

// â”€â”€â”€ Partner inquiry (to admin) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendPartnerNotification(data: {
  name: string; email: string; organisation: string; message: string
}) {
  return getResend().emails.send({
    from: FROM,
    to: ADMIN,
    replyTo: data.email,
    subject: `[Partner] Inquiry from ${data.organisation} â€” ${data.name}`,
    html: shell(`
      <span class="badge">Partnership Inquiry</span>
      <h2>New partnership inquiry</h2>
      <div class="field"><div class="k">Name</div><div class="v">${data.name}</div></div>
      <div class="field"><div class="k">Email</div><div class="v"><a href="mailto:${data.email}" style="color:#1a3c2e">${data.email}</a></div></div>
      <div class="field"><div class="k">Organisation</div><div class="v">${data.organisation}</div></div>
      <div class="field"><div class="k">Message</div><div class="v" style="white-space:pre-wrap">${data.message}</div></div>
      <a href="mailto:${data.email}" class="btn">Reply to ${data.name} â†’</a>
    `),
  })
}

