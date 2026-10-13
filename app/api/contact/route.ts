import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendContactNotification, sendContactConfirmation } from '@/lib/email'
import sql from '@/lib/db'
import { parseBody, zEmail, zName, zShortText, zLongText } from '@/lib/validation'
import { log } from '@/lib/logger'
import { recordConcern, looksLikeSafeguarding } from '@/lib/safeguarding'
import { CONTACT_TOPICS } from '@/lib/contact-routes'

const ContactSchema = z.object({
  name: zName,
  email: zEmail,
  subject: zShortText,
  message: zLongText,
  // Picks the inbox the message is delivered to (lib/contact-routes.ts).
  // Older clients that send no topic land in the general inbox.
  topic: z.enum(CONTACT_TOPICS).default('general'),
  // "This is a safeguarding concern" on the contact form.
  safeguarding: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const { data, error } = await parseBody(req, ContactSchema)
  if (error) return error
  const { name, email, subject, message, safeguarding, topic } = data

  // A message the sender marked as a safeguarding concern goes only to the
  // restricted incident log, not to the general contact inbox and its
  // all-staff notification. If logging it fails, it falls through to the
  // ordinary path below rather than being lost.
  if (safeguarding) {
    try {
      const created = await recordConcern({
        source: 'contact_form', reporterName: name, reporterEmail: email,
        description: `${subject}\n\n${message}`,
      })
      if (created) {
        try { await sendContactConfirmation(email, name) } catch (err) { log.error('contact email', err) }
        return NextResponse.json({ success: true })
      }
    } catch (err) {
      log.error('contact safeguarding', err)
    }
  }

  let contactId: string | undefined
  try {
    const rows = await sql`INSERT INTO contact_messages (name, email, subject, message, topic) VALUES (${name}, ${email}, ${subject}, ${message}, ${topic}) RETURNING id`
    contactId = rows?.[0]?.id as string | undefined
  } catch { /* non-fatal if DB unavailable */ }

  // Not marked, but reads like one: copy it into the incident log too, so the
  // safeguarding team sees it even if nobody in the general inbox flags it.
  if (!safeguarding && looksLikeSafeguarding(subject, message)) {
    try {
      await recordConcern({
        source: 'contact_form', sourceRef: contactId ? `contact:${contactId}` : null,
        reporterName: name, reporterEmail: email, description: `${subject}\n\n${message}`,
      })
    } catch (err) {
      log.error('contact safeguarding', err)
    }
  }

  try {
    await Promise.all([
      sendContactNotification({ name, email, subject, message, topic }),
      sendContactConfirmation(email, name),
    ])
  } catch (err) {
    log.error('contact email', err)
  }

  return NextResponse.json({ success: true })
}
