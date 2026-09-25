'use client'

import { useFormSubmit } from '@/lib/useFormSubmit'
import { FormInput, FormTextarea, FormSelect } from '@/components/form/FormField'
import { FormSuccess, FormError } from '@/components/form/FormSuccess'

export default function PartnerForm() {
  const { status, error, handleSubmit } = useFormSubmit({
    endpoint: '/api/partner',
    buildPayload: fd => ({
      name: fd.get('name'),
      email: fd.get('email'),
      organisation: fd.get('org') || '',
      message: fd.get('message'),
    }),
    event: 'partner_inquiry_submitted',
    eventProperties: fd => ({ partnership_type: fd.get('type') as string | null }),
  })

  if (status === 'done') {
    return (
      <FormSuccess
        title="Enquiry received!"
        message="Thank you for reaching out. We'll be in touch within 3 business days."
      />
    )
  }

  return (
    <form className="form" style={{ maxWidth: 640, margin: '0 auto' }} onSubmit={handleSubmit}>
      <div className="form-row">
        <FormInput label="Your Name" id="p-name" name="name" required placeholder="Ada Lovelace" />
        <FormInput label="Organisation" id="p-org" name="org" placeholder="Company / School name" />
      </div>
      <FormInput label="Email" id="p-email" name="email" type="email" required placeholder="you@example.com" />
      <FormSelect label="Partnership type" id="p-type" name="type" required>
        <option value="">Select…</option>
        <option>School / University</option>
        <option>Corporate / Company</option>
        <option>Individual Mentor</option>
        <option>NGO / Charity</option>
        <option>Media / Press</option>
        <option>Other</option>
      </FormSelect>
      <FormTextarea
        label="Tell us about your goals" id="p-msg" name="message" required
        placeholder="What do you hope to achieve through this partnership?"
      />
      {status === 'error' && <FormError error={error} />}
      <button type="submit" className="btn btn--block" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send Enquiry'}
      </button>
    </form>
  )
}
