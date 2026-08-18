# Baseline de despliegue en Azure

## Objetivo

Desplegar un ambiente DEV reproducible sin acoplar el código a una opción definitiva de hosting.

## Vista

```text
Azure Front Door + WAF
        │
        ├── control-web ── control-api ── Platform DB / Client Catalog
        │
        └── portal-web ─── data-api ───── Client DBs
                                      │
worker ── Service Bus ────────────────┘

Blob Storage por cliente
Key Vault
App Configuration
Application Insights / Log Analytics / Monitor
```

## Ambientes

- Development.
- Test.
- QA/UAT.
- Production.

Producción no comparte datos, secretos, redes ni storage con ambientes inferiores.

## Hosting

La aplicación debe ser container-ready y también capaz de ejecutarse como proceso Node.js. `TBD-DEV-002` define App Service o Container Apps para el primer ambiente.

Criterios de decisión:

- disponibilidad regional y SKU;
- costo base;
- operación del equipo;
- escalamiento de web, API y worker;
- revisiones y despliegue gradual;
- integración con red privada;
- observabilidad;
- recuperación.

## Datos

- Platform DB separada.
- Una Azure SQL DB por cliente.
- Elastic pool sólo después de medir perfil y riesgo de noisy neighbor.
- `ClientCatalog` registra la versión de schema.
- Connection strings o credenciales no se exponen al frontend ni se almacenan como texto en el catálogo.

## IaC

Bicep es la propuesta inicial:

```text
infra/modules/frontdoor
infra/modules/app-hosting
infra/modules/sql
infra/modules/storage
infra/modules/service-bus
infra/modules/key-vault
infra/modules/monitoring
infra/environments/dev
infra/environments/test
infra/environments/prod
```

## Pipeline propuesto

GitHub Actions:

```text
PR verify
→ build artifacts
→ security scan
→ deploy DEV
→ smoke/integration/E2E
→ approval environment
→ deploy UAT/PROD
```

Las identidades de despliegue usan permisos mínimos y environments protegidos.

## Primer despliegue DEV

Debe incluir sólo:

- Platform DB;
- Client DB A y B;
- portal/control web;
- data/control API;
- worker mínimo;
- OpenAPI;
- observabilidad;
- secrets/config;
- smoke tests.

No incorpora SLA, DR regional, custom domains ni white label comercial antes de sus decisiones.
