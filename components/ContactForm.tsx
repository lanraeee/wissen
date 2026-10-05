'use client'

import { useFormSubmit } from '@/lib/useFormSubmit'
import { FormInput, FormTextarea } from '@/components/form/FormField'
import { FormSuccess, FormError } from '@/components/form/FormSuccess'

export default function ContactForm() {
  const { status, error, handleSubmit } = useFormSubmit({
    endpoint: '/api/contact',
    buildPayload: fd => ({
      name: fd.get('name'),
      email: fd.get('email'),
      subject: fd.get('subject'),
      message: fd.get('message'),
      safeguarding: fd.get('safeguarding') === 'on',
    }),
    event: 'contact_form_submitted',
    eventProperties: fd => ({ subject_length: (fd.get('subject') as string | null)?.length ?? 0 }),
  })

  if (status === 'done') {
    return (
      <FormSuccess
        className="feature form reveal"
        title="Message sent!"
        message="Thanks for reaching out. We'll be in touch within 2 business days."
      />
    )
  }

  return (
    <form className="feature form reveal" onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: '1.2rem' }}>Send a Message</h3>
      <div className="form-row">
        <FormInput label="Name" id="c-name" name="name" required placeholder="Your name" />
        <FormInput label="Email" id="c-email" name="email" type="email" required placeholder="you@example.com" />
      </div>
      <FormInput label="Subject" id="c-subject" name="subject" required placeholder="How can we help?" />
      <FormTextarea label="Message" id="c-msg" name="message" required placeholder="Tell us more…" />
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '.88rem', margin: '-.2rem 0 1rem' }}>
        <input type="checkbox" name="safeguarding" style={{ marginTop: 3 }} />
        <span>This is a safeguarding concern. It will go only to our safeguarding lead and directors. You can also use the <a href="/safeguarding#report-a-concern">safeguarding report form</a>.</span>
      </label>
      {status === 'error' && <FormError error={error} />}
      <button type="submit" className="btn" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
