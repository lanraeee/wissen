import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { directorGuard } from '@/lib/admin-guard'
import {
  gocardlessToken, gocardlessFindInstitution, gocardlessCreateRequisition, savePendingRequisition,
} from '@/lib/ledger-providers'
import { log } from '@/lib/logger'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.wissenhaus.org'

// Starts a GoCardless Bank Account Data requisition for Tide: creates the
// bank-consent session and hands back the link the director opens to log
// into Tide and authorise read access. Nothing is saved to the ledger
// config yet -- that happens in the callback route, once they're back.
export async function POST() {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  if (!process.env.GOCARDLESS_SECRET_ID || !process.env.GOCARDLESS_SECRET_KEY) {
    return NextResponse.json({ error: 'GoCardless is not configured (missing GOCARDLESS_SECRET_ID/GOCARDLESS_SECRET_KEY).' }, { status: 503 })
  }

  try {
    const token = await gocardlessToken()
    const institution = await gocardlessFindInstitution(token, 'Tide')
    if (!institution) {
      return NextResponse.json({ error: 'Could not find "Tide" in GoCardless\'s list of supported institutions.' }, { status: 502 })
    }

    const reference = crypto.randomUUID()
    const redirectUrl = `${SITE_URL}/api/admin/whf-cio/ledger/gocardless/callback`
    const requisition = await gocardlessCreateRequisition(token, { institutionId: institution.id, redirectUrl, reference })
    await savePendingRequisition(reference, requisition.id, institution.name)

    return NextResponse.json({ link: requisition.link })
  } catch (err) {
    log.error('gocardless connect', err)
    const message = err instanceof Error ? err.message : 'Could not start the Tide connection'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
