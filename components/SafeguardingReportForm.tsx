'use client'

import { useState } from 'react'
import { useFormSubmit } from '@/lib/useFormSubmit'
import { FormInput, FormTextarea, FormSelect } from '@/components/form/FormField'
import { FormSuccess, FormError } from '@/components/form/FormSuccess'

const CONCERNS: [string, string][] = [
  ['physical', 'Physical harm'],
  ['emotional', 'Emotional harm'],
  ['sexual', 'Sexual abuse or exploitation'],
  ['neglect', 'Neglect'],
  ['exploitation', 'Exploitation, trafficking or forced work'],
  ['online_harm', 'Online harm'],
  ['scam_or_fraud', 'A scam or fake opportunity'],
  ['bullying_or_harassment', 'Bullying or harassment'],
  ['self_harm', 'Self-harm or risk to themselves'],
  ['conduct_of_staff_or_volunteer', 'Behaviour of someone connected with Wissen-Haus'],
  ['other', 'Something else'],
]

// Goes to /api/safeguarding/report, which writes straight into the restricted
// incident log in WHF-CIO Records. Only the description is required, so
// someone who wants to stay anonymous can.
export default function SafeguardingReportForm() {
  const [reference, setReference] = useState<string | null>(null)
  const { status, error, handleSubmit } = useFormSubmit({
    endpoint: '/api/safeguarding/report',
    buildPayload: fd => ({
      name: fd.get('name') || null,
      email: fd.get('email') || null,
      phone: fd.get('phone') || null,
      relationship: fd.get('relationship') || null,
      person_at_risk: fd.get('person_at_risk') || 'unknown',
      concern_type: fd.get('concern_type') || null,
      description: fd.get('description'),
      location: fd.get('location') || null,
      immediate_danger: fd.get('immediate_danger') === 'on',
      website: fd.get('website') || undefined,
    }),
    // No properties: nothing about a safeguarding report goes to analytics.
    event: 'safeguarding_report_submitted',
    onSuccess: d => setReference((d as { reference?: string | null })?.reference ?? null),
  })

  if (status === 'done') {
    return (
      <FormSuccess
        className="feature form"
        title="Thank you. Your concern has been received."
        message={`Our safeguarding lead will review it${reference ? `. Your reference is ${reference}; quote it if you contact us about this again` : ''}. If anyone is in immediate danger, call the emergency services now.`}
      />
    )
  }

  return (
    <form className="feature form" onSubmit={handleSubmit} id="report-a-concern">
      <h3 style={{ marginBottom: '.6rem' }}>Report a safeguarding concern</h3>
      <p style={{ fontSize: '.9rem', color: 'var(--ink-60, #4a5a4f)', marginBottom: '1.2rem' }}>
        This goes only to our designated safeguarding lead and the foundation&apos;s directors. You can leave your details
        blank to report anonymously, though we may then be less able to follow up.
      </p>
      <FormTextarea label="What happened? *" id="sg-description" name="description" required minLength={10} maxLength={8000}
        placeholder="What happened or what worries you, who was involved, and when." />
      <div className="form-row">
        <FormSelect label="Who is at risk?" id="sg-person" name="person_at_risk" defaultValue="unknown">
          <option value="child">A child (under 18)</option>
          <option value="adult_at_risk">An adult at risk</option>
          <option value="other">Someone else</option>
          <option value="unknown">Not sure</option>
        </FormSelect>
        <FormSelect label="Type of concern" id="sg-type" name="concern_type" defaultValue="">
          <option value="">Not sure</option>
          {CONCERNS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </FormSelect>
      </div>
      <FormInput label="Where did it happen?" id="sg-location" name="location" maxLength={300} placeholder="e.g. at an event, online, at school" />
      <div className="form-row">
        <FormInput label="Your name" id="sg-name" name="name" maxLength={100} placeholder="Optional" />
        <FormInput label="Your email" id="sg-email" name="email" type="email" maxLength={255} placeholder="Optional" />
      </div>
      <div className="form-row">
        <FormInput label="Your phone" id="sg-phone" name="phone" maxLength={40} placeholder="Optional" />
        <FormInput label="How are you connected to this?" id="sg-rel" name="relationship" maxLength={100} placeholder="e.g. parent, teacher, volunteer, the young person" />
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '.9rem', margin: '.4rem 0 1rem' }}>
        <input type="checkbox" name="immediate_danger" style={{ marginTop: 4 }} />
        <span>Someone may be in immediate danger. <strong>If so, also call the emergency services now</strong> (999 in the UK, 112 in Nigeria).</span>
      </label>
      {/* Honeypot, hidden from people and screen readers. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, opacity: 0 }} />
      {status === 'error' && <FormError error={error} />}
      <button type="submit" className="btn" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send report'}
      </button>
    </form>
  )
}
