import type { ReactNode } from "react";

interface ErrorStateProps {
  readonly action?: ReactNode;
  readonly message: string;
  readonly title: string;
}

interface LoadingStateProps {
  readonly label?: string;
}

interface StatusBadgeProps {
  readonly children: ReactNode;
  readonly tone: "information" | "success" | "warning";
}

export function ErrorState({ action, message, title }: ErrorStateProps) {
  return (
    <section className="ta-state ta-state--error" aria-labelledby="error-state-title" role="alert">
      <span className="ta-state__icon" aria-hidden="true">
        !
      </span>
      <div>
        <p className="ta-eyebrow">Estado seguro</p>
        <h1 id="error-state-title">{title}</h1>
        <p>{message}</p>
        {action ? <div className="ta-state__action">{action}</div> : null}
      </div>
    </section>
  );
}

export function LoadingState({ label = "Preparando la experiencia" }: LoadingStateProps) {
  return (
    <section className="ta-state ta-state--loading" aria-live="polite" aria-busy="true">
      <span className="ta-spinner" aria-hidden="true" />
      <div>
        <p className="ta-eyebrow">Cargando</p>
        <h1>{label}</h1>
        <p>Esto tomará sólo un momento.</p>
      </div>
    </section>
  );
}

export function StatusBadge({ children, tone }: StatusBadgeProps) {
  return (
    <span className={`ta-status-badge ta-status-badge--${tone}`}>
      <span className="ta-status-badge__dot" aria-hidden="true" />
      {children}
    </span>
  );
}
