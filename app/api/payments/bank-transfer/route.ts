import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import {
  generateReference, getBankDetails, accountFor, getPledge, updatePledge,
  type BankCurrency, type BankPledge,
} from '@/lib/bank-transfer'
import { sendBankTransferInstructions, sendBankTransferNotification } from '@/lib/email'

const CURRENCIES: BankCurrency[] = ['NGN', 'USD', 'GBP', 'EUR']

// Records a bank-transfer pledge and returns the reference plus the URL of the
// page showing the account details. No money has moved at this point — the
// pledge only becomes a donation (receipt + certificate) once an admin
// confirms it landed, via /api/admin/bank-transfers.
export async function POST(req: NextRequest) {
  const { amount, currency, name, email, message } = await req.json()

  const value = Number(amount)
  if (!Number.isFinite(value) || value <= 0)
    return NextResponse.json({ error: 'A donation amount is required' }, { status: 400 })
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim())
    return NextResponse.json({ error: 'Your name and email are required' }, { status: 400 })
  if (!CURRENCIES.includes(currency))
    return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 })

  const details = await getBankDetails()
  if (!details.enabled)
    return NextResponse.json({ error: 'Bank transfer donations are currently unavailable.' }, { status: 503 })

  const account = accountFor(details, currency)
  if (!account?.account_number)
    return NextResponse.json(
      { error: `We don't have a ${currency} account set up yet. Please choose another currency or email info@wissenhaus.org.` },
      { status: 503 },
    )

  const pledge: BankPledge = {
    reference: generateReference(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    amount: value,
    currency,
    message: typeof message === 'string' && message.trim() ? message.trim() : undefined,
    status: 'awaiting_transfer',
    created_at: new Date().toISOString(),
  }

  try {
    await sql`
      INSERT INTO submissions (type, name, email, data, status)
      VALUES ('bank_transfer', ${pledge.name}, ${pledge.email}, ${JSON.stringify(pledge)}, 'pending')
    `
  } catch (err) {
    console.error('[bank transfer pledge insert]', err)
    return NextResponse.json({ error: 'Could not start your donation. Please try again.' }, { status: 502 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wissenhaus.org'
  const detailsUrl = `${siteUrl}/donate/bank-transfer/${pledge.reference}`

  // Best-effort: the donor is about to see these details on screen anyway, so a
  // mail failure must not fail the pledge.
  try {
    await Promise.all([
      sendBankTransferInstructions({
        to: pledge.email,
        name: pledge.name,
        amount: pledge.amount,
        currency: pledge.currency,
        reference: pledge.reference,
        detailsUrl,
        accountName: details.account_name,
        bankName: details.bank_name,
        accountNumber: account.account_number,
        extras: [
          { label: 'Sort Code', value: account.sort_code ?? '' },
          { label: 'IBAN', value: account.iban ?? '' },
          { label: 'SWIFT / BIC', value: account.swift ?? '' },
        ],
        instructions: details.instructions,
      }),
      sendBankTransferNotification({
        name: pledge.name,
        email: pledge.email,
        amount: pledge.amount,
        currency: pledge.currency,
        reference: pledge.reference,
        stage: 'pledged',
      }),
    ])
  } catch (err) {
    console.error('[bank transfer pledge email]', err)
  }

  return NextResponse.json(
    { reference: pledge.reference, url: `/donate/bank-transfer/${pledge.reference}` },
    { status: 201 },
  )
}

// The donor declaring "I've sent the transfer". Advisory only: it nudges the
// admin to go looking for the money. It deliberately does NOT issue a receipt
// or certificate — only a confirmed arrival does that.
export async function PUT(req: NextRequest) {
  const { reference } = await req.json()
  if (!reference) return NextResponse.json({ error: 'reference required' }, { status: 400 })

  const pledge = await getPledge(reference)
  if (!pledge) return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
  if (pledge.status === 'confirmed' || pledge.status === 'declared_sent')
    return NextResponse.json({ status: pledge.status })

  const updated = await updatePledge(reference, {
    status: 'declared_sent',
    declared_at: new Date().toISOString(),
  })

  try {
    await sendBankTransferNotification({
      name: pledge.name,
      email: pledge.email,
      amount: pledge.amount,
      currency: pledge.currency,
      reference: pledge.reference,
      stage: 'declared_sent',
    })
  } catch (err) {
    console.error('[bank transfer declared email]', err)
  }

  return NextResponse.json({ status: updated?.status ?? 'declared_sent' })
}
