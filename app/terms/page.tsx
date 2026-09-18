import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms & Conditions of Use · Wissen-Haus',
  description: 'The terms and conditions governing your use of the Wissen-Haus Youth Empowerment Foundation website and programmes.',
}

const LAST_UPDATED = '13 September 2026'

const TOC = [
  { id: 'acceptance', label: 'Acceptance of Terms' },
  { id: 'about-us', label: 'About Wissen-Haus' },
  { id: 'eligibility', label: 'Eligibility & Accounts' },
  { id: 'acceptable-use', label: 'Acceptable Use' },
  { id: 'user-content', label: 'User-Generated Content' },
  { id: 'courses', label: 'Courses & Certificates' },
  { id: 'donations', label: 'Donations' },
  { id: 'opportunities', label: 'Third-Party Opportunity Listings' },
  { id: 'ip', label: 'Intellectual Property' },
  { id: 'third-party', label: 'Third-Party Services' },
  { id: 'disclaimers', label: 'Disclaimers' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'indemnity', label: 'Indemnification' },
  { id: 'termination', label: 'Termination' },
  { id: 'law', label: 'Governing Law' },
  { id: 'changes', label: 'Changes to These Terms' },
  { id: 'contact', label: 'Contact Us' },
]

function H({ id, n, children }: { id: string; n: string; children: React.ReactNode }) {
  return (
    <h2 id={id} style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid #ddd9d0', paddingBottom: 6, marginTop: 36, color: '#0f2d1d' }}>
      {n}. {children}
    </h2>
  )
}

export default function TermsPage() {
  return (
    <div style={{ background: '#fefcf5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(20px,4vw,40px)' }}>

        <div style={{ borderBottom: '2px solid #1a3c2e', paddingBottom: 12, marginBottom: 24 }}>
          <div style={{ fontSize: '.72rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 6 }}>
            Legal
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, color: '#0f2d1d', lineHeight: 1.1 }}>
            Terms &amp; Conditions of Use
          </h1>
          <p style={{ margin: '10px 0 0', color: '#4a5a4f', fontSize: '.95rem' }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <article style={{ color: '#1a2e24', lineHeight: 1.75, fontSize: '.96rem' }}>

          <p>
            These Terms &amp; Conditions of Use (&ldquo;Terms&rdquo;) govern your access to and use of <strong>wissenhaus.org</strong> (the &ldquo;Site&rdquo;), operated by Wissen-Haus Youth Empowerment Foundation (&ldquo;Wissen-Haus,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), a non-profit organisation founded in Ibadan, Nigeria. By accessing or using the Site, creating an account, submitting a form, or making a donation, you agree to be bound by these Terms. If you do not agree, please do not use the Site.
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

          <H id="acceptance" n="1">Acceptance of Terms</H>
          <p>
            By using the Site in any way, you confirm that you have read, understood, and agree to these Terms and our <Link href="/privacy" style={{ color: '#1a3c2e' }}>Privacy Policy</Link>, which is incorporated into these Terms by reference.
          </p>

          <H id="about-us" n="2">About Wissen-Haus</H>
          <p>
            Wissen-Haus Youth Empowerment Foundation is a non-profit organisation dedicated to bridging the skills gap for African youth and the diaspora through career guidance, mentorship, courses, community programmes, and events such as the Career Clarity Fair. Nothing on the Site should be understood as a guarantee of any particular career, financial, or educational outcome.
          </p>

          <H id="eligibility" n="3">Eligibility &amp; Accounts</H>
          <p>
            Many of our programmes are designed for secondary school students and young people, some of whom are minors. Where you are under the age of majority in your jurisdiction, you should only create an account with the involvement or consent of a parent or guardian, in accordance with our <Link href="/privacy#children" style={{ color: '#1a3c2e' }}>Privacy Policy</Link>.
          </p>
          <p>When you create an account, you agree to:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Provide accurate, current, and complete information</li>
            <li>Keep your login credentials confidential and secure</li>
            <li>Notify us promptly of any unauthorised use of your account</li>
            <li>Accept responsibility for all activity that occurs under your account</li>
          </ul>
          <p>We may suspend or terminate accounts that violate these Terms, at our discretion.</p>

          <H id="acceptable-use" n="4">Acceptable Use</H>
          <p>When using the Site, you agree not to:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Post or transmit content that is unlawful, harassing, defamatory, obscene, or discriminatory</li>
            <li>Impersonate any person or misrepresent your affiliation with any person or entity</li>
            <li>Attempt to gain unauthorised access to any part of the Site, other accounts, or our systems</li>
            <li>Scrape, data-mine, or systematically extract content from the Site without our written permission</li>
            <li>Upload viruses, malware, or any code intended to disrupt the Site</li>
            <li>Use the Site for any fraudulent or illegal purpose, including money laundering through the donation system</li>
          </ul>

          <H id="user-content" n="5">User-Generated Content</H>
          <p>
            Discussion threads, replies, and impact-story testimonials you submit (&ldquo;User Content&rdquo;) remain yours. By submitting User Content, you grant Wissen-Haus a non-exclusive, worldwide, royalty-free licence to display, reproduce, and distribute it on the Site and in our promotional materials (for example, a testimonial you submit and we approve may appear on our homepage). You are solely responsible for your User Content and confirm you have the right to share it. We may remove or decline to publish any User Content at our discretion, including testimonials submitted for moderation that we choose not to approve.
          </p>

          <H id="courses" n="6">Courses &amp; Certificates</H>
          <p>
            Our free courses and the certificates issued on completion are provided for educational and skills-development purposes. They are not accredited academic qualifications unless expressly stated, and completion does not guarantee employment, admission, or any specific outcome. Certificates are issued based on self-reported module completion within the platform.
          </p>

          <H id="donations" n="7">Donations</H>
          <p>
            Donations made through the Site are voluntary contributions to support our programmes. All payments are processed securely by Stripe; see our <Link href="/privacy#payments" style={{ color: '#1a3c2e' }}>Privacy Policy</Link> for details. Donations are generally non-refundable except where required by law or at our discretion in cases of processing error. Wissen-Haus retains discretion over how donated funds are allocated across our programmes in furtherance of our charitable mission, consistent with any specific campaign purpose stated at the time of donation.
          </p>

          <H id="opportunities" n="8">Third-Party Opportunity Listings</H>
          <p>
            Our Opportunity Hub aggregates scholarships, internships, jobs, and grants from third-party sources for informational convenience. We do not independently verify every listing, are not a party to any application or agreement you enter into with a third party, and are not responsible for the accuracy, legitimacy, or outcome of any listing. Always exercise your own judgement and due diligence before applying or providing personal information to a third party.
          </p>

          <H id="ip" n="9">Intellectual Property</H>
          <p>
            The Site&apos;s design, text, graphics, logos, and the Wissen-Haus name and branding are the property of Wissen-Haus Youth Empowerment Foundation and protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works from Site content without our prior written consent, except as permitted for personal, non-commercial use (e.g. sharing a link, or a certificate you have earned).
          </p>

          <H id="third-party" n="10">Third-Party Services</H>
          <p>
            The Site relies on third-party services including Stripe (payments), Resend (email), PostHog (analytics), and hosting/database providers. Your use of features that rely on these services is also subject to those providers&apos; own terms.
          </p>

          <H id="disclaimers" n="11">Disclaimers</H>
          <p>
            The Site and all content are provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose, non-infringement, or that the Site will be uninterrupted, secure, or error-free. Career guidance, salary information, and opportunity listings are provided for general informational purposes and should not be treated as professional, financial, or legal advice.
          </p>

          <H id="liability" n="12">Limitation of Liability</H>
          <p>
            To the fullest extent permitted by law, Wissen-Haus and its directors, staff, and volunteers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of income, opportunity, or data, arising out of or related to your use of the Site, even if advised of the possibility of such damages. Our total liability for any claim arising from your use of the Site shall not exceed the greater of the amount you paid us (if any) in the twelve months preceding the claim, or an amount consistent with what is reasonable for a non-profit organisation of our size.
          </p>

          <H id="indemnity" n="13">Indemnification</H>
          <p>
            You agree to indemnify and hold harmless Wissen-Haus, its directors, staff, and volunteers from any claims, damages, losses, or expenses (including reasonable legal fees) arising from your violation of these Terms, your User Content, or your misuse of the Site.
          </p>

          <H id="termination" n="14">Termination</H>
          <p>
            We may suspend or terminate your access to the Site or your account at any time, with or without notice, for conduct that we believe violates these Terms or is otherwise harmful to other users, us, or third parties. You may stop using the Site or request deletion of your account at any time by contacting us.
          </p>

          <H id="law" n="15">Governing Law</H>
          <p>
            These Terms are governed by the laws of the Federal Republic of Nigeria, without regard to conflict-of-law principles, and any dispute arising from these Terms or your use of the Site shall be subject to the exclusive jurisdiction of the courts of Nigeria. This does not remove any statutory protections you may be entitled to under the mandatory consumer-protection laws of your own country of residence, where applicable.
          </p>

          <H id="changes" n="16">Changes to These Terms</H>
          <p>
            We may update these Terms from time to time. Material changes will be reflected by updating the &ldquo;Last updated&rdquo; date above. Continued use of the Site after changes take effect constitutes acceptance of the revised Terms.
          </p>

          <H id="contact" n="17">Contact Us</H>
          <p>
            Questions about these Terms can be sent to <a href="mailto:info@wissenhaus.org" style={{ color: '#1a3c2e' }}>info@wissenhaus.org</a>, or by post to Wissen-Haus Youth Empowerment Foundation, Ibadan, Oyo State, Nigeria.
          </p>

          <div style={{ marginTop: 40, background: '#f0ece4', borderLeft: '4px solid #1a3c2e', borderRadius: '0 8px 8px 0', padding: '14px 18px', fontSize: '.85rem', color: '#4a5a4f' }}>
            See also our <Link href="/privacy" style={{ color: '#1a3c2e' }}>Privacy Policy</Link>.
          </div>
        </article>
      </div>
    </div>
  )
}
