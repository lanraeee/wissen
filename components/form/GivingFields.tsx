'use client'

export const MIN_MONTHLY_NGN = 5000

interface Props {
  amount: string
  onAmountChange: (value: string) => void
  method: 'stripe' | 'bank_transfer'
  onMethodChange: (value: 'stripe' | 'bank_transfer') => void
  idPrefix: string
}

// Shared by VolunteerForm and PartnerForm: every applicant commits to a
// monthly gift alongside their application. Submitting the form never
// blocks on this (lib/recurring-giving.ts's pledge stays 'pending' until
// they actually finish paying), but choosing an amount and a method is
// itself required — this is what "sets up" the commitment.
export default function GivingFields({ amount, onAmountChange, method, onMethodChange, idPrefix }: Props) {
  return (
    <div className="field" style={{ background: 'var(--surface-2,#f4f0e7)', borderRadius: 10, padding: '1rem 1.1rem', marginTop: '.4rem' }}>
      <label htmlFor={`${idPrefix}-amount`} style={{ fontWeight: 700 }}>Monthly Giving Commitment</label>
      <p style={{ margin: '.2rem 0 .8rem', fontSize: '.85rem', color: 'var(--ink-60,#8a9a8f)' }}>
        We ask everyone who applies to also commit to a small monthly gift, by card or bank transfer. Minimum ₦{MIN_MONTHLY_NGN.toLocaleString()}/month.
      </p>
      <div className="form-row">
        <div>
          <label htmlFor={`${idPrefix}-amount`} style={{ fontSize: '.82rem' }}>Monthly amount (₦)</label>
          <input
            id={`${idPrefix}-amount`}
            type="number"
            min={MIN_MONTHLY_NGN}
            step={500}
            required
            value={amount}
            onChange={e => onAmountChange(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-method`} style={{ fontSize: '.82rem' }}>Payment method</label>
          <select
            id={`${idPrefix}-method`}
            value={method}
            onChange={e => onMethodChange(e.target.value as 'stripe' | 'bank_transfer')}
          >
            <option value="stripe">Card (sets up automatic monthly billing)</option>
            <option value="bank_transfer">Bank transfer (we&apos;ll remind you each month)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
