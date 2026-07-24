import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Wissen-Haus Youth Empowerment Foundation · Bridging the Skills Gap',
  description: 'We equip Nigerian youth with practical skills, mentorship and global exposure for economic independence. 500+ students reached in our first year across Ibadan.',
  openGraph: {
    title: 'Wissen-Haus — Bridging the Skills Gap in Nigeria',
    description: 'Empowering young Nigerians with practical career skills, mentorship, and global exposure. 500+ students reached across Ibadan.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Wissen-Haus Youth Empowerment Foundation' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wissen-Haus — Bridging the Skills Gap in Nigeria',
    description: 'Empowering young Nigerians with practical career skills, mentorship, and global exposure.',
    images: ['/opengraph-image'],
  },
}

const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <span className="blob blob--green" />
        <span className="blob blob--red" />
        <div className="wrap wrap-wide">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="eyebrow reveal">Ibadan, Nigeria · Est. 2025</span>
              <h1 className="display-xl mt-s reveal-words">Your Roadmap to<br />Opportunity Starts Here.</h1>
              <p className="lead mt-s reveal" data-d="1">
                Confused about what&#39;s next? Don&#39;t know where to start? We&#39;ve built resources that help you discover careers that match your interests, understand what it takes to succeed, and connect with people doing the work you&#39;re curious about.
              </p>
              <div className="hero-cta reveal" data-d="2">
                <Link href="/career-pathways" className="btn btn--lg mag">
                  Take the Career Assessment {ARROW}
                </Link>
              </div>
            </div>
            <div className="hero-media reveal--scale tilt" data-d="2">
              <span className="hero-ring hero-ring--1" />
              <span className="hero-ring hero-ring--2" />
              <div className="frame tilt-inner shine">
                <Image src="/img/hero-students.jpg" alt="Nigerian secondary school students smiling in class" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className="hero-badge hero-badge--tl">
                <span className="n" data-count="500" data-suffix="+">500+</span>
                <span className="t">students reached</span>
              </div>
              <div className="hero-badge hero-badge--br">
                <span className="n" data-count="15" data-suffix="+">15+</span>
                <span className="t">school partnerships</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          <span>Career Guidance</span><span>Global Exposure</span><span>Mentorship</span><span>Economic Independence</span><span>Digital Skills</span><span>Social Impact</span>
          <span>Career Guidance</span><span>Global Exposure</span><span>Mentorship</span><span>Economic Independence</span><span>Digital Skills</span><span>Social Impact</span>
        </div>
      </div>

      {/* MISSION */}
      <section className="section" id="mission">
        <div className="wrap">
          <div className="split">
            <div className="reveal--left">
              <span className="section-index">01 · Our Mission</span>
              <h2 className="mt-s">Every young Nigerian deserves the tools to thrive.</h2>
            </div>
            <div className="reveal--right">
              <p className="lead">We are dedicated to bridging the skills gap in Nigeria by equipping young people with practical career guidance and global exposure. Our mission is to empower the next generation through economic independence and social impact, ensuring every young Nigerian has the tools to thrive.</p>
              <Link href="/about" className="textlink mt-m">Read our story {ARROW}</Link>
            </div>
          </div>
          <div className="stats mt-l stagger">
            <div className="stat"><div className="num" data-count="500" data-suffix="+">500+</div><div className="lbl">Students Reached</div></div>
            <div className="stat"><div className="num" data-count="30" data-suffix="+">30+</div><div className="lbl">Mentors Involved</div></div>
            <div className="stat"><div className="num" data-count="15" data-suffix="+">15+</div><div className="lbl">School Partnerships</div></div>
            <div className="stat"><div className="num" data-count="1" data-suffix="">1</div><div className="lbl">Year Since Launch</div></div>
          </div>
        </div>
      </section>

      {/* FEATURED PROGRAMMES */}
      <section className="section panel-dark">
        <div className="wrap">
          <div className="head-row mb-l reveal">
            <div className="section-head">
              <span className="eyebrow eyebrow--light">Our Featured Programmes</span>
              <h2>Three ways we build career-ready futures.</h2>
            </div>
            <Link href="/programmes" className="btn btn--outline-light">All programmes</Link>
          </div>
          <div className="grid grid-3">
            <article className="card reveal">
              <div className="card__media">
                <span className="card__tag">Trade Fair</span>
                <Image src="/img/prog-bootcamp.jpg" alt="Trade Fair students" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className="card__body">
                <span className="card__num">01</span>
                <h3>Trade Fair</h3>
                <p>A one-day career exploration fair for all secondary school students in Ibadan. Meet professionals, explore diverse careers, and discover your path forward.</p>
                <Link href="/programmes" className="textlink">Learn more {ARROW}</Link>
              </div>
            </article>
            <article className="card reveal" data-d="1">
              <div className="card__media">
                <span className="card__tag">Podcast</span>
                <Image src="/img/prog-podcast.jpg" alt="Opportunity Blueprint podcast recording" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className="card__body">
                <span className="card__num">02</span>
                <h3>Opportunity Blueprint</h3>
                <p>Weekly insights and career guidance from our experts, bridging the skills gap through global exposure.</p>
                <Link href="/podcast" className="textlink">Listen now {ARROW}</Link>
              </div>
            </article>
            <article className="card reveal" data-d="2">
              <div className="card__media">
                <span className="card__tag">Storytelling</span>
                <Image src="/img/prog-impact.jpg" alt="Impact content and community initiatives" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className="card__body">
                <span className="card__num">03</span>
                <h3>Impact Content</h3>
                <p>Empowering Nigerian youth through social-impact storytelling and community-driven initiatives.</p>
                <Link href="/impact-content" className="textlink">Explore more {ARROW}</Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* CAREER HUB RESOURCES */}
      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">What We Offer</span>
            <h2>Three ways to get started.</h2>
          </div>
          <div className="grid grid-3">
            <div className="feature reveal">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M21 10v5" /><path d="M6 12v4c0 1 2.7 3 6 3s6-2 6-3v-4" /></svg>
              </div>
              <h3>Discover Career Pathways</h3>
              <p>Explore tech, business, media, entrepreneurship, healthcare, and social impact. For each path, we explain what the job actually is, the skills you need, realistic salary ranges in Nigeria, and how to get started today.</p>
            </div>
            <div className="feature reveal" data-d="1">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" /></svg>
              </div>
              <h3>See Global Opportunities</h3>
              <p>Remote jobs, international scholarships, visa-sponsored roles. Learn how to position yourself to compete globally—all while building your career in Nigeria.</p>
            </div>
            <div className="feature reveal" data-d="2">
              <div className="feature__ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9" /></svg>
              </div>
              <h3>Get Real Mentorship</h3>
              <p>Connect with professionals who&#39;ve been where you are. Get answers to real questions, learn from their mistakes, and get accountability from people who care about your success.</p>
            </div>
          </div>
          <div className="hero-cta mt-l reveal">
            <Link href="/community" className="btn">Explore the Community Hub</Link>
          </div>
        </div>
      </section>

      {/* INSTAGRAM REEL */}
      <section className="section video-band">
        <div className="wrap">
          <div className="video-grid">
            <div className="reveal--left">
              <span className="eyebrow eyebrow--light">Watch · @wissen_haus</span>
              <h2 className="mt-s">See the movement in motion.</h2>
              <p className="lead mt-s">Real students, real mentors, real impact. Get a glimpse of Wissen-Haus in action and the young people bridging their own skills gap.</p>
              <div className="hero-cta mt-m">
                <a href="https://www.instagram.com/reel/DaGV76FIV2u/" target="_blank" rel="noopener noreferrer" className="btn btn--light btn--lg mag">
                  Watch on Instagram {ARROW}
                </a>
                <a href="https://www.instagram.com/wissen_haus/" target="_blank" rel="noopener noreferrer" className="btn btn--outline-light btn--lg">Follow us</a>
              </div>
            </div>
            <div className="reveal--right">
              <div className="reel-frame">
                <span className="reel-frame__ring" />
                <iframe
                  src="https://www.instagram.com/reel/DaGV76FIV2u/embed/"
                  title="Wissen-Haus on Instagram"
                  loading="lazy"
                  scrolling="no"
                  allowTransparency={true}
                  allow="encrypted-media; clipboard-write"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POLICY */}
      <section className="section section--tight">
        <div className="wrap">
          <div className="split split--reverse">
            <div className="split__media reveal" data-d="1">
              <Image src="/img/students-2.jpg" alt="Students engaged in learning and research" fill style={{ objectFit: 'cover' }} />
            </div>
            <div className="reveal">
              <span className="section-index">02 · Policy &amp; Research</span>
              <h2 className="mt-s">Evidence for the future of work.</h2>
              <p className="lead mt-s">We publish comprehensive policy papers and research reports focused on the future of work, youth economic independence, and global exposure for Nigerian students.</p>
              <Link href="/policy-research" className="btn mt-m">
                View papers {ARROW}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="section panel-dark">
        <div className="wrap center">
          <span className="quote-mark reveal">&ldquo;</span>
          <p className="quote-lg reveal" style={{ color: '#fff', maxWidth: '20ch', marginInline: 'auto' }}>The search for real results is over at last.</p>
          <div className="mt-m reveal" data-d="1">
            <div className="testi__name" style={{ color: 'var(--gold)' }}>Chidi Okoro</div>
            <div className="testi__role">Senior Secondary Student &amp; Volunteer</div>
          </div>
          <div className="cta-actions reveal" data-d="2">
            <Link href="/impact" className="btn btn--light">Read impact stories</Link>
          </div>
        </div>
      </section>

      {/* GET INVOLVED CTA */}
      <section className="section">
        <div className="wrap">
          <div className="cta-band reveal">
            <span className="eyebrow" style={{ color: '#fff' }}><span style={{ background: '#fff' }} />Get Involved</span>
            <h2 className="mt-s">Help us empower Nigeria&#39;s next generation.</h2>
            <p className="lead">Mentor a student, partner your institution, or fuel the mission with a gift. Every hour and every naira moves a young person closer to economic independence.</p>
            <div className="cta-actions">
              <Link href="/volunteer" className="btn btn--light btn--lg">Volunteer with us</Link>
              <Link href="/donate" className="btn btn--outline-light btn--lg">Donate</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
