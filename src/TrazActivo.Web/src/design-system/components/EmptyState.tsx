import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="empty-state" aria-labelledby="empty-state-title">
      <Inbox aria-hidden="true" />
      <h2 id="empty-state-title">{title}</h2>
      {description ? <p>{description}</p> : null}
    </section>
  )
}
