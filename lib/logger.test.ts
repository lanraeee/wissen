const captureExceptionMock = vi.fn()
vi.mock('@sentry/nextjs', () => ({ captureException: (...args: unknown[]) => captureExceptionMock(...args) }))

import { log } from './logger'

describe('log', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
    warnSpy.mockRestore()
    logSpy.mockRestore()
  })

  it('writes info as a JSON line via console.log', () => {
    log.info('test-route', 'something happened', { userId: '123' })
    expect(logSpy).toHaveBeenCalledTimes(1)
    const parsed = JSON.parse(logSpy.mock.calls[0][0] as string)
    expect(parsed).toMatchObject({ level: 'info', route: 'test-route', message: 'something happened', userId: '123' })
    expect(parsed.time).toBeDefined()
  })

  it('writes warn as a JSON line via console.warn', () => {
    log.warn('test-route', 'careful')
    expect(warnSpy).toHaveBeenCalledTimes(1)
    const parsed = JSON.parse(warnSpy.mock.calls[0][0] as string)
    expect(parsed.level).toBe('warn')
  })

  it('writes error as a JSON line with error details, via console.error', () => {
    const err = new Error('boom')
    log.error('test-route', err)
    expect(errorSpy).toHaveBeenCalledTimes(1)
    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string)
    expect(parsed.level).toBe('error')
    expect(parsed.message).toBe('boom')
    expect(parsed.error).toMatchObject({ name: 'Error', message: 'boom' })
    expect(parsed.error.stack).toBeDefined()
  })

  it('handles a non-Error thrown value', () => {
    log.error('test-route', 'just a string')
    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string)
    expect(parsed.error).toMatchObject({ name: 'UnknownError', message: 'just a string' })
  })

  it('forwards errors to Sentry.captureException, tagged with the route', () => {
    const err = new Error('boom')
    log.error('my-route', err)
    expect(captureExceptionMock).toHaveBeenCalledWith(err, { tags: { route: 'my-route' } })
  })

  it('does not forward info/warn to Sentry', () => {
    log.info('r', 'x')
    log.warn('r', 'x')
    expect(captureExceptionMock).not.toHaveBeenCalled()
  })
})
