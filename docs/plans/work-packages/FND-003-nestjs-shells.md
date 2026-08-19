# FND-003 — Shells NestJS de Data Plane, Control Plane y worker

## Estado

`DONE`

Autorizada exclusivamente para implementación por decisión humana del 2026-08-19. FND-001 está
`DONE`, por lo que la dependencia y el gate de entrada están satisfechos. Esta transición no
autorizó ninguna otra Work Package. El cierre fue aprobado humanamente tras la implementación y
merge del PR #8 en `architecture/v1.1-typescript` mediante el commit `860910a`.

## Objetivo

Crear foundations NestJS independientes para `data-api`, `control-api` y `worker`, respetando capas y sin lógica de dominio anticipada.

## Resultado observable

Las tres aplicaciones levantan y construyen por separado, exponen health mínimo seguro y cumplen reglas automatizadas de dependencias.

## Requisitos relacionados

- EPIC-FND-02.
- PDD 05.3, 06 y 44.
- Gate 1.

## ADR relacionados

- ADR-015.
- ADR-019.
- ADR-021.

## Gate de entrada

- FND-001 completada (`DONE`); gate de entrada satisfecho.

## Gate de salida

- Shells backend disponibles para OpenAPI, datos y boundary Client.

## Scope

### Incluye

- Bootstrap, configuración validada, health y shutdown controlado.
- Carpetas/capas presentation, application, domain e infrastructure donde correspondan.
- Worker standalone sin job funcional.

### No incluye

- Prisma, Client Resolver, autenticación real, endpoints de negocio o mensajería Azure.
- Imports internos entre aplicaciones.
- Microservicios por bounded context.

## Dependencias

- FND-001 (`DONE`; satisfecha).

## Precondiciones

- Toolchain y puertos locales definidos sin secretos.

## Supuestos

- El runtime es local; no se presume hosting Azure ni topología productiva.

## Bloqueos/TBD

- `TBD-DEV-002` y `DEC-AZR-002` mantienen el hosting Azure pendiente y no bloquean el shell local.

## Diseño

### Componentes afectados

- `apps/data-api`, `apps/control-api`, `apps/worker`.

### Cambios esperados

- Bootstrap mínimo, health y graceful shutdown.

### Frontend

- No aplica.

### API/OpenAPI

- Health técnico; contratos funcionales llegan en API-001.

### Application/Domain/Policy

- Sólo límites de capas; sin invariantes funcionales.

### ClientContext y aislamiento

- Cualquier ruta de negocio futura debe requerir el boundary; el health no abre Client DB.

### Prisma y migraciones

- No aplica.

### Permisos

- Health limitado según configuración local; ningún permiso de negocio.

### Eventos y auditoría

- No aplica.

### Observabilidad

- Startup/shutdown/health con redacción de configuración.

## Contratos API

- Health técnico no forma parte del Data Plane de negocio.

## Persistencia

- Ninguna.

## Archivos o módulos esperados

- `apps/data-api`, `apps/control-api` y `apps/worker` con bootstrap/health mínimos.

## Criterios de aceptación

- [x] Las tres apps construyen y levantan de forma independiente.
- [x] `data-api` y `control-api` no mezclan módulos ni permisos.
- [x] Worker no procesa mensajes sin envelope/contexto.
- [x] Controllers no contienen invariantes.
- [x] Shutdown no deja procesos abiertos.

## Casos negativos

- [x] Un import entre apps falla architecture test.
- [x] Un secreto/config completa no aparece en health/logs.
- [x] El health no intenta abrir Prisma Client DB.

## Pruebas obligatorias

```text
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:architecture
npm run build
```

## Comandos locales

```text
npm run dev --workspace data-api
npm run dev --workspace control-api
npm run dev --workspace worker
```

## Definition of Done

- [x] Build/lint/typecheck.
- [x] Unit/architecture.
- [x] Health y shutdown verificados.
- [x] Límites de apps documentados.
- [x] Sin Prisma, secretos o funcionalidad anticipada.
- [x] Sin TBD P0 aplicable.

## Evidencia esperada

- Logs sanitizados de startup/health/shutdown y matriz de dependencias.

## Evidencia de cierre

- PR #8 implementado y mergeado en `architecture/v1.1-typescript`.
- Merge commit integrado: `860910a`.
- Reporte de implementación: `docs/plans/reports/FND-003-report.md`.
- `npm ci`: exit 0.
- `npm run verify`: exit 0; ejecutó `VERIFY_RUNNING step=build` y posteriormente
  `VERIFY_RUNNING step=test:backend-smoke`, y terminó con
  `VERIFY_COMPLETE result=CONTROLS_EXECUTED_WITH_EXPLICIT_SCOPE_STATUSES`.
- `npm run test:unit`: 24/24.
- `npm run test:architecture`: 24/24.
- Builds independientes de `data-api`, `control-api` y `worker`: exit 0.
- Backend smoke integrado al contrato raíz de `verify`: Data API y Control API respondieron HTTP
  200; el worker mantuvo correctamente su runtime idle; los tres shutdown liberaron sus handles.
- `git diff --check`: exit 0.
- `git status`: working tree limpio post-merge.
- No se implementó FND-004, FND-005 ni ninguna Work Package posterior; ninguna queda autorizada
  por este cierre.

## Riesgos

- Convertir shells en servicios prematuros.
- Duplicar configuración sin límites claros.

## Rollback o reversibilidad

- Reversión por workspace, sin datos persistidos.

## Condiciones de bloqueo

- FND-001 está completada y no constituye un bloqueo vigente.
- No quedan condiciones de bloqueo aplicables al cierre de FND-003; no se mezclaron Control Plane
  y Data Plane.
