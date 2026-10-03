import { pageCopyText as t, pageCopyTextarea as ta, type PageCopySchema } from './page-copy-shared'

// Registry of every page wired to the generic page-copy system. Add a new
// page's schema below (named export + push into PAGE_COPY_SCHEMAS), then
// read it server-side via getPageCopy(YOUR_SCHEMA) from lib/page-copy.ts in
// that page's page.tsx. The admin "Page Copy" editor (client-safe: this
// file has no server-only imports) renders whatever's registered here --
// no separate registration step needed for the editor itself.
export const ABOUT_SCHEMA: PageCopySchema = {
  slug: 'about', label: 'About',
  fields: [
    t('heroEyebrow', 'Hero eyebrow', 'About Wissen-Haus'),
    t('heroTitle', 'Hero title', 'Bridging the skills gap for African youth and the diaspora.', 160),
    ta('heroLead', 'Hero intro', 'Explore our story, meet our founder, discover impact stories from our community, and get in touch with us.', 400),
    t('storyTitle', '"Our Story" card title', 'Our Story'),
    ta('storyBody', '"Our Story" card body', "Discover the Wissen-Haus journey, our mission, and the values that drive everything we do. Learn how we're bridging the gap between the classroom and the world.", 500),
    t('storyLinkText', '"Our Story" card link text', 'Read our story'),
    t('ctaTitle', 'Closing banner title', 'Be part of the story.'),
    ta('ctaLead', 'Closing banner body', 'Whether you mentor, partner or give, you help a young African or diaspora changemaker bridge the gap between potential and opportunity.', 400),
    t('ctaVolunteerText', 'Closing banner "Volunteer" button', 'Volunteer with us'),
    t('ctaPartnerText', 'Closing banner "Partner" button', 'Partner with us'),
  ],
}

export const ABOUT_STORY_SCHEMA: PageCopySchema = {
  slug: 'about-story', label: 'About · Our Story',
  fields: [
    t('heroEyebrow', 'Hero eyebrow', 'Our Story'),
    t('heroTitle', 'Hero title', 'Building the bridge young Africans and the diaspora deserve.', 160),
    ta('heroLead', 'Hero intro', "We started small in Ibadan, Nigeria—mentoring and counselling young people one by one, seeing firsthand how transformative real guidance can be. What we discovered is that this problem is bigger than one country or one person can solve. So we're building Wissen-Haus to scale what we've learned and help thousands of talented young people—across Nigeria, Africa, and the diaspora—access the opportunities that should be available to everyone.", 800),

    t('s1Index', 'Section 1 index label', '01 · The Problem We Saw'),
    t('s1Heading', 'Section 1 heading', 'What Sparked Our Mission'),
    ta('s1Para1', 'Section 1 paragraph 1', 'Imagine graduating with excellent grades, only to discover that employers want something your school never taught you. Imagine having a brilliant idea for a business but not knowing a single person in the industry. Imagine being talented but invisible because you grew up outside the circles where opportunities flow.', 600),
    ta('s1Para2', 'Section 1 paragraph 2', "This is the reality for millions of young Africans and diaspora youth. Not because they lack talent. Not because they don't work hard. But because the bridge between what they learn and what the world needs simply doesn't exist.", 600),
    t('s1Para3', 'Section 1 highlighted line', 'We saw this gap. And we decided to build a bridge.', 200),

    t('s2Index', 'Section 2 index label', "02 · What We're Building"),
    t('s2Heading', 'Section 2 heading', 'Three Pillars of Change'),
    ta('s2Intro', 'Section 2 intro line', "We've learned from mentoring 50+ young people that real transformation happens through three things:", 300),
    t('pillar1Label', 'Pillar 1 label', 'Career Clarity Fair'),
    ta('pillar1Body', 'Pillar 1 body', 'Intensive, practical training in the skills employers actually need. Not textbooks. Real tools for landing jobs and building careers.', 400),
    t('pillar2Label', 'Pillar 2 label', 'Opportunity Blueprint Podcast'),
    ta('pillar2Body', 'Pillar 2 body', "Direct access to the stories of people who've built what you dream about. Proof that it's possible. Inspiration that sticks.", 400),
    t('pillar3Label', 'Pillar 3 label', 'Community & Mentorship'),
    ta('pillar3Body', 'Pillar 3 body', "A network where you're not alone. Real mentors. Real peers. Real accountability. This is where lasting change happens.", 400),
    ta('s2Closing', 'Section 2 closing line', "We're just getting started. Every person we mentor teaches us how to build this better. Every success story shows us we're on the right path.", 400),

    t('approachEyebrow', '"Our Approach" eyebrow', 'Our Approach'),
    t('approachHeading', '"Our Approach" heading', 'Three things set us apart—and why they matter.', 200),
    t('feature1Title', 'Feature 1 title', 'Skills That Get Jobs'),
    ta('feature1Body', 'Feature 1 body', "Not theory. We teach what employers actually hire for—communication, problem-solving, leadership—because classroom skills alone won't cut it.", 400),
    t('feature2Title', 'Feature 2 title', 'Mentors Who Care'),
    ta('feature2Body', 'Feature 2 body', "Not advisors. Real working professionals who've been where you are, who'll call you back, and who'll help you navigate the bumpy road to your first job or business.", 400),
    t('feature3Title', 'Feature 3 title', 'A Growing Community'),
    ta('feature3Body', 'Feature 3 body', "You're not alone. Connect with peers, mentors, and changemakers who are building careers, starting businesses, and lifting each other up.", 400),

    t('ctaTitle', 'Closing banner title', 'Be part of the story.'),
    ta('ctaLead', 'Closing banner body', 'Whether you mentor, partner or give, you help a young African or diaspora changemaker bridge the gap between potential and opportunity.', 400),
    t('ctaVolunteerText', 'Closing banner "Volunteer" button', 'Volunteer with us'),
    t('ctaFounderText', 'Closing banner "Founder" button', 'Meet the Founder'),
  ],
}

export const CONTACT_SCHEMA: PageCopySchema = {
  slug: 'contact', label: 'Contact',
  fields: [
    t('heroTitle', 'Hero title', 'Get in Touch'),
    ta('heroLead', 'Hero intro', "Have questions or want to collaborate? We'd love to hear from you.", 300),
    t('generalLabel', '"General Inquiries" label', 'General Inquiries'),
    t('partnershipsLabel', '"Partnerships" label', 'Partnerships'),
    t('hqLabel', '"Headquarters" label', 'Headquarters'),
    t('hqValue', '"Headquarters" value', 'Ibadan, Nigeria'),
    t('intlLabel', '"International" label', 'International'),
    ta('intlValue', '"International" value', 'Serving communities in the UK and across the diaspora', 200),
    t('followTitle', '"Follow Us" heading', 'Follow Us'),
    ta('followBody', '"Follow Us" body', 'Connect with us on social media to stay updated on our latest initiatives and impact stories.', 300),
  ],
}

export const PROGRAMMES_SCHEMA: PageCopySchema = {
  slug: 'programmes', label: 'Programmes',
  fields: [
    t('heroEyebrow', 'Hero eyebrow', 'Our Programmes'),
    t('heroTitle', 'Hero title', 'Everything we build, built for you.', 160),
    ta('heroLead', 'Hero intro', "From one-day career fairs to podcasts to digital courses—every Wissen-Haus programme is designed to bridge a real gap in a young African or diaspora changemaker's journey.", 400),

    t('p1Title', 'Programme 1 title', 'Career Clarity Fair'),
    ta('p1Body', 'Programme 1 body', 'A one-day career exploration fair for secondary school students in Ibadan. Meet professionals, explore diverse careers, and discover your path forward.', 400),
    t('p1LinkText', 'Programme 1 link text', 'Learn more'),

    t('p2Title', 'Programme 2 title', 'Opportunity Blueprint'),
    ta('p2Body', 'Programme 2 body', "Our flagship podcast featuring weekly career insights and guidance from professionals who've walked the path. Launching soon.", 400),
    t('p2LinkText', 'Programme 2 link text', 'Find out more'),

    t('p3Title', 'Programme 3 title', 'Impact Content'),
    ta('p3Body', 'Programme 3 body', 'Social-impact storytelling that highlights African youth and diaspora changemakers doing extraordinary things. Your story matters and deserves to be told.', 400),
    t('p3LinkText', 'Programme 3 link text', 'Explore stories'),

    t('p4Title', 'Programme 4 title', 'Events & Cafés'),
    ta('p4Body', 'Programme 4 body', 'Regular networking events, career cafés, and workshops that connect students with professionals in relaxed settings.', 400),
    t('p4LinkText', 'Programme 4 link text', 'See events'),

    t('p5Title', 'Programme 5 title', 'Career Hub'),
    ta('p5Body', 'Programme 5 body', 'Online platform with job boards, scholarship listings, free courses, mentorship matching, and career tools—all in one place.', 400),
    t('p5LinkText', 'Programme 5 link text', 'Access the hub'),

    t('ctaTitle', 'Closing banner title', 'Partner with a programme.'),
    ta('ctaLead', 'Closing banner body', "Bring Wissen-Haus to your school, sponsor a cohort, or host a career fair. Let's talk about what's possible.", 400),
    t('ctaPartnerText', 'Closing banner "Partner" button', 'Partner with us'),
    t('ctaContactText', 'Closing banner "Contact" button', 'Get in touch'),
  ],
}

export const CAREER_CLARITY_FAIR_SCHEMA: PageCopySchema = {
  slug: 'career-clarity-fair', label: 'Career Clarity Fair',
  fields: [
    t('heroEyebrow', 'Hero eyebrow', 'Programmes · Career Clarity Fair'),
    t('heroTitle', 'Hero title', 'Career Clarity Fair', 100),
    ta('heroLead', 'Hero intro', "A one-day career exploration fair open to all secondary school students in Africa and the diaspora — from JS1 to SS3. Meet real professionals, explore careers you've never heard of, and leave with a clear direction.", 500),
    t('heroBtn1Text', 'Hero "Register" button', 'Register to attend'),
    t('heroBtn2Text', 'Hero "Bring to school" button', 'Bring it to your school'),

    t('donationBadge', 'Donation callout badge', 'Donation Drive · Series 1'),
    t('donationTitle', 'Donation callout title', 'Help us bring this Fair to life.', 160),
    ta('donationBody', 'Donation callout body', "We're raising ₦50,000,000 to fund student materials, facilitators and impact measurement for 500–1,000 students. Every contribution fills a seat at the Fair.", 400),
    t('donationBtnText', 'Donation callout button', 'Donate now'),

    t('whoEyebrow', '"Who Should Apply" eyebrow', 'Who Should Apply'),
    t('whoHeading', '"Who Should Apply" heading', 'This Fair is for every secondary school student who has questions about their future.', 220),
    t('who1Title', 'Audience 1 title', 'All Secondary School Students'),
    ta('who1Body', 'Audience 1 body', "From JS1 to SS3 — whether you're choosing subjects, thinking about university, or taking your first career steps. The earlier, the better.", 300),
    t('who2Title', 'Audience 2 title', 'The Undecided'),
    ta('who2Body', 'Audience 2 body', 'If you have no idea what career path to pursue, this is the most important day you can spend. Come with questions.', 300),
    t('who3Title', 'Audience 3 title', 'The Ambitious'),
    ta('who3Body', 'Audience 3 body', 'You know what you want but don’t know how to get there. The Career Clarity Fair connects you with professionals who have already walked the path.', 300),

    t('howEyebrow', '"How It Works" eyebrow', 'How It Works'),
    t('howHeading', '"How It Works" heading', 'What happens at the Career Clarity Fair', 200),
    t('step1Title', 'Step 1 title', 'Arrive & Explore'),
    ta('step1Body', 'Step 1 body', 'Browse booths representing 20+ career paths from tech to healthcare to media.', 250),
    t('step2Title', 'Step 2 title', 'Meet the Pros'),
    ta('step2Body', 'Step 2 body', "Have real conversations with professionals. Ask the questions you couldn't ask a teacher.", 250),
    t('step3Title', 'Step 3 title', 'Skills Tasters'),
    ta('step3Body', 'Step 3 body', 'Participate in short hands-on workshops and skill demonstrations.', 250),
    t('step4Title', 'Step 4 title', 'Leave with a Plan'),
    ta('step4Body', 'Step 4 body', 'Get your personalised career direction worksheet and connect with a mentor.', 250),

    t('ctaTitle', 'Closing banner title', 'Bring the Career Clarity Fair to your school.', 200),
    ta('ctaLead', 'Closing banner body', "We partner with schools across Ibadan and beyond. If you're a teacher, administrator, or parent — reach out and let's talk.", 400),
    t('ctaBtn1Text', 'Closing banner "Register" button', 'Register to attend'),
    t('ctaBtn2Text', 'Closing banner "Partner" button', 'Partner with us'),
  ],
}

export const PAGE_COPY_SCHEMAS: PageCopySchema[] = [
  ABOUT_SCHEMA,
  ABOUT_STORY_SCHEMA,
  CONTACT_SCHEMA,
  PROGRAMMES_SCHEMA,
  CAREER_CLARITY_FAIR_SCHEMA,
]

export const OPPORTUNITY_BLUEPRINT_SCHEMA: PageCopySchema = {
  slug: 'opportunity-blueprint', label: 'Opportunity Blueprint',
  fields: [
    t('heroEyebrow', 'Hero eyebrow', 'Programmes · Podcast'),
    t('heroTitle', 'Hero title', 'Opportunity Blueprint', 100),
    ta('heroLead', 'Hero intro', 'Weekly career insights, real stories, and practical guidance from professionals building careers across Africa and beyond. Launching soon.', 400),
    t('heroBtnText', 'Hero button text', 'Notify me when it launches'),

    t('expectEyebrow', '"What to Expect" eyebrow', 'What to Expect'),
    t('expectHeading', '"What to Expect" heading', 'Real conversations that open doors.', 200),
    t('f1Title', 'Feature 1 title', 'Career Stories'),
    ta('f1Body', 'Feature 1 body', 'Hear how professionals went from school to their dream careers — including the failures, setbacks, and breakthroughs.', 300),
    t('f2Title', 'Feature 2 title', 'Global Perspective'),
    ta('f2Body', 'Feature 2 body', 'From Lagos to London, insights on how to position yourself for global opportunities while remaining grounded in Nigeria.', 300),
    t('f3Title', 'Feature 3 title', 'Practical Takeaways'),
    ta('f3Body', 'Feature 3 body', 'Every episode ends with concrete steps you can take this week to move your career forward.', 300),

    t('notifyEyebrow', 'Notify-form eyebrow', 'Stay Updated'),
    t('notifyHeading', 'Notify-form heading', 'Be the first to know when we launch.', 200),

    t('ctaTitle', 'Closing banner title', 'Want to be a guest?'),
    ta('ctaLead', 'Closing banner body', "Share your career story on Opportunity Blueprint. We're especially interested in professionals working in Nigeria, across Africa, or in the diaspora.", 400),
    t('ctaBtnText', 'Closing banner button', 'Get in touch'),
  ],
}
PAGE_COPY_SCHEMAS.push(OPPORTUNITY_BLUEPRINT_SCHEMA)

export const IMPACT_CONTENT_SCHEMA: PageCopySchema = {
  slug: 'impact-content', label: 'Impact Content',
  fields: [
    t('heroEyebrow', 'Hero eyebrow', 'Programmes · Impact Content'),
    t('heroTitle', 'Hero title', 'Stories that inspire action.', 160),
    ta('heroLead', 'Hero intro', "African youth and diaspora changemakers doing extraordinary things. We tell their stories so the next generation knows what's possible.", 400),
    t('ctaTitle', 'Closing banner title', 'Have a story to tell?'),
    ta('ctaLead', 'Closing banner body', "We're always looking for young Africans and diaspora changemakers doing extraordinary things. If that's you — or if you know someone whose story deserves to be heard — reach out.", 400),
    t('ctaBtnText', 'Closing banner button', 'Submit a story'),
  ],
}
PAGE_COPY_SCHEMAS.push(IMPACT_CONTENT_SCHEMA)

export const EVENTS_SCHEMA: PageCopySchema = {
  slug: 'events', label: 'Events & Cafés',
  fields: [
    t('heroEyebrow', 'Hero eyebrow', 'Programmes · Events'),
    t('heroTitle', 'Hero title', 'Events & Cafés', 100),
    ta('heroLead', 'Hero intro', 'Networking events, career cafés, and workshops that connect African youth and the diaspora with professionals — in real spaces, with real conversations.', 400),
    t('heroBtn1Text', 'Hero "See upcoming" button', 'See upcoming events'),
    t('heroBtn2Text', 'Hero "Join community" button', 'Join the community'),

    t('formatsEyebrow', '"What We Run" eyebrow', 'What We Run'),
    t('formatsHeading', '"What We Run" heading', 'Four formats, one goal: connection.', 160),
    t('type1Title', 'Format 1 title', 'Career Cafés'),
    ta('type1Body', 'Format 1 body', 'Informal coffee-style sessions where students sit with professionals in a specific field and ask anything — no formality, just real conversation.', 350),
    t('type2Title', 'Format 2 title', 'Workshops'),
    ta('type2Body', 'Format 2 body', 'Hands-on skill-building sessions covering CV writing, interview preparation, personal branding, and navigating the modern job market.', 350),
    t('type3Title', 'Format 3 title', 'Networking Events'),
    ta('type3Body', 'Format 3 body', 'Curated evenings that bridge the gap between students, recent graduates, and working professionals in a structured yet relaxed setting.', 350),
    t('type4Title', 'Format 4 title', 'Panel Talks'),
    ta('type4Body', 'Format 4 body', "Industry-specific panels where experts share career paths, industry insights, and honest advice you won't find in a classroom.", 350),

    t('upcomingEyebrow', '"Upcoming Events" eyebrow', 'Upcoming Events'),
    t('upcomingHeading', '"Upcoming Events" heading', 'Mark your calendar.', 160),
    ta('upcomingLead', '"Upcoming Events" intro', 'Our next events are being confirmed. Join the community to be the first to hear about dates, venues, and how to register.', 300),
    t('upcomingBtnText', 'Notify-form button', 'Notify me of upcoming events'),

    t('hostTitle', '"Host an event" title', 'Host an event with us.'),
    ta('hostBody', '"Host an event" body', 'Have a venue, a network, or an idea? Partner with Wissen-Haus to bring career events to your school, community, or organisation.', 300),
    t('hostBtnText', '"Host an event" button', 'Partner with us'),
    t('speakerTitle', '"Be a speaker" title', 'Be a speaker.'),
    ta('speakerBody', '"Be a speaker" body', 'Share your career story at a Wissen-Haus event. We especially welcome professionals from diverse fields, backgrounds, and career paths.', 300),
    t('speakerBtnText', '"Be a speaker" button', 'Get in touch'),
  ],
}
PAGE_COPY_SCHEMAS.push(EVENTS_SCHEMA)

export const POLICY_RESEARCH_SCHEMA: PageCopySchema = {
  slug: 'policy-research', label: 'Policy & Research',
  fields: [
    t('heroEyebrow', 'Hero eyebrow', 'Policy & Research'),
    t('heroTitle', 'Hero title', 'Evidence for the future of work.', 160),
    ta('heroLead', 'Hero intro', 'We publish comprehensive policy papers and research focused on youth economic independence, the skills gap, and the future of work across Nigeria, Africa, and the diaspora.', 400),

    t('paperNumber', 'Featured paper number', 'Policy Paper 001'),
    ta('paperTitle', 'Featured paper title', 'Beyond Unemployment: A Skills-First Framework for Nigerian Youth Economic Independence', 300),
    ta('paperSub', 'Featured paper summary', "Nigeria's youth unemployment crisis is not merely an employment problem—it is a skills access problem. This paper proposes a three-pillar framework for systemic change.", 400),
    t('paperAuthors', 'Featured paper authors', 'Wissen-Haus Research Team'),
    t('paperYear', 'Featured paper year', '2026', 20),
    t('paperFormat', 'Featured paper format line', 'Free · 11 pages'),
    t('timelineTitle', 'Timeline heading', 'Research Timeline'),

    t('focusEyebrow', '"Research Focus" eyebrow', 'Research Focus Areas'),
    t('focusHeading', '"Research Focus" heading', 'What we investigate.', 160),
    t('focus1Title', 'Focus area 1 title', 'Skills Gap Analysis'),
    ta('focus1Body', 'Focus area 1 body', 'Mapping the gap between what schools teach and what employers need in modern Nigerian workplaces.', 300),
    t('focus2Title', 'Focus area 2 title', 'Global Youth Labour Markets'),
    ta('focus2Body', 'Focus area 2 body', 'How remote work and global hiring trends create both challenges and opportunities for African youth.', 300),
    t('focus3Title', 'Focus area 3 title', 'Impact Measurement'),
    ta('focus3Body', 'Focus area 3 body', 'Developing rigorous methodologies for measuring the real-world impact of career guidance interventions.', 300),

    t('newsletterEyebrow', 'Newsletter eyebrow', 'Newsletter'),
    t('newsletterHeading', 'Newsletter heading', 'Get our research in your inbox.', 160),
    t('newsletterBtnText', 'Newsletter button', 'Subscribe to Research Updates'),
  ],
}
PAGE_COPY_SCHEMAS.push(POLICY_RESEARCH_SCHEMA)

export const VOLUNTEER_SCHEMA: PageCopySchema = {
  slug: 'volunteer', label: 'Volunteer',
  fields: [
    t('heroEyebrow', 'Hero eyebrow', 'Volunteer With Us'),
    t('heroTitle', 'Hero title', 'Join the mission to empower African and diaspora youth.', 160),
    ta('heroLead', 'Hero intro', 'Help us bridge the skills gap in Ibadan and beyond by contributing your time and expertise to mentor the next generation of leaders.', 400),
    t('heroBtnText', 'Hero button', 'Start mentoring'),

    t('waysEyebrow', '"Ways to Contribute" eyebrow', 'Ways to Contribute'),
    t('waysHeading', '"Ways to Contribute" heading', 'Ways to Contribute Your Skills', 200),
    t('way1Title', 'Way 1 title', 'Mentoring'),
    ta('way1Body', 'Way 1 body', 'Guide students through career choices and personal growth by sharing your professional journey and advice.', 300),
    t('way1Tag', 'Way 1 tag line', 'Build Impact · Gain Community'),
    t('way2Title', 'Way 2 title', 'Technical Training'),
    ta('way2Body', 'Way 2 body', 'Help bridge the skills gap by teaching coding, digital marketing, or vocational skills to our eager participants.', 300),
    t('way2Tag', 'Way 2 tag line', 'Share Skills · Empower Youth'),
    t('way3Title', 'Way 3 title', 'Operations'),
    ta('way3Body', 'Way 3 body', 'Contribute your time to content creation, event planning, or logistical support as we scale our impact across Africa and the diaspora.', 300),
    t('way3Tag', 'Way 3 tag line', 'Shape the Future · Gain Experience'),

    ta('quote', 'Testimonial quote', 'Volunteering with Wissen-Haus gave me back as much as I gave — real relationships, real growth.', 300),
    t('quoteName', 'Testimonial name', 'Tolu Adeyemi'),
    t('quoteRole', 'Testimonial role', 'Mentor, 2025 cohort'),

    t('applyEyebrow', 'Apply-form eyebrow', 'Apply'),
    t('applyHeading', 'Apply-form heading', 'Ready to give your time?', 160),
    ta('applyLead', 'Apply-form intro', 'Fill out the form below and our team will reach out within 5 business days.', 300),
  ],
}
PAGE_COPY_SCHEMAS.push(VOLUNTEER_SCHEMA)

export const PARTNER_SCHEMA: PageCopySchema = {
  slug: 'partner', label: 'Partner',
  fields: [
    t('heroEyebrow', 'Hero eyebrow', 'Partner With Us'),
    t('heroTitle', 'Hero title', "Let's build the bridge together.", 160),
    ta('heroLead', 'Hero intro', "Whether you're a school administrator, a company with a CSR mandate, or an individual with expertise to share—there's a partnership model for you.", 400),

    t('modelsEyebrow', '"Partnership Models" eyebrow', 'Partnership Models'),
    t('modelsHeading', '"Partnership Models" heading', 'Three ways to partner.', 160),
    t('model1Title', 'Model 1 title', 'Schools & Universities'),
    ta('model1Body', 'Model 1 body', 'Host Wissen-Haus events on campus. Give your students access to our community hub. Let us deliver Career Clarity Fair skills sessions in your classrooms.', 400),
    t('model1LinkText', 'Model 1 link text', 'Enquire now'),
    t('model2Title', 'Model 2 title', 'Companies'),
    ta('model2Body', 'Model 2 body', 'Sponsor a Career Clarity Fair cohort, offer internships through our platform, or send your employees as volunteer mentors. Meet your CSR goals while creating real impact.', 400),
    t('model2LinkText', 'Model 2 link text', 'Discuss a partnership'),
    t('model3Title', 'Model 3 title', 'Individuals'),
    ta('model3Body', 'Model 3 body', "You're a professional who wants to give back but doesn't know how to structure it. We'll match you with students who need exactly what you offer.", 400),
    t('model3LinkText', 'Model 3 link text', 'Become a mentor'),

    t('howEyebrow', '"How It Works" eyebrow', 'How It Works'),
    t('howHeading', '"How It Works" heading', 'Simple to start. Built to last.', 160),
    t('step1Title', 'Step 1 title', 'Reach out'),
    ta('step1Body', 'Step 1 body', "Drop us an email or fill out the form below. We'll respond within 3 business days.", 250),
    t('step2Title', 'Step 2 title', 'Discovery call'),
    ta('step2Body', 'Step 2 body', 'A 30-minute conversation to understand your goals and how we can best collaborate.', 250),
    t('step3Title', 'Step 3 title', 'Partnership proposal'),
    ta('step3Body', 'Step 3 body', 'We craft a tailored proposal with clear deliverables, timelines, and impact metrics.', 250),
    t('step4Title', 'Step 4 title', 'Launch & report'),
    ta('step4Body', 'Step 4 body', 'We deliver the programme and send you a detailed impact report afterwards.', 250),

    t('partnersEyebrow', '"Our Partners" eyebrow', 'Our Partners'),
    t('partnersHeading', '"Our Partners" heading', 'Organizations Making Impact Together', 200),
    ta('partnersLead', '"Our Partners" intro', "We're proud to collaborate with leading organizations committed to youth empowerment and access to education.", 300),

    t('formEyebrow', 'Contact-form eyebrow', 'Get in Touch'),
    t('formHeading', 'Contact-form heading', 'Start the conversation.', 160),
  ],
}
PAGE_COPY_SCHEMAS.push(PARTNER_SCHEMA)

export const DONATE_SCHEMA: PageCopySchema = {
  slug: 'donate', label: 'Donate',
  fields: [
    t('heroEyebrow', 'Hero eyebrow', 'Donate'),
    t('heroTitle', 'Hero title', "Fuel a young African or diaspora changemaker's future.", 200),
    ta('heroLead', 'Hero intro', 'Every gift helps us deliver free Career Clarity Fairs, mentorship and global exposure to students who need it most. Bridge the skills gap with us.', 400),
    t('heroBtnText', 'Hero button', 'Give now'),

    t('impactEyebrow', '"Your Impact" eyebrow', 'Your Impact'),
    t('impactHeading', '"Your Impact" heading', 'Every naira builds a career-ready future.', 160),
    ta('impactLead', '"Your Impact" body', 'Since our launch in 2025, gifts from people like you have reached young people across Ibadan, Nigeria, and are now extending to Africa and the diaspora.', 400),

    t('giveEyebrow', '"Give Now" eyebrow', 'Give Now'),
    t('giveHeading', '"Give Now" heading', 'Choose a gift that changes a life.', 160),
    ta('giveLead', '"Give Now" intro', 'Pick a suggested amount or enter your own, then pay by card or direct bank transfer. Give in Naira, Dollars, Pounds or Euros — card donations are processed securely by Stripe. Every contribution goes directly to equipping students.', 500),
    ta('bankTransferNote', 'Bank-transfer note below the widget', "Prefer a direct bank transfer? Choose Bank Transfer above — fill in the same details and we'll show you the account to pay into, then email your receipt and certificate once it clears.", 400),

    t('dcTitle', 'DataCamp banner title', 'Amplify Your Impact'),
    ta('dcBody', 'DataCamp banner body', 'Your donation provides Career Clarity Fairs and mentorship. Our partnership with DataCamp multiplies that impact by giving students free access to 500+ premium data science and AI courses — preparing them for the jobs of tomorrow.', 500),
    t('dcLinkText', 'DataCamp banner link text', 'Learn about our DataCamp partnership'),

    t('transparencyEyebrow', '"Transparency" eyebrow', 'Transparency'),
    t('transparencyHeading', '"Transparency" heading', 'Your money, clearly accounted for.', 160),
    ta('transparencyLead', '"Transparency" intro', 'We publish annual reports and provide detailed impact statements to all donors above ₦20,000.', 300),
    t('split1Title', 'Fund split 1 title', '70% Programmes'),
    ta('split1Body', 'Fund split 1 body', 'Directly funds workshops, Career Clarity Fairs, and student resources.', 250),
    t('split2Title', 'Fund split 2 title', '20% Operations'),
    ta('split2Body', 'Fund split 2 body', 'Staff time, technology, and administration that makes delivery possible.', 250),
    t('split3Title', 'Fund split 3 title', '10% Growth'),
    ta('split3Body', 'Fund split 3 body', 'Reserved to expand to new schools and communities across Nigeria, Africa, and the diaspora.', 250),
  ],
}
PAGE_COPY_SCHEMAS.push(DONATE_SCHEMA)

export const SAFEGUARDING_SCHEMA: PageCopySchema = {
  slug: 'safeguarding', label: 'Safeguarding Policy',
  fields: [
    t('title', 'Page title', 'Safeguarding Policy'),
    t('version', 'Version', '1.0', 20),
    t('lastUpdated', 'Last updated', '3 October 2026', 40),
    t('nextReview', 'Next review', 'October 2027', 40),
    ta('intro', 'Opening paragraph', 'Wissen Haus Foundation (“Wissen-Haus”, “we”, “us”) works with young people in Nigeria, Ghana, Kenya, South Africa and diaspora communities, including students under 18. This policy explains how we keep the children, young people and adults we work with safe, and what everyone connected with Wissen-Haus must do if they have a concern.', 1000),
    ta('emergencyNotice', 'Emergency notice box', 'If someone is in immediate danger, contact your local emergency services first (for example 999 in the UK or the emergency number in your country), then tell us as soon as it is safe to do so. In the UK you can also call the NSPCC helpline on 0808 800 5000 or Childline on 0800 1111.', 600),
  ],
}
PAGE_COPY_SCHEMAS.push(SAFEGUARDING_SCHEMA)

export const PRIVACY_SCHEMA: PageCopySchema = {
  slug: 'privacy', label: 'Privacy Policy',
  fields: [
    t('title', 'Page title', 'Privacy Policy'),
    t('lastUpdated', 'Last updated', '30 September 2026', 40),
    ta('intro1', 'Opening paragraph', 'Wissen-Haus Empowerment Foundation (“Wissen-Haus,” “we,” “us,” or “our”) is a non-profit organisation founded in Ibadan, Nigeria, serving African youth, the diaspora, and international supporters. This Privacy Policy explains what personal information we collect through wissenhaus.org (the “Site”), how we use it, who we share it with, and the choices and rights you have.', 1000),
    ta('intro2', 'Second paragraph', 'By using the Site, creating an account, submitting a form, or making a donation, you agree to the collection and use of information as described in this policy. If you do not agree, please do not use the Site.', 600),
  ],
}
PAGE_COPY_SCHEMAS.push(PRIVACY_SCHEMA)

export const TERMS_SCHEMA: PageCopySchema = {
  slug: 'terms', label: 'Terms & Conditions',
  fields: [
    t('title', 'Page title', 'Terms & Conditions of Use'),
    t('lastUpdated', 'Last updated', '13 September 2026', 40),
    ta('intro', 'Opening paragraph', 'These Terms & Conditions of Use (“Terms”) govern your access to and use of wissenhaus.org (the “Site”), operated by Wissen-Haus Empowerment Foundation (“Wissen-Haus,” “we,” “us,” or “our”), a non-profit organisation founded in Ibadan, Nigeria. By accessing or using the Site, creating an account, submitting a form, or making a donation, you agree to be bound by these Terms. If you do not agree, please do not use the Site.', 1200),
  ],
}
PAGE_COPY_SCHEMAS.push(TERMS_SCHEMA)

export function pageCopySchemaFor(slug: string): PageCopySchema | undefined {
  return PAGE_COPY_SCHEMAS.find(s => s.slug === slug)
}
