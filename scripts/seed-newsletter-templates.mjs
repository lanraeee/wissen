// One-time (idempotent) seed of starter newsletter templates, so the admin
// newsletter editor (/admin/newsletter?tab=templates) isn't a blank slate.
// `body` is the INNER content only -- sendNewsletterEmail() wraps it in
// shell() and appends the unsubscribe footer itself, so templates never
// need to write either of those. Uses the same CSS classes shell() ships
// (.badge, .btn, .field, .divider) so these render consistently with every
// other email in the app.
//
// Run with: node --env-file=.env.local scripts/seed-newsletter-templates.mjs
import { neon } from '@neondatabase/serverless'

const SITE = 'https://www.wissenhaus.org'
const btn = (href, label) => `<a href="${href}" class="btn">${label} →</a>`

const TEMPLATES = [
  {
    name: 'Welcome — New Subscriber',
    subject: 'Welcome to Wissen-Haus',
    body: `<h2>Welcome — glad you're here.</h2>
<p>You're now part of a community working toward one goal: equipping African youth and the diaspora with the guidance, mentorship, and opportunities they need for real economic independence.</p>
<p>Here's where to start:</p>
<ul>
  <li>Explore our <a href="${SITE}/programmes">programmes</a></li>
  <li>Browse open <a href="${SITE}/community?tab=all#opportunities">scholarships, jobs & grants</a></li>
  <li>Read real <a href="${SITE}/impact-content">impact stories</a> from people we've worked with</li>
</ul>
${btn(`${SITE}/community`, 'Visit the Community Hub')}`,
  },
  {
    name: 'Monthly Impact Update',
    subject: 'This month at Wissen-Haus',
    body: `<span class="badge">Monthly Update</span>
<h2>Here's what your support made possible this month.</h2>
<p>[Summarize this month's numbers: students reached, mentors matched, opportunities posted, events held.]</p>
<div class="field"><div class="k">Students Reached</div><div class="v">[number]</div></div>
<div class="field"><div class="k">Opportunities Shared</div><div class="v">[number]</div></div>
<div class="field"><div class="k">Mentorship Sessions</div><div class="v">[number]</div></div>
<p>None of this happens without people like you paying attention and showing up.</p>
${btn(`${SITE}/impact`, 'See the full impact report')}`,
  },
  {
    name: 'Donation Appeal — General',
    subject: 'Help us reach more young people',
    body: `<h2>A small gift goes further than you'd think.</h2>
<p>Every donation to Wissen-Haus funds mentorship, career guidance, and real opportunities for young people who are ready to work but short on access.</p>
<p>Whether it's ₦5,000 or ₦50,000, your gift directly funds the next career fair, the next scholarship match, the next mentoring session.</p>
${btn(`${SITE}/donate`, 'Make a gift today')}`,
  },
  {
    name: 'Donation Appeal — Urgent / Deadline',
    subject: "We're close — but we need your help before [date]",
    body: `<span class="badge">Time-Sensitive</span>
<h2>We're [X]% of the way there.</h2>
<p>[Campaign name] closes on [date], and we still need [amount] to make it happen. If you've been meaning to give, this is the moment — every gift between now and the deadline moves us closer.</p>
${btn(`${SITE}/donate`, 'Give before the deadline')}
<p style="font-size:.85rem;color:#8a9a8f">Already given? Thank you — forward this to someone who might want to be part of it too.</p>`,
  },
  {
    name: 'Volunteer Recruitment',
    subject: 'We need people like you',
    body: `<h2>Got an hour a week? We could use it.</h2>
<p>We're looking for volunteers to help with mentoring, content creation, operations, and technical support. No huge time commitment required — just consistency.</p>
<ul>
  <li>Mentoring — share your career experience with someone starting out</li>
  <li>Content Creation — help tell our impact stories</li>
  <li>Technical Training — teach a skill that opens doors</li>
</ul>
${btn(`${SITE}/volunteer`, 'See open roles')}`,
  },
  {
    name: 'Corporate Partnership Invitation',
    subject: 'Partner with Wissen-Haus',
    body: `<h2>Your company could change how young people see their future.</h2>
<p>We partner with companies and schools to deliver mentorship, internships, and career exposure to African youth and the diaspora. If your organisation is looking for a meaningful way to invest in the next generation of talent, we'd like to talk.</p>
${btn(`${SITE}/partner`, 'Explore partnership models')}`,
  },
  {
    name: 'Event Invitation — Career Clarity Fair',
    subject: "You're invited: Career Clarity Fair",
    body: `<span class="badge">Event</span>
<h2>Career Clarity Fair — [date]</h2>
<p>A free event for secondary school students to explore career paths, meet professionals, and get a personalised roadmap for what's next.</p>
<div class="field"><div class="k">Date</div><div class="v">[date]</div></div>
<div class="field"><div class="k">Location</div><div class="v">[location]</div></div>
${btn(`${SITE}/career-clarity-fair`, 'Register now')}`,
  },
  {
    name: 'Event Follow-Up / Thank You',
    subject: 'Thank you for being part of [event name]',
    body: `<h2>Thank you for showing up.</h2>
<p>[Event name] wouldn't have been possible without everyone who attended, volunteered, and spoke. A few highlights:</p>
<ul>
  <li>[highlight 1]</li>
  <li>[highlight 2]</li>
  <li>[highlight 3]</li>
</ul>
<p>Keep an eye out — our next event is coming soon.</p>
${btn(`${SITE}/events`, "See what's next")}`,
  },
  {
    name: 'Scholarship / Opportunity Announcement',
    subject: 'New scholarship opportunity — apply now',
    body: `<span class="badge">New Opportunity</span>
<h2>[Scholarship / programme name]</h2>
<p>[One or two sentences on who it's for and what it covers.]</p>
<div class="field"><div class="k">Deadline</div><div class="v">[date]</div></div>
<div class="field"><div class="k">Eligibility</div><div class="v">[who can apply]</div></div>
${btn(`${SITE}/community?tab=scholarships#opportunities`, 'View & apply')}`,
  },
  {
    name: 'New Course / Programme Launch',
    subject: 'Just launched: [programme name]',
    body: `<h2>Something new just landed.</h2>
<p>We just opened [programme/course name] — [one-line description of what it teaches and who it's for].</p>
${btn(`${SITE}/programmes`, 'Explore the programme')}`,
  },
  {
    name: 'Success Story / Testimonial Spotlight',
    subject: "[Name]'s story: from [starting point] to [outcome]",
    body: `<span class="badge">Impact Story</span>
<h2>"[Short, powerful quote from the testimonial]"</h2>
<p>[2-3 paragraph version of their story: where they started, what Wissen-Haus helped with, where they are now.]</p>
<p style="font-weight:700">— [Name], [role/title]</p>
${btn(`${SITE}/impact-content`, 'Read more stories like this')}`,
  },
  {
    name: 'Year-End Giving Appeal',
    subject: 'Before the year ends — one more gift?',
    body: `<span class="badge">Year-End Appeal</span>
<h2>This year, because of people like you —</h2>
<ul>
  <li>[number] young people reached</li>
  <li>[number] mentorship matches made</li>
  <li>[number] opportunities shared</li>
</ul>
<p>As the year closes, we're asking for one more gift to carry this momentum into [next year]. Every donation before [date] is tax-deductible where applicable and comes with a receipt and certificate.</p>
${btn(`${SITE}/donate`, 'Make your year-end gift')}`,
  },
  {
    name: 'Matching Gift Campaign',
    subject: 'Your gift just got twice as powerful',
    body: `<span class="badge">Matching Gift</span>
<h2>Every gift is being matched right now.</h2>
<p>Thanks to [partner/sponsor name], every donation to Wissen-Haus between [start date] and [end date] is being matched [1:1 / up to $X]. That means your ₦10,000 becomes ₦20,000 — at no extra cost to you.</p>
${btn(`${SITE}/donate`, 'Double your impact')}`,
  },
  {
    name: 'Monthly Newsletter Digest',
    subject: 'Wissen-Haus Monthly — [Month Year]',
    body: `<h2>This month, in brief.</h2>
<div class="field"><div class="k">Featured Story</div><div class="v">[headline + short summary]</div></div>
<div class="field"><div class="k">New Opportunities</div><div class="v">[count] new listings this month</div></div>
<div class="field"><div class="k">Upcoming Events</div><div class="v">[event name] — [date]</div></div>
<div class="divider"></div>
<p>Want to see all of it? Visit the Community Hub for the full picture.</p>
${btn(`${SITE}/community`, 'Visit Community Hub')}`,
  },
  {
    name: 'Survey / Feedback Request',
    subject: "Got 2 minutes? We'd love your feedback",
    body: `<h2>Help us get better.</h2>
<p>We're always trying to improve what we offer, and the best way to do that is to ask the people we're actually trying to help. Could you spare two minutes for a short survey?</p>
${btn('[survey link]', 'Take the survey')}
<p style="font-size:.85rem;color:#8a9a8f">Your answers are completely anonymous unless you choose to add your name.</p>`,
  },
  {
    name: 'Jobs & Internships Roundup',
    subject: "This week's jobs & internships",
    body: `<span class="badge">Opportunity Roundup</span>
<h2>Fresh opportunities, hand-picked this week.</h2>
<ul>
  <li>[Role] at [Company] — [location/remote]</li>
  <li>[Role] at [Company] — [location/remote]</li>
  <li>[Role] at [Company] — [location/remote]</li>
</ul>
${btn(`${SITE}/community?tab=jobs#opportunities`, 'See all jobs')}`,
  },
  {
    name: 'Policy & Research Report Release',
    subject: 'New report: [report title]',
    body: `<span class="badge">New Research</span>
<h2>[Report title]</h2>
<p>[One or two sentences summarising the finding and why it matters for African youth and the diaspora.]</p>
${btn(`${SITE}/policy-research`, 'Read the full report')}`,
  },
  {
    name: 'Safeguarding Policy Update',
    subject: 'An update to our Safeguarding policy',
    body: `<h2>We've updated our Safeguarding policy.</h2>
<p>Keeping the young people we work with safe is foundational to everything we do. We've made the following changes: [summarise changes].</p>
<p>You can read the full policy at any time.</p>
${btn(`${SITE}/safeguarding`, 'View our Safeguarding policy')}
<p style="font-size:.85rem;color:#8a9a8f">If you ever have a safeguarding concern, you can report it confidentially at any time.</p>`,
  },
  {
    name: 'Donor Thank You / Gratitude',
    subject: 'Thank you — truly.',
    body: `<h2>We don't say this enough: thank you.</h2>
<p>Your support this past [month/quarter/year] has directly funded [specific outcome — e.g. "12 mentorship pairings and 3 scholarship placements"]. We wanted to take a moment, with nothing to ask for, to just say thank you for being part of this.</p>
<p>— The Wissen-Haus team</p>`,
  },
  {
    name: 'Re-Engagement — "We Miss You"',
    subject: "It's been a while — here's what you've missed",
    body: `<h2>We noticed you've been away.</h2>
<p>A lot has happened since you last checked in: new opportunities, new programmes, new stories. Here's a quick catch-up:</p>
<ul>
  <li>[highlight 1]</li>
  <li>[highlight 2]</li>
  <li>[highlight 3]</li>
</ul>
${btn(`${SITE}/community`, "See what's new")}`,
  },
]

async function main() {
  const databaseUrl = process.env.WISSENDB_DATABASE_URL_UNPOOLED ?? process.env.WISSENDB_DATABASE_URL ?? process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('Error: WISSENDB_DATABASE_URL env var not found.')
    console.error('Run: node --env-file=.env.local scripts/seed-newsletter-templates.mjs')
    process.exit(1)
  }
  const sql = neon(databaseUrl)

  let created = 0, skipped = 0
  for (const t of TEMPLATES) {
    const existing = await sql`SELECT id FROM newsletter_templates WHERE name = ${t.name}`
    if (existing.length > 0) { skipped++; continue }
    await sql`INSERT INTO newsletter_templates (name, subject, body) VALUES (${t.name}, ${t.subject}, ${t.body})`
    created++
    console.log(`✓ ${t.name}`)
  }
  console.log(`\n${created} created, ${skipped} already existed.`)
}

main()
