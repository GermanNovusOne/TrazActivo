import { Activity, CircleAlert, LoaderCircle, type LucideIcon } from 'lucide-react'

export type StatusTone = 'development' | 'loading' | 'healthy' | 'unavailable' | 'neutral'

interface StatusBadgeProps {
  label: string
  tone?: StatusTone
}

const icons: Record<StatusTone, LucideIcon> = {
  development: Activity,
  loading: LoaderCircle,
  healthy: Activity,
  unavailable: CircleAlert,
  neutral: Activity,
}

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  const Icon = icons[tone]

  return (
    <span className={`status-badge status-badge--${tone}`} role="status" aria-live="polite">
      <Icon className={tone === 'loading' ? 'status-badge__spinner' : undefined} aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}
