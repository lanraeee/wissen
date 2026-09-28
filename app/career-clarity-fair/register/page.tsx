import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import CareerFairRegisterForm from '@/components/CareerFairRegisterForm'
import { getOgCopy } from '@/lib/og'
import { ogSchemaFor } from '@/lib/og-schema'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getOgCopy(ogSchemaFor('career-clarity-fair-register')!))
}

export default function CareerFairRegisterPage() {
  return (
    <section className="section" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
      <div className="wrap">
        <div className="section-head center mb-l reveal">
          <span className="eyebrow">Career Clarity Fair</span>
          <h1 className="display-lg mt-s">Register to attend</h1>
          <p className="lead mt-m">Tell us a bit about yourself and we&apos;ll point you to the booths that matter most for where you want to go.</p>
        </div>
        <CareerFairRegisterForm />
      </div>
    </section>
  )
}
