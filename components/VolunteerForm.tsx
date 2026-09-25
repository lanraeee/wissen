'use client'

import { useFormSubmit } from '@/lib/useFormSubmit'
import { FormInput, FormTextarea, FormSelect } from '@/components/form/FormField'
import { FormSuccess, FormError } from '@/components/form/FormSuccess'

export default function VolunteerForm() {
  const { status, error, handleSubmit } = useFormSubmit({
    endpoint: '/api/volunteer',
    buildPayload: fd => ({
      name: `${fd.get('firstName')} ${fd.get('lastName')}`.trim(),
      email: fd.get('email'),
      role: fd.get('role'),
      message: fd.get('bio'),
    }),
    event: 'volunteer_application_submitted',
    eventProperties: fd => ({ volunteer_role: fd.get('role') as string | null }),
  })

  if (status === 'done') {
    return (
      <FormSuccess
        title="Application received!"
        message="Thank you for volunteering. We'll be in touch within 5 business days."
      />
    )
  }

  return (
    <form className="form" style={{ maxWidth: 640, margin: '0 auto' }} onSubmit={handleSubmit}>
      <div className="form-row">
        <FormInput label="First Name" id="v-first" name="firstName" required placeholder="Ada" />
        <FormInput label="Last Name" id="v-last" name="lastName" required placeholder="Lovelace" />
      </div>
      <FormInput label="Email" id="v-email" name="email" type="email" required placeholder="you@example.com" />
      <FormSelect label="How do you want to contribute?" id="v-role" name="role" required>
        <option value="">Select an option…</option>
        <option>Mentoring</option>
        <option>Technical Training</option>
        <option>Operations &amp; Events</option>
        <option>Content Creation</option>
        <option>Other</option>
      </FormSelect>
      <FormTextarea
        label="Brief background (current role, skills, why you want to volunteer)"
        id="v-bio" name="bio" required placeholder="Tell us about yourself…"
      />
      {status === 'error' && <FormError error={error} />}
      <button type="submit" className="btn btn--block" disabled={status === 'sending'}>
        {status === 'sending' ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  )
}
