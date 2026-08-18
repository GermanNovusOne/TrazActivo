import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkServiceHealth } from './healthClient'

describe('checkServiceHealth', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('devuelve unavailable cuando vence el timeout', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_path: string, options?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))

    const health = checkServiceHealth(25)
    await vi.advanceTimersByTimeAsync(25)

    await expect(health).resolves.toBe('unavailable')
  })
})
