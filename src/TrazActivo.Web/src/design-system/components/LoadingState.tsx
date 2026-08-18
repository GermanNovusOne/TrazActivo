import { LoaderCircle } from 'lucide-react'

interface LoadingStateProps {
  label?: string
}

export function LoadingState({ label = 'Cargando' }: LoadingStateProps) {
  return (
    <div className="state-message" role="status" aria-live="polite">
      <LoaderCircle className="state-message__spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}
