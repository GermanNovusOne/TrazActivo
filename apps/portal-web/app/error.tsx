"use client";

import { ErrorState } from "@trazactivo/design-system";

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <ErrorState
      action={
        <button className="ta-button" onClick={reset} type="button">
          Intentar nuevamente
        </button>
      }
      message="La vista no está disponible. Vuelve a intentarlo sin perder información sensible."
      title="No pudimos mostrar esta página"
    />
  );
}
