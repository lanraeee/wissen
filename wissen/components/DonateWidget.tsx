'use client'

import { useState, FormEvent } from 'react'

const AMOUNTS_NGN = [5000, 10000, 20000, 50000]
const AMOUNTS_USD = [5, 10, 25, 50]

type Currency = 'NGN' | 'USD'

export default function DonateWidget() {
  const [currency, setCurrency] = useState<Currency>('NGN')
  const [selected, setSelected] = useState<number | null>(null)
  const [custom, setCustom] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  const amounts = currency === 'NGN' ? AMOUNTS_NGN : AMOUNTS_USD
  const symbol = currency === 'NGN' ? '₦' : '$'

  const finalAmount = custom ? parseFloat(custom) : selected

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!finalAmount || finalAmount <= 0) { setError('Please select or enter an amount'); return }
    if (!name.trim() || !email.trim()) { setError('Please enter your name and email'); return }

    setStatus('loading')
    setError('')

    const endpoint = currency === 'NGN' ? '/api/payments/paystack' : '/api/payments/stripe'
    const siteUrl = window.location.origin

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          currency,
          email,
          name,
          callbackUrl: `${siteUrl}/donate/success`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payment initialisation failed')

      if (currency === 'NGN' && data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else if (currency === 'USD' && data.clientSecret) {
        // Redirect to Stripe-hosted checkout isn't set up yet; open success with ref
        window.location.href = `/donate/success?ref=${data.reference}&provider=stripe`
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Currency toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {(['NGN', 'USD'] as Currency[]).map(c => (
          <button
            key={c}
            type="button"
            onClick={() => { setCurrency(c); setSelected(null); setCustom('') }}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: '2px solid',
              borderColor: currency === c ? 'var(--green-800,#1a3c2e)' : '#e8e4dc',
              background: currency === c ? 'var(--green-800,#1a3c2e)' : '#fff',
              color: currency === c ? '#f4f0e7' : '#3a4a3f',
              fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', transition: 'all .15s',
            }}
          >
            {c === 'NGN' ? '🇳🇬 Nigerian Naira (₦)' : '🌍 International (USD $)'}
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
          placeholder={`e.g. ${symbol}${currency === 'NGN' ? '15000' : '30'}`}
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
          ? 'Redirecting to payment…'
          : `Donate ${finalAmount ? `${symbol}${Number(finalAmount).toLocaleString()}` : 'Now'}`}
      </button>

      <p style={{ textAlign: 'center', fontSize: '.78rem', color: 'var(--ink-60,#8a9a8f)', marginTop: '1rem' }}>
        {currency === 'NGN' ? 'Powered by Paystack · Secure Nigerian payment gateway' : 'Powered by Stripe · Secure international payments'}
      </p>
    </form>
  )
}
