// Shared building blocks for every transactional email in lib/email.ts, plus
// the newsletter sender in lib/newsletter.ts. Split out from lib/email.ts so
// lib/email-render.ts (which lib/email.ts itself depends on, for admin-editable
// template overrides) can use shell()/esc() without a circular import.

export function esc(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─── Shared building blocks ────────────────────────────────────────────────
// Nearly every admin-notification email is "a badge, a heading, a list of
// label/value rows, and a reply button" — these factor out that repetition
// without changing any email's rendered output.
export function firstNameOf(name: string) {
  return esc(name.split(' ')[0])
}

export function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount)
}

/** One `.field` row: a label above a value. `value` may itself contain markup. */
export function field(label: string, value: string) {
  return `<div class="field"><div class="k">${esc(label)}</div><div class="v">${value}</div></div>`
}

/** field() with the value HTML-escaped, for plain-text values. */
export function fieldText(label: string, value: string) {
  return field(label, esc(value))
}

/** field() for longer free-text (messages, quotes) that should preserve line breaks. */
export function fieldPre(label: string, value: string) {
  return field(label, `<span style="white-space:pre-wrap">${esc(value)}</span>`)
}

/** Multiple field() rows, skipping any whose value is falsy. */
export function fields(rows: Array<[label: string, value: string] | string | false | null | undefined>) {
  return rows.filter((r): r is [string, string] => Array.isArray(r)).map(([l, v]) => field(l, v)).join('')
}

/** field() for a code-like value (reference numbers, IDs) rendered in monospace. */
export function fieldMono(label: string, value: string, size = '.85rem') {
  return field(label, `<span style="font-family:monospace;font-size:${size}">${esc(value)}</span>`)
}

export function mailtoLink(email: string) {
  return `<a href="mailto:${esc(email)}" style="color:#1a3c2e">${esc(email)}</a>`
}

/** The "Reply to <name> →" call-to-action button used on every admin notification. */
export function replyButton(email: string, name: string) {
  return `<a href="mailto:${esc(email)}" class="btn">Reply to ${esc(name)} →</a>`
}

// ─── Shared HTML shell ─────────────────────────────────────────────────────
// Modern-but-email-safe CSS: a fluid single-column layout (already worked on
// narrow screens), plus a `prefers-color-scheme: dark` block for the mail
// clients that support it (Apple Mail, Outlook.com, newer Gmail) so the card
// doesn't stay stark white against a dark chrome. No flexbox/grid — email
// rendering engines are still effectively table-and-block CSS only, so the
// header and footer columns are tables.
export const DEFAULT_TAGLINE = 'Empowering Youth, Shaping Futures'
export const DEFAULT_SITE_URL = 'https://www.wissenhaus.org'

/**
 * Everything around an email's body: the brand in the header, and the
 * contact details, social links and legal links in the footer. Built from
 * the admin-editable brand (Settings → General) and contact details
 * (Content → Contact Details) by getEmailChrome() in lib/email-render.ts, so
 * an edit there shows up in the next email sent. Kept as plain data here, with
 * no server imports, because lib/email-catalog.ts (and through it the admin
 * editor) imports this file too.
 */
export interface EmailChrome {
  brandName: string
  brandDescriptor: string
  tagline: string
  siteUrl: string
  email: string
  phoneNigeria: string
  phoneUk: string
  addressNigeria: string
  addressUk: string
  socials: Array<{ label: string; url: string }>
  /** Bulk mail only (newsletter, donation broadcasts): adds an unsubscribe line. */
  unsubscribeUrl?: string
}

export const DEFAULT_CHROME: EmailChrome = {
  brandName: 'Wissen-Haus',
  brandDescriptor: 'Empowerment Foundation',
  tagline: DEFAULT_TAGLINE,
  siteUrl: DEFAULT_SITE_URL,
  email: 'info@wissenhaus.org',
  phoneNigeria: '+234800947736',
  phoneUk: '',
  addressNigeria: 'Ibadan, Oyo State, Nigeria',
  addressUk: '',
  socials: [
    { label: 'Instagram', url: 'https://www.instagram.com/wissen_haus' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/company/wissen-haus-empowerment-foundation' },
  ],
}

// Same set as the site footer's bottom row (components/Footer.tsx).
const LEGAL_LINKS: Array<[label: string, path: string]> = [
  ['Privacy Policy', '/privacy'],
  ['Terms &amp; Conditions', '/terms'],
  ['Safeguarding', '/safeguarding'],
  ['Financial Ledger', '/transparency/ledger'],
  ['Contact', '/contact'],
]

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

function officeCell(flag: string, label: string, address: string, phone: string) {
  if (!address && !phone) return ''
  return `<td class="office" valign="top">
        <div class="office-k">${flag} ${label}</div>
        ${address ? `<div>${esc(address)}</div>` : ''}
        ${phone ? `<div><a href="${esc(telHref(phone))}">${esc(phone)}</a></div>` : ''}
      </td>`
}

function footer(c: EmailChrome) {
  const site = c.siteUrl.replace(/\/+$/, '')
  const offices = [
    officeCell('🇳🇬', 'Nigeria', c.addressNigeria, c.phoneNigeria),
    officeCell('🇬🇧', 'United Kingdom', c.addressUk, c.phoneUk),
  ].filter(Boolean)
  const host = site.replace(/^https?:\/\//, '')
  const socials = c.socials.filter(s => s.url)
  const fullName = c.brandDescriptor ? `${c.brandName} ${c.brandDescriptor}` : c.brandName
  return `<div class="foot">
    <div class="foot-tag">${esc(c.tagline)}</div>
    ${offices.length ? `<table role="presentation" class="offices" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${offices.join('')}</tr></table>` : ''}
    <div class="foot-row">
      <a href="mailto:${esc(c.email)}">${esc(c.email)}</a> · <a href="${esc(site)}">${esc(host)}</a>
    </div>
    ${socials.length ? `<div class="foot-row">${socials.map(s => `<a href="${esc(s.url)}">${esc(s.label)}</a>`).join(' · ')}</div>` : ''}
    <div class="foot-legal">${LEGAL_LINKS.map(([label, path]) => `<a href="${esc(site + path)}">${label}</a>`).join(' · ')}</div>
    <div class="foot-small">
      Concerned about a child or young person's safety? See our <a href="${esc(site)}/safeguarding">safeguarding page</a> for how to raise it.<br/>
      ${c.unsubscribeUrl
        ? `You're receiving this because you subscribed to or engaged with ${esc(c.brandName)}. <a href="${esc(c.unsubscribeUrl)}">Unsubscribe</a>.<br/>`
        : `You're receiving this because of an action you or your organisation took with ${esc(c.brandName)}.<br/>`}
      © ${new Date().getFullYear()} ${esc(fullName)}. All rights reserved.
    </div>
  </div>`
}

export function shell(body: string, chrome: EmailChrome = DEFAULT_CHROME) {
  const site = chrome.siteUrl.replace(/\/+$/, '')
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light dark"/>
<meta name="supported-color-schemes" content="light dark"/>
<style>
  body{margin:0;padding:0;background:#f4f0e7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a2e24}
  .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.07)}
  .head{background:#fff;padding:28px 36px 22px;text-align:center;border-bottom:4px solid #1a3c2e}
  .head img{display:block;margin:0 auto 10px;border:0;width:64px;height:64px}
  .head h1{margin:0;color:#1a3c2e;font-size:1.15rem;letter-spacing:.08em;text-transform:uppercase;font-weight:700}
  .head p{margin:4px 0 0;color:#8a9a8f;font-size:.74rem;letter-spacing:.14em;text-transform:uppercase}
  .accent{height:3px;background:#c0392b;line-height:3px;font-size:0}
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
  .foot{background:#1a3c2e;padding:28px 36px;text-align:center;font-size:.78rem;color:rgba(244,240,231,.75);line-height:1.6}
  .foot a{color:#f4f0e7;text-decoration:underline}
  .foot-tag{color:#f4f0e7;font-weight:700;font-size:.85rem;letter-spacing:.04em;margin-bottom:16px}
  .offices{margin:0 0 14px}
  .office{padding:0 8px 10px;text-align:center;font-size:.78rem;color:rgba(244,240,231,.75)}
  .office-k{font-weight:700;color:#f4f0e7;margin-bottom:2px}
  .foot-row{margin-bottom:8px}
  .foot-legal{margin:14px 0 12px;padding-top:14px;border-top:1px solid rgba(244,240,231,.18)}
  .foot-small{font-size:.7rem;color:rgba(244,240,231,.55)}
  .foot-small a{color:rgba(244,240,231,.8)}
  @media (max-width:600px){
    .wrap{margin:0;border-radius:0;max-width:100%}
    .head,.body,.foot{padding-left:22px;padding-right:22px}
    .office{display:block;width:100%!important}
  }
  @media (prefers-color-scheme:dark){
    body{background:#0f1a14}
    .wrap{background:#16241c;box-shadow:none}
    .head{background:#16241c}
    .head h1{color:#f4f0e7}
    .body h2{color:#f4f0e7}
    .body p,.body li{color:#c7d2cb}
    .field .v{color:#f4f0e7}
    .foot{background:#0f1a14}
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="head">
    <a href="${esc(site)}"><img src="${esc(site)}/img/email-logo.png" width="64" height="64" alt="${esc(chrome.brandName)} logo"/></a>
    <h1>${esc(chrome.brandName)}</h1>
    ${chrome.brandDescriptor ? `<p>${esc(chrome.brandDescriptor)}</p>` : ''}
  </div>
  <div class="accent">&nbsp;</div>
  <div class="body">${body}</div>
  ${footer(chrome)}
</div>
</body>
</html>`
}
