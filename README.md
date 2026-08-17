# TrazActivo

Base de trabajo para TrazActivo, una plataforma SaaS multi-tenant de gestión
patrimonial y auxiliar contable.

## Fuente de verdad

El documento [TrazActivo_PDD_v1.0_RC1.md](TrazActivo_PDD_v1.0_RC1.md) es la
fuente de verdad vigente. Los artefactos de este repositorio derivan de esa
baseline y no pueden completar silenciosamente decisiones marcadas como TBD.

## Estado actual

El repositorio se encuentra en Sprint 1: foundation ejecutable del Control
Plane sobre .NET 10. La solución implementa el modelo mínimo de Tenant y
TenantCatalogEntry, lifecycle inicial, contratos de tenancy, API versionada,
health, OpenAPI, Problem Details, CorrelationId, PlatformAudit, idempotencia y
optimistic concurrency.

Los adaptadores de persistencia son exclusivamente en memoria para
`Development` y `Testing`; el arranque los rechaza en `Production`. No existe
Data Plane funcional ni infraestructura productiva. En particular, no debe
iniciarse el posting de depreciación hasta cerrar `TBD-ACC-002`,
`TBD-ACC-003` y la matriz normativa del perfil piloto.

## Estructura

```text
contracts/   Contratos neutrales al stack
database/    Estrategia y gates de migraciones por tenant
docs/        Arquitectura, ADR, seguridad, dominio, pruebas y gobernanza
infra/       Decisiones y límites de infraestructura; IaC aún bloqueado
policies/    Gobernanza del Policy Engine y golden dataset
src/         Foundation .NET 10 del Control Plane, tenancy y API
tests/       Especificaciones P0 y suites ejecutables de Sprint 1
```

## Invariantes no negociables

- Monolito modular API-first.
- Database-per-tenant y storage segregado por tenant.
- Control Plane separado de Data Plane.
- `TenantContext` construido y validado server-side.
- Ningún `TenantId` enviado por frontend selecciona DB, storage, cache o índice.
- Reglas contables sólo en backend/Policy Engine.
- Pruebas MT-001 a MT-015 P0 y bloqueantes de release.
- Eventos aprobados o contabilizados se revierten; no se borran.

La baseline se mantiene en
[docs/governance/sprint-0-status.md](docs/governance/sprint-0-status.md) y el
alcance ejecutable se registra en
[docs/implementation/sprint-1-platform-foundation.md](docs/implementation/sprint-1-platform-foundation.md).
