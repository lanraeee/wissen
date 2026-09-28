'use client'

interface FormCheckboxGroupProps {
  label: string
  options: readonly string[]
  values: string[]
  onChange: (values: string[]) => void
  max?: number
  hint?: string
}

/** A labeled group of checkboxes for multi-select questions, optionally capped at `max`. */
export function FormCheckboxGroup({ label, options, values, onChange, max, hint }: FormCheckboxGroupProps) {
  function toggle(option: string) {
    if (values.includes(option)) {
      onChange(values.filter(v => v !== option))
    } else {
      if (max && values.length >= max) return
      onChange([...values, option])
    }
  }

  return (
    <div className="field">
      <label>{label}{max ? ` (choose up to ${max})` : ''}</label>
      {hint && <p style={{ margin: '0 0 .5rem', fontSize: '.82rem', color: 'var(--ink-60)' }}>{hint}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
        {options.map(option => {
          const checked = values.includes(option)
          const disabled = !checked && !!max && values.length >= max
          return (
            <label key={option} style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', opacity: disabled ? .5 : 1 }}>
              <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(option)} style={{ marginTop: 3 }} />
              <span>{option}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
