'use client'

import { useState, FormEvent } from 'react'
import posthog from 'posthog-js'

type Currency = 'NGN' | 'USD' | 'GBP' | 'EUR'
type Method = 'card' | 'bank'

const AMOUNTS: Record<Currency, number[]> = {
  NGN: [5000, 10000, 20000, 50000],
  USD: [5, 10, 25, 50],
  GBP: [5, 10, 25, 50],
  EUR: [5, 10, 25, 50],
}
const SYMBOL: Record<Currency, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' }
const TOGGLE_LABEL: Record<Currency, string> = {
  NGN: '🇳🇬 Naira (₦)',
  USD: '🇺🇸 US Dollar ($)',
  GBP: '🇬🇧 British Pound (£)',
  EUR: '🇪🇺 Euro (€)',
}
const CUSTOM_PLACEHOLDER: Record<Currency, string> = { NGN: '15000', USD: '30', GBP: '25', EUR: '25' }

// Stripe charges and the foundation's bank accounts both cover all four, so
// the same choice is offered whichever way the donor pays.
const CURRENCIES: Currency[] = ['NGN', 'USD', 'GBP', 'EUR']

export default function DonateWidget() {
  const [method, setMethod] = useState<Method>('card')
  const [currency, setCurrency] = useState<Currency>('NGN')
  const [selected, setSelected] = useState<number | null>(null)
  const [custom, setCustom] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  const amounts = AMOUNTS[currency]
  const symbol = SYMBOL[currency]

  const finalAmount = custom ? parseFloat(custom) : selected

  // The amount and currency carry over between methods — only the destination
  // changes — so switching just clears any stale error.
  function changeMethod(next: Method) {
    setMethod(next)
    setError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!finalAmount || finalAmount <= 0) { setError('Please select or enter an amount'); return }
    if (!name.trim() || !email.trim()) { setError('Please enter your name and email'); return }

    setStatus('loading')
    setError('')

    const siteUrl = window.location.origin
    const endpoint = method === 'bank' ? '/api/payments/bank-transfer' : '/api/payments/stripe'

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          currency,
          email,
          name,
          ...(method === 'card' ? { callbackUrl: `${siteUrl}/donate/success` } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || (method === 'bank' ? 'Could not start your donation' : 'Payment initialisation failed'))

      // Capture donation initiation before redirect (browser unloads immediately after)
      posthog.capture('donation_initiated', {
        amount: finalAmount,
        currency,
        provider: method === 'bank' ? 'bank_transfer' : 'stripe',
      })

      if (data.url) window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Payment method */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([['card', '💳 Card'], ['bank', '🏦 Bank Transfer']] as [Method, string][]).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => changeMethod(m)}
            aria-pressed={method === m}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 8, border: '2px solid',
              borderColor: method === m ? 'var(--green-800,#1a3c2e)' : '#e8e4dc',
              background: method === m ? 'var(--green-800,#1a3c2e)' : '#fff',
              color: method === m ? '#f4f0e7' : '#3a4a3f',
              fontWeight: 700, fontSize: '.9rem', cursor: 'pointer', transition: 'all .15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: '.8rem', color: 'var(--ink-60,#8a9a8f)', margin: '0 0 22px', lineHeight: 1.5 }}>
        {method === 'bank'
          ? "Fill in your details and we'll show you the account to transfer to, with a reference to quote. Your receipt and certificate follow once the transfer clears."
          : 'Pay securely by card — your receipt and certificate arrive by email straight away.'}
      </p>

      {/* Currency toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {CURRENCIES.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => { setCurrency(c); setSelected(null); setCustom('') }}
            style={{
              flex: '1 1 140px', padding: '10px 0', borderRadius: 8, border: '2px solid',
              borderColor: currency === c ? 'var(--green-800,#1a3c2e)' : '#e8e4dc',
              background: currency === c ? 'var(--green-800,#1a3c2e)' : '#fff',
              color: currency === c ? '#f4f0e7' : '#3a4a3f',
              fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', transition: 'all .15s',
            }}
          >
            {TOGGLE_LABEL[c]}
          </button>
        ))}
      </div>

      {/* Pre-set amounts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {amounts.map(a => (
          <button
            key={a}
            type="button"
            onClick={() => { setSelected(a); setCustom('') }}
            style={{
              padding: '12px 4px', borderRadius: 8, border: '2px solid',
              borderColor: selected === a && !custom ? 'var(--green-800,#1a3c2e)' : '#e8e4dc',
              background: selected === a && !custom ? '#f0ece4' : '#fff',
              fontWeight: 700, fontSize: '.9rem', cursor: 'pointer', color: '#1a2e24',
            }}
          >
            {symbol}{a.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <div className="field" style={{ marginBottom: 20 }}>
        <label htmlFor="d-custom">Or enter your own amount ({symbol})</label>
        <input
          id="d-custom"
          type="number"
          min="1"
          step="any"
          placeholder={`e.g. ${symbol}${CUSTOM_PLACEHOLDER[currency]}`}
          value={custom}
          onChange={e => { setCustom(e.target.value); setSelected(null) }}
        />
      </div>

      {/* Donor details */}
      <div className="form-row" style={{ marginBottom: 20 }}>
        <div className="field">
          <label htmlFor="d-name">Your Name</label>
          <input id="d-name" required placeholder="Ada Lovelace" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="d-email">Email</label>
          <input id="d-email" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
      </div>

      {error && <p style={{ color: '#c0392b', fontSize: '.875rem', marginBottom: '1rem' }}>{error}</p>}

      <button
        type="submit"
        className="btn btn--block btn--lg"
        disabled={status === 'loading'}
        style={{ fontSize: '1rem' }}
      >
        {status === 'loading'
          ? (method === 'bank' ? 'Preparing your details…' : 'Redirecting to payment…')
          : method === 'bank'
            ? `Get bank details${finalAmount ? ` for ${symbol}${Number(finalAmount).toLocaleString()}` : ''}`
            : `Donate ${finalAmount ? `${symbol}${Number(finalAmount).toLocaleString()}` : 'Now'}`}
      </button>

      <p style={{ textAlign: 'center', fontSize: '.78rem', color: 'var(--ink-60,#8a9a8f)', marginTop: '1rem' }}>
        {method === 'bank'
          ? 'Direct transfer in Naira, Dollars, Pounds or Euros · No card needed'
          : 'Powered by Stripe · Secure payments in Naira, Dollars, Pounds or Euros'}
      </p>
    </form>
  )
}
