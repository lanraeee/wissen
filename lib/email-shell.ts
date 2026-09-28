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
// rendering engines are still effectively table-and-block CSS only.
export const DEFAULT_TAGLINE = 'Empowering Youth, Shaping Futures'

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
  <div class="head">
    <h1>Wissen-Haus</h1>
    <p>Empowerment Foundation</p>
  </div>
  <div class="body">${body}</div>
  <div class="foot">
    <strong>${esc(tagline)}</strong><br/>
    Wissen-Haus Empowerment Foundation · Ibadan, Nigeria<br/>
    <a href="https://wissenhaus.org">wissenhaus.org</a> · <a href="mailto:info@wissenhaus.org">info@wissenhaus.org</a>
  </div>
</div>
</body>
</html>`
}
