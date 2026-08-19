import { AppShell, StatusBadge } from "@trazactivo/design-system";

const navigation = [
  { current: true, href: "/", label: "Inicio" },
  { href: "/health", label: "Estado del shell" },
] as const;

const foundations = [
  {
    description: "Espacio reservado para la experiencia patrimonial del cliente.",
    index: "01",
    title: "Gestión patrimonial",
  },
  {
    description: "Navegación preparada sin adelantar flujos ni estado de negocio.",
    index: "02",
    title: "Operación separada",
  },
  {
    description: "Superficie lista para el cliente OpenAPI de una Work Package futura.",
    index: "03",
    title: "Contrato futuro",
  },
] as const;

export default function PortalHome() {
  return (
    <AppShell audienceLabel="Portal de clientes" navigation={navigation} variant="portal">
      <section className="ta-hero" aria-labelledby="portal-title">
        <div>
          <p className="ta-eyebrow">Portal de clientes</p>
          <h1 id="portal-title">Tu operación patrimonial empieza con una base clara.</h1>
          <p className="ta-hero__lead">
            Este shell establece navegación, accesibilidad y lenguaje visual sin conectarse a datos
            ni anticipar funcionalidades de negocio.
          </p>
        </div>
        <div className="ta-hero__aside">
          <StatusBadge tone="success">Shell disponible</StatusBadge>
          <small>Vista local sin autenticación, contexto de cliente ni llamadas API.</small>
        </div>
      </section>

      <section className="ta-section" id="overview" aria-labelledby="portal-foundations-title">
        <div className="ta-section__heading">
          <h2 id="portal-foundations-title">Una foundation enfocada</h2>
          <p>Sin mezclar superficies de plataforma.</p>
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
