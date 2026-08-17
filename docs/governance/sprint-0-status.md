# Estado de Sprint 0

## Objetivo

Preparar la baseline implementable exigida por la Fase 0 del PDD sin adelantar
decisiones contables, de seguridad, aislamiento o plataforma que continúan TBD.

## Entregables

| Entregable PDD | Estado | Evidencia en repositorio |
|---|---|---|
| PDD aprobado | Pendiente | `TBD-PROD-001`; RC1 sigue siendo baseline propuesta |
| ADR P0 | En curso | `docs/architecture/adr/` |
| Matriz normativa perfil piloto | Bloqueado | `docs/accounting/pilot-normative-matrix.md` |
| Golden dataset aprobado | Bloqueado | `docs/accounting/golden-dataset-governance.md` |
| Prototipos UX-001 a UX-005 | Material de validación existente | `trazactivo_demo/`, sin incorporar ni modificar en Sprint 0 |
| Threat model | Baseline creada | `docs/security/threat-model.md` |
| Decisión hosting/IaC | Bloqueado | ADR-013, ADR-014, `TBD-AZR-001`, `TBD-AZR-004` |
| Modelo de dominio y API base | Baseline creada | `docs/domain/`, `docs/api/`, `contracts/` |

## Dentro de Sprint 0

- Arquitectura y fronteras del monolito modular.
- Contratos de `TenantContext`, mensaje asíncrono y Problem Details.
- Estrategia de database-per-tenant y migraciones.
- Threat model y especificaciones MT-001 a MT-015.
- ADR aceptados y ADR pendientes sin decisión artificial.
- Gates contables y de release.

## Fuera de Sprint 0

- Implementación de frontend, API, workers o persistencia.
- Provisionamiento Azure productivo.
- Selección de runtime, IaC o plataforma CI/CD sin cierre del TBD respectivo.
- Publicación de políticas contables.
- Implementación de posting de depreciación.

## Criterio de salida

Sprint 0 sólo puede cerrarse cuando no queden TBD P0 que alteren el modelo de
datos o el cálculo inicial. La existencia de este scaffolding no satisface ese
criterio por sí sola.

Fuente: PDD secciones D.1, 45, 46.2 y 48 Fase 0.
