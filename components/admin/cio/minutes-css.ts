// Styling for the minutes preview/print document -- same typographic family
// and palette as the constitution booklet (booklet-css.ts), but a single
// flowing letter page rather than a paginated A5 booklet: minutes are a
// one-sitting record, not a bound document.

const SERIF = "'EB Garamond','Cormorant Garamond',Garamond,'Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif"
const DISPLAY = "'Cormorant Garamond','Cormorant',Garamond,'Palatino Linotype',Palatino,Georgia,serif"

export const MINUTES_CSS = `
.mn-root{--ink:#1d1d1b;--green:#123524;--green2:#1f5a3f;--gold:#b08d2e;--paper:#fffdf8;font-family:${SERIF};color:var(--ink)}
.mn-root *{box-sizing:border-box}
.mn-sheet{background:var(--paper);max-width:680px;margin:0 auto;padding:48px 52px;box-shadow:0 2px 14px rgba(0,0,0,.14);border-radius:2px}
.mn-head{text-align:center;padding-bottom:18px;margin-bottom:18px;border-bottom:1.4px solid var(--green)}
.mn-org{font-family:${DISPLAY};font-weight:700;font-size:15px;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}
.mn-kicker{font-family:${DISPLAY};font-size:10.5px;letter-spacing:.3em;text-transform:uppercase;color:var(--gold);font-weight:700;margin-top:10px}
.mn-title{font-family:${DISPLAY};font-weight:700;font-size:22px;letter-spacing:.04em;color:var(--green);margin:4px 0 8px}
.mn-meta{font-size:12px;letter-spacing:.06em;color:#5a564a;font-variant-numeric:oldstyle-nums}
.mn-roster{font-size:13px;line-height:1.7;margin-bottom:22px}
.mn-roster .mn-rk{font-family:${DISPLAY};font-weight:700;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);display:block;margin-top:10px}
.mn-heading{font-family:${DISPLAY};font-weight:700;font-size:15.5px;color:var(--green);margin:20px 0 6px;display:flex;gap:10px;align-items:baseline}
.mn-heading .mn-hn{color:var(--gold);min-width:20px}
.mn-para{display:grid;grid-template-columns:34px 1fr;font-size:13.5px;line-height:1.65;text-align:justify;margin-bottom:5px}
.mn-para .mn-n{color:var(--green2);font-weight:600;font-variant-numeric:tabular-nums}
.mn-plain{font-size:13.5px;line-height:1.65;margin-bottom:5px;text-align:justify}
.mn-tag{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:1px 7px;border-radius:99px;margin-right:5px;vertical-align:1px;font-family:system-ui,sans-serif}
.mn-tag.mn-resolved{background:#e3f1e8;color:var(--green)}
.mn-tag.mn-open{background:#fdf1d9;color:#8a6410}
.mn-sigrow{display:flex;gap:40px;margin-top:38px;flex-wrap:wrap}
.mn-sigblock{flex:1;min-width:200px}
.mn-sigline{height:1px;background:#4a4a46;margin-top:28px}
.mn-sigcap{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#6d6a5e;margin-top:4px}
.mn-takenby{margin-top:18px;font-size:12px;color:#5a564a}

.mn-stage{border-radius:10px;overflow:auto;max-height:70vh;padding:20px 0;background:linear-gradient(180deg,#e9e4d6,#d9d2bf)}
`

export const MINUTES_PRINT_CSS = `
@page{size:A4;margin:22mm 18mm}
html,body{margin:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.mn-print .mn-sheet{box-shadow:none;max-width:none;padding:0}
`

export { FONTS_URL } from './booklet-css'
