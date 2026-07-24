'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import '../career-assessment.css'

// ─── Types ──────────────────────────────────────────────────────────────────

type Phase = 'hero' | 'quiz' | 'results'
type CareerKey = 'pm' | 'da' | 'se' | 'ux' | 'sim' | 'te' | 'hp' | 'en' | 'mm' | 'fp' | 'cc' | 'pa'
type ScoreMap = Partial<Record<CareerKey, number>>

interface Career {
  title: string
  icon: string
  tagline: string
  description: string
  salary: string
  salaryNote: string
  growth: string
  growthColor: string
  skills: string[]
  link: string
}

interface Result {
  key: CareerKey
  score: number
  reasons: string[]
}

// ─── Questions ───────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    q: 'What area interests you most?',
    hint: 'Choose the field that genuinely excites you.',
    opts: [
      { label: 'Technology & Engineering', icon: '💻' },
      { label: 'Business & Finance', icon: '📊' },
      { label: 'Healthcare & Wellness', icon: '🏥' },
      { label: 'Creative Arts & Design', icon: '🎨' },
      { label: 'Social Impact & Community', icon: '🌍' },
    ],
  },
  {
    q: 'How do you prefer to work?',
    hint: 'Your ideal day-to-day environment.',
    opts: [
      { label: 'Remote — flexible & independent', icon: '🏠' },
      { label: 'Office — structured & collaborative', icon: '🏢' },
      { label: 'Hybrid — best of both worlds', icon: '⚡' },
      { label: 'Field — hands-on & community-facing', icon: '🌿' },
    ],
  },
  {
    q: 'Where are you in your career journey?',
    hint: 'Be honest — every stage has great opportunities.',
    opts: [
      { label: 'Just starting out', icon: '🌱' },
      { label: '2–5 years of experience', icon: '📈' },
      { label: 'Mid-career professional', icon: '🎯' },
      { label: 'Looking to transition', icon: '🔄' },
    ],
  },
  {
    q: 'How important is a high salary to you?',
    hint: 'Be honest — there\'s no wrong answer.',
    opts: [
      { label: 'Not a priority — mission over money', icon: '❤️' },
      { label: 'Moderate — decent pay is enough', icon: '✅' },
      { label: 'High — I want top earning potential', icon: '💎' },
    ],
  },
  {
    q: 'What work-life balance suits you best?',
    hint: 'Think about your ideal week, not just your ideal day.',
    opts: [
      { label: 'Flexible hours — work on my schedule', icon: '🕐' },
      { label: 'Standard 9–5 — clear boundaries', icon: '📅' },
      { label: 'Entrepreneurial — all-in on growth', icon: '🚀' },
    ],
  },
  {
    q: 'Which skills do you enjoy using most?',
    hint: 'Pick the one that energises you, not just what you\'re good at.',
    opts: [
      { label: 'People skills — connecting & empathising', icon: '🤝' },
      { label: 'Problem solving — logic & strategy', icon: '🧩' },
      { label: 'Creating — design, writing, making', icon: '✏️' },
      { label: 'Analysing — data, research & patterns', icon: '🔬' },
      { label: 'Leading — managing & inspiring teams', icon: '👑' },
    ],
  },
  {
    q: 'Where do you want your career to take you?',
    hint: 'Geographic ambition shapes which doors open fastest.',
    opts: [
      { label: 'Nigeria — local roots, local impact', icon: '🇳🇬' },
      { label: 'Africa — continental reach', icon: '🌍' },
      { label: 'Global — international teams & markets', icon: '✈️' },
    ],
  },
  {
    q: 'How do you learn best?',
    hint: 'The right career should match how you naturally grow.',
    opts: [
      { label: 'Hands-on — learning by doing', icon: '🔧' },
      { label: 'Classroom — structured lessons & exams', icon: '🎓' },
      { label: 'Self-paced — online & independent', icon: '💡' },
      { label: 'Mentorship — guided by experienced people', icon: '🧑‍🏫' },
    ],
  },
  {
    q: 'What is your risk tolerance?',
    hint: 'Risk and reward are always linked — know your comfort zone.',
    opts: [
      { label: 'Stable — secure, predictable career', icon: '🏛️' },
      { label: 'Startup — fast, risky, high reward', icon: '⚡' },
      { label: 'Flexible — somewhere in between', icon: '🌊' },
    ],
  },
  {
    q: 'What matters most to you in a career?',
    hint: 'Your core motivation shapes everything — career choice, performance, fulfilment.',
    opts: [
      { label: 'Impact — making a real difference', icon: '🌟' },
      { label: 'Income — maximising earnings', icon: '💰' },
      { label: 'Growth — rapid learning & progression', icon: '📈' },
      { label: 'Autonomy — being my own boss', icon: '🦅' },
      { label: 'Security — long-term stability', icon: '🛡️' },
    ],
  },
]

// ─── Scoring Matrix ───────────────────────────────────────────────────────────
// SCORING[questionIndex][answerIndex] = { careerKey: points }

const SCORING: ScoreMap[][] = [
  // Q0: Interest
  [
    { se: 3, da: 3, pm: 2, ux: 2 },
    { en: 3, mm: 2, fp: 2, pm: 2 },
    { hp: 3, te: 1 },
    { ux: 3, cc: 3, mm: 2 },
    { sim: 3, te: 2, pa: 3 },
  ],
  // Q1: Environment
  [
    { se: 2, cc: 2, da: 2, ux: 1 },
    { fp: 2, mm: 1, pa: 1 },
    { pm: 2, mm: 2, ux: 1 },
    { hp: 3, sim: 2, te: 1 },
  ],
  // Q2: Career stage (mild influence)
  [
    { te: 1, cc: 1, se: 1 },
    { da: 1, mm: 1, ux: 1 },
    { fp: 1, pm: 1, pa: 1 },
    { en: 1, sim: 1 },
  ],
  // Q3: Salary priority
  [
    { te: 1, sim: 1, cc: 1 },
    { ux: 1, mm: 1, pa: 1 },
    { se: 2, fp: 3, da: 2, hp: 2, pm: 2 },
  ],
  // Q4: Work-life balance
  [
    { cc: 2, se: 1, da: 1 },
    { fp: 2, te: 2, hp: 1 },
    { en: 3, mm: 1, pm: 1 },
  ],
  // Q5: Skills
  [
    { sim: 2, te: 3, hp: 2, mm: 2 },
    { se: 2, pm: 2, da: 2, ux: 1 },
    { ux: 2, cc: 3, mm: 2 },
    { da: 3, fp: 3, pa: 2, pm: 1 },
    { en: 2, pm: 2, sim: 2, mm: 1 },
  ],
  // Q6: Geography
  [
    { te: 1, fp: 1, hp: 1, sim: 1 },
    { pa: 2, sim: 2, en: 1 },
    { se: 2, cc: 2, ux: 1, da: 1 },
  ],
  // Q7: Learning style
  [
    { hp: 2, en: 2, ux: 1 },
    { te: 2, fp: 1, pa: 1 },
    { se: 2, cc: 2, da: 1 },
    { pm: 2, sim: 1, mm: 1 },
  ],
  // Q8: Risk tolerance
  [
    { hp: 2, te: 2, fp: 2, pa: 1 },
    { en: 3, pm: 2, se: 1 },
    { cc: 2, ux: 1, mm: 1, da: 1 },
  ],
  // Q9: What matters most
  [
    { sim: 3, te: 2, hp: 2, pa: 2 },
    { fp: 3, se: 2, da: 2, hp: 1 },
    { pm: 2, se: 2, mm: 2, da: 1 },
    { en: 3, cc: 2, ux: 1 },
    { fp: 2, hp: 2, te: 2, pa: 2 },
  ],
]

// ─── Match Signal Reasons ─────────────────────────────────────────────────────
// Key format: `${questionIndex}_${answerIndex}`  (only for scores >= 2)

const MATCH_SIGNALS: Record<CareerKey, Record<string, string>> = {
  pm: {
    '0_0': 'Your interest in technology gives you the credibility to work alongside engineering teams.',
    '0_1': 'A business mindset is the foundation of every great product decision.',
    '1_2': 'Hybrid environments suit PMs perfectly — balancing stakeholder meetings with deep strategy work.',
    '3_2': 'Your high salary focus aligns: Product Managers rank among the best-compensated roles in tech.',
    '4_2': 'Entrepreneurial energy drives exceptional product vision — you build like a founder.',
    '5_1': 'Problem solving is the daily currency of great Product Management.',
    '5_4': 'Natural leaders who align cross-functional teams around a vision are what this role demands.',
    '7_3': 'Mentorship-based growth mirrors how top PMs develop — learning from experienced product leaders.',
    '8_1': 'Startup appetite is an asset: the best PMs thrive in fast-moving, high-stakes environments.',
    '9_2': 'Growth-focused careers reward PMs quickly — paths to Director and CPO are well-defined.',
  },
  da: {
    '0_0': 'Interest in technology is the core foundation of a data analytics career.',
    '1_0': 'Remote data roles are among the most abundant fully-distributed positions globally.',
    '3_2': 'Skilled data analysts command competitive salaries — your high earning focus is achievable.',
    '4_0': 'Flexible hours are common in data roles, particularly remote positions.',
    '5_3': 'Analytical thinking is the number-one skill in data — you\'re already wired for this.',
    '7_2': 'Self-paced learners thrive in data analytics; the online resources are world-class.',
    '8_2': 'Flexible risk suits the growing data market — roles span every sector and company size.',
    '9_1': 'Income-focused drive aligns with data\'s strong and growing earning trajectory.',
    '9_2': 'Growth mindset fits perfectly: the data field evolves fast and rewards continuous learners.',
  },
  se: {
    '0_0': 'Deep interest in technology is the strongest predictor of engineering success.',
    '1_0': 'Remote software roles are the most globally abundant — your flexibility is a major advantage.',
    '3_2': 'Software engineers are among the highest-paid professionals in Nigeria and globally.',
    '4_0': 'Flexible hours are very common — many engineering teams are fully async.',
    '5_1': 'Software engineering is structured problem-solving at its finest.',
    '6_2': 'A global outlook opens doors to international remote roles and diaspora opportunities.',
    '7_2': 'Self-paced learners excel in engineering — the learning resources are limitless and free.',
    '8_1': 'Your startup appetite is perfect — Nigeria\'s tech ecosystem is growing fast.',
    '9_1': 'Income focus aligns strongly: software engineering leads Nigeria\'s pay rankings.',
    '9_2': 'A growth mindset will accelerate your path from junior to senior engineer.',
  },
  ux: {
    '0_0': 'Technology interest means you\'ll understand the systems you design interfaces for.',
    '0_3': 'Creative instincts are the foundation of exceptional UX/UI work.',
    '1_0': 'Remote UX roles are widely available with global product companies.',
    '1_2': 'Hybrid environments are typical for in-house designers collaborating with product teams.',
    '3_2': 'Senior UX designers command premium salaries — your high salary focus is achievable.',
    '5_1': 'Problem solving is fundamental to UX — you design solutions to human challenges.',
    '5_2': 'Your love of creating makes UX/UI design a natural and energising career.',
    '6_2': 'A global outlook opens doors: the best UX roles are with international product teams.',
    '9_3': 'Autonomy is common in design — you\'ll own the process from research to final screens.',
  },
  sim: {
    '0_4': 'Passion for social impact is the defining trait of great Social Impact Managers.',
    '1_3': 'Field-based community work is where social impact professionals create real change.',
    '5_0': 'People skills are your greatest asset — social impact work is 90% human connection.',
    '5_4': 'Leading teams toward a shared mission is the heart of social impact management.',
    '6_1': 'An Africa-wide vision expands your scope and influence as a social impact professional.',
    '7_3': 'Mentorship-based learning mirrors NGO culture — experience-sharing drives the sector.',
    '9_0': 'Impact-driven motivation is the core reason social impact professionals love their work.',
    '9_2': 'The NGO and social enterprise sector is growing fast, creating clear career trajectories.',
  },
  te: {
    '0_4': 'Social impact interest means you\'ll find deep fulfilment in shaping young people\'s futures.',
    '1_3': 'School and community environments are where great educators do their best work.',
    '3_2': 'Education leadership, edtech, and corporate training can meet high salary expectations.',
    '4_1': 'Standard school hours make teaching one of the best structured-schedule careers available.',
    '5_0': 'People skills are your competitive advantage — great teachers inspire through connection.',
    '7_1': 'Classroom-based learning suits the structured, evidence-based approach of education.',
    '8_0': 'Education is one of the most stable sectors — demand persists across all economic cycles.',
    '9_0': 'Impact is why most educators join — and stay in — the profession.',
    '9_4': 'Security-focused professionals find education reliably stable across economic cycles.',
  },
  hp: {
    '0_2': 'Healthcare interest is the clearest signal for this career path.',
    '1_3': 'Field work — hospitals, clinics, communities — is the daily rhythm of healthcare.',
    '3_2': 'Healthcare specialists in Nigeria and globally earn among the highest salaries available.',
    '4_1': 'Structured hours define hospital and clinical roles — predictable and professional.',
    '5_0': 'People skills are central to healthcare — it is built entirely on trust and empathy.',
    '7_0': 'Hands-on clinical learning is how healthcare professionals develop true mastery.',
    '8_0': 'Healthcare is one of the most recession-proof, stable sectors in existence.',
    '9_0': 'Few careers create impact as directly and immediately as healthcare.',
    '9_1': 'Income focus is well-placed: healthcare is one of the highest-earning career paths globally.',
    '9_4': 'Security: healthcare demand never drops — qualified professionals are always needed.',
  },
  en: {
    '0_1': 'Business interest combined with entrepreneurial drive is a powerful foundation.',
    '3_3': 'Career transitioners bring invaluable real-world experience to entrepreneurship.',
    '4_2': 'Entrepreneurial lifestyle means building something entirely on your own terms.',
    '5_4': 'Your drive to lead is what entrepreneurship rewards most — founders must inspire.',
    '6_1': 'Africa-wide ambition is exactly the mindset for building a scalable continental business.',
    '7_0': 'Hands-on learning is how entrepreneurs grow — every day in the field is a lesson.',
    '8_1': 'Startup appetite is the defining trait of founders — you embrace risk and uncertainty.',
    '9_3': 'Autonomy is the #1 reason people build their own companies — own your outcomes fully.',
  },
  mm: {
    '0_1': 'Business interest gives you the commercial lens every effective marketer needs.',
    '0_3': 'Creative instincts are the competitive edge separating great marketers from average ones.',
    '1_2': 'Hybrid roles dominate marketing — agency days and remote execution are the norm.',
    '3_2': 'Senior marketing managers earn well — your high salary drive is achievable.',
    '4_2': 'Entrepreneurial energy makes you a natural marketer — bold, curious, and action-oriented.',
    '5_0': 'People skills are at the root of effective brand building and customer connection.',
    '5_2': 'Your love of creating — campaigns, content, brand strategy — is the heart of marketing.',
    '8_1': 'Startup appetite means you\'ll thrive in fast-paced agencies and growth-marketing environments.',
    '9_2': 'A growth mindset is exactly how marketing careers accelerate — test, learn, scale.',
  },
  fp: {
    '0_1': 'Business and finance interest is the bedrock of this career path.',
    '1_1': 'Office-based roles are standard in banking, accounting, and financial services.',
    '3_2': 'Finance is one of the highest-earning sectors in Nigeria — your salary drive aligns.',
    '4_1': 'Structured hours define financial institutions — clear routines, clear rewards.',
    '5_3': 'Analytical skills are non-negotiable in finance — you\'ll use them every single day.',
    '7_1': 'Formal qualifications (ACCA, CFA, ICAN) follow a classroom model — ideal for your learning style.',
    '8_0': 'Finance is among the most stable, well-structured sectors with clear career ladders.',
    '9_1': 'Income maximisation is a core motivator in finance — the earning ceiling is genuinely high.',
    '9_4': 'Security: financial services is among the most stable employment sectors globally.',
  },
  cc: {
    '0_3': 'Creative interest is the core driver of successful content creation careers.',
    '1_0': 'Remote work is the default for most professional content creators today.',
    '3_2': 'High income is achievable: creators with engaged audiences earn significantly.',
    '4_0': 'Flexible hours are the number-one benefit of being a professional content creator.',
    '5_2': 'Your love of creating — writing, filming, podcasting — is the engine of this career.',
    '6_2': 'A global audience mindset will help you build audiences well beyond Nigeria.',
    '7_2': 'Self-paced learners thrive — content skills are best developed by making things daily.',
    '8_2': 'Flexible risk suits the variable but high-upside income nature of content creation.',
    '9_3': 'Autonomy is the ultimate reward: own your platform, your schedule, and your brand.',
  },
  pa: {
    '0_4': 'Social impact interest is a strong predictor of a fulfilling career in policy.',
    '1_1': 'Policy work is institution-based — government bodies, think tanks, and IGOs.',
    '3_1': 'Moderate salary expectations fit public sector roles; international positions pay well.',
    '5_3': 'Analytical skills are the backbone of policy research and advisory work.',
    '6_1': 'Africa-wide focus is especially valued — regional policy knowledge shapes real outcomes.',
    '7_1': 'Academic and classroom training is the standard pathway for policy professionals.',
    '8_0': 'Policy positions are typically stable — many are government or IGO-backed.',
    '9_0': 'Impact is the core motivation of policy advisors — shaping decisions that affect millions.',
    '9_4': 'Security: government and international organisation roles offer long-term stability.',
  },
}

// ─── Career Database ──────────────────────────────────────────────────────────

const CAREERS: Record<CareerKey, Career> = {
  pm: {
    title: 'Product Manager',
    icon: '🧭',
    tagline: 'Bridge business goals and technical execution',
    description: 'Product Managers own the vision and roadmap of a digital product. You\'ll collaborate with engineers, designers, and business stakeholders to ship features that users love and that drive revenue — sitting at the intersection of technology, business, and design.',
    salary: '₦300,000 – ₦800,000/month',
    salaryNote: 'Senior PMs at global tech companies earn significantly more in USD',
    growth: 'Very High',
    growthColor: '#16a34a',
    skills: ['Strategic thinking', 'Data analysis', 'User research', 'Agile & Scrum', 'Stakeholder communication', 'Roadmap prioritisation'],
    link: '/courses',
  },
  da: {
    title: 'Data Analyst',
    icon: '📊',
    tagline: 'Turn raw numbers into decisions that move businesses forward',
    description: 'Data Analysts collect, process, and interpret data to help organisations make smarter decisions. You\'ll build dashboards, run deep analyses, identify trends, and tell compelling stories with numbers that shape strategy.',
    salary: '₦200,000 – ₦600,000/month',
    salaryNote: 'Remote roles with international clients can earn 3–5× more',
    growth: 'High',
    growthColor: '#16a34a',
    skills: ['SQL', 'Excel & Google Sheets', 'Python or R', 'Data visualisation', 'Statistical analysis', 'Business intelligence tools'],
    link: '/courses',
  },
  se: {
    title: 'Software Engineer',
    icon: '💻',
    tagline: 'Build the digital products that millions of people rely on',
    description: 'Software Engineers design, build, and maintain software systems — from mobile apps to enterprise platforms. You\'ll write code that solves real problems at scale, collaborate in teams, and continuously learn as technology evolves.',
    salary: '₦300,000 – ₦1,200,000/month',
    salaryNote: 'Among the highest-earning careers in Nigeria\'s booming tech ecosystem',
    growth: 'Very High',
    growthColor: '#16a34a',
    skills: ['Programming (JavaScript, Python, etc.)', 'System design', 'Version control (Git)', 'Problem solving', 'Testing & debugging', 'Cloud platforms'],
    link: '/courses',
  },
  ux: {
    title: 'UX/UI Designer',
    icon: '🎨',
    tagline: 'Design digital experiences that people genuinely love using',
    description: 'UX/UI Designers create intuitive, beautiful digital interfaces. You\'ll conduct user research, build wireframes, create interactive prototypes, and collaborate closely with developers to ship polished, user-centred products.',
    salary: '₦200,000 – ₦700,000/month',
    salaryNote: 'Senior designers at global product companies command premium rates',
    growth: 'High',
    growthColor: '#16a34a',
    skills: ['Figma & Adobe XD', 'User research', 'Wireframing & prototyping', 'Visual design', 'Usability testing', 'Design systems'],
    link: '/courses',
  },
  sim: {
    title: 'Social Impact Manager',
    icon: '🌍',
    tagline: 'Lead programmes that transform communities at scale',
    description: 'Social Impact Managers design and run programmes at NGOs, foundations, and social enterprises. You\'ll manage projects, lead community teams, secure grants and partnerships, and rigorously measure your impact on people\'s lives.',
    salary: '₦150,000 – ₦400,000/month',
    salaryNote: 'International NGO and donor-funded positions often pay significantly higher',
    growth: 'Moderate',
    growthColor: '#d97706',
    skills: ['Programme management', 'Monitoring & evaluation', 'Grant writing', 'Community engagement', 'Stakeholder relations', 'Impact measurement'],
    link: '/community',
  },
  te: {
    title: 'Teacher / Educator',
    icon: '📚',
    tagline: 'Shape the next generation and build lasting human capital',
    description: 'Educators inspire, challenge, and develop people at every level. Beyond classroom teaching, the field spans curriculum development, edtech, education policy, corporate training, and mentorship — a career with genuine reach.',
    salary: '₦80,000 – ₦250,000/month',
    salaryNote: 'International schools, edtech platforms & corporate training pay significantly more',
    growth: 'Moderate',
    growthColor: '#d97706',
    skills: ['Curriculum design', 'Communication', 'Empathy & patience', 'Assessment methods', 'Digital tools for education', 'Classroom management'],
    link: '/community',
  },
  hp: {
    title: 'Healthcare Professional',
    icon: '🏥',
    tagline: 'Save lives, improve health outcomes, and serve communities',
    description: 'Healthcare spans medicine, nursing, pharmacy, physiotherapy, public health, and mental health. It\'s one of the most respected, stable, and globally portable careers available — and the demand for skilled professionals never drops.',
    salary: '₦150,000 – ₦500,000/month',
    salaryNote: 'Specialists and diaspora professionals earn significantly more; global demand is very high',
    growth: 'High',
    growthColor: '#16a34a',
    skills: ['Clinical knowledge', 'Patient care', 'Diagnostic reasoning', 'Communication', 'Teamwork', 'Continuous professional learning'],
    link: '/community',
  },
  en: {
    title: 'Entrepreneur',
    icon: '🚀',
    tagline: 'Build something from nothing and create your own future',
    description: 'Entrepreneurs identify problems and build solutions — businesses, products, and services that create value. It requires resilience, creativity, and appetite for risk, but the freedom and rewards are genuinely unlimited.',
    salary: 'Variable — ₦0 to unlimited',
    salaryNote: 'Nigeria\'s startup ecosystem is growing fast; funding and exit opportunities are expanding',
    growth: 'High (if it works)',
    growthColor: '#16a34a',
    skills: ['Problem identification', 'Business model design', 'Sales & marketing', 'Financial management', 'Leadership & team building', 'Resilience & grit'],
    link: '/community',
  },
  mm: {
    title: 'Marketing Manager',
    icon: '📣',
    tagline: 'Build brands, capture audiences, and drive business growth',
    description: 'Marketing Managers develop and execute strategies to reach customers and grow revenue. You\'ll own campaigns, manage budgets, analyse performance data, and build brand identity across digital and physical channels.',
    salary: '₦200,000 – ₦600,000/month',
    salaryNote: 'Performance marketers and brand strategists at large companies earn above this range',
    growth: 'High',
    growthColor: '#16a34a',
    skills: ['Brand strategy', 'Digital marketing', 'Content creation', 'Analytics & reporting', 'Campaign management', 'Social media'],
    link: '/community',
  },
  fp: {
    title: 'Finance Professional',
    icon: '💹',
    tagline: 'Manage money, build wealth, and drive financial strategy',
    description: 'Finance professionals work in banking, investment, accounting, and corporate finance. You\'ll manage financial reporting, investment portfolios, risk analysis, and help businesses make smarter financial decisions.',
    salary: '₦250,000 – ₦800,000/month',
    salaryNote: 'Investment banking and financial services in Lagos often exceed this range',
    growth: 'High',
    growthColor: '#16a34a',
    skills: ['Financial modelling', 'Accounting principles', 'Risk management', 'Excel & financial tools', 'Regulatory knowledge', 'Investment analysis'],
    link: '/community',
  },
  cc: {
    title: 'Content Creator',
    icon: '🎬',
    tagline: 'Build audiences, tell stories, and turn creativity into income',
    description: 'Content Creators build loyal audiences through video, writing, podcasting, photography, and social media. It\'s one of the fastest-growing career paths globally, with multiple and stackable monetisation models.',
    salary: '₦100,000 – ₦500,000/month',
    salaryNote: 'Top creators earn multiples of this via brand deals, courses & subscriptions',
    growth: 'Very High',
    growthColor: '#16a34a',
    skills: ['Storytelling', 'Video production', 'Copywriting', 'Social media strategy', 'Personal branding', 'Audience building & analytics'],
    link: '/community',
  },
  pa: {
    title: 'Policy Advisor',
    icon: '🏛️',
    tagline: 'Shape laws and decisions that affect millions of lives',
    description: 'Policy Advisors research, analyse, and recommend solutions to public problems. You\'ll work in government, think tanks, NGOs, or international organisations — influencing the decisions that shape economies, health, and opportunity.',
    salary: '₦200,000 – ₦600,000/month',
    salaryNote: 'International organisations (UN, World Bank, AfDB) pay significantly more',
    growth: 'Moderate',
    growthColor: '#d97706',
    skills: ['Policy research & analysis', 'Report & brief writing', 'Stakeholder engagement', 'Economics & statistics', 'Communication', 'Critical thinking'],
    link: '/policy-research',
  },
}

// ─── Scoring Engine ────────────────────────────────────────────────────────────

function computeResults(answers: number[]): Result[] {
  const scores: Partial<Record<CareerKey, number>> = {}

  answers.forEach((ansIdx, qIdx) => {
    const scoreMap = SCORING[qIdx]?.[ansIdx] ?? {}
    for (const [key, pts] of Object.entries(scoreMap)) {
      const k = key as CareerKey
      scores[k] = (scores[k] ?? 0) + (pts ?? 0)
    }
  })

  const allKeys = Object.keys(CAREERS) as CareerKey[]
  return allKeys
    .map((key) => {
      const score = scores[key] ?? 0
      const reasons: string[] = []
      answers.forEach((ansIdx, qIdx) => {
        const pts = SCORING[qIdx]?.[ansIdx]?.[key] ?? 0
        if (pts >= 2) {
          const signal = MATCH_SIGNALS[key]?.[`${qIdx}_${ansIdx}`]
          if (signal && !reasons.includes(signal)) reasons.push(signal)
        }
      })
      if (reasons.length === 0) {
        reasons.push(`Your combination of interests, skills, and goals aligns well with a career as a ${CAREERS[key].title}.`)
      }
      return { key, score, reasons: reasons.slice(0, 3) }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

// ─── SVG Arrow ─────────────────────────────────────────────────────────────────

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="1em" height="1em">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ─── Component ────────────────────────────────────────────────────────────────

export default function CareerAssessmentPage() {
  const [phase, setPhase] = useState<Phase>('hero')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [results, setResults] = useState<Result[] | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  // Restore completed results from localStorage on mount
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('wh_assessmentResults')
      if (saved) {
        const parsed = JSON.parse(saved) as Result[]
        setResults(parsed)
        setPhase('results')
      }
    } catch {}
  }, [])

  // Persist results
  useEffect(() => {
    if (!mounted || !results) return
    try {
      localStorage.setItem('wh_assessmentResults', JSON.stringify(results))
      localStorage.setItem('wh_assessmentAnswers', JSON.stringify(answers))
    } catch {}
  }, [results, answers, mounted])

  function handleStart() {
    setPhase('quiz')
    setStep(0)
    setAnswers([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleAnswer(answerIdx: number) {
    const newAnswers = [...answers, answerIdx]
    setAnswers(newAnswers)
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const r = computeResults(newAnswers)
      setResults(r)
      setPhase('results')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleBack() {
    if (step === 0) { setPhase('hero'); return }
    setStep(step - 1)
    setAnswers(answers.slice(0, -1))
  }

  const handleRetake = useCallback(() => {
    try { localStorage.removeItem('wh_assessmentResults'); localStorage.removeItem('wh_assessmentAnswers') } catch {}
    setResults(null)
    setAnswers([])
    setStep(0)
    setPhase('hero')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const progress = Math.round(((step + 1) / QUESTIONS.length) * 100)
  const q = QUESTIONS[step]

  // ── HERO ──
  if (phase === 'hero') return (
    <div className="ca-page">
      <section className="ca-hero">
        <div className="ca-hero__blob ca-hero__blob--1" />
        <div className="ca-hero__blob ca-hero__blob--2" />
        <div className="wrap ca-hero__inner">
          <div className="ca-hero__copy">
            <span className="eyebrow">Career Assessment</span>
            <h1 className="display-lg ca-hero__h1">Discover Your Ideal<br />Career Path</h1>
            <p className="lead ca-hero__lead">
              Answer 10 quick questions. Get personalised career recommendations based on your interests, skills, and goals.
            </p>
            <div className="ca-trust">
              <span className="ca-trust__pill">⏱ Takes 5 minutes</span>
              <span className="ca-trust__pill">📋 10 questions</span>
              <span className="ca-trust__pill">🎯 12 career profiles</span>
            </div>
            <div className="ca-hero__cta">
              <button className="btn btn--lg" onClick={handleStart}>
                Start the Assessment <Arrow />
              </button>
              {mounted && results && (
                <button className="btn btn--ghost" onClick={() => setPhase('results')}>
                  View my results
                </button>
              )}
            </div>
          </div>
          <div className="ca-hero__visual" aria-hidden="true">
            <div className="ca-visual-card ca-visual-card--1">
              <span className="ca-visual-card__icon">💻</span>
              <span>Software Engineer</span>
            </div>
            <div className="ca-visual-card ca-visual-card--2">
              <span className="ca-visual-card__icon">🎨</span>
              <span>UX/UI Designer</span>
            </div>
            <div className="ca-visual-card ca-visual-card--3">
              <span className="ca-visual-card__icon">📊</span>
              <span>Data Analyst</span>
            </div>
            <div className="ca-visual-card ca-visual-card--4">
              <span className="ca-visual-card__icon">🚀</span>
              <span>Entrepreneur</span>
            </div>
            <div className="ca-visual-centerpiece">
              <span>12</span>
              <small>Career<br />Paths</small>
            </div>
          </div>
        </div>
      </section>

      <section className="ca-how section--tight">
        <div className="wrap">
          <div className="ca-how__head">
            <span className="eyebrow">How it works</span>
            <h2 className="ca-how__h2">Three steps to your career match</h2>
          </div>
          <div className="ca-how__steps">
            {[
              { n: '01', title: 'Answer 10 questions', body: 'Quick card-based questions about your interests, skills, and priorities. No right or wrong answers.' },
              { n: '02', title: 'Get your top 3 matches', body: 'Our algorithm maps your answers to 12 career profiles and surfaces the paths that fit you best.' },
              { n: '03', title: 'Explore & take action', body: 'For each match, see salary ranges, required skills, and direct links to courses and opportunities.' },
            ].map(s => (
              <div key={s.n} className="ca-step">
                <div className="ca-step__num">{s.n}</div>
                <h3 className="ca-step__title">{s.title}</h3>
                <p className="ca-step__body">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="ca-how__cta">
            <button className="btn btn--lg" onClick={handleStart}>
              Begin — it&rsquo;s free <Arrow />
            </button>
          </div>
        </div>
      </section>
    </div>
  )

  // ── QUIZ ──
  if (phase === 'quiz') return (
    <div className="ca-page">
      <section className="ca-quiz">
        <div className="wrap ca-quiz__wrap">

          {/* Progress */}
          <div className="ca-progress">
            <div className="ca-progress__bar">
              <div className="ca-progress__fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="ca-progress__meta">
              <button className="ca-back" onClick={handleBack}>
                ← {step === 0 ? 'Back' : 'Previous'}
              </button>
              <span className="ca-progress__label">{step + 1} of {QUESTIONS.length}</span>
            </div>
          </div>

          {/* Question */}
          <div className="ca-question">
            <p className="ca-question__hint">{q.hint}</p>
            <h2 className="ca-question__q">{q.q}</h2>
          </div>

          {/* Answers */}
          <div className={`ca-options ca-options--${q.opts.length > 4 ? '5' : q.opts.length}`}>
            {q.opts.map((opt, i) => (
              <button
                key={opt.label}
                className="ca-opt"
                onClick={() => handleAnswer(i)}
              >
                <span className="ca-opt__icon">{opt.icon}</span>
                <span className="ca-opt__label">{opt.label}</span>
                <span className="ca-opt__arrow"><Arrow /></span>
              </button>
            ))}
          </div>

        </div>
      </section>
    </div>
  )

  // ── RESULTS ──
  if (phase === 'results' && results) return (
    <div className="ca-page">
      {/* Results header */}
      <section className="ca-results-hero">
        <div className="wrap ca-results-hero__inner">
          <span className="eyebrow eyebrow--light">Your Results</span>
          <h1 className="ca-results-hero__h1">Your Top 3 Career Paths</h1>
          <p className="ca-results-hero__sub">
            Based on your answers, here are the careers that fit your interests, skills, and goals best.
          </p>
        </div>
      </section>

      {/* Career cards */}
      <section className="ca-results section--tight">
        <div className="wrap">
          {results.map((r, rank) => {
            const career = CAREERS[r.key]
            return (
              <div key={r.key} className={`ca-career-card ${rank === 0 ? 'ca-career-card--top' : ''}`}>
                {rank === 0 && <div className="ca-career-card__badge">Best Match</div>}
                <div className="ca-career-card__header">
                  <div className="ca-career-card__icon">{career.icon}</div>
                  <div className="ca-career-card__meta">
                    <span className="ca-career-card__rank">#{rank + 1} Match</span>
                    <h2 className="ca-career-card__title">{career.title}</h2>
                    <p className="ca-career-card__tagline">{career.tagline}</p>
                  </div>
                  <div className="ca-career-card__salary-block">
                    <span className="ca-career-card__salary-label">Typical salary (Nigeria)</span>
                    <span className="ca-career-card__salary">{career.salary}</span>
                    <span className="ca-career-card__salary-note">{career.salaryNote}</span>
                  </div>
                </div>

                <div className="ca-career-card__body">
                  <div className="ca-career-card__section">
                    <h3 className="ca-career-card__section-title">About this career</h3>
                    <p className="ca-career-card__desc">{career.description}</p>
                  </div>

                  <div className="ca-career-card__section">
                    <h3 className="ca-career-card__section-title">Why it matches you</h3>
                    <ul className="ca-reasons">
                      {r.reasons.map((reason, i) => (
                        <li key={i} className="ca-reason">
                          <span className="ca-reason__dot" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="ca-career-card__cols">
                    <div className="ca-career-card__section">
                      <h3 className="ca-career-card__section-title">Required skills</h3>
                      <ul className="ca-skills">
                        {career.skills.map(s => <li key={s} className="ca-skill">{s}</li>)}
                      </ul>
                    </div>
                    <div className="ca-career-card__section">
                      <h3 className="ca-career-card__section-title">Growth potential</h3>
                      <div className="ca-growth" style={{ color: career.growthColor }}>
                        <span className="ca-growth__dot" style={{ background: career.growthColor }} />
                        {career.growth}
                      </div>
                    </div>
                  </div>

                  <div className="ca-career-card__actions">
                    <Link href={career.link} className="btn">
                      Explore resources <Arrow />
                    </Link>
                    <Link href="/jobs" className="btn btn--ghost">Browse related jobs</Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Next steps */}
      <section className="ca-next section panel-dark">
        <div className="wrap">
          <div className="ca-next__head">
            <span className="eyebrow eyebrow--light">What&rsquo;s next</span>
            <h2 className="ca-next__h2">Turn insight into action</h2>
          </div>
          <div className="ca-next__grid">
            {[
              { icon: '📚', title: 'Browse Courses', body: 'Start learning the skills your matched careers need.', href: '/courses', label: 'View courses' },
              { icon: '💼', title: 'Explore Opportunities', body: 'Jobs, internships, scholarships and competitions.', href: '/jobs', label: 'Find opportunities' },
              { icon: '👥', title: 'Join the Community', body: 'Connect with peers on similar career paths.', href: '/community', label: 'Join now' },
              { icon: '🧑‍🏫', title: 'Talk to a Mentor', body: 'Get guidance from professionals in your matched fields.', href: '/volunteer', label: 'Find a mentor' },
            ].map(card => (
              <div key={card.title} className="ca-next-card">
                <div className="ca-next-card__icon">{card.icon}</div>
                <h3 className="ca-next-card__title">{card.title}</h3>
                <p className="ca-next-card__body">{card.body}</p>
                <Link href={card.href} className="textlink" style={{ color: 'var(--gold)' }}>
                  {card.label} <Arrow />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Retake + FAQ */}
      <section className="ca-footer-section section--tight">
        <div className="wrap ca-footer-section__inner">

          <div className="ca-testimonial">
            <p className="ca-testimonial__quote">
              &ldquo;The assessment showed me that my love of people skills and social impact pointed to Social Impact Management — I had no idea that was even a career. Now I have a clear direction.&rdquo;
            </p>
            <div className="ca-testimonial__author">
              <strong>Amara Okonkwo</strong>
              <span>SS3 Student, Government College Ibadan</span>
            </div>
          </div>

          <div className="ca-faq">
            <h2 className="ca-faq__h2">Still unsure?</h2>
            {[
              {
                q: 'Can I retake the assessment?',
                a: 'Yes — click the button below to restart with fresh answers. Your previous results will be cleared.',
              },
              {
                q: 'What if I relate to more than one result?',
                a: 'That\'s completely normal. Many careers overlap — a Content Creator also needs Marketing skills; a Product Manager needs both Tech and Business literacy. Explore all three results and look for the common threads.',
              },
              {
                q: 'How do I get started in any of these careers?',
                a: 'Browse our free courses, explore open opportunities, and connect with a mentor who is already working in the field. Everything is available in the links above.',
              },
            ].map((faq, i) => (
              <div key={i} className={`ca-faq__item ${openFaq === i ? 'open' : ''}`}>
                <button
                  className="ca-faq__q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <span className="ca-faq__chevron">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <p className="ca-faq__a">{faq.a}</p>}
              </div>
            ))}
          </div>

          <div className="ca-retake">
            <p>Not happy with your results?</p>
            <button className="btn btn--ghost" onClick={handleRetake}>
              Retake Assessment
            </button>
          </div>

        </div>
      </section>
    </div>
  )

  return null
}
