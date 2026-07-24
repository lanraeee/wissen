import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { COURSES } from '@/lib/courseData'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import CertShareButtons from '@/components/CertShareButtons'
import './certificate.css'

interface Props {
  params: Promise<{ courseId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params
  const course = COURSES.find(c => c.id === courseId)
  if (!course) return {}
  return {
    title: `Certificate of Completion — ${course.title} | Wissen-Haus`,
    description: `Official certificate of completion for ${course.title}, issued by Wissen-Haus Youth Empowerment Foundation.`,
    openGraph: {
      title: `Certificate of Completion — ${course.title}`,
      description: `Issued by Wissen-Haus Youth Empowerment Foundation · wissenhaus.org`,
      images: ['/img/logo.png'],
    },
  }
}

export default async function CertificatePage({ params }: Props) {
  const { courseId } = await params
  const course = COURSES.find(c => c.id === courseId)
  if (!course) notFound()

  const session = await getSession()
  if (!session) {
    return (
      <section className="section" style={{ paddingTop: 'clamp(48px,6vw,84px)', textAlign: 'center' }}>
        <div className="wrap">
          <h1>Sign in to view your certificate</h1>
          <Link href="/login" className="btn mt-m">Sign In</Link>
        </div>
      </section>
    )
  }

  const [cert] = await sql`
    SELECT certificate_id, issued_at FROM certificates
    WHERE user_id = ${session.id} AND course_id = ${courseId}
  `

  const completedRows = await sql`
    SELECT module_id FROM course_progress
    WHERE user_id = ${session.id} AND course_id = ${courseId}
  `
  const allComplete = completedRows.length === course.modules.length

  if (!cert) {
    return (
      <section className="section" style={{ paddingTop: 'clamp(48px,6vw,84px)', textAlign: 'center' }}>
        <div className="wrap" style={{ maxWidth: 600 }}>
          <h1>Certificate not yet earned</h1>
          <p className="lead mt-s">
            {allComplete
              ? 'All modules are complete — your certificate is being processed.'
              : `Complete all ${course.modules.length} modules to earn your certificate. You have completed ${completedRows.length} so far.`}
          </p>
          <Link href={`/courses/${courseId}`} className="btn mt-m">Continue Course</Link>
        </div>
      </section>
    )
  }

  const issuedDate = new Date(cert.issued_at as string)
  const issuedFormatted = issuedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const issuedYear = issuedDate.getFullYear()
  const issuedMonth = issuedDate.getMonth() + 1

  return (
    <div className="cert-page">

      {/* ── Certificate document ── */}
      <div className="cert-doc" id="certificate">

        {/* Corner ornaments */}
        <span className="cert-corner-bl" aria-hidden="true">✦</span>
        <span className="cert-corner-br" aria-hidden="true">✦</span>

        {/* Header band */}
        <div className="cert-header">
          <div className="cert-header__brand">
            <Image
              src="/img/logo.png"
              alt="Wissen-Haus logo"
              width={68}
              height={68}
              className="cert-header__logo"
            />
            <div className="cert-header__name">
              Wissen-Haus
              <small>Youth Empowerment Foundation</small>
            </div>
          </div>
          <div className="cert-header__badge">Official Certificate</div>
        </div>

        {/* Body */}
        <div className="cert-body">

          {/* Eyebrow */}
          <div className="cert-eyebrow">
            <span className="cert-eyebrow__line" />
            <span className="cert-eyebrow__text">Certificate of Completion</span>
            <span className="cert-eyebrow__line cert-eyebrow__line--r" />
          </div>

          <p className="cert-intro">This is to proudly certify that</p>

          <h1 className="cert-name">{session.name}</h1>

          <div className="cert-name-rule">
            <span className="cert-name-rule__bar" />
            <span className="cert-name-rule__dot" />
            <span className="cert-name-rule__bar" />
          </div>

          <p className="cert-completion">has successfully completed all {course.modules.length} modules of</p>

          <h2 className="cert-course">{course.title}</h2>

          <p className="cert-subtitle">A programme of the Wissen-Haus Learning Platform</p>

          <div className="cert-divider">
            <span className="cert-divider__line" />
            <span className="cert-divider__ornament">❧</span>
            <span className="cert-divider__line cert-divider__line--r" />
          </div>

        </div>

        {/* Footer row */}
        <div className="cert-footer">

          {/* Issued info */}
          <div className="cert-issued">
            <div className="cert-issued__label">Date of Issue</div>
            <div className="cert-issued__value">{issuedFormatted}</div>
            <Link
              href={`/verify/${cert.certificate_id as string}`}
              className="cert-issued__id"
              title="Verify this certificate"
            >
              {cert.certificate_id as string}
            </Link>
          </div>

          {/* Seal */}
          <div className="cert-seal">
            <div className="cert-seal__ring">
              <Image
                src="/img/logo.png"
                alt="Wissen-Haus seal"
                width={34}
                height={34}
                className="cert-seal__logo"
              />
            </div>
            <span className="cert-seal__label">Verified</span>
          </div>

          {/* Signature */}
          <div className="cert-sig">
            <div className="cert-sig__name">Benz Olagbaye</div>
            <div className="cert-sig__rule" />
            <div className="cert-sig__title">Founder &amp; Director · Wissen-Haus</div>
          </div>

        </div>
      </div>

      {/* ── Share actions ── */}
      <CertShareButtons
        courseId={courseId}
        courseTitle={course.title}
        certId={cert.certificate_id as string}
        recipientName={session.name}
        issuedYear={issuedYear}
        issuedMonth={issuedMonth}
      />

      <Link href="/courses" className="cert-back">← Browse more courses</Link>

    </div>
  )
}
