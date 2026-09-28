import type { OgPageSchema } from './og-shared'

// Registry of every page whose <title>/og:title/og:description is editable
// from the admin "Open Graph" tab. Deliberately excludes pages whose
// metadata is derived from real, per-record content rather than fixed page
// copy -- app/courses/[courseId]/page.tsx (course title/tagline),
// app/donate/[slug]/page.tsx (campaign title), and
// app/community/threads/[id]/layout.tsx (thread title) already show their
// actual content's title, which is the correct behaviour; a generic
// override here would fight that instead of complementing it.
//
// Each `default*` value is the page's original hardcoded copy -- both the
// admin editor's placeholder and the page's runtime fallback if never
// saved. Add a new page by adding its schema here and wiring
// `generateMetadata` + `getOgCopy` into that page.tsx (see any entry below
// for the pattern) -- the editor itself needs no further registration.
export const OG_PAGE_SCHEMAS: OgPageSchema[] = [
  {
    slug: 'home', label: 'Homepage',
    defaultTitle: 'Wissen-Haus Empowerment Foundation · Empowering Youth, Shaping Futures',
    defaultOgTitle: 'Wissen-Haus — Empowering Youth, Shaping Futures',
    defaultDescription: 'We equip African youth and the diaspora with practical skills, mentorship and global exposure for economic independence. Founded in Ibadan, Nigeria, now reaching young people across Africa and internationally.',
  },
  {
    slug: 'about', label: 'About',
    defaultTitle: 'About Us · Wissen-Haus', defaultOgTitle: 'About Us',
    defaultDescription: 'The Wissen-Haus journey: bridging the classroom and the world so every young African and diaspora changemaker can achieve economic independence.',
  },
  {
    slug: 'about-story', label: 'About · Our Story',
    defaultTitle: 'Our Story · Wissen-Haus', defaultOgTitle: 'Our Story',
    defaultDescription: 'The Wissen-Haus journey: bridging the classroom and the world so every young African and diaspora changemaker can achieve economic independence.',
  },
  {
    slug: 'founder', label: 'Founder',
    defaultTitle: 'Meet the Founder · Wissen-Haus', defaultOgTitle: 'Meet the Founder',
    defaultDescription: 'Meet Benz Olagbaye, Founder and Executive Director of Wissen-Haus Empowerment Foundation.',
  },
  {
    slug: 'team', label: 'Team',
    defaultTitle: 'Our Team · Wissen-Haus', defaultOgTitle: 'Our Team',
    defaultDescription: 'Meet the people who hold Wissen-Haus together — the founder, advisors, mentors, and volunteers building something that matters.',
  },
  {
    slug: 'contact', label: 'Contact',
    defaultTitle: 'Contact Us · Wissen-Haus', defaultOgTitle: 'Contact Us',
    defaultDescription: 'Get in touch with Wissen-Haus. Contact us for inquiries, partnerships, volunteering, or general questions.',
  },
  {
    slug: 'programmes', label: 'Programmes',
    defaultTitle: 'Programmes · Wissen-Haus', defaultOgTitle: 'Our Programmes',
    defaultDescription: 'Career Clarity Fair, Opportunity Blueprint Podcast, Impact Content, Events, and Career Hub — all our programmes in one place.',
  },
  {
    slug: 'career-clarity-fair', label: 'Career Clarity Fair',
    defaultTitle: 'Career Clarity Fair · Wissen-Haus', defaultOgTitle: 'Career Clarity Fair',
    defaultDescription: 'A one-day career exploration fair for secondary school students in Africa and the diaspora. Meet professionals, explore careers, and discover your path.',
  },
  {
    slug: 'career-clarity-fair-register', label: 'Career Clarity Fair · Register',
    defaultTitle: 'Register · Career Clarity Fair · Wissen-Haus', defaultOgTitle: 'Register for the Career Clarity Fair',
    defaultDescription: 'Register for the Wissen-Haus Career Clarity Fair and get your personal booth guide.',
  },
  {
    slug: 'opportunity-blueprint', label: 'Opportunity Blueprint',
    defaultTitle: 'Opportunity Blueprint Podcast · Wissen-Haus', defaultOgTitle: 'Opportunity Blueprint Podcast',
    defaultDescription: "Our flagship podcast featuring weekly career insights and guidance from professionals who've walked the path.",
  },
  {
    slug: 'impact-content', label: 'Impact Content',
    defaultTitle: 'Impact Content · Wissen-Haus', defaultOgTitle: 'Impact Content',
    defaultDescription: 'Social-impact storytelling that highlights African youth and diaspora changemakers doing extraordinary things.',
  },
  {
    slug: 'events', label: 'Events & Cafés',
    defaultTitle: 'Events & Cafés · Wissen-Haus', defaultOgTitle: 'Events & Cafés',
    defaultDescription: 'Networking events, career cafés, and workshops that connect African youth and the diaspora with professionals in relaxed, inspiring settings.',
  },
  {
    slug: 'policy-research', label: 'Policy & Research',
    defaultTitle: 'Policy & Research · Wissen-Haus', defaultOgTitle: 'Policy & Research',
    defaultDescription: 'Comprehensive policy papers and research reports on youth employment, skills gap, and economic independence across Nigeria, Africa, and the diaspora.',
  },
  {
    slug: 'volunteer', label: 'Volunteer',
    defaultTitle: 'Volunteer · Wissen-Haus', defaultOgTitle: 'Volunteer With Us',
    defaultDescription: 'Volunteer with Wissen-Haus and help bridge the skills gap in Ibadan and beyond. Mentor, train and support African youth and the diaspora.',
  },
  {
    slug: 'partner', label: 'Partner',
    defaultTitle: 'Partner With Us · Wissen-Haus', defaultOgTitle: 'Partner With Us',
    defaultDescription: 'Partner with Wissen-Haus to empower African youth and the diaspora. For schools, companies, and individuals.',
  },
  {
    slug: 'partners-datacamp', label: 'Partners · DataCamp',
    defaultTitle: 'DataCamp Donates Partnership · Wissen-Haus', defaultOgTitle: 'Free DataCamp Access for Our Community',
    defaultDescription: 'Wissen-Haus is now a DataCamp Donates partner. Premium DataCamp licenses available for students and team members.',
  },
  {
    slug: 'partners-datacamp-apply', label: 'Partners · DataCamp Application',
    defaultTitle: 'DataCamp Scholarship Application · Wissen-Haus', defaultOgTitle: 'Apply for a DataCamp Scholarship',
    defaultDescription: 'Apply for a Wissen-Haus × DataCamp scholarship — free access to DataCamp for motivated young people facing genuine barriers to learning data, analytics and AI skills.',
  },
  {
    slug: 'donate', label: 'Donate',
    defaultTitle: 'Donate · Wissen-Haus', defaultOgTitle: 'Donate to Wissen-Haus',
    defaultDescription: "Fuel a young African or diaspora changemaker's future. Your gift funds free Career Clarity Fairs, mentorship and global exposure for students who need it most.",
  },
  {
    slug: 'donate-success', label: 'Donate · Thank You',
    defaultTitle: 'Thank You · Wissen-Haus', defaultOgTitle: 'Thank You',
    defaultDescription: 'Your donation to Wissen-Haus has been received. Thank you for empowering youth across Africa and the diaspora.',
  },
  {
    slug: 'donate-bank-transfer', label: 'Donate · Bank Transfer',
    defaultTitle: 'Complete Your Bank Transfer · Wissen-Haus', defaultOgTitle: 'Complete Your Bank Transfer',
    defaultDescription: 'Bank account details for your donation to Wissen-Haus Empowerment Foundation.',
  },
  {
    slug: 'careers', label: 'Careers',
    defaultTitle: 'Careers · Wissen-Haus', defaultOgTitle: 'Careers at Wissen-Haus',
    defaultDescription: 'Join the Wissen-Haus team and help bridge the skills gap for African youth and the diaspora.',
  },
  {
    slug: 'career-pathways', label: 'Career Pathways',
    defaultTitle: 'Career Pathways · Wissen-Haus', defaultOgTitle: 'Career Pathways',
    defaultDescription: 'Discover your career path with realistic salary ranges in Nigeria, the skills you need, and opportunities across Africa and the diaspora.',
  },
  {
    slug: 'career-assessment', label: 'Career Assessment',
    defaultTitle: 'Career Assessment · Wissen-Haus', defaultOgTitle: 'Career Assessment',
    defaultDescription: 'Take the free Wissen-Haus Career Assessment to discover career paths that match your interests and strengths, with personalised next steps.',
  },
  {
    slug: 'community', label: 'Community Hub',
    defaultTitle: 'Community Hub · Wissen-Haus', defaultOgTitle: 'Community Hub',
    defaultDescription: 'Scholarships, internships, mentorship, courses and a community feed—everything a young Nigerian changemaker needs in one place.',
  },
  {
    slug: 'community-landing', label: 'Community · Landing',
    defaultTitle: 'Community Hub · Wissen-Haus', defaultOgTitle: 'Community Hub',
    defaultDescription: 'Join the Wissen-Haus community hub to access scholarships, internships, jobs, courses, and mentorship.',
  },
  {
    slug: 'community-threads', label: 'Community · Discussion Threads',
    defaultTitle: 'Discussion Threads · Wissen-Haus Community', defaultOgTitle: 'Discussion Threads',
    defaultDescription: 'Discuss, share wins, ask questions — the Wissen-Haus community discussion board.',
  },
  {
    slug: 'competitions', label: 'Competitions',
    defaultTitle: 'Competitions & Hackathons · Wissen-Haus Community', defaultOgTitle: 'Competitions & Hackathons',
    defaultDescription: 'Online competitions, hackathons, and challenges open to African youth.',
  },
  {
    slug: 'courses', label: 'Courses',
    defaultTitle: 'Courses · Wissen-Haus', defaultOgTitle: 'Courses',
    defaultDescription: 'Free and premium certificate courses for Nigerian youth. Build real career skills.',
  },
  {
    slug: 'jobs', label: 'Jobs',
    defaultTitle: 'Remote Jobs · Wissen-Haus Community', defaultOgTitle: 'Remote Jobs',
    defaultDescription: 'Remote job opportunities curated for Nigerian, African, and diaspora youth. Updated daily.',
  },
  {
    slug: 'internships', label: 'Internships',
    defaultTitle: 'Internships · Wissen-Haus Community', defaultOgTitle: 'Internships',
    defaultDescription: 'Internship opportunities open to Nigerian, African, and diaspora youth.',
  },
  {
    slug: 'impact', label: 'Impact',
    defaultTitle: 'Impact · Wissen-Haus', defaultOgTitle: 'Our Impact',
    defaultDescription: 'Real stories from the Wissen-Haus community — students and mentors who have changed their trajectory.',
  },
  {
    slug: 'scholarships', label: 'Scholarships',
    defaultTitle: 'Scholarships · Wissen-Haus Community', defaultOgTitle: 'Scholarships',
    defaultDescription: 'Scholarships for Nigerian, African, and diaspora students.',
  },
  {
    slug: 'privacy', label: 'Privacy Policy',
    defaultTitle: 'Privacy Policy · Wissen-Haus', defaultOgTitle: 'Privacy Policy',
    defaultDescription: 'How Wissen-Haus Empowerment Foundation collects, uses, and protects your personal information.',
  },
  {
    slug: 'terms', label: 'Terms & Conditions',
    defaultTitle: 'Terms & Conditions of Use · Wissen-Haus', defaultOgTitle: 'Terms & Conditions',
    defaultDescription: 'The terms and conditions governing your use of the Wissen-Haus Empowerment Foundation website and programmes.',
  },
]

export function ogSchemaFor(slug: string): OgPageSchema | undefined {
  return OG_PAGE_SCHEMAS.find(s => s.slug === slug)
}
