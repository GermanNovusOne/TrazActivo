import { AppShell, StatusBadge } from "@trazactivo/design-system";

const navigation = [
  { current: true, href: "/", label: "Resumen" },
  { href: "/health", label: "Estado de plataforma" },
] as const;

const foundations = [
  {
    description: "Superficie reservada para la futura administración del catálogo de clientes.",
    index: "01",
    title: "Clientes SaaS",
  },
  {
    description: "Health visual del shell sin consultar servicios, datos ni infraestructura.",
    index: "02",
    title: "Visibilidad operativa",
  },
  {
    description: "Navegación de plataforma aislada de la experiencia del cliente.",
    index: "03",
    title: "Plano de control",
  },
] as const;

export default function ControlHome() {
  return (
    <AppShell audienceLabel="TrazActivo Control" navigation={navigation} variant="control">
      <section className="ta-hero" aria-labelledby="control-title">
        <div>
          <p className="ta-eyebrow">Administración SaaS</p>
          <h1 id="control-title">Una vista de plataforma claramente separada.</h1>
          <p className="ta-hero__lead">
            Este shell establece la identidad operativa de TrazActivo Control sin habilitar
            lifecycle, soporte, identidad ni acceso a recursos de clientes.
          </p>
        </div>
        <div className="ta-hero__aside">
          <StatusBadge tone="information">Shell disponible</StatusBadge>
          <small>Vista local sin permisos de plataforma ni operaciones ejecutables.</small>
        </div>
      </section>

      <section className="ta-section" id="overview" aria-labelledby="control-foundations-title">
        <div className="ta-section__heading">
          <h2 id="control-foundations-title">Control sin cruces de responsabilidad</h2>
          <p>La operación del cliente vive en otro shell.</p>
        </div>
        <div className="ta-card-grid">
          {foundations.map((foundation) => (
            <article className="ta-card" key={foundation.index}>
              <span className="ta-card__index" aria-hidden="true">
                {foundation.index}
              </span>
              <h3>{foundation.title}</h3>
              <p>{foundation.description}</p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
