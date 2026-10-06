import { NextRequest, NextResponse } from 'next/server'
import { directorGuard } from '@/lib/admin-guard'
import {
  gocardlessToken, gocardlessGetRequisition, gocardlessAccountDisplayName, takePendingRequisition, addStoredAccounts,
} from '@/lib/ledger-providers'
import { logActivity } from '@/lib/audit-log'
import { log } from '@/lib/logger'

function page(title: string, body: string) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
    <style>body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f4f0e7;margin:0;padding:48px 20px;color:#1a2e24}
    .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 20px rgba(0,0,0,.07)}
    h1{font-size:1.2rem;margin:0 0 12px} p{line-height:1.6;color:#3a4a3f} ul{padding-left:18px;color:#3a4a3f}
    a.btn{display:inline-block;margin-top:16px;background:#1a3c2e;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600}</style>
    </head><body><div class="card">${body}</div></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

// Where GoCardless sends the director's browser back after they log into
// Tide and approve (or decline) read access. Bank Account Data has no
// webhook -- this redirect, carrying back the `ref` we created the
// requisition with, is the only notification this flow gets.
export async function GET(req: NextRequest) {
  const session = await directorGuard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const reference = req.nextUrl.searchParams.get('ref')
  const declined = req.nextUrl.searchParams.get('error')
  const backLink = '<a class="btn" href="/admin/whf-cio?tab=ledger">Back to the Ledger</a>'

  if (declined) {
    return page('Connection declined', `<h1>Connection declined</h1><p>Tide access wasn't granted (${declined}). You can try connecting again from the Ledger tab.</p>${backLink}`)
  }
  if (!reference) {
    return page('Missing reference', `<h1>Something went wrong</h1><p>GoCardless didn't send back a reference, so this session can't be matched to a connection attempt.</p>${backLink}`)
  }

  const pending = await takePendingRequisition(reference)
  if (!pending) {
    return page('Session expired', `<h1>This connection session has expired</h1><p>Please start again from the Ledger tab.</p>${backLink}`)
  }

  try {
    const token = await gocardlessToken()
    const requisition = await gocardlessGetRequisition(token, pending.requisitionId)
    const accountIds = requisition.accounts ?? []
    if (accountIds.length === 0) {
      return page('No accounts linked', `<h1>No accounts came through</h1><p>The ${pending.institutionName} connection completed, but no accounts were returned. This can happen if no account was selected during login.</p>${backLink}`)
    }

    const saved = await Promise.all(accountIds.map(async (accountId, i) => ({
      source: 'tide' as const,
      label: (await gocardlessAccountDisplayName(token, accountId)) ?? `${pending.institutionName} ${i + 1}`,
      accountId,
    })))
    await addStoredAccounts(saved)
    logActivity(session, 'whf_cio.ledger.gocardless_connect', { targetType: 'cio_ledger_sync', details: { institution: pending.institutionName, accounts: saved.length } })

    return page('Tide connected', `<h1>${pending.institutionName} connected ✓</h1>
      <p>${saved.length} account${saved.length === 1 ? '' : 's'} linked and will appear next time the ledger syncs:</p>
      <ul>${saved.map(a => `<li>${a.label}</li>`).join('')}</ul>
      ${backLink}`)
  } catch (err) {
    log.error('gocardless callback', err, { reference })
    const message = err instanceof Error ? err.message : 'Could not finish connecting'
    return page('Connection failed', `<h1>Something went wrong finishing the connection</h1><p>${message}</p>${backLink}`)
  }
}
