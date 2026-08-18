import type { ReactNode } from "react";

export interface NavigationItem {
  readonly current?: boolean;
  readonly href: string;
  readonly label: string;
}

interface AppShellProps {
  readonly audienceLabel: string;
  readonly children: ReactNode;
  readonly navigation: readonly NavigationItem[];
  readonly variant: "control" | "portal";
}

export function AppShell({ audienceLabel, children, navigation, variant }: AppShellProps) {
  return (
    <div className={`ta-app-shell ta-app-shell--${variant}`}>
      <a className="ta-skip-link" href="#main-content">
        Saltar al contenido principal
      </a>

      <header className="ta-topbar">
        <div className="ta-brand" aria-label={`TrazActivo — ${audienceLabel}`}>
          <span className="ta-brand__mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span className="ta-brand__copy">
            <strong>TrazActivo</strong>
            <span>{audienceLabel}</span>
          </span>
        </div>
        <span className="ta-topbar__baseline">Foundation v1.1</span>
      </header>

      <div className="ta-app-shell__body">
        <aside className="ta-sidebar">
          <nav aria-label={`Navegación de ${audienceLabel}`}>
            <p className="ta-sidebar__label">Navegación</p>
            <ul className="ta-nav">
              {navigation.map((item) => (
                <li key={item.href}>
                  <a
                    aria-current={item.current ? "page" : undefined}
                    className={item.current ? "ta-nav__link ta-nav__link--current" : "ta-nav__link"}
                    href={item.href}
                  >
                    <span className="ta-nav__indicator" aria-hidden="true" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="ta-sidebar__note">Cada activo tiene una historia verificable.</p>
        </aside>

        <main className="ta-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>

      <footer className="ta-footer">
        <span>TrazActivo</span>
        <span>Shell local · Sin datos de negocio</span>
      </footer>
    </div>
  );
}
