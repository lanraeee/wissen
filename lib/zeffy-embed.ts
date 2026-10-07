// Renders Zeffy's own embed snippet verbatim (just parametrized by form
// URL), rather than reimplementing it: Zeffy's docs explicitly warn against
// Zeffy processing payments for a hand-built form (see lib/ledger-providers.ts's
// Zeffy section) -- their own script is the only supported integration path,
// so this stays a pass-through of exactly what their "Share" page gives you.
// formUrl is admin-entered (donation_projects.zeffy_form_url), same trust
// model as the other admin-authored raw HTML in this codebase (newsletter
// bodies, email_templates.html).
export function zeffyEmbedHtml(formUrl: string): string {
  const fallbackSrc = `https://www.zeffy.com${formUrl}`
  return `<div>
  <div data-zeffy-embed data-form-url="${formUrl}"></div>
  <div data-zeffy-embed-fallback style="display:none;">
    <div style="position:relative;overflow:hidden;height:450px;width:100%;"><iframe title='Donation form powered by Zeffy' style='position: absolute; border: 0; top:0;left:0;bottom:0;right:0;width:100%;height:100%' data-zeffy-embed-src='${fallbackSrc}' allowpaymentrequest allowTransparency="true"></iframe></div>
  </div>
  <script
    src="https://www.zeffy.com/embed/v2/zeffy-embed.js"
    onerror="document.querySelectorAll('[data-zeffy-embed-fallback]').forEach(function(el){el.style.display='block';el.querySelectorAll('iframe[data-zeffy-embed-src]').forEach(function(f){f.src=f.getAttribute('data-zeffy-embed-src');});});">
  </script>
</div>`
}
