// Renders a Zeffy popup-button trigger -- Zeffy's own recommendation over
// the inline-iframe embed ("best conversion and accessibility for donors"
// per their docs) -- rather than reimplementing their checkout: Zeffy's
// docs are explicit that it can't process payments for a hand-built form
// (see lib/ledger-providers.ts's Zeffy section), their own script is the
// only supported integration path. formUrl is admin-entered
// (donation_projects.zeffy_form_url or
// donation_settings.zeffy_general_form_url), same trust model as the other
// admin-authored raw HTML in this codebase (newsletter bodies,
// email_templates.html).
//
// The script is loaded separately from the markup deliberately: a
// <script> inserted via dangerouslySetInnerHTML (-> the DOM's innerHTML
// setter) is created as an inert element -- the browser never fetches or
// executes it, by design, the same reason innerHTML can't be used for
// script-based XSS. It has to be loaded with a real
// document.createElement('script') + appendChild (see loadZeffyPopupScript
// below, called from a 'use client' component's useEffect), or the button
// never gets its popup behaviour wired up -- which is exactly what "the
// card isn't showing" looked like with the earlier iframe-embed attempt.
//
// The <a> trigger itself has no such problem (anchor tags with custom
// attributes render fine via innerHTML) and its real href is a genuine
// fallback: if the script never loads for any reason, clicking it just
// opens Zeffy's hosted form in a new tab instead of a popup -- donors are
// never left looking at a dead button.
export const ZEFFY_POPUP_SCRIPT_SRC = 'https://zeffy-scripts.s3.ca-central-1.amazonaws.com/embed-form-script.min.js'

function toZeffyUrl(formUrl: string): string {
  // Accepts either the bare path Zeffy's iframe embed uses
  // ("/embed/donation-form/x") or an already-absolute zeffy.com URL.
  return formUrl.startsWith('http') ? formUrl : `https://www.zeffy.com${formUrl}`
}

function withModalParam(url: string): string {
  return url.includes('?') ? `${url}&modal=true` : `${url}?modal=true`
}

export function zeffyPopupButtonMarkup(formUrl: string, label = 'Donate Now'): string {
  const modalUrl = withModalParam(toZeffyUrl(formUrl))
  return `<a zeffy-form-link="${modalUrl}" href="${modalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--block btn--lg" style="text-align:center;text-decoration:none;display:block">${label}</a>`
}

/**
 * Loads Zeffy's popup-embed script exactly once per page. Safe to call
 * every time the Zeffy tab is shown -- it no-ops if the script is already
 * present (loading or loaded), so switching tabs back and forth never
 * double-loads or re-fetches it.
 */
export function loadZeffyPopupScript() {
  if (document.querySelector(`script[src="${ZEFFY_POPUP_SCRIPT_SRC}"]`)) return
  const script = document.createElement('script')
  script.src = ZEFFY_POPUP_SCRIPT_SRC
  script.async = true
  document.body.appendChild(script)
}
