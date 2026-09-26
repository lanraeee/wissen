import type { Metadata } from 'next'
import CareerFairRegisterForm from '@/components/CareerFairRegisterForm'

export const metadata: Metadata = {
  title: 'Register · Career Clarity Fair · Wissen-Haus',
  description: 'Register for the Wissen-Haus Career Clarity Fair and get your personal booth guide.',
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
