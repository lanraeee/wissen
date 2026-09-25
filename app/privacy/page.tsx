import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy Â· Wissen-Haus',
  description: 'How Wissen-Haus Empowerment Foundation collects, uses, and protects your personal information.',
}

const LAST_UPDATED = '13 September 2026'

const TOC = [
  { id: 'who-we-are', label: 'Who We Are' },
  { id: 'information-we-collect', label: 'Information We Collect' },
  { id: 'how-we-use-it', label: 'How We Use Your Information' },
  { id: 'cookies', label: 'Cookies & Tracking' },
  { id: 'payments', label: 'Payments' },
  { id: 'emails', label: 'Email Communications' },
  { id: 'sharing', label: 'Sharing With Third Parties' },
  { id: 'retention', label: 'Data Retention' },
  { id: 'security', label: 'Data Security' },
  { id: 'children', label: "Children's Privacy" },
  { id: 'rights', label: 'Your Rights' },
  { id: 'transfers', label: 'International Data Transfers' },
  { id: 'third-party-links', label: 'Third-Party Links' },
  { id: 'changes', label: 'Changes to This Policy' },
  { id: 'contact', label: 'Contact Us' },
]

function H({ id, n, children }: { id: string; n: string; children: React.ReactNode }) {
  return (
    <h2 id={id} style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid #ddd9d0', paddingBottom: 6, marginTop: 36, color: '#0f2d1d' }}>
      {n}. {children}
    </h2>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <div style={{ background: '#fefcf5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(20px,4vw,40px)' }}>

        <div style={{ borderBottom: '2px solid #1a3c2e', paddingBottom: 12, marginBottom: 24 }}>
          <div style={{ fontSize: '.72rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 6 }}>
            Legal
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, color: '#0f2d1d', lineHeight: 1.1 }}>
            Privacy Policy
          </h1>
          <p style={{ margin: '10px 0 0', color: '#4a5a4f', fontSize: '.95rem' }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <article style={{ color: '#1a2e24', lineHeight: 1.75, fontSize: '.96rem' }}>

          <p>
            Wissen-Haus Empowerment Foundation (&ldquo;Wissen-Haus,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is a non-profit organisation founded in Ibadan, Nigeria, serving African youth, the diaspora, and international supporters. This Privacy Policy explains what personal information we collect through <strong>wissenhaus.org</strong> (the &ldquo;Site&rdquo;), how we use it, who we share it with, and the choices and rights you have.
          </p>
          <p>
            By using the Site, creating an account, submitting a form, or making a donation, you agree to the collection and use of information as described in this policy. If you do not agree, please do not use the Site.
          </p>

          <div style={{ background: '#f0ece4', border: '1px solid #ddd9d0', borderRadius: 8, padding: '16px 20px', margin: '24px 0' }}>
            <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: 10 }}>Contents</div>
            <ol style={{ margin: 0, padding: '0 0 0 18px', fontSize: '.88rem', columns: 2, columnGap: 24 }}>
              {TOC.map((t, i) => (
                <li key={t.id} style={{ marginBottom: 4, breakInside: 'avoid' }}>
                  <a href={`#${t.id}`} style={{ color: '#1a3c2e', textDecoration: 'none' }}>{i + 1}. {t.label}</a>
                </li>
              ))}
            </ol>
          </div>

          <H id="who-we-are" n="1">Who We Are</H>
          <p>
            Wissen-Haus Empowerment Foundation is headquartered in Ibadan, Oyo State, Nigeria. We are the data controller for personal information collected through the Site. For any privacy-related question, contact us at <a href="mailto:info@wissenhaus.org" style={{ color: '#1a3c2e' }}>info@wissenhaus.org</a>.
          </p>

          <H id="information-we-collect" n="2">Information We Collect</H>
          <p><strong>Account information.</strong> When you sign up for the Community Hub, we collect your first name, last name, email address, and a password (stored as a one-way hash â€” we never see or store your password itself).</p>
          <p><strong>Learning activity.</strong> If you take a course, we record which modules you have completed and issue a certificate ID when you finish. We also track a daily visit streak tied to your account.</p>
          <p><strong>Forms you submit.</strong> Our contact, volunteer, and partnership forms collect your name, email address, and the message or details you provide (e.g. your intended volunteer role, or your organisation&apos;s name).</p>
          <p><strong>Community content.</strong> Discussion threads, replies, and impact-story testimonials you choose to submit are stored and, where approved for publication, displayed publicly on the Site alongside your name and any role/title you provide.</p>
          <p><strong>Donations.</strong> When you donate, we collect your name, email address, and the amount and currency donated. We do <strong>not</strong> collect or store your card number, expiry date, or CVV â€” those are entered directly into Stripe&apos;s secure, hosted payment page and never pass through our servers. See <Link href="#payments" style={{ color: '#1a3c2e' }}>Payments</Link> below.</p>
          <p><strong>Automatically collected information.</strong> Like most websites, we automatically log some technical information when you visit: page views, the page you came from (referrer), an approximate country derived from your IP address, device/browser type, and a session identifier. We use PostHog, a product analytics tool, for this purpose.</p>
          <p><strong>Cookies.</strong> We use a small number of cookies and browser storage entries â€” see <Link href="#cookies" style={{ color: '#1a3c2e' }}>Cookies &amp; Tracking</Link>.</p>

          <H id="how-we-use-it" n="3">How We Use Your Information</H>
          <ul style={{ paddingLeft: 20 }}>
            <li>To create and maintain your account, and keep you signed in</li>
            <li>To track course progress and issue certificates</li>
            <li>To respond to contact, volunteer, and partnership enquiries</li>
            <li>To process donations, issue receipts, and maintain financial records</li>
            <li>To send transactional emails (welcome messages, confirmations, receipts) â€” see <Link href="#emails" style={{ color: '#1a3c2e' }}>Email Communications</Link></li>
            <li>To display community content you have chosen to publish (testimonials, forum posts)</li>
            <li>To understand how the Site is used, so we can improve it, using aggregated and individual analytics data</li>
            <li>To detect, investigate, and prevent fraud, abuse, or security incidents</li>
            <li>To comply with applicable law, including financial record-keeping for donations</li>
          </ul>

          <H id="cookies" n="4">Cookies &amp; Tracking</H>
          <p>We use the following categories of cookies and local storage:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Strictly necessary:</strong> an authentication cookie (<code>wh_token</code>) that keeps you signed in. This is essential for the Site to function and cannot be disabled while remaining signed in.</li>
            <li><strong>Analytics:</strong> PostHog sets cookies/local storage to distinguish visitors and measure usage. This helps us understand which pages and programmes are useful.</li>
          </ul>
          <p>You can block or delete cookies through your browser settings, though doing so may prevent you from staying signed in or may affect how some features work.</p>

          <H id="payments" n="5">Payments</H>
          <p>
            All donations are processed by <strong>Stripe, Inc.</strong>, a PCI-DSS Level 1 certified payment processor. When you donate, you are redirected to a Stripe-hosted checkout page to enter your card details directly with Stripe â€” Wissen-Haus never receives, sees, or stores your full card number, expiry date, or security code. We only receive confirmation of the payment (amount, currency, a payment reference, and the billing name/email you provided) once Stripe verifies it succeeded. Stripe&apos;s own use of your data is governed by <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#1a3c2e' }}>Stripe&apos;s Privacy Policy</a>.
          </p>

          <H id="emails" n="6">Email Communications</H>
          <p>We send transactional emails through Resend, a third-party email delivery service, including:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>A welcome email when you create an account</li>
            <li>Confirmations when you submit a contact, volunteer, or partnership form</li>
            <li>Donation receipts and internal notifications when a donation is completed</li>
          </ul>
          <p>These are transactional/operational messages tied to an action you took, not marketing newsletters. We do not currently send promotional email campaigns. If that changes, we will offer a clear opt-out on any marketing message.</p>

          <H id="sharing" n="7">Sharing With Third Parties</H>
          <p>We do not sell your personal information. We share information only with service providers who help us operate the Site, under obligations to protect it appropriately:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Stripe</strong> â€” payment processing (see <Link href="#payments" style={{ color: '#1a3c2e' }}>Payments</Link>)</li>
            <li><strong>Resend</strong> â€” transactional email delivery</li>
            <li><strong>PostHog</strong> â€” product analytics</li>
            <li><strong>Neon (PostgreSQL) and Vercel</strong> â€” database hosting and website hosting/infrastructure</li>
          </ul>
          <p>We may also disclose information where required by law, to protect the rights, property, or safety of Wissen-Haus, our users, or the public, or in connection with a merger, restructuring, or transfer of our operations (in which case we would notify affected users).</p>

          <H id="retention" n="8">Data Retention</H>
          <p>
            We retain account and learning-activity data for as long as your account is active, and donation records for as long as required for financial and tax record-keeping purposes. You may request deletion of your account at any time (see <Link href="#rights" style={{ color: '#1a3c2e' }}>Your Rights</Link>); we will delete or anonymise personal information that we are not legally required to retain.
          </p>

          <H id="security" n="9">Data Security</H>
          <p>
            We use industry-standard measures to protect your information, including encrypted connections (HTTPS), hashed passwords, and access controls on our administrative systems. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
          </p>

          <H id="children" n="10">Children&#39;s Privacy</H>
          <p>
            Many of our programmes â€” including the Career Clarity Fair and career-guidance content â€” are designed for secondary school students, some of whom are minors under the age of 18. Our Community Hub account creation is intended for users capable of consenting to these terms in their jurisdiction; where local law requires parental or guardian consent for a minor to create an account, that consent must be obtained before signing up. We do not knowingly collect more personal information from a child than is necessary to provide our services, and we do not use children&apos;s information for third-party advertising. A parent or guardian who believes their child has provided personal information without appropriate consent may contact us at <a href="mailto:info@wissenhaus.org" style={{ color: '#1a3c2e' }}>info@wissenhaus.org</a> to request its removal.
          </p>

          <H id="rights" n="11">Your Rights</H>
          <p>Depending on where you live, you may have rights to:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to or restrict certain processing</li>
            <li>Request a copy of your data in a portable format</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
          <p>
            To exercise any of these rights, email <a href="mailto:info@wissenhaus.org" style={{ color: '#1a3c2e' }}>info@wissenhaus.org</a>. We will respond within a reasonable time and in accordance with applicable law, including Nigeria&apos;s Data Protection Act 2023 and, where applicable to visitors from those regions, the UK and EU General Data Protection Regulation.
          </p>

          <H id="transfers" n="12">International Data Transfers</H>
          <p>
            We are based in Nigeria and serve users across Africa, the diaspora, and internationally. Our service providers (including Stripe, Resend, PostHog, Neon, and Vercel) may process and store data in the United States, the European Union, the United Kingdom, or elsewhere. By using the Site, you understand that your information may be transferred to and processed in countries other than your own, which may have different data protection laws.
          </p>

          <H id="third-party-links" n="13">Third-Party Links</H>
          <p>
            The Site links to third-party content such as our Instagram and LinkedIn pages, external scholarship and job listings, and embedded Instagram reels. We are not responsible for the privacy practices of these third parties â€” please review their own privacy policies.
          </p>

          <H id="changes" n="14">Changes to This Policy</H>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be reflected by updating the &ldquo;Last updated&rdquo; date above. Continued use of the Site after changes take effect constitutes acceptance of the revised policy.
          </p>

          <H id="contact" n="15">Contact Us</H>
          <p>
            Questions about this Privacy Policy or your personal information can be sent to <a href="mailto:info@wissenhaus.org" style={{ color: '#1a3c2e' }}>info@wissenhaus.org</a>, or by post to Wissen-Haus Empowerment Foundation, Ibadan, Oyo State, Nigeria.
          </p>

          <div style={{ marginTop: 40, background: '#f0ece4', borderLeft: '4px solid #1a3c2e', borderRadius: '0 8px 8px 0', padding: '14px 18px', fontSize: '.85rem', color: '#4a5a4f' }}>
            See also our <Link href="/terms" style={{ color: '#1a3c2e' }}>Terms &amp; Conditions</Link>.
          </div>
        </article>
      </div>
    </div>
  )
}
