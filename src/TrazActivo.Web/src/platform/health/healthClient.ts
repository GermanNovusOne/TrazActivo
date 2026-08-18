export type ServiceHealth = 'healthy' | 'unavailable'

const healthEndpoints = ['/health/live', '/health/ready'] as const
const defaultTimeoutMs = 5_000

async function requestHealth(endpoint: (typeof healthEndpoints)[number], signal: AbortSignal) {
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal,
  })

  if (!response.ok) {
    throw new Error(`Health endpoint returned ${response.status}.`)
  }
}

export async function checkServiceHealth(timeoutMs = defaultTimeoutMs): Promise<ServiceHealth> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    await Promise.all(healthEndpoints.map((endpoint) => requestHealth(endpoint, controller.signal)))
    return 'healthy'
  } catch {
    return 'unavailable'
  } finally {
    clearTimeout(timeout)
  }
}
