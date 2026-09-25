import { NextRequest } from 'next/server'
import { z } from 'zod'
import { parseBody, zEmail, zName, zShortText, zMessage, zLongText } from './validation'

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function rawRequest(body: string) {
  return new NextRequest('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

describe('parseBody', () => {
  const Schema = z.object({ name: zName, email: zEmail })

  it('returns data for a valid body', async () => {
    const { data, error } = await parseBody(jsonRequest({ name: 'Ada', email: 'ada@example.com' }), Schema)
    expect(error).toBeUndefined()
    expect(data).toEqual({ name: 'Ada', email: 'ada@example.com' })
  })

  it('trims whitespace via schema transforms', async () => {
    const { data } = await parseBody(jsonRequest({ name: '  Ada  ', email: 'ada@example.com' }), Schema)
    expect(data?.name).toBe('Ada')
  })

  it('returns a 400 response for missing required fields', async () => {
    const { data, error } = await parseBody(jsonRequest({ name: 'Ada' }), Schema)
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
    expect(error!.status).toBe(400)
  })

  it('returns a 400 response for an invalid email', async () => {
    const { error } = await parseBody(jsonRequest({ name: 'Ada', email: 'not-an-email' }), Schema)
    expect(error?.status).toBe(400)
    const body = await error!.json()
    expect(body.error).toContain('email')
  })

  it('returns a 400 response for malformed JSON instead of throwing', async () => {
    const { error } = await parseBody(rawRequest('{not valid json'), Schema)
    expect(error?.status).toBe(400)
    const body = await error!.json()
    expect(body.error).toBe('Invalid JSON body')
  })

  it('rejects a field over its max length', async () => {
    const LongSchema = z.object({ subject: zShortText })
    const { error } = await parseBody(jsonRequest({ subject: 'x'.repeat(201) }), LongSchema)
    expect(error?.status).toBe(400)
  })

  it('treats an optional field as optional', async () => {
    const OptionalSchema = z.object({ message: zMessage })
    const { data, error } = await parseBody(jsonRequest({}), OptionalSchema)
    expect(error).toBeUndefined()
    expect(data?.message).toBeUndefined()
  })

  it('rejects an empty required long-text field', async () => {
    const Schema2 = z.object({ message: zLongText })
    const { error } = await parseBody(jsonRequest({ message: '' }), Schema2)
    expect(error?.status).toBe(400)
  })
})
