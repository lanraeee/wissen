'use client'

import { useState } from 'react'
import posthog from 'posthog-js'
import { FormInput, FormTextarea, FormSelect } from '@/components/form/FormField'
import { FormCheckboxGroup } from '@/components/form/FormCheckboxGroup'
import { FormSuccess, FormError } from '@/components/form/FormSuccess'
import {
  AGE_RANGES, CURRENT_STATUS_OPTIONS, EDUCATION_LEVELS, LEARNING_GOALS, EXPERIENCE_LEVELS,
  SITUATION_OPTIONS, ACCESS_METHOD_OPTIONS, WEEKLY_HOURS_OPTIONS, ACCESS_SUPPORT_OPTIONS,
  EVIDENCE_OPTIONS, IMPACT_AREA_OPTIONS,
} from '@/lib/scholarship-shared'

interface FormState {
  name: string; email: string; phone: string
  ageRange: string; country: string; stateRegion: string; city: string
  currentStatus: string; educationLevel: string
  learningGoals: string[]; experienceLevel: string; motivationEssay: string
  situation: string[]; accessMethod: string
  weeklyHours: string; accessSupport: string; priorCourses: string
  evidenceTypes: string[]; impactAreas: string[]
  agreeAll: boolean; consentSuccessStory: boolean
}

const INITIAL_STATE: FormState = {
  name: '', email: '', phone: '',
  ageRange: '', country: '', stateRegion: '', city: '',
  currentStatus: '', educationLevel: '',
  learningGoals: [], experienceLevel: '', motivationEssay: '',
  situation: [], accessMethod: '',
  weeklyHours: '', accessSupport: '', priorCourses: '',
  evidenceTypes: [], impactAreas: [],
  agreeAll: false, consentSuccessStory: false,
}

const STEP_TITLES = ['About You', 'Your Goals', 'Your Readiness', 'Commitment']

function wordCount(s: string) {
  return s.trim().split(/\s+/).filter(Boolean).length
}

function validateStep(step: number, f: FormState): string | null {
  switch (step) {
    case 0:
      if (!f.name.trim()) return 'Please enter your full name.'
      if (!f.email.trim()) return 'Please enter your email address.'
      if (!f.phone.trim()) return 'Please enter your phone/WhatsApp number.'
      if (!f.ageRange) return 'Please select your age range.'
      if (!f.country.trim() || !f.stateRegion.trim() || !f.city.trim()) return 'Please fill in your country, state/region and city.'
      if (!f.currentStatus) return 'Please select your current status.'
      if (!f.educationLevel) return 'Please select your highest level of education.'
      return null
    case 1:
      if (f.learningGoals.length === 0) return 'Please select at least one thing you want to learn.'
      if (!f.experienceLevel) return 'Please select your experience level.'
      if (wordCount(f.motivationEssay) < 40) return 'Please write a little more about your goals and why you need this scholarship (a few sentences is fine).'
      if (f.situation.length === 0) return 'Please select at least one option describing your situation.'
      if (!f.accessMethod) return 'Please tell us how you would access DataCamp without this scholarship.'
      return null
    case 2:
      if (!f.weeklyHours) return 'Please select how many hours a week you can dedicate.'
      if (!f.accessSupport) return 'Please tell us about your device and internet access.'
      if (!f.priorCourses) return 'Please let us know if you have completed any online courses before.'
      if (f.impactAreas.length === 0) return 'Please select at least one answer for who this could benefit.'
      return null
    case 3:
      if (!f.agreeAll) return 'Please confirm you agree to the commitments above.'
      return null
    default:
      return null
  }
}

export default function ScholarshipApplicationForm({ tagline }: { tagline: string }) {
  const [step, setStep] = useState(0)
  const [f, setF] = useState<FormState>(INITIAL_STATE)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setF(prev => ({ ...prev, [key]: value }))
  }

  function next() {
    const err = validateStep(step, f)
    if (err) { setError(err); return }
    setError('')
    setStep(s => Math.min(s + 1, STEP_TITLES.length - 1))
  }

  function back() {
    setError('')
    setStep(s => Math.max(s - 1, 0))
  }

  async function submit() {
    const err = validateStep(step, f)
    if (err) { setError(err); return }
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        name: f.name, email: f.email, phone: f.phone,
        ageRange: f.ageRange, country: f.country, stateRegion: f.stateRegion, city: f.city,
        currentStatus: f.currentStatus, educationLevel: f.educationLevel,
        learningGoals: f.learningGoals, experienceLevel: f.experienceLevel, motivationEssay: f.motivationEssay,
        situation: f.situation, accessMethod: f.accessMethod,
        weeklyHours: f.weeklyHours, accessSupport: f.accessSupport, priorCourses: f.priorCourses,
        evidenceTypes: f.evidenceTypes, impactAreas: f.impactAreas,
        agreeAll: f.agreeAll, consentSuccessStory: f.consentSuccessStory || undefined,
      }
      const res = await fetch('/api/scholarships/datacamp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Something went wrong')
      posthog.capture('scholarship_application_submitted', { learning_goals: f.learningGoals })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <FormSuccess
          title="🎉 Application Received"
          message="Thank you for applying for the Wissen-Haus × DataCamp Scholarship Programme. Our team will review applications based on need, motivation, commitment, relevance of goals and potential impact. Only shortlisted applicants will be contacted. Your next opportunity could start here."
        />
        <p style={{ textAlign: 'center', marginTop: '-1.5rem', fontWeight: 700, color: 'var(--green-800,#1a3c2e)' }}>
          Wissen-Haus · {tagline}
        </p>
      </div>
    )
  }

  const isLast = step === STEP_TITLES.length - 1

  return (
    <div className="form" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-60)' }}>
          Section {step + 1} of {STEP_TITLES.length}
        </span>
        <span style={{ fontSize: '.9rem', fontWeight: 700 }}>{STEP_TITLES[step]}</span>
      </div>
      <div style={{ height: 4, background: '#e8e4dc', borderRadius: 99, marginBottom: '1.75rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${((step + 1) / STEP_TITLES.length) * 100}%`, background: '#1a3c2e', borderRadius: 99, transition: 'width .3s' }} />
      </div>

      {step === 0 && (
        <>
          <FormInput label="Full Name" id="s-name" value={f.name} onChange={e => update('name', e.target.value)} placeholder="Ada Lovelace" />
          <div className="form-row">
            <FormInput label="Email Address" id="s-email" type="email" value={f.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" />
            <FormInput label="Phone/WhatsApp Number" id="s-phone" value={f.phone} onChange={e => update('phone', e.target.value)} placeholder="080…" />
          </div>
          <FormSelect label="Age" id="s-age" value={f.ageRange} onChange={e => update('ageRange', e.target.value)}>
            <option value="">Select…</option>
            {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
          </FormSelect>
          <div className="form-row">
            <FormInput label="Country" id="s-country" value={f.country} onChange={e => update('country', e.target.value)} placeholder="Nigeria" />
            <FormInput label="State/Region" id="s-state" value={f.stateRegion} onChange={e => update('stateRegion', e.target.value)} placeholder="Oyo State" />
          </div>
          <FormInput label="City" id="s-city" value={f.city} onChange={e => update('city', e.target.value)} placeholder="Ibadan" />
          <FormSelect label="Current Status" id="s-status" value={f.currentStatus} onChange={e => update('currentStatus', e.target.value)}>
            <option value="">Select…</option>
            {CURRENT_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </FormSelect>
          <FormSelect label="Highest Level of Education Completed" id="s-edu" value={f.educationLevel} onChange={e => update('educationLevel', e.target.value)}>
            <option value="">Select…</option>
            {EDUCATION_LEVELS.map(o => <option key={o} value={o}>{o}</option>)}
          </FormSelect>
        </>
      )}

      {step === 1 && (
        <>
          <FormCheckboxGroup label="What would you most like to learn through DataCamp?" options={LEARNING_GOALS} values={f.learningGoals} onChange={v => update('learningGoals', v)} max={3} />
          <FormSelect label="Your current level of experience with data/technology" id="s-exp" value={f.experienceLevel} onChange={e => update('experienceLevel', e.target.value)}>
            <option value="">Select…</option>
            {EXPERIENCE_LEVELS.map(o => <option key={o} value={o}>{o}</option>)}
          </FormSelect>
          <FormTextarea
            label="In a few sentences: what do you hope to achieve, and why do you need this scholarship?" id="s-motivation"
            value={f.motivationEssay} onChange={e => update('motivationEssay', e.target.value)}
            placeholder="Tell us what DataCamp would help you achieve, and what currently stops you accessing learning like this." rows={5}
          />
          <FormCheckboxGroup label="Which of the following best describes your current situation?" options={SITUATION_OPTIONS} values={f.situation} onChange={v => update('situation', v)} />
          <FormSelect label="How would you currently access DataCamp if you did not receive this scholarship?" id="s-access" value={f.accessMethod} onChange={e => update('accessMethod', e.target.value)}>
            <option value="">Select…</option>
            {ACCESS_METHOD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </FormSelect>
          <p style={{ fontSize: '.82rem', color: 'var(--ink-60)' }}>We won&apos;t ask for bank statements, payslips or other sensitive financial documents at this stage.</p>
        </>
      )}

      {step === 2 && (
        <>
          <FormSelect label="How much time can you realistically dedicate to learning each week?" id="s-hours" value={f.weeklyHours} onChange={e => update('weeklyHours', e.target.value)}>
            <option value="">Select…</option>
            {WEEKLY_HOURS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </FormSelect>
          <FormSelect label="Do you have reliable access to a device and the internet for online learning?" id="s-access-support" value={f.accessSupport} onChange={e => update('accessSupport', e.target.value)}>
            <option value="">Select…</option>
            {ACCESS_SUPPORT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </FormSelect>
          <FormSelect label="Have you previously completed any online courses or professional training?" id="s-prior" value={f.priorCourses} onChange={e => update('priorCourses', e.target.value)}>
            <option value="">Select…</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </FormSelect>
          <FormCheckboxGroup label="Do you have any evidence of your interest in this field? (optional)" options={EVIDENCE_OPTIONS} values={f.evidenceTypes} onChange={v => update('evidenceTypes', v)} />
          <p style={{ fontSize: '.82rem', color: 'var(--ink-60)', marginTop: '-.5rem' }}>Not having a portfolio will not disadvantage your application.</p>
          <FormCheckboxGroup label="Who else could benefit from the skills you gain?" options={IMPACT_AREA_OPTIONS} values={f.impactAreas} onChange={v => update('impactAreas', v)} />
        </>
      )}

      {step === 3 && (
        <>
          <label className="field" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '.6rem', display: 'flex' }}>
            <input type="checkbox" checked={f.agreeAll} onChange={e => update('agreeAll', e.target.checked)} style={{ marginTop: 3 }} />
            <span>
              If selected, I agree to use the scholarship for genuine learning and professional development, make a genuine effort to
              complete DataCamp courses, provide occasional progress updates, and not sell, transfer or exchange my scholarship access
              for money or other benefits. I agree that Wissen-Haus may contact me about my application, scholarship and learning progress.
            </span>
          </label>
          <label className="field" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '.6rem', display: 'flex' }}>
            <input type="checkbox" checked={f.consentSuccessStory} onChange={e => update('consentSuccessStory', e.target.checked)} style={{ marginTop: 3 }} />
            <span>(Optional) I am happy for Wissen-Haus to contact me in the future about sharing my scholarship experience or success story.</span>
          </label>
        </>
      )}

      {error && <FormError error={error} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', gap: 12 }}>
        {step > 0 ? (
          <button type="button" className="btn btn--ghost" onClick={back} disabled={submitting}>← Back</button>
        ) : <span />}
        {isLast ? (
          <button type="button" className="btn" onClick={submit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        ) : (
          <button type="button" className="btn" onClick={next}>Next →</button>
        )}
      </div>
    </div>
  )
}
