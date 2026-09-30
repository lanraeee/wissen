import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import SupportTicketForm from '@/components/support/SupportTicketForm'

export const metadata: Metadata = pageMetadata({
  title: 'Support · Wissen-Haus',
  ogTitle: 'Get support from Wissen-Haus',
  description: 'Ask the Wissen-Haus team about courses, scholarships, the Career Clarity Fair or anything else. Open a ticket or chat with us.',
})

export default function SupportPage() {
  return (
    <section className="section section--tight" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <span className="eyebrow reveal">Support</span>
        <h1 className="display-lg mt-s reveal">How can we help?</h1>
        <p className="lead mt-s reveal" data-d="1">
          Send us a message and we&apos;ll reply by email and here on the site. You&apos;ll get a
          reference you can use to check back any time — no account needed.
        </p>
        <div className="mt-l">
          <SupportTicketForm />
        </div>
      </div>
    </section>
  )
}
