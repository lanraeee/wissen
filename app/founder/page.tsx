import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import sql from '@/lib/db'

export const metadata: Metadata = {
  title: 'Meet the Founder · Wissen-Haus',
  description: 'Meet Benz Olagbaye, Founder and Executive Director of Wissen-Haus Youth Empowerment Foundation.',
}

interface FounderContent {
  name: string
  role: string
  quote: string
  paragraphs: string[]
}

const DEFAULT: FounderContent = {
  name: 'Benz Olagbaye',
  role: 'Founder & Executive Director',
  quote: 'I grew up watching brilliant young minds in Nigeria with unlimited potential, yet they had limited access to the right guidance, mentorship, and opportunities.',
  paragraphs: [
    "Year after year, I saw the same pattern: talented students excelling in classrooms yet struggling to bridge the gap between academic knowledge and real-world readiness. They knew what they wanted to achieve, but lacked the roadmap to get there. They had the desire to succeed, but didn't know which doors to knock on. It broke my heart then, and it still drives me today.",
    "Moving to the UK opened my eyes to a deeper truth about the real nature of the skills gap. It wasn't about intelligence or capability. The real issue was access. Young Nigerians deserve the same global exposure, career mentorship, and skill development opportunities as their peers anywhere in the world. They deserve more than just hope; they deserve a proven path to economic independence.",
    "That's why I founded Wissen-Haus.",
    "I started this foundation because I refused to accept that your zip code should limit your potential and determine your destiny. I've mentored over 50 young people, watching them grow into confident professionals who now lead their own journeys with belief in themselves and their abilities.",
    "Every member of the Wissen-Haus community is proof that when young people are equipped with the right skills, guidance, and belief in themselves, they don't just succeed—they transform their entire communities.",
    "This is just the beginning.",
  ],
}

async function getFounder(): Promise<FounderContent> {
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = 'founder_bio'`
    if (rows[0]?.value) return { ...DEFAULT, ...(rows[0].value as Partial<FounderContent>) }
  } catch {}
  return DEFAULT
}

export default async function FounderPage() {
  const founder = await getFounder()

  return (
    <section className="section" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
      <div className="wrap">
        <div className="section-head mb-l reveal">
          <span className="eyebrow">Meet the Founder</span>
        </div>
        <div className="founder">
          <div className="founder__media reveal--left">
            <div className="founder__cap">
              <b>{founder.name}</b>
              <span>{founder.role}</span>
            </div>
            <Image src="/img/Benzz.jpg" alt={`${founder.name}, ${founder.role}`} fill style={{ objectFit: 'cover', objectPosition: 'center 22%' }} />
          </div>
          <div className="founder__body reveal--right">
            <span className="quote-mark">&ldquo;</span>
            <p className="founder__lead">{founder.quote}</p>
            {founder.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <div className="founder__sign">
              <span className="founder__name">{founder.name}</span>
              <span className="founder__role">{founder.role}</span>
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/about/story" className="btn btn--ghost">Our Story</Link>
              <Link href="/volunteer" className="btn">Get Involved</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
