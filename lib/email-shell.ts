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

// ─── Header / footer chrome ────────────────────────────────────────────────
// shell() ships with sensible static defaults (used as-is by the admin
// template preview, which never fetches live data) between HTML comment
// markers. lib/email.ts's sendEmail() — the one chokepoint every real send
// passes through — replaces the marked regions with renderEmailHeader() output
// built from the configured brand, and renderEmailFooter() output. The footer
// text is fixed (see renderEmailFooter); only its tagline follows the caller.
// A send is never blocked on this: if that replacement fails for any reason
// the static defaults still render a complete, correct-looking email.

export const SITE_URL = 'https://www.wissenhaus.org'
export const DEFAULT_TAGLINE = 'Empowering Youth, Shaping Futures'

// A plain static file, not Next's /_next/image optimizer: that route is
// dynamic (on-demand resizing, its own caching/auth path), and several
// email clients fetch images through their own proxy (Gmail's, Outlook's
// Safe Links) that doesn't always reach a dynamic route the same way it
// reaches a static one -- which is what showed up as the logo just not
// loading. public/img/logo-email.png is a pre-resized 120x120 copy of
// public/img/logo.png (1750x1750, 290KB -- far too heavy to inline at
// display size), checked in rather than generated at request time.
const LOGO_URL = `${SITE_URL}/img/logo-email.png`

export const HEADER_START = '<!--WH_HEADER-->'
export const HEADER_END = '<!--/WH_HEADER-->'
export const FOOTER_START = '<!--WH_FOOTER-->'
export const FOOTER_END = '<!--/WH_FOOTER-->'

export interface EmailBrand { name: string; descriptor: string }

function defaultHeaderInner(brand: EmailBrand = { name: 'Wissen-Haus', descriptor: 'Empowerment Foundation' }) {
  return `<img src="${LOGO_URL}" width="48" height="48" alt="${esc(brand.name)}" style="display:block;margin:0 auto 10px;border-radius:10px"/>
    <h1>${esc(brand.name)}</h1>
    ${brand.descriptor ? `<p>${esc(brand.descriptor)}</p>` : ''}`
}

/** Real header chrome built from the live brand -- what sendEmail() splices in for every actual send. */
export function renderEmailHeader(brand: EmailBrand) {
  return defaultHeaderInner(brand)
}

// The footer every email carries. The text is fixed here rather than read from
// contact_details, on purpose: the same block is pasted into the Resend
// templates, which cannot read the database, so a live send and its template
// always show the same footer. Contact details still drive the website footer
// and the contact page. The tagline is the one part that follows the caller,
// so a template can keep its own.
export function renderEmailFooter(tagline: string = DEFAULT_TAGLINE) {
  const year = new Date().getFullYear()
  return `<strong>${esc(tagline)}</strong><br/>
    Wissen Haus Foundation<br/>
    NGA: Ibadan, Oyo State · <a href="tel:+234800947736">+234800947736</a><br/>
    UK: Manchester, England · <a href="tel:+443302201562">+443302201562</a><br/>
    <a href="mailto:info@wissenhaus.org">info@wissenhaus.org</a> · <a href="${SITE_URL}/">wissenhaus.org</a>
    <div style="margin-top:10px"><a href="https://www.instagram.com/wissen_haus" style="color:#8a9a8f;text-decoration:underline">Instagram</a> · <a href="https://www.linkedin.com/company/wissen-haus-empowerment-foundation" style="color:#8a9a8f;text-decoration:underline">LinkedIn</a></div>
    <div class="legal-links" style="margin-top:14px">
      <a href="${SITE_URL}/privacy">Privacy Policy</a> ·
      <a href="${SITE_URL}/terms">Terms &amp; Conditions</a> ·
      <a href="${SITE_URL}/safeguarding">Safeguarding</a> ·
      <a href="${SITE_URL}/policy-research">Policy &amp; Research</a>
    </div>
    <div style="margin-top:10px;color:#b4c4ba">© ${year} Wissen Haus Foundation UK &amp; Wissen Haus Empowerment Foundation NGA. All rights reserved.</div>`
}

// ─── Shared HTML shell ─────────────────────────────────────────────────────
// Modern-but-email-safe CSS: a fluid single-column layout (already worked on
// narrow screens), plus a `prefers-color-scheme: dark` block for the mail
// clients that support it (Apple Mail, Outlook.com, newer Gmail) so the card
// doesn't stay stark white against a dark chrome. No flexbox/grid — email
// rendering engines are still effectively table-and-block CSS only.
export function shell(body: string, tagline: string = DEFAULT_TAGLINE) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light dark"/>
<meta name="supported-color-schemes" content="light dark"/>
<style>
  body{margin:0;padding:0;background:#f4f0e7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a2e24}
  .wrap{max-width:580px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.07)}
  .head{background:linear-gradient(160deg,#1a3c2e,#0f2a1f);padding:34px 36px;text-align:center}
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
  .foot{background:#f4f0e7;padding:26px 36px 30px;text-align:center;font-size:.78rem;color:#8a9a8f;line-height:1.7;word-break:break-word;overflow-wrap:anywhere}
  .foot a{color:#1a3c2e;text-decoration:none}
  .foot .legal-links a{color:#8a9a8f;text-decoration:underline}
  @media (max-width:600px){
    .wrap{margin:0;border-radius:0;max-width:100%}
    .head,.body,.foot{padding-left:22px;padding-right:22px}
  }
  @media (prefers-color-scheme:dark){
    body{background:#0f1a14}
    .wrap{background:#16241c;box-shadow:none}
    .body h2{color:#f4f0e7}
    .body p,.body li{color:#c7d2cb}
    .field .v{color:#f4f0e7}
    .foot{background:#0f1a14;color:#6b7d72}
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="head">${HEADER_START}${defaultHeaderInner()}${HEADER_END}</div>
  <div class="body">${body}</div>
  <div class="foot">${FOOTER_START}${renderEmailFooter(tagline)}${FOOTER_END}</div>
</div>
</body>
</html>`
}
