import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import DonateWidget from '@/components/DonateWidget'

export const metadata: Metadata = {
  title: 'Donation Drive: Series 1 · Career Clarity Fair · Wissen-Haus',
  description: 'Help us deliver the Career Clarity Fair to 500–1,000 students in Ibadan on 5 December 2026. Our first public donation drive — fund the event that changes what young Nigerians believe is possible.',
}

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 18, height: 18 }}>
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ width: 16, height: 16, flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// 5 December 2026 — days from 7 September 2026
const DAYS_LEFT = 89
const STUDENTS_TARGET = '500–1,000'
const SCHOOLS = '3+'
const SECTORS = '15+'

const STAGES = [
  {
    n: '1',
    title: 'Reach',
    desc: 'Animated content screened in front of 500–1,000 Ibadan students — JSS1 through SS3 — in a single day, in one room.',
    color: '#E0A83E',
  },
  {
    n: '2',
    title: 'Engage',
    desc: 'Watch, quiz, discuss, create. Six touchpoints with the same content — not passive viewing, but participation that leaves something behind.',
    color: '#2C7A4B',
  },
  {
    n: '3',
    title: 'Learn',
    desc: 'Every activity is tied to named learning outcomes agreed with our partners — cultural identity, self-belief, aspiration, resilience.',
    color: '#1E5E3B',
  },
  {
    n: '4',
    title: 'Measure',
    desc: 'Before, during, and after. Student voice captured as evidence — the same children measured at each stage with a consistent instrument.',
    color: '#16452C',
  },
  {
    n: '5',
    title: 'Extend',
    desc: 'The Fair produces an Impact Snapshot: a co-branded report on what the content did — evidence that opens the door to Ibadan school activations and further funding.',
    color: '#0F2D1D',
  },
]

const BUDGET_LINES = [
  { item: 'Student resource packs (Passport, Workbook, Action Card, Badge)', amount: '₦15,000,000' },
  { item: 'Facilitator & volunteer coordination, transport', amount: '₦9,500,000' },
  { item: 'Event environment — signage, banners, stage backdrop', amount: '₦7,500,000' },
  { item: 'Measurement tools — pre/during/after surveys, quiz printing', amount: '₦6,000,000' },
  { item: 'Photography & videography — student voice capture', amount: '₦8,000,000' },
  { item: 'Logistics & contingency', amount: '₦4,000,000' },
]

const FAQ = [
  {
    q: 'What exactly is the Career Clarity Fair?',
    a: 'A one-day career discovery marketplace for secondary school students in Ibadan — hands-on exploration across 15+ career sectors, in three age-appropriate tracks (JSS1–JSS2, JSS3, SS1–SS3). Design principle: 70% hands-on participation, 30% talks. Scheduled for Saturday 5 December 2026.',
  },
  {
    q: 'Who is the animation studio partner and what role do they play?',
    a: 'Our animation studio partner (name withheld until the partnership is fully confirmed) is a Nigerian animation studio. At the Fair, their content becomes the centrepiece of a designed activation — a screening with guided discussion, built around a confidence-building challenge where students publicly name one thing they believe they can do.',
  },
  {
    q: 'What does my donation specifically fund?',
    a: 'This Donation Drive covers the community delivery costs: student resource packs, facilitator coordination, event environment (signage, banners, backdrop), measurement tools (pre/during/after surveys), and photography and video documentation. The core content partnership is funded separately.',
  },
  {
    q: 'Will I receive an update on impact?',
    a: 'Yes. After the Fair (December 2026 – January 2027), we publish the Career Clarity Fair Impact Snapshot — measuring reach, student engagement, learning outcomes, and student voice. All donors will receive this report. Donors of ₦50,000 or more receive a personalised acknowledgement.',
  },
]

export default function DonationDriveSeries1Page() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="section section--tight panel-dark" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="rgrid-hero" style={{ gap: 'clamp(40px,6vw,72px)', alignItems: 'center' }}>
            <div className="reveal">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                <span className="eyebrow eyebrow--light">Donation Drive · Series 1</span>
                <span style={{
                  background: 'var(--red)', color: '#fff',
                  fontFamily: 'var(--ff-mono)', fontSize: '.65rem', letterSpacing: '.14em',
                  textTransform: 'uppercase', padding: '3px 10px', borderRadius: 99,
                }}>
                  {DAYS_LEFT} days to go
                </span>
              </div>

              <h1 className="display-lg" style={{ color: '#fff', lineHeight: .95, marginBottom: '1rem' }}>
                500–1,000 Ibadan<br />students.<br />
                <span style={{ color: 'var(--gold)' }}>5 December 2026.</span>
              </h1>

              <p className="lead" style={{ color: 'rgba(244,240,231,.78)', maxWidth: 540 }}>
                The Career Clarity Fair is happening. One day. One campus in Ibadan.
                Fifteen career sectors. Three age tracks. Hands-on career discovery for every
                secondary student who walks through the door — free.
              </p>
              <p style={{ color: 'rgba(244,240,231,.55)', fontSize: '.95rem', lineHeight: 1.65, marginTop: '.85rem', maxWidth: 520 }}>
                This campaign funds the student materials, facilitators, event environment and
                impact measurement that turn the Fair from an idea into evidence.
              </p>

              <div className="hero-cta mt-l">
                <a href="#give" className="btn btn--light btn--lg">Fund the Fair {ARROW}</a>
                <a href="#event" className="btn btn--outline-light btn--lg">About the event</a>
              </div>
            </div>

            {/* Stats panel */}
            <div className="reveal" data-d="1" style={{
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 'var(--radius-lg)', padding: 'clamp(24px,4vw,36px)',
            }}>
              {[
                { num: STUDENTS_TARGET, lbl: 'Students expected', sub: 'JSS1 through SS3' },
                { num: SCHOOLS, lbl: 'Partner schools', sub: 'Ibadan, Oyo State' },
                { num: SECTORS, lbl: 'Career sectors', sub: 'Represented on the day' },
                { num: '1 day', lbl: '5 December 2026', sub: '8:00am – 5:00pm' },
              ].map(({ num, lbl, sub }, i) => (
                <div key={lbl} style={{
                  paddingBlock: 16,
                  borderBottom: i < 3 ? '1px solid rgba(255,255,255,.1)' : 'none',
                }}>
                  <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: '1.8rem', color: i % 2 === 0 ? 'var(--gold)' : '#fff', lineHeight: 1 }}>{num}</div>
                  <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, color: '#fff', fontSize: '.95rem', marginTop: 4 }}>{lbl}</div>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '.65rem', letterSpacing: '.12em', color: 'rgba(255,255,255,.45)', marginTop: 3 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      {/* ── Event overview ── */}
      <section className="section section--tight" id="event">
        <div className="wrap">
          <div className="split" style={{ gap: 'clamp(40px,6vw,80px)', alignItems: 'center' }}>
            <div className="reveal" style={{
              flex: '0 0 auto', width: 'min(100%, 480px)',
              aspectRatio: '4/3', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative',
            }}>
              <Image src="/img/community-2.jpg" alt="Students at the Career Clarity Fair" fill style={{ objectFit: 'cover' }} />
              {/* Date badge */}
              <div style={{
                position: 'absolute', bottom: 20, left: 20,
                background: 'var(--green-900)', color: '#fff',
                borderRadius: 12, padding: '14px 20px',
                fontFamily: 'var(--ff-mono)',
              }}>
                <div style={{ fontSize: '.65rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>Date confirmed</div>
                <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: '1.1rem' }}>Saturday 5 December 2026</div>
                <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.55)', marginTop: 3 }}>Ibadan, Oyo State · 8:00am – 5:00pm</div>
              </div>
            </div>

            <div className="reveal" data-d="1">
              <span className="eyebrow">The Event</span>
              <h2 className="mt-s">A career marketplace, not a careers talk.</h2>
              <p className="lead mt-m">
                The Career Clarity Fair is a full-day career discovery marketplace for secondary
                students in Ibadan. Hands-on exploration across 15+ sectors, in three age-appropriate
                tracks. Students do — they do not sit and listen.
              </p>
              <p style={{ color: 'var(--ink-60)', lineHeight: 1.65, marginTop: '1rem' }}>
                Hosted on a partner school campus, provided in-kind. Schools recruited and
                confirmed through our existing programme. Parental consent, safeguarding leads,
                and photo/video permissions already built in.
              </p>

              <div className="rgrid-2" style={{ gap: 14, marginTop: '1.75rem' }}>
                {[
                  { label: 'Design', value: '70% hands-on, 30% talks' },
                  { label: 'Age tracks', value: 'JSS1–JSS2 · JSS3 · SS1–SS3' },
                  { label: 'Entry', value: 'Free for every student' },
                  { label: 'Venue', value: 'Partner campus, Ibadan' },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: 'var(--green-50)', borderRadius: 10, padding: '12px 16px',
                  }}>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '.62rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--green-600)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: '.95rem', color: 'var(--green-800)' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1.75rem' }}>
                <Link href="/career-clarity-trade-fair" className="textlink" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  Full programme details {ARROW}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content Partnership (partner name withheld pending confirmation) ── */}
      <section className="section" style={{ background: 'var(--cream-2)' }}>
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">Featured Partnership</span>
            <h2>Career Clarity Fair × Animation Studio Partner</h2>
            <p className="lead mt-m" style={{ maxWidth: 640, marginInline: 'auto' }}>
              We are not screening their films and moving on. We have designed a multi-stage
              activation that starts with content and ends with measurable evidence of what it did.
            </p>
          </div>

          {/* Partner callout */}
          <div className="reveal rgrid-2" style={{
            background: 'var(--green-800)', borderRadius: 'var(--radius-lg)',
            padding: 'clamp(28px,5vw,48px)', marginBottom: '3rem',
            gap: 'clamp(24px,4vw,48px)',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '.7rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>
                In partnership with (name to be confirmed)
              </div>
              <h3 style={{ color: '#fff', marginBottom: 12, lineHeight: 1.05 }}>Animation Studio Partner</h3>
              <p style={{ color: 'rgba(244,240,231,.75)', lineHeight: 1.65, fontSize: '.95rem' }}>
                Our partner brings youth-focused animated storytelling to the Fair — content chosen
                to build cultural pride and self-belief. Hundreds of students. One day to understand
                what happens after they watch it.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Animated content screening with guided discussion',
                'Confidence Challenge — students name one thing they believe they can do',
                'Creative response captured and celebrated on the day',
              ].map(t => (
                <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'rgba(244,240,231,.8)', fontSize: '.9rem', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--gold)', marginTop: 3, flexShrink: 0 }}>{CHECK}</span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* 5 stages */}
          <div className="section-head mb-l reveal">
            <span className="eyebrow">Five Stages</span>
            <h2>How the day is designed.</h2>
            <p className="lead mt-m">Not a screening with a logo attached. A sequence where every stage produces evidence for the next.</p>
          </div>

          <div className="rgrid-5" style={{ gap: 12, marginBottom: 16 }}>
            {STAGES.map((s, i) => (
              <div
                key={s.n}
                className="reveal"
                data-d={String(i)}
                style={{
                  background: s.color, borderRadius: 'var(--radius)', padding: '24px 20px',
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}
              >
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: '.65rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Stage {s.n} of 5</div>
                <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: '1.3rem', color: '#fff', lineHeight: 1 }}>{s.title}</div>
                <p style={{ color: 'rgba(255,255,255,.72)', fontSize: '.82rem', lineHeight: 1.55 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="reveal" style={{
            background: 'rgba(10,33,21,.06)', border: '1px solid var(--line)',
            borderRadius: 'var(--radius)', padding: '18px 24px',
            fontStyle: 'italic', color: 'var(--ink-60)', textAlign: 'center', fontSize: '.95rem', lineHeight: 1.65,
          }}>
            "The December Fair is the entry point, not the whole partnership. Each stage produces the evidence that makes the next one possible."
          </div>
        </div>
      </section>

      {/* ── Impact what donors fund ── */}
      <section className="section section--tight">
        <div className="wrap">
          <div className="split" style={{ gap: 'clamp(40px,6vw,80px)', alignItems: 'flex-start' }}>
            <div className="reveal">
              <span className="eyebrow">Your Gift Covers</span>
              <h2 className="mt-s">The community delivery costs.</h2>
              <p className="lead mt-m">
                The core content partnership is funded separately. This campaign
                covers everything that turns one day of content into an evidence-producing,
                student-first experience.
              </p>
              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                {BUDGET_LINES.map((line, i) => (
                  <div key={line.item} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: 16, padding: '14px 20px',
                    borderBottom: i < BUDGET_LINES.length - 1 ? '1px solid var(--line)' : 'none',
                    background: i % 2 === 0 ? '#fff' : 'var(--cream)',
                  }}>
                    <span style={{ color: 'var(--ink-60)', fontSize: '.9rem', lineHeight: 1.4 }}>{line.item}</span>
                    <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 600, fontSize: '.88rem', color: 'var(--green-800)', whiteSpace: 'nowrap' }}>{line.amount}</span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: 16, padding: '16px 20px',
                  background: 'var(--green-800)',
                }}>
                  <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Total campaign target</span>
                  <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: '1.1rem', color: 'var(--gold)' }}>₦50,000,000</span>
                </div>
              </div>
            </div>

            <div className="reveal" data-d="1" style={{ flex: '0 0 auto', width: 'min(100%, 420px)' }}>
              <span className="eyebrow">The Impact</span>
              <h2 className="mt-s">What the day produces.</h2>
              <p style={{ color: 'var(--ink-60)', marginTop: '1rem', lineHeight: 1.65 }}>
                After the Fair, we publish the <strong>Career Clarity Fair Impact Snapshot</strong> —
                a report both organisations can use with funders, brands, and school
                partners.
              </p>
              <div style={{ marginTop: '1.75rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Reach', val: 'Students, schools, age groups reached' },
                  { label: 'Engagement', val: 'Screening, quiz and challenge participation rates' },
                  { label: 'Student Voice', val: 'Selected quotes and reactions, with consent' },
                  { label: 'Learning', val: 'Pre and post responses to named outcomes' },
                  { label: 'Cultural Connection', val: 'How Ibadan youth respond to Yoruba-language animation' },
                  { label: 'Next Step', val: 'Evidence that opens the Ibadan school activation pathway' },
                ].map((row, i) => (
                  <div key={row.label} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 99, flexShrink: 0,
                      background: 'var(--green-800)', color: '#fff',
                      fontFamily: 'var(--ff-mono)', fontSize: '.72rem', fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: '.9rem', color: 'var(--green-800)', marginBottom: 2 }}>{row.label}</div>
                      <div style={{ color: 'var(--ink-60)', fontSize: '.85rem', lineHeight: 1.5 }}>{row.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Donate ── */}
      <section className="section" id="give" style={{ background: 'var(--cream-2)' }}>
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">Give Now</span>
            <h2>Fund a student's day.</h2>
            <p className="lead mt-m" style={{ maxWidth: 560, marginInline: 'auto' }}>
              Nigerian supporters give via Paystack. International supporters via Stripe. Every contribution — of any size — fills a seat at the Fair.
            </p>
          </div>

          {/* Illustrative equivalents */}
          <div className="rgrid-3" style={{ gap: 12, maxWidth: 680, margin: '0 auto 2.5rem', textAlign: 'center' }}>
            {[
              { amount: '₦5,000', equiv: 'A student\'s workbook, passport & action card' },
              { amount: '₦20,000', equiv: 'All materials for four students for the full day' },
              { amount: '₦50,000', equiv: 'Sponsors one facilitator\'s transport and day rate' },
            ].map(({ amount, equiv }) => (
              <div key={amount} className="reveal" style={{
                background: '#fff', border: '1px solid var(--line)',
                borderRadius: 'var(--radius)', padding: '16px 14px',
              }}>
                <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: '1.2rem', color: 'var(--green-800)', marginBottom: 6 }}>{amount}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--ink-60)', lineHeight: 1.4 }}>{equiv}</div>
              </div>
            ))}
          </div>

          <div className="card reveal" style={{ padding: 'clamp(24px,4vw,48px)', maxWidth: 640, margin: '0 auto' }}>
            <DonateWidget />
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }} className="reveal">
            <p style={{ color: 'var(--ink-60)', marginBottom: '.75rem', fontSize: '.9rem' }}>
              Corporate sponsorships and named partnerships available.
            </p>
            <a href="mailto:director@wissenhaus.org?subject=Career Clarity Fair — Sponsorship Enquiry" className="textlink">
              Contact director@wissenhaus.org {ARROW}
            </a>
          </div>
        </div>
      </section>

      {/* ── Accountability ── */}
      <section className="section panel-dark">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow eyebrow--light">Accountability</span>
            <h2>Your money, clearly traced.</h2>
          </div>
          <div className="grid grid-3">
            {[
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
                title: 'All to the Fair',
                desc: 'Every naira and dollar raised in this Series 1 drive goes directly to the 5 December Career Clarity Fair delivery costs.',
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" /></svg>,
                title: 'Impact Snapshot',
                desc: 'After the Fair, all donors receive the Career Clarity Fair Impact Snapshot — real numbers, real student voices.',
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" /></svg>,
                title: 'Secure Payments',
                desc: 'Processed by Paystack (Nigeria) and Stripe (international) — PCI-compliant and encrypted. Payment details never stored by Wissen-Haus.',
              },
            ].map((f, i) => (
              <div key={f.title} className="feature reveal" data-d={i > 0 ? String(i) : undefined}>
                <div className="feature__ic">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section section--tight">
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">Questions</span>
            <h2>Frequently asked.</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {FAQ.map((item, i) => (
              <div
                key={item.q}
                className="reveal"
                data-d={i % 2 === 1 ? '1' : undefined}
                style={{ borderBottom: '1px solid var(--line)', paddingBlock: 24 }}
              >
                <h4 style={{ color: 'var(--green-800)', marginBottom: 10, fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3 }}>
                  {item.q}
                </h4>
                <p style={{ color: 'var(--ink-60)', lineHeight: 1.65, fontSize: '.95rem' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="section section--tight" style={{ background: 'var(--cream-2)' }}>
        <div className="wrap">
          <div className="cta-band reveal" style={{ textAlign: 'center' }}>
            <h2>5 December is {DAYS_LEFT} days away.</h2>
            <p className="lead mt-m" style={{ maxWidth: 520, marginInline: 'auto' }}>
              Every contribution buys a student a seat in the room. Help us fill the Fair and prove what Nigerian youth do when someone believes in them.
            </p>
            <div className="cta-actions mt-l">
              <a href="#give" className="btn btn--light btn--lg">Donate now {ARROW}</a>
              <Link href="/partner" className="btn btn--outline-light btn--lg">Sponsor the Fair</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
