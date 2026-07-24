import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Career Clarity Trade Fair · Wissen-Haus',
  description: 'A one-day career exploration fair for secondary school students. Meet professionals, explore careers, and discover your path.',
}

export default function BootcampPage() {
  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="eyebrow">Programmes · Trade Fair</span>
              <h1 className="display-lg mt-s">Career Clarity Trade Fair</h1>
              <p className="lead mt-m">A one-day career exploration fair open to all secondary school students in Ibadan — from JS1 to SS3. Meet real professionals, explore careers you&#39;ve never heard of, and leave with a clear direction.</p>
              <div className="hero-cta mt-m">
                <Link href="/volunteer" className="btn btn--lg">Bring it to your school</Link>
                <Link href="/donate" className="btn btn--ghost">Support the Fair</Link>
              </div>
            </div>
            <div className="split__media reveal" data-d="1">
              <Image src="/img/prog-bootcamp.jpg" alt="Students at the Wissen-Haus Career Clarity Trade Fair" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">Who Should Apply</span>
            <h2>This Fair is for every secondary school student who has questions about their future.</h2>
          </div>
          <div className="grid grid-3">
            <div className="feature reveal">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M6 12v4c0 1 2.7 3 6 3s6-2 6-3v-4" /></svg></div>
              <h3>All Secondary School Students</h3>
              <p>From JS1 to SS3 — whether you&apos;re choosing subjects, thinking about university, or taking your first career steps. The earlier, the better.</p>
            </div>
            <div className="feature reveal" data-d="1">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9" /></svg></div>
              <h3>The Undecided</h3>
              <p>If you have no idea what career path to pursue, this is the most important day you can spend. Come with questions.</p>
            </div>
            <div className="feature reveal" data-d="2">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></svg></div>
              <h3>The Ambitious</h3>
              <p>You know what you want but don&#39;t know how to get there. The Trade Fair connects you with professionals who have already walked the path.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section panel-dark">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow eyebrow--light">How It Works</span>
            <h2>What happens at the Trade Fair</h2>
          </div>
          <div className="steps">
            <div className="step reveal">
              <div className="step__n">01</div>
              <h4>Arrive &amp; Explore</h4>
              <p>Browse booths representing 20+ career paths from tech to healthcare to media.</p>
            </div>
            <div className="step reveal" data-d="1">
              <div className="step__n">02</div>
              <h4>Meet the Pros</h4>
              <p>Have real conversations with professionals. Ask the questions you couldn&#39;t ask a teacher.</p>
            </div>
            <div className="step reveal" data-d="2">
              <div className="step__n">03</div>
              <h4>Skills Tasters</h4>
              <p>Participate in short hands-on workshops and skill demonstrations.</p>
            </div>
            <div className="step reveal" data-d="3">
              <div className="step__n">04</div>
              <h4>Leave with a Plan</h4>
              <p>Get your personalised career direction worksheet and connect with a mentor.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="cta-band reveal">
            <h2>Bring the Trade Fair to your school.</h2>
            <p className="lead">We partner with schools across Ibadan and beyond. If you&#39;re a teacher, administrator, or parent — reach out and let&#39;s talk.</p>
            <div className="cta-actions">
              <Link href="/partner" className="btn btn--light btn--lg">Partner with us</Link>
              <Link href="/donate" className="btn btn--outline-light btn--lg">Sponsor a Fair</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
