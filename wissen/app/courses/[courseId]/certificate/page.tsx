import { notFound } from 'next/navigation'
import { COURSES } from '@/lib/courseData'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'
import Link from 'next/link'

interface Props {
  params: Promise<{ courseId: string }>
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

  const issuedDate = new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <section className="section" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <div className="certificate">
          <h2>Certificate of Completion</h2>
          <h3>{course.title}</h3>
          <h4>Awarded to {session.name}</h4>
          <p style={{ color: 'var(--ink-60)', marginBottom: '1.5rem' }}>
            This is to certify that <strong>{session.name}</strong> has successfully completed all {course.modules.length} modules of <strong>{course.title}</strong> on the Wissen-Haus Learning Platform.
          </p>
          <p style={{ fontFamily: 'var(--ff-mono)', fontSize: '.8rem', color: 'var(--ink-60)', marginBottom: '2rem' }}>
            Certificate ID: {cert.certificate_id} · Issued: {issuedDate}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={`https://www.linkedin.com/shareArticle?mini=true&url=https://wissenhaus.org/courses/${courseId}/certificate&title=${encodeURIComponent(`I completed ${course.title} on Wissen-Haus!`)}&summary=${encodeURIComponent(`Certificate ID: ${cert.certificate_id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{ background: '#0A66C2', borderColor: '#0A66C2' }}
            >
              Share on LinkedIn
            </a>
            <button onClick={() => window.print()} className="btn" style={{ background: 'var(--green-800)', borderColor: 'var(--green-800)' }}>
              Print Certificate
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href="/courses" className="textlink">Browse more courses</Link>
        </div>
      </div>
    </section>
  )
}
