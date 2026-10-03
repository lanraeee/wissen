import { describe, it, expect } from 'vitest'
import { RESOURCES, getResource, parseBody, buildInsert, buildUpdate, dbErrorResponse } from './whf-cio'

describe('whf-cio generic records', () => {
  it('only resolves whitelisted resources', () => {
    expect(getResource('meetings')).toBe(RESOURCES.meetings)
    expect(getResource('users')).toBeNull()
    expect(getResource('__proto__')).toBeNull()
    expect(getResource('constructor')).toBeNull()
  })

  it('requires required columns on create', () => {
    const r = parseBody(RESOURCES.meetings, { title: 'AGM' }, false)
    expect(r.ok).toBe(false)
  })

  it('ignores unknown keys so they can never name a column', () => {
    const r = parseBody(RESOURCES.policies, { title: 'Safeguarding', 'id; DROP TABLE x': 'y', evil: 1 }, false)
    expect(r).toEqual({ ok: true, values: { title: 'Safeguarding' } })
  })

  it('normalises ISO timestamps to dates and rejects impossible ones', () => {
    const ok = parseBody(RESOURCES.filings, { title: 'Annual return', due_date: '2026-10-03T00:00:00.000Z' }, false)
    expect(ok).toEqual({ ok: true, values: { title: 'Annual return', due_date: '2026-10-03' } })
    expect(parseBody(RESOURCES.filings, { title: 'x', due_date: '2026-02-31' }, false).ok).toBe(false)
  })

  it('validates enum options', () => {
    expect(parseBody(RESOURCES.policies, { title: 'x', status: 'bogus' }, false).ok).toBe(false)
    expect(parseBody(RESOURCES.policies, { title: 'x', status: 'adopted' }, false).ok).toBe(true)
  })

  it('partial update touches only sent keys and can clear a field with ""', () => {
    expect(parseBody(RESOURCES.policies, { owner: '' }, true)).toEqual({ ok: true, values: { owner: null } })
    expect(parseBody(RESOURCES.policies, {}, true).ok).toBe(false)
    expect(parseBody(RESOURCES.policies, { title: '' }, true).ok).toBe(false)
  })

  it('coerces ints and bools', () => {
    const r = parseBody(RESOURCES.declarations, {
      trustee_id: '11111111-1111-1111-1111-111111111111', declaration_year: '2026', declared_on: '2026-10-03', has_conflicts: 'true',
    }, false)
    expect(r).toEqual({ ok: true, values: { trustee_id: '11111111-1111-1111-1111-111111111111', declaration_year: 2026, declared_on: '2026-10-03', has_conflicts: true } })
    expect(parseBody(RESOURCES.declarations, { trustee_id: 'a', declaration_year: 'abc', declared_on: '2026-10-03' }, false).ok).toBe(false)
  })

  it('builds parameterised SQL', () => {
    expect(buildInsert(RESOURCES.policies, { title: 'A', owner: 'B' })).toEqual({
      text: 'INSERT INTO cio_policies (title, owner) VALUES ($1, $2) RETURNING *', params: ['A', 'B'],
    })
    expect(buildUpdate(RESOURCES.policies, 'ID', { owner: null })).toEqual({
      text: 'UPDATE cio_policies SET owner = $1, updated_at = NOW() WHERE id = $2 RETURNING *', params: [null, 'ID'],
    })
  })

  it('maps database errors', () => {
    expect(dbErrorResponse({ code: '23505' }).status).toBe(409)
    expect(dbErrorResponse({ code: '42P01' }).status).toBe(503)
    expect(dbErrorResponse(new Error('x')).status).toBe(500)
  })
})
