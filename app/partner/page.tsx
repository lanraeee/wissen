import type { Metadata } from 'next'
import Image from 'next/image'
import { pageMetadata } from '@/lib/seo'
import Link from 'next/link'
import PartnerForm from '@/components/PartnerForm'
import PartnersCarousel, { type Partner } from '@/components/PartnersCarousel'
import { getSiteContent } from '@/lib/site-content'
import { getPageCopy } from '@/lib/page-copy'
import { PARTNER_SCHEMA } from '@/lib/page-copy-schema'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'
import { getContactDetails } from '@/lib/contact-details'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getOgCopy(ogSchemaFor('partner')!))
}

export default async function PartnerPage() {
  const [partners, c, details] = await Promise.all([
    getSiteContent<Partner[]>('partners').then(p => p ?? []),
    getPageCopy(PARTNER_SCHEMA),
    getContactDetails(),
  ])
  return (
    <>
      <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
        <div className="wrap">
          <div className="split">
            <div className="reveal">
            <span className="eyebrow">{c.heroEyebrow}</span>
            <h1 className="display-lg mt-s">{c.heroTitle}</h1>
            <p className="lead mt-m">{c.heroLead}</p>
          </div>
            <div className="split__media reveal" data-d="1">
              <Image src="/img/partner-hero.jpg" alt="Two professionals in conversation across a meeting table in Lagos" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow">{c.modelsEyebrow}</span>
            <h2>{c.modelsHeading}</h2>
          </div>
          <div className="grid grid-3">
            <div className="feature reveal">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M6 12v4c0 1 2.7 3 6 3s6-2 6-3v-4" /></svg></div>
              <h3>{c.model1Title}</h3>
              <p>{c.model1Body}</p>
              <a href={`mailto:${details.primary_email}?subject=School Partnership Enquiry`} className="textlink">{c.model1LinkText}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            </div>
            <div className="feature reveal" data-d="1">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg></div>
              <h3>{c.model2Title}</h3>
              <p>{c.model2Body}</p>
              <a href={`mailto:${details.primary_email}?subject=Corporate Partnership Enquiry`} className="textlink">{c.model2LinkText}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            </div>
            <div className="feature reveal" data-d="2">
              <div className="feature__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9" /></svg></div>
              <h3>{c.model3Title}</h3>
              <p>{c.model3Body}</p>
              <Link href="/volunteer" className="textlink">{c.model3LinkText}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section panel-dark">
        <div className="wrap">
          <div className="section-head mb-l reveal">
            <span className="eyebrow eyebrow--light">{c.howEyebrow}</span>
            <h2>{c.howHeading}</h2>
          </div>
          <div className="steps">
            <div className="step reveal">
              <div className="step__n">01</div>
              <h4>{c.step1Title}</h4>
              <p>{c.step1Body}</p>
            </div>
            <div className="step reveal" data-d="1">
              <div className="step__n">02</div>
              <h4>{c.step2Title}</h4>
              <p>{c.step2Body}</p>
            </div>
            <div className="step reveal" data-d="2">
              <div className="step__n">03</div>
              <h4>{c.step3Title}</h4>
              <p>{c.step3Body}</p>
            </div>
            <div className="step reveal" data-d="3">
              <div className="step__n">04</div>
              <h4>{c.step4Title}</h4>
              <p>{c.step4Body}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="pattern-edge" aria-hidden="true" />

      <section className="section">
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">{c.partnersEyebrow}</span>
            <h2>{c.partnersHeading}</h2>
            <p className="lead mt-m">{c.partnersLead}</p>
          </div>

          <div className="reveal">
            <PartnersCarousel partners={partners} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head center mb-l reveal">
            <span className="eyebrow">{c.formEyebrow}</span>
            <h2>{c.formHeading}</h2>
          </div>
          <PartnerForm />
        </div>
      </section>
    </>
  )
}
