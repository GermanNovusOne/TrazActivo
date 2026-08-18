import { AppShell, StatusBadge } from "@trazactivo/design-system";

const navigation = [
  { href: "/", label: "Resumen" },
  { current: true, href: "/health", label: "Estado de plataforma" },
] as const;

export default function ControlHealthPage() {
  return (
    <AppShell audienceLabel="TrazActivo Control" navigation={navigation} variant="control">
      <section className="ta-hero" aria-labelledby="control-health-title">
        <div>
          <p className="ta-eyebrow">Smoke visual</p>
          <h1 id="control-health-title">El shell de Control está disponible.</h1>
          <p className="ta-hero__lead">
            Esta vista confirma únicamente el render de la aplicación y sus límites visuales.
          </p>
        </div>
        <div className="ta-hero__aside">
          <StatusBadge tone="success">Disponible</StatusBadge>
          <small>No representa health de Platform DB, catálogo ni servicios Azure.</small>
        </div>
      </section>

      <dl className="ta-health-grid" aria-label="Controles del shell de TrazActivo Control">
        <div>
          <dt>Aplicación</dt>
          <dd>control-web</dd>
        </div>
        <div>
          <dt>Superficie</dt>
          <dd>Control Plane</dd>
        </div>
        <div>
          <dt>Operaciones de plataforma</dt>
          <dd>No habilitadas</dd>
        </div>
      </dl>
    </AppShell>
  );
}
