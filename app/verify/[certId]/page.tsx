import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { COURSES } from '@/lib/courseData'
import sql from '@/lib/db'

interface Props {
  params: Promise<{ certId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certId } = await params
  const [row] = await sql`
    SELECT c.course_id, u.first_name || ' ' || u.last_name AS name FROM certificates c
    JOIN users u ON u.id = c.user_id
    WHERE c.certificate_id = ${certId}
  `
  if (!row) return { title: 'Certificate Not Found — Wissen-Haus' }
  const course = COURSES.find(c => c.id === row.course_id as string)
  return {
    title: `Certificate Verified — ${course?.title ?? 'Wissen-Haus'}`,
    description: `This certificate issued to ${row.name as string} by Wissen-Haus Youth Empowerment Foundation has been verified as authentic.`,
  }
}

export default async function VerifyCertPage({ params }: Props) {
  const { certId } = await params

  const [row] = await sql`
    SELECT c.certificate_id, c.course_id, c.issued_at,
           u.first_name || ' ' || u.last_name AS name
    FROM certificates c
    JOIN users u ON u.id = c.user_id
    WHERE c.certificate_id = ${certId}
  `

  if (!row) {
    return (
      <section style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
          <h1 style={{ fontSize: '1.6rem', color: '#8B1A1A', marginBottom: 12 }}>Certificate Not Found</h1>
          <p style={{ color: '#5a5a4a', marginBottom: 24 }}>
            No certificate matches ID <code style={{ background: '#f0ede5', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: '.9rem' }}>{certId}</code>.
            It may be invalid or the ID may have been mistyped.
          </p>
          <Link href="/" className="btn">Back to Wissen-Haus</Link>
        </div>
      </section>
    )
  }

  const course = COURSES.find(c => c.id === row.course_id as string)
  const issuedDate = new Date(row.issued_at as string)
  const issuedFormatted = issuedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <section style={{ minHeight: '70vh', background: '#f4f0e8', padding: 'clamp(40px,6vw,80px) 16px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Verified banner */}
        <div style={{
          background: '#0F2D1D',
          borderRadius: '12px 12px 0 0',
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderBottom: '3px solid #B8952A',
        }}>
          <Image src="/img/logo.png" alt="Wissen-Haus" width={44} height={44} style={{ borderRadius: '50%', border: '2px solid rgba(184,149,42,0.6)' }} />
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>Wissen-Haus</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>Youth Empowerment Foundation</div>
          </div>
          <div style={{ marginLeft: 'auto', background: '#22c55e', color: '#fff', borderRadius: 20, padding: '4px 14px', fontSize: '.75rem', fontWeight: 700, letterSpacing: '.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            VERIFIED
          </div>
        </div>

        {/* Certificate details card */}
        <div style={{
          background: '#FEFCF5',
          border: '1px solid rgba(184,149,42,0.3)',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ color: '#B8952A', fontSize: '.65rem', fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 8 }}>
              Certificate of Completion
            </div>
            <div style={{ color: '#5a5a4a', fontSize: '.82rem', marginBottom: 6 }}>This certifies that</div>
            <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(1.5rem,4vw,2rem)', color: '#0F2D1D', lineHeight: 1.2, marginBottom: 4 }}>
              {row.name as string}
            </div>
            <div style={{ color: '#5a5a4a', fontSize: '.82rem', marginBottom: 8 }}>successfully completed</div>
            <div style={{ fontWeight: 800, fontSize: 'clamp(1rem,2.5vw,1.25rem)', color: '#0F2D1D', lineHeight: 1.3 }}>
              {course?.title ?? row.course_id as string}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(184,149,42,0.25)', margin: '0 0 20px' }} />

          <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', margin: 0 }}>
            <div>
              <dt style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#9a9a8a', marginBottom: 2 }}>Date Issued</dt>
              <dd style={{ margin: 0, fontSize: '.88rem', color: '#3a3a2a', fontWeight: 600 }}>{issuedFormatted}</dd>
            </div>
            <div>
              <dt style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#9a9a8a', marginBottom: 2 }}>Issued by</dt>
              <dd style={{ margin: 0, fontSize: '.88rem', color: '#3a3a2a', fontWeight: 600 }}>Benz Olagbaye</dd>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <dt style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#9a9a8a', marginBottom: 2 }}>Certificate ID</dt>
              <dd style={{ margin: 0, fontFamily: 'monospace', fontSize: '.8rem', color: '#5a5a4a', wordBreak: 'break-all' }}>{row.certificate_id as string}</dd>
            </div>
          </dl>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link
              href="/"
              style={{ fontSize: '.8rem', color: '#9a9a8a', textDecoration: 'none' }}
            >
              wissenhaus.org
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
