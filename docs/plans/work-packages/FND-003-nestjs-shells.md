# FND-003 — Shells NestJS de Data Plane, Control Plane y worker

## Estado

`DRAFT`

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

- FND-001 completada.

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

- FND-001.

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

- [ ] Las tres apps construyen y levantan de forma independiente.
- [ ] `data-api` y `control-api` no mezclan módulos ni permisos.
- [ ] Worker no procesa mensajes sin envelope/contexto.
- [ ] Controllers no contienen invariantes.
- [ ] Shutdown no deja procesos abiertos.

## Casos negativos

- [ ] Un import entre apps falla architecture test.
- [ ] Un secreto/config completa no aparece en health/logs.
- [ ] El health no intenta abrir Prisma Client DB.

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

- [ ] Build/lint/typecheck.
- [ ] Unit/architecture.
- [ ] Health y shutdown verificados.
- [ ] Límites de apps documentados.
- [ ] Sin Prisma, secretos o funcionalidad anticipada.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- Logs sanitizados de startup/health/shutdown y matriz de dependencias.

## Riesgos

- Convertir shells en servicios prematuros.
- Duplicar configuración sin límites claros.

## Rollback o reversibilidad

- Reversión por workspace, sin datos persistidos.

## Condiciones de bloqueo

- FND-001 no completada.
- Diseño que mezcle Control/Data Plane.
