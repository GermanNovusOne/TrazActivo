import { CircleAlert } from 'lucide-react'

interface ErrorStateProps {
  title: string
  description?: string
}

export function ErrorState({ title, description }: ErrorStateProps) {
  return (
    <section className="error-state" role="alert" aria-labelledby="error-state-title">
      <CircleAlert aria-hidden="true" />
      <h2 id="error-state-title">{title}</h2>
      {description ? <p>{description}</p> : null}
    </section>
  )
}
