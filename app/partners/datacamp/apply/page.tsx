import type { Metadata } from 'next'
import ScholarshipApplicationForm from '@/components/ScholarshipApplicationForm'

export const metadata: Metadata = {
  title: 'DataCamp Scholarship Application · Wissen-Haus',
  description: 'Apply for a Wissen-Haus × DataCamp scholarship — free access to DataCamp for motivated young people facing genuine barriers to learning data, analytics and AI skills.',
}

export default function DataCampScholarshipApplyPage() {
  return (
    <section className="section" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
      <div className="wrap">
        <div className="section-head center mb-l reveal">
          <span className="eyebrow">DataCamp Scholarship Programme</span>
          <h1 className="display-lg mt-s">Are you ready to build skills that can change your career?</h1>
          <p className="lead mt-m" style={{ maxWidth: '60ch', margin: 'var(--spacing-m) auto 0' }}>
            Wissen-Haus is offering DataCamp scholarships to young people who are motivated to develop practical
            skills in data, analytics, AI, programming and related fields — but may not otherwise have access to
            premium learning resources. Designed for learners who demonstrate motivation, genuine financial/access
            barriers, commitment to learning, and a clear plan for using their skills.
          </p>
          <p className="mt-s" style={{ fontSize: '.85rem', color: 'var(--ink-60)' }}>Estimated completion time: 7–10 minutes.</p>
        </div>

        <ScholarshipApplicationForm />
      </div>
    </section>
  )
}
