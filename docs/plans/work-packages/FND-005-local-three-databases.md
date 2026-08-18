# FND-005 — Entorno local con Platform DB y Client DB A/B

## Estado

`DRAFT`

## Objetivo

Proveer infraestructura local reproducible con tres bases SQL reales y controles de readiness, reset seguro y diagnóstico para las pruebas de aislamiento.

## Resultado observable

`npm run local:up` levanta Platform DB, Client DB A y Client DB B como recursos distintos; sus endpoints, credenciales locales y volúmenes se distinguen sin guardar secretos en Git.

## Requisitos relacionados

- EPIC-FND-05.
- SAAS-001.
- PDD 44.6.
- Gate 1 y entrada de Gate 2.

## ADR relacionados

- ADR-018.
- ADR-020.
- ADR-021.

## Gate de entrada

- FND-001 completada.

## Gate de salida

- Tres DB reales disponibles y verificadas para migraciones independientes.

## Scope

### Incluye

- Docker Compose, preflight Windows, health checks y nombres inequívocos.
- Comandos `local:up`, `local:down`, status y reset de datos locales con guardas de path/ambiente.
- Evidencia de que A y B son DB distintas.

### No incluye

- Schemas Prisma, seeds de negocio o Azure SQL.
- Storage/mensajería no requeridos por el skeleton.
- Borrar recursos fuera del proyecto.

## Dependencias

- FND-001.

## Precondiciones

- Docker y puertos locales validados.
- Cualquier acción destructiva resuelve y verifica exactamente los recursos Compose del proyecto.

## Supuestos

- El entorno local es desechable y no representa SLA, capacidad ni disponibilidad Azure.

## Bloqueos/TBD

- `TBD-DEV-002`, `TBD-DEV-003` y `TBD-DATA-001` no aplican al entorno local.
- Si el motor SQL local propuesto cambia la semántica relevante de Azure SQL, se registra Decision Request; no se oculta la diferencia.

## Diseño

### Componentes afectados

- Compose, scripts locales y testkit de infraestructura.

### Cambios esperados

- Servicios separados, readiness y guía de recuperación.

### Frontend

- No aplica.

### API/OpenAPI

- No aplica.

### Application/Domain/Policy

- No aplica.

### ClientContext y aislamiento

- Las DB no se seleccionan desde navegador; sólo se exponen a servicios backend locales.

### Prisma y migraciones

- Prepara destinos, no crea schemas.

### Permisos

- Credenciales locales de mínimo privilegio, fuera de control de versiones.

### Eventos y auditoría

- No aplica.

### Observabilidad

- Health por servicio, puerto y DB sin exponer credenciales.

## Contratos API

- No aplica.

## Persistencia

- Tres servicios/bases físicamente diferenciables y recreables.

## Archivos o módulos esperados

- Compose local, preflight Windows, scripts `local:*` y testkit de readiness/identidad de DB.

## Criterios de aceptación

- [ ] `local:up` es idempotente y tiene health verificable.
- [ ] Platform, A y B poseen identificadores/endpoints distintos.
- [ ] Una caída de A no se presenta como caída de B.
- [ ] No hay secretos o connection strings reales en Git.
- [ ] Un clon limpio reproduce el entorno sin pasos ocultos.

## Casos negativos

- [ ] Colisión de puertos falla con diagnóstico claro.
- [ ] Reset fuera del ambiente local es rechazado.
- [ ] Una sola DB con schemas A/B no satisface aceptación.

## Pruebas obligatorias

```text
npm run local:up
npm run local:status
npm run test:integration -- --project local-infrastructure
npm run test:architecture
npm run local:down
```

## Comandos locales

- Los comandos destructivos de reset se documentan pero sólo se ejecutan contra recursos locales resueltos y validados.

## Definition of Done

- [ ] Integration/architecture.
- [ ] DB A/B reales verificadas.
- [ ] Health y runbook local.
- [ ] Reset seguro.
- [ ] Sin secretos.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- Inventario de containers/DB, health, prueba de independencia y bootstrap desde clon limpio.

## Riesgos

- Simular aislamiento con una sola DB.
- Scripts destructivos demasiado amplios.

## Rollback o reversibilidad

- Detener y remover exclusivamente recursos Compose identificados del proyecto; datos locales son recreables.

## Condiciones de bloqueo

- No puede demostrarse separación real A/B.
- Preflight no protege recursos externos.
