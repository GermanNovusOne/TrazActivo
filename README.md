# TrazActivo

Base de trabajo para TrazActivo, una plataforma SaaS multi-tenant de gestión
patrimonial y auxiliar contable.

## Fuente de verdad

El documento [TrazActivo_PDD_v1.0_RC1.md](TrazActivo_PDD_v1.0_RC1.md) es la
fuente de verdad vigente. Los artefactos de este repositorio derivan de esa
baseline y no pueden completar silenciosamente decisiones marcadas como TBD.

## Estado actual

El repositorio se encuentra en Sprint 0: baseline y validación. En esta etapa
se versionan decisiones, límites de módulos, contratos base, amenazas, pruebas
P0 y gates de avance. El stack de aplicación, el hosting, IaC y CI/CD siguen
pendientes donde el PDD así lo indica.

No existe todavía implementación productiva. En particular, no debe iniciarse
el posting de depreciación hasta cerrar `TBD-ACC-002`, `TBD-ACC-003` y la
matriz normativa del perfil piloto.

## Estructura

```text
contracts/   Contratos neutrales al stack
database/    Estrategia y gates de migraciones por tenant
docs/        Arquitectura, ADR, seguridad, dominio, pruebas y gobernanza
infra/       Decisiones y límites de infraestructura; IaC aún bloqueado
policies/    Gobernanza del Policy Engine y golden dataset
src/         Mapa del futuro monolito modular; sin runtime seleccionado
tests/       Especificaciones P0 neutrales al framework
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

El estado y los bloqueos de Sprint 0 se mantienen en
[docs/governance/sprint-0-status.md](docs/governance/sprint-0-status.md).
