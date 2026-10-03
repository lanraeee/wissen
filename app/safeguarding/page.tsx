import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import Link from 'next/link'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getOgCopy(ogSchemaFor('safeguarding')!))
}

const LAST_UPDATED = '3 October 2026'
const NEXT_REVIEW = 'October 2027'
const CONTACT_EMAIL = 'wissenhaus@outlook.com'

const TOC = [
  { id: 'statement', label: 'Our Commitment' },
  { id: 'scope', label: 'Who This Policy Applies To' },
  { id: 'definitions', label: 'What We Mean by Safeguarding' },
  { id: 'principles', label: 'Our Principles' },
  { id: 'responsibilities', label: 'Who Is Responsible' },
  { id: 'recruitment', label: 'Safer Recruitment & Vetting' },
  { id: 'conduct', label: 'Code of Conduct' },
  { id: 'mentoring', label: 'Mentoring & One-to-One Contact' },
  { id: 'events', label: 'Events, Fairs & Workshops' },
  { id: 'online', label: 'Online Safety' },
  { id: 'images', label: 'Photographs, Video & Consent' },
  { id: 'consent', label: 'Young People, Parents & Guardians' },
  { id: 'concerns', label: 'Raising a Concern' },
  { id: 'response', label: 'How We Respond' },
  { id: 'allegations', label: 'Allegations Against Staff & Volunteers' },
  { id: 'partners', label: 'Partners & Working Overseas' },
  { id: 'confidentiality', label: 'Confidentiality & Records' },
  { id: 'training', label: 'Training' },
  { id: 'review', label: 'Governance & Review' },
]

function H({ id, n, children }: { id: string; n: string; children: React.ReactNode }) {
  return (
    <h2 id={id} style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid #ddd9d0', paddingBottom: 6, marginTop: 36, color: '#0f2d1d', scrollMarginTop: 90 }}>
      {n}. {children}
    </h2>
  )
}

const link = { color: '#1a3c2e' }

export default function SafeguardingPage() {
  return (
    <div style={{ background: '#fefcf5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(20px,4vw,40px)' }}>

        <div style={{ borderBottom: '2px solid #1a3c2e', paddingBottom: 12, marginBottom: 24 }}>
          <div style={{ fontSize: '.72rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a9a8f', marginBottom: 6 }}>
            Policy
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, color: '#0f2d1d', lineHeight: 1.1 }}>
            Safeguarding Policy
          </h1>
          <p style={{ margin: '10px 0 0', color: '#4a5a4f', fontSize: '.95rem' }}>
            Version 1.0 &middot; Last updated: {LAST_UPDATED} &middot; Next review: {NEXT_REVIEW}
          </p>
        </div>

        <article style={{ color: '#1a2e24', lineHeight: 1.75, fontSize: '.96rem' }}>

          <p>
            Wissen Haus Empowerment Foundation (&ldquo;Wissen-Haus&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) works with young people in Nigeria, Ghana, Kenya, South Africa and diaspora communities, including students under 18. This policy explains how we keep the children, young people and adults we work with safe, and what everyone connected with Wissen-Haus must do if they have a concern.
          </p>

          <div style={{ background: '#fff4f2', border: '1px solid #f0c9c2', borderRadius: 8, padding: '14px 18px', margin: '24px 0', fontSize: '.92rem' }}>
            <strong>If someone is in immediate danger, contact your local emergency services first</strong> (for example 999 in the UK or the emergency number in your country), then tell us as soon as it is safe to do so. In the UK you can also call the NSPCC helpline on 0808 800 5000 or Childline on 0800 1111.
          </div>

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

          <H id="statement" n="1">Our Commitment</H>
          <p>
            Every child and young person has the right to be safe and to be treated with respect. We believe that harm to anyone we work with is never acceptable, that nothing we do is more important than their welfare, and that all concerns will be taken seriously and acted on. We will not tolerate abuse, exploitation, bullying or harassment by anyone connected with Wissen-Haus.
          </p>
          <p>
            Our trustees carry the legal duty to protect everyone who comes into contact with the charity. This policy reflects that duty and the Charity Commission&apos;s guidance on safeguarding, and it sits alongside our <Link href="/privacy" style={link}>Privacy Policy</Link> and <Link href="/terms" style={link}>Terms &amp; Conditions</Link>.
          </p>

          <H id="scope" n="2">Who This Policy Applies To</H>
          <p>It applies to everyone acting for or with Wissen-Haus, in any country and in person or online:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>trustees, employees and contractors;</li>
            <li>volunteers, mentors, speakers, trainers and event helpers;</li>
            <li>partner organisations, schools and anyone delivering activity on our behalf; and</li>
            <li>moderators and administrators of our website, community hub and support channels.</li>
          </ul>
          <p>
            It covers all our activity: career fairs, workshops, mentoring, courses, the community hub and discussion forum, live chat and support, events and cafés, research and the website.
          </p>

          <H id="definitions" n="3">What We Mean by Safeguarding</H>
          <p>
            A <strong>child</strong> is anyone under 18. An <strong>adult at risk</strong> is someone aged 18 or over who may need support because of their circumstances and who cannot protect themselves from harm or exploitation. Safeguarding means protecting people from harm, preventing abuse and neglect, and responding properly when something goes wrong.
          </p>
          <p>Harm can take many forms, including:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Physical, emotional and sexual abuse</strong>, and neglect;</li>
            <li><strong>Exploitation</strong>, including sexual exploitation, trafficking, forced labour and grooming;</li>
            <li><strong>Online harm</strong>, including cyberbullying, unwanted contact, sharing of images and exposure to harmful content;</li>
            <li><strong>Financial and employment scams</strong> aimed at young people, such as fake jobs, scholarships or fees. Because we list opportunities, we take particular care here;</li>
            <li><strong>Bullying, harassment and discrimination</strong>; and</li>
            <li><strong>Abuse of trust or position</strong> by a volunteer, mentor or member of staff.</li>
          </ul>

          <H id="principles" n="4">Our Principles</H>
          <ul style={{ paddingLeft: 20 }}>
            <li>The welfare of the child or adult at risk comes first.</li>
            <li>Everyone has an equal right to protection, regardless of age, disability, gender, race, religion, belief, sexual orientation or background.</li>
            <li>Safeguarding is everyone&apos;s responsibility. Anyone can raise a concern, and no one will be penalised for doing so in good faith.</li>
            <li>We work in the open and keep adults&apos; contact with young people transparent and appropriate.</li>
            <li>We follow the law of every country we work in, and where local requirements are lower than this policy, we apply this policy.</li>
          </ul>

          <H id="responsibilities" n="5">Who Is Responsible</H>
          <p>
            <strong>Trustees</strong> hold overall responsibility. They adopt this policy, make sure it is followed and resourced, appoint a named trustee to lead on safeguarding, and review it at least once a year.
          </p>
          <p>
            The <strong>Designated Safeguarding Lead (DSL)</strong> and a <strong>Deputy DSL</strong> are appointed by the trustees. The DSL receives and records concerns, decides what action to take, makes referrals to statutory agencies, advises colleagues, and reports to the trustees. Their names and contact details are given to every trustee, volunteer, mentor and partner at induction and are available on request through our <Link href="/contact" style={link}>contact page</Link>.
          </p>
          <p>
            <strong>Everyone connected with Wissen-Haus</strong> must read and follow this policy, complete the training that goes with their role, and report any concern immediately.
          </p>

          <H id="recruitment" n="6">Safer Recruitment &amp; Vetting</H>
          <p>Before anyone works with young people on our behalf, we will:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>use a written role description and an application or conversation that includes questions about suitability to work with young people;</li>
            <li>take up at least two references and check identity;</li>
            <li>for roles in the UK that are eligible, carry out an <strong>enhanced DBS check</strong>, and for roles elsewhere obtain the nearest local equivalent (for example a police clearance or character certificate) where available, together with references;</li>
            <li>ask the person to sign our code of conduct; and</li>
            <li>give a safeguarding induction before they have any contact with young people.</li>
          </ul>
          <p>
            Nobody is given unsupervised access to young people until these steps are complete. We keep a record that they were done.
          </p>

          <H id="conduct" n="7">Code of Conduct</H>
          <p><strong>We will:</strong></p>
          <ul style={{ paddingLeft: 20 }}>
            <li>treat everyone with respect, dignity and fairness;</li>
            <li>keep to professional boundaries and communicate openly and in public or monitored spaces where possible;</li>
            <li>listen to young people, take what they say seriously and never promise to keep a safeguarding concern secret;</li>
            <li>report concerns, and any breach of this policy, straight away; and</li>
            <li>be a positive example, with appropriate language and behaviour at all times.</li>
          </ul>
          <p><strong>We will never:</strong></p>
          <ul style={{ paddingLeft: 20 }}>
            <li>hit, threaten, belittle, humiliate or discriminate against anyone;</li>
            <li>have a sexual or romantic relationship with, or make sexual comments to, a young person we work with;</li>
            <li>ask a young person for money, gifts or favours, or give gifts that could be seen as grooming or favouritism;</li>
            <li>share personal contact details privately with a young person or arrange to meet them outside our activities;</li>
            <li>use alcohol or drugs while working with young people; or</li>
            <li>take or share images of a young person without proper consent.</li>
          </ul>

          <H id="mentoring" n="8">Mentoring &amp; One-to-One Contact</H>
          <ul style={{ paddingLeft: 20 }}>
            <li>Mentoring takes place on platforms and channels approved by Wissen-Haus, not through personal social-media or messaging accounts.</li>
            <li>Mentors do not have private, unrecorded one-to-one contact with anyone under 18. Sessions with under-18s are held with a second adult present or able to see the session, or are recorded with consent and the recording is kept securely.</li>
            <li>Meetings are scheduled in advance through Wissen-Haus, at reasonable hours, and in public or monitored settings.</li>
            <li>Mentors report any request for private contact, gifts or secrecy from a young person to the DSL.</li>
            <li>Mentoring relationships are reviewed regularly, and a mentor can be withdrawn at any time.</li>
          </ul>

          <H id="events" n="9">Events, Fairs &amp; Workshops</H>
          <ul style={{ paddingLeft: 20 }}>
            <li>For school events, we agree responsibilities with the school beforehand. The school remains responsible for its students&apos; supervision, and a school staff member is present throughout.</li>
            <li>We carry out a risk assessment for every event, in person or online, and maintain suitable adult-to-young-person ratios.</li>
            <li>Attendance is recorded, and young people are told who to speak to if they have a concern.</li>
            <li>Under-18s are never left alone with an adult who is not cleared to work with them.</li>
            <li>First aid, emergency contacts and an incident log are in place for each event.</li>
          </ul>

          <H id="online" n="10">Online Safety</H>
          <p>Much of our work is online, so we apply the same standards to digital spaces:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>The <Link href="/community" style={link}>community hub</Link>, discussion threads and live chat are moderated. Content that is abusive, sexual, exploitative or unsafe is removed and may be reported to the authorities.</li>
            <li>We ask users not to share personal contact details, home addresses or financial information in public posts.</li>
            <li>Staff, volunteers and mentors never contact young people through private channels outside approved Wissen-Haus systems.</li>
            <li>We check the opportunities we list and remove those that look fraudulent or ask applicants for payment. Please report any listing that worries you.</li>
            <li>Young people can report online concerns using the contact route in section 12.</li>
          </ul>
          <p>
            Personal data is handled in line with our <Link href="/privacy" style={link}>Privacy Policy</Link> and applicable data protection law.
          </p>

          <H id="images" n="11">Photographs, Video &amp; Consent</H>
          <p>
            We take and publish photographs, video and testimonials only with informed consent. For anyone under 18, consent must come from a parent or guardian as well as the young person. We do not publish a young person&apos;s full name together with an identifiable photograph, home address, school or other details that could be used to find them. Anyone can withdraw consent at any time by contacting us, and we will remove the material wherever we are able.
          </p>

          <H id="consent" n="12">Young People, Parents &amp; Guardians</H>
          <p>
            Many of our programmes are designed for secondary school students. Where someone is under the age of majority in their country, they should take part with the knowledge and consent of a parent, guardian or school. We tell parents and guardians what we do, who is working with their child, and how to raise a concern, and we make this policy available to them on request.
          </p>

          <H id="concerns" n="13">Raising a Concern</H>
          <p>Anyone, whether a young person, parent, volunteer, partner or member of the public, can raise a safeguarding concern. You can:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>email <a href={`mailto:${CONTACT_EMAIL}?subject=Safeguarding%20concern`} style={link}>{CONTACT_EMAIL}</a> with the subject &ldquo;Safeguarding concern&rdquo;; or</li>
            <li>use our <Link href="/contact" style={link}>contact page</Link>, marking your message &ldquo;Safeguarding&rdquo;, or open a <Link href="/support" style={link}>support ticket</Link>.</li>
          </ul>
          <p>
            Please include what happened, who was involved, when and where, and how to reach you. You do not need to be certain: if something worries you, tell us. You can report anonymously, though we may be less able to follow up. Reports are read by the DSL, not by general staff.
          </p>

          <H id="response" n="14">How We Respond</H>
          <ol style={{ paddingLeft: 20 }}>
            <li><strong>Make the person safe.</strong> If anyone is in immediate danger, call the emergency services.</li>
            <li><strong>Listen, reassure and record.</strong> Do not question or investigate. Write down exactly what was said or seen, with the date and time, and pass it to the DSL the same day.</li>
            <li><strong>The DSL assesses the concern</strong> and decides whether it needs referral. Serious concerns are referred without delay to the right statutory agency: the local authority children&apos;s services or police in the UK, or the relevant child-protection authority or police in the country concerned.</li>
            <li><strong>Support.</strong> We keep in touch with the young person and their family where appropriate and signpost help.</li>
            <li><strong>Learn.</strong> The DSL records the outcome and reports to the trustees, and we change our practice where needed.</li>
          </ol>
          <p>
            Where an incident is serious, the trustees will report it to the Charity Commission as a serious incident, and to any other regulator or funder that requires it.
          </p>

          <H id="allegations" n="15">Allegations Against Staff &amp; Volunteers</H>
          <p>
            Any allegation or concern about the behaviour of a trustee, employee, volunteer, mentor or partner is reported straight to the DSL (or, if it concerns the DSL, to the safeguarding trustee). The person is removed from contact with young people while the matter is looked into, and the allegation is referred to the appropriate authority, including the local authority designated officer in the UK, and the police where a crime may have been committed. We do not investigate criminal matters ourselves. Appropriate action, including ending a relationship with Wissen-Haus and making a report to the relevant barring authority, will be taken where warranted.
          </p>
          <p>
            Anyone who raises a concern about a colleague in good faith is protected from retaliation. Please see section 13 for how to report.
          </p>

          <H id="partners" n="16">Partners &amp; Working Overseas</H>
          <ul style={{ paddingLeft: 20 }}>
            <li>We carry out safeguarding checks on partners, schools and delivery agents before we work with them, and we record the outcome.</li>
            <li>Partnership agreements require partners to have, or adopt, safeguarding arrangements at least equal to this policy and to report concerns to us promptly.</li>
            <li>We follow the child-protection law of each country in which we work, and report to the authorities there as well as in the UK where required.</li>
            <li>Local volunteers and mentors receive the same vetting, induction and training as everyone else, adapted to local context and language.</li>
          </ul>

          <H id="confidentiality" n="17">Confidentiality &amp; Records</H>
          <p>
            Safeguarding information is shared only with those who need to know in order to protect someone, and never promised to be kept secret from the DSL or statutory agencies. Records are factual, dated, stored securely with restricted access, and kept only as long as necessary, in line with data protection law. Where sharing information is needed to protect a person from harm, we will do so even without consent.
          </p>

          <H id="training" n="18">Training</H>
          <p>
            Everyone receives a safeguarding induction suited to their role and refresher training at least every two years. The DSL and Deputy complete additional training and refresh it regularly. Trustees receive safeguarding training as part of their induction. We record who has been trained and when.
          </p>

          <H id="review" n="19">Governance &amp; Review</H>
          <p>
            The trustees review this policy at least annually, and sooner after a serious incident, a change in the law or a significant change in our activities. They receive a safeguarding report at every trustee meeting. This policy is available to the public on this page and to anyone who asks.
          </p>
          <p style={{ fontSize: '.88rem', color: '#4a5a4f' }}>
            Related UK guidance: the Charities Act 2011, the Children Act 1989, the Safeguarding Vulnerable Groups Act 2006, the Protection of Freedoms Act 2012, the Data Protection Act 2018 and the Charity Commission&apos;s safeguarding guidance for charities and trustees.
          </p>

          <div style={{ marginTop: 40, background: '#f0ece4', borderLeft: '4px solid #1a3c2e', borderRadius: '0 8px 8px 0', padding: '14px 18px', fontSize: '.85rem', color: '#4a5a4f' }}>
            See also our <Link href="/privacy" style={link}>Privacy Policy</Link> and <Link href="/terms" style={link}>Terms &amp; Conditions</Link>. Worried about someone? <Link href="/contact" style={link}>Contact us</Link>.
          </div>
        </article>
      </div>
    </div>
  )
}
