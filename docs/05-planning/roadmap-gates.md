# Roadmap por gates

## Gate 0. Preservación y baseline

Entregables:

- tag del repositorio actual;
- PDD v1.1 RC1;
- ADR-015 a ADR-021;
- AGENTS.md actualizado;
- registro de TBD y decisiones.

Criterio de salida: no existe ambigüedad sobre stack, nomenclatura Client, DB por cliente o prohibición de continuar en .NET.

## Gate 1. Foundation local

- monorepo;
- portal-web, control-web, data-api, control-api y worker levantan;
- OpenAPI disponible;
- design tokens aplicados;
- Docker Compose operativo;
- `npm run verify` ejecutable.

Criterio de salida: un equipo nuevo puede clonar, instalar, levantar y verificar sin pasos manuales ocultos.

## Gate 2. Aislamiento multi-cliente

- Platform DB;
- Client Catalog;
- Client Resolver;
- ClientContext;
- Client DB A y B;
- DataSource Manager;
- pruebas MC aplicables.

Criterio de salida: una sesión del Cliente A no obtiene ningún dato, documento, cache o conexión del Cliente B.

## Gate 3. Walking skeleton de AssetItem

- crear, listar y consultar activo;
- auditoría;
- idempotencia;
- concurrencia;
- UI Next.js;
- contrato OpenAPI;
- tests unit, integration, contract y E2E.

Criterio de salida: una operación recorre frontend, backend, dominio, Prisma, DB propia y auditoría.

## Gate 4. Identidad y autorización

- Entra ID/OIDC o modo local aprobado;
- ClientMembership;
- roles, permisos y features;
- cambio seguro de cliente;
- TOTP/step-up según alcance.

## Gate 5. TrazActivo Control y provisionamiento

- alta de cliente;
- provisionamiento local/DEV;
- lifecycle;
- schema version;
- health y PlatformAudit.

## Gate 6. Gestión patrimonial e inventario

- estructura;
- custodia y movimientos;
- QR;
- campañas;
- observaciones y conciliación;
- PWA cuando los TBD offline estén resueltos.

## Gate 7. Auxiliar contable

- libros y períodos;
- políticas;
- reconocimiento;
- Policy Engine;
- depreciación;
- asientos y reversión;
- golden dataset aprobado.

## Gate 8. Azure DEV y preparación productiva

- IaC;
- CI/CD;
- observabilidad;
- restore por cliente;
- seguridad;
- pruebas de carga;
- runbooks;
- NFR contractuales.

No se declara producción mientras permanezcan abiertos los TBD que alteran seguridad, cálculo, restore, SLA, RPO o RTO.
