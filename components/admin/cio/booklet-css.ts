// Booklet styling, shared by the on-screen preview and the print/PDF document. A5 pages (148 x 210 mm at 96 dpi).
export const PAGE_W = 559
export const PAGE_H = 794
export const BODY_W = 437
export const BODY_H = 636
export const LINE_H = 21 // 14px body at line-height 1.5; the paginator splits text on multiples of this

const SERIF = "'EB Garamond','Cormorant Garamond',Garamond,'Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif"
const DISPLAY = "'Cormorant Garamond','Cormorant',Garamond,'Palatino Linotype',Palatino,Georgia,serif"

export const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap'

export const BOOKLET_CSS = `
.bk-root{--ink:#1d1d1b;--green:#123524;--green2:#1f5a3f;--gold:#b08d2e;--paper:#fffdf8;font-family:${SERIF};color:var(--ink)}
.bk-root *{box-sizing:border-box}
.bk-page{position:relative;width:${PAGE_W}px;height:${PAGE_H}px;background:var(--paper);overflow:hidden;flex:none;font-size:14px;line-height:1.5}
.bk-page.bk-verso{box-shadow:inset -14px 0 18px -14px rgba(0,0,0,.22)}
.bk-page.bk-recto{box-shadow:inset 14px 0 18px -14px rgba(0,0,0,.22)}
.bk-body{position:absolute;top:74px;width:${BODY_W}px;height:${BODY_H}px;overflow:hidden}
.bk-verso .bk-body{left:54px}.bk-recto .bk-body{left:68px}
.bk-run{position:absolute;top:34px;width:${BODY_W}px;font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:#6d6a5e;display:flex;justify-content:space-between;border-bottom:.6px solid #cfc8b4;padding-bottom:7px}
.bk-verso .bk-run{left:54px}.bk-recto .bk-run{left:68px}
.bk-folio{position:absolute;bottom:38px;width:${BODY_W}px;text-align:center;font-size:12px;color:#55524a;font-variant-numeric:oldstyle-nums}
.bk-verso .bk-folio{left:54px}.bk-recto .bk-folio{left:68px}
.bk-folio::before,.bk-folio::after{content:'';display:inline-block;width:18px;height:.6px;background:#b9b29a;vertical-align:middle;margin:0 10px}

.bk-body>*,.bk-measure>*{padding-bottom:9px}
.bk-body>.bk-piece{padding-bottom:0;overflow:hidden}
.bk-body>.bk-clause:first-child{padding-top:0}
.bk-clause{padding-top:22px;text-align:center}
.bk-clause .bk-kicker{font-family:${DISPLAY};font-size:10.5px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold);font-weight:700}
.bk-clause h2{margin:4px 0 7px;font-family:${DISPLAY};font-weight:700;font-size:17px;letter-spacing:.09em;text-transform:uppercase;color:var(--green);line-height:1.25}
.bk-clause .bk-orn{display:block;height:6px;border-top:.8px solid var(--gold);border-bottom:.8px solid var(--gold);width:58px;margin:0 auto;opacity:.85}
.bk-sub{padding-top:7px;font-family:${DISPLAY};font-weight:700;font-size:14.5px;color:var(--green);display:flex;gap:10px}
.bk-sub .bk-n{min-width:28px;color:var(--gold)}
.bk-para{display:grid;grid-template-columns:38px 1fr;text-align:justify;hyphens:auto;-webkit-hyphens:auto}
.bk-para.bk-nonum{display:block}
.bk-para .bk-n{color:var(--green2);font-weight:600;font-variant-numeric:tabular-nums}
.bk-item{display:grid;text-align:justify;hyphens:auto}
.bk-item.l1{grid-template-columns:28px 1fr;margin-left:38px}
.bk-item.l2{grid-template-columns:30px 1fr;margin-left:66px}
.bk-item .bk-n{color:var(--green2)}
.bk-bullet{display:grid;grid-template-columns:20px 1fr;margin-left:38px;text-align:justify}
.bk-bullet::before{content:'\\25C6';font-size:7px;color:var(--gold);line-height:2.6}
.bk-table{width:100%;border-collapse:collapse;font-size:12.4px;margin:2px 0 4px}
.bk-table th{font-family:${DISPLAY};text-transform:uppercase;letter-spacing:.1em;font-size:10.5px;text-align:left;color:var(--green);border-top:1.2px solid var(--green);border-bottom:.8px solid var(--green);padding:5px 6px}
.bk-table td{padding:5px 6px;border-bottom:.6px solid #d8d1bd;vertical-align:top}
.bk-sigblock{padding-top:14px}
.bk-sigline{height:1px;background:#4a4a46;width:68%;margin-top:22px}
.bk-sigcap{font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:#6d6a5e;margin-top:3px}
.bk-end{text-align:center;padding-top:18px;font-family:${DISPLAY};letter-spacing:.3em;text-transform:uppercase;font-size:11px;color:var(--gold);font-weight:700}
.bk-draft .bk-body::before{content:'DRAFT';position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) rotate(-32deg);font-family:${DISPLAY};font-size:120px;font-weight:700;letter-spacing:.12em;color:rgba(18,53,36,.055);pointer-events:none;z-index:0}

.bk-cover,.bk-back{background:radial-gradient(120% 90% at 50% 30%,#1b4a34 0%,#123524 55%,#0b2417 100%);color:#f3e9c9;text-align:center}
.bk-cover{box-shadow:inset 14px 0 18px -14px rgba(0,0,0,.5)}
.bk-cover .bk-frame,.bk-back .bk-frame{position:absolute;inset:26px;border:1.4px solid #c9a646;pointer-events:none}
.bk-cover .bk-frame::after,.bk-back .bk-frame::after{content:'';position:absolute;inset:6px;border:.6px solid rgba(201,166,70,.7)}
.bk-medal{position:absolute;left:50%;top:104px;width:176px;height:176px;margin-left:-88px;border-radius:50%;background:#fff;border:3px solid #c9a646;box-shadow:0 0 0 6px rgba(201,166,70,.25),0 8px 22px rgba(0,0,0,.35);overflow:hidden}

.bk-medal img{position:absolute;width:292px;max-width:none;left:-58px;top:-50px;clip-path:inset(0 0 29% 0)}
.bk-cover .bk-stack{position:absolute;left:44px;right:44px;top:318px}
.bk-cover .bk-title{font-family:${DISPLAY};font-weight:700;font-size:35px;letter-spacing:.3em;text-indent:.3em;color:#e3c46a}
.bk-cover .bk-org{font-family:${DISPLAY};font-size:19px;letter-spacing:.16em;text-transform:uppercase;line-height:1.45;font-weight:600;color:#f6efd6}
.bk-cover .bk-sub2{margin-top:16px;font-style:italic;font-size:14px;color:#d8cfae}
.bk-gold-rule{display:block;margin:16px auto;width:90px;height:7px;border-top:.9px solid #c9a646;border-bottom:.9px solid #c9a646}
.bk-cover .bk-ver{position:absolute;left:0;right:0;bottom:70px;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#d9c27a;line-height:2}
.bk-back .bk-medal{top:300px;width:110px;height:110px;margin-left:-55px}
.bk-back .bk-medal img{width:182px;left:-36px;top:-31px}
.bk-back .bk-bt{position:absolute;left:0;right:0;top:440px;font-family:${DISPLAY};font-size:13px;letter-spacing:.3em;text-transform:uppercase;color:#d9c27a}

.bk-imprint{position:absolute;left:54px;width:${BODY_W}px;bottom:96px;text-align:center;font-size:11.5px;line-height:1.75;color:#4d4a42}
.bk-imprint strong{display:block;font-family:${DISPLAY};font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--green);margin-bottom:4px}
.bk-imprint .bk-line{display:inline-block;width:110px;border-bottom:.8px solid #6d6a5e;vertical-align:baseline}
.bk-toc-h{text-align:center;padding-bottom:12px}
.bk-toc-h .bk-kicker{font-family:${DISPLAY};font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold);font-weight:700}
.bk-toc-h h2{margin:4px 0 8px;font-family:${DISPLAY};font-size:26px;letter-spacing:.2em;text-transform:uppercase;color:var(--green);font-weight:700}
.bk-toc{display:flex;align-items:baseline;gap:8px;padding:2.5px 0;font-size:13.4px}
.bk-toc .bk-tn{width:26px;color:var(--gold);font-weight:600;font-variant-numeric:tabular-nums}
.bk-toc .bk-tt{flex:none;max-width:340px}
.bk-toc .bk-dots{flex:1;border-bottom:1px dotted #a8a28d;transform:translateY(-3px)}
.bk-toc .bk-tp{width:24px;text-align:right;font-variant-numeric:tabular-nums}
.bk-measure{position:absolute;left:-99999px;top:0;width:${BODY_W}px;visibility:hidden;font-size:14px;line-height:1.5}

.bk-stage{position:relative;overflow:hidden;background:linear-gradient(180deg,#e9e4d6,#d9d2bf);border-radius:10px;padding:22px 0 18px;outline:none}
.bk-spread{display:flex;justify-content:center;transform-origin:top center;filter:drop-shadow(0 12px 18px rgba(0,0,0,.28))}
.bk-spread.bk-spine{position:relative}
.bk-ctl{display:flex;justify-content:center;align-items:center;gap:16px;margin-top:12px;font-family:system-ui,sans-serif;font-size:.8rem;color:#3a4a3f}
`

export const PRINT_CSS = `
@page{size:148mm 210mm;margin:0}
html,body{margin:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.bk-print .bk-page{width:148mm;height:210mm;break-after:page;page-break-after:always;box-shadow:none!important;margin:0}
.bk-print .bk-page:last-child{break-after:auto;page-break-after:auto}
`
