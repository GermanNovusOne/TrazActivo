import { useEffect, useState } from 'react'
import { checkServiceHealth, type ServiceHealth } from './healthClient'

export type ServiceHealthState = 'loading' | ServiceHealth

export function useServiceHealth(): ServiceHealthState {
  const [status, setStatus] = useState<ServiceHealthState>('loading')

  useEffect(() => {
    let isCurrent = true

    void checkServiceHealth().then((result) => {
      if (isCurrent) {
        setStatus(result)
      }
    })

    return () => {
      isCurrent = false
    }
  }, [])

  return status
}
