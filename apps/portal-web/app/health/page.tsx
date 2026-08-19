import { AppShell, StatusBadge } from "@trazactivo/design-system";

const navigation = [
  { href: "/", label: "Inicio" },
  { current: true, href: "/health", label: "Estado del shell" },
] as const;

export default function PortalHealthPage() {
  return (
    <AppShell audienceLabel="Portal de clientes" navigation={navigation} variant="portal">
      <section className="ta-hero" aria-labelledby="portal-health-title">
        <div>
          <p className="ta-eyebrow">Smoke visual</p>
          <h1 id="portal-health-title">El shell del portal está disponible.</h1>
          <p className="ta-hero__lead">
            Esta vista confirma únicamente el render del frontend y su design system compartido.
          </p>
        </div>
        <div className="ta-hero__aside">
          <StatusBadge tone="success">Disponible</StatusBadge>
          <small>No representa health de API, base de datos ni servicios Azure.</small>
        </div>
      </section>

      <dl className="ta-health-grid" aria-label="Controles del shell del portal">
        <div>
          <dt>Aplicación</dt>
          <dd>portal-web</dd>
        </div>
        <div>
          <dt>Design system</dt>
          <dd>Cargado</dd>
        </div>
        <div>
          <dt>Datos de negocio</dt>
          <dd>No conectados</dd>
        </div>
      </dl>
    </AppShell>
  );
}
