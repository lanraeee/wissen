'use client'

import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface FieldWrapProps {
  label: string
  htmlFor: string
  children: ReactNode
}

/** The shared `.field` wrapper: a label above whatever input it's given. */
function FieldWrap({ label, htmlFor, children }: FieldWrapProps) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  )
}

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
}

export function FormInput({ label, id, ...inputProps }: FormInputProps) {
  return (
    <FieldWrap label={label} htmlFor={id}>
      <input id={id} {...inputProps} />
    </FieldWrap>
  )
}

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  id: string
}

export function FormTextarea({ label, id, ...textareaProps }: FormTextareaProps) {
  return (
    <FieldWrap label={label} htmlFor={id}>
      <textarea id={id} {...textareaProps} />
    </FieldWrap>
  )
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  id: string
  children: ReactNode
}

export function FormSelect({ label, id, children, ...selectProps }: FormSelectProps) {
  return (
    <FieldWrap label={label} htmlFor={id}>
      <select id={id} {...selectProps}>{children}</select>
    </FieldWrap>
  )
}
