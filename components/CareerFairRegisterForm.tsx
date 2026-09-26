'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useFormSubmit } from '@/lib/useFormSubmit'
import { FormInput, FormSelect } from '@/components/form/FormField'
import { FormError } from '@/components/form/FormSuccess'
import { CAREER_INTERESTS, CLASS_GRADES, ATTENDING_AS_OPTIONS, type FairEvent, type AssessmentSnapshot } from '@/lib/career-fair-shared'

interface RegisterResponse {
  registrationId: string
  guideUrl: string
  recommendedBooths: { id: string; name: string }[]
}

function readAssessmentSnapshot(): AssessmentSnapshot[] | null {
  try {
    const saved = localStorage.getItem('wh_assessmentResults')
    return saved ? (JSON.parse(saved) as AssessmentSnapshot[]) : null
  } catch {
    return null
  }
}

export default function CareerFairRegisterForm() {
  const [events, setEvents] = useState<FairEvent[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [result, setResult] = useState<RegisterResponse | null>(null)

  useEffect(() => {
    fetch('/api/career-fair/events')
      .then(res => res.json())
      .then(data => setEvents(data.events ?? []))
      .catch(() => setLoadError(true))
  }, [])

  const { status, error, handleSubmit } = useFormSubmit<Record<string, unknown>>({
    endpoint: '/api/career-fair/register',
    buildPayload: fd => ({
      eventId: Number(fd.get('eventId')),
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone') || undefined,
      school: fd.get('school'),
      attendingAs: fd.get('attendingAs'),
      classGrade: fd.get('classGrade') || undefined,
      careerInterest: fd.get('careerInterest') || undefined,
      newsletterOptIn: fd.get('newsletterOptIn') === 'on',
      assessmentSnapshot: readAssessmentSnapshot() ?? undefined,
    }),
    event: 'career_fair_registration_submitted',
    eventProperties: fd => ({ career_interest: fd.get('careerInterest') as string | null }),
    onSuccess: data => setResult(data as RegisterResponse),
  })

  if (status === 'done' && result) {
    return (
      <div className="form" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', padding: '2.5rem' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--green-800,#1a3c2e)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
        <h3 style={{ marginTop: '1rem' }}>You&apos;re registered!</h3>
        <p style={{ color: 'var(--ink-60)', marginTop: '.5rem' }}>
          We&apos;ve emailed your confirmation and personal booth guide. Bring it with you — it&apos;s your check-in reference at the door.
        </p>
        {result.recommendedBooths.length > 0 && (
          <p style={{ marginTop: '1rem' }}>
            <strong>Booths picked for you:</strong> {result.recommendedBooths.map(b => b.name).join(', ')}
          </p>
        )}
        <Link href={result.guideUrl} className="btn mt-m">View your booth guide →</Link>
      </div>
    )
  }

  if (loadError) {
    return <p style={{ textAlign: 'center', color: 'var(--ink-60)' }}>Couldn&apos;t load fair events. Please refresh the page and try again.</p>
  }

  if (!events) {
    return <p style={{ textAlign: 'center', color: 'var(--ink-60)' }}>Loading…</p>
  }

  if (events.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--ink-60)' }}>There&apos;s no Career Clarity Fair open for registration right now — check back soon.</p>
  }

  return (
    <form className="form" style={{ maxWidth: 640, margin: '0 auto' }} onSubmit={handleSubmit}>
      {events.length > 1 ? (
        <FormSelect label="Which fair are you registering for?" id="cf-event" name="eventId" required>
          <option value="">Select a fair…</option>
          {events.map(e => (
            <option key={e.id} value={e.id}>
              {e.title}{e.event_date ? ` — ${new Date(e.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
            </option>
          ))}
        </FormSelect>
      ) : (
        <input type="hidden" name="eventId" value={events[0].id} />
      )}
      <FormInput label="Full Name" id="cf-name" name="name" required placeholder="Ada Lovelace" />
      <FormSelect label="Attending As" id="cf-attending-as" name="attendingAs" required>
        <option value="">Select…</option>
        {ATTENDING_AS_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
      </FormSelect>
      <div className="form-row">
        <FormInput label="Email" id="cf-email" name="email" type="email" required placeholder="you@example.com" />
        <FormInput label="Phone (optional)" id="cf-phone" name="phone" type="tel" placeholder="080..." />
      </div>
      <FormInput label="School" id="cf-school" name="school" required placeholder="Your school's name" />
      <FormSelect label="Class / Grade (recommended)" id="cf-grade" name="classGrade">
        <option value="">Select…</option>
        {CLASS_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
      </FormSelect>
      <FormSelect label="Career interest area" id="cf-interest" name="careerInterest">
        <option value="">Select…</option>
        {CAREER_INTERESTS.map(i => <option key={i} value={i}>{i}</option>)}
      </FormSelect>
      <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '.5rem', display: 'flex' }}>
        <input type="checkbox" name="newsletterOptIn" id="cf-newsletter" />
        <span>Add me to the Wissen-Haus Empowerment Foundation newsletter list</span>
      </label>
      {status === 'error' && <FormError error={error} />}
      <button type="submit" className="btn btn--block" disabled={status === 'sending'}>
        {status === 'sending' ? 'Registering…' : 'Register for the Fair'}
      </button>
    </form>
  )
}
