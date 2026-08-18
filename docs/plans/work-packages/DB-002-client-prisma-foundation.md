# DB-002 — Prisma foundation de Client DB A/B

## Estado

`DRAFT`

## Objetivo

Establecer un único schema Prisma de Client DB destinado a A y B, sin usar `ClientId` en una base compartida como barrera; DB-003 aplica y prueba las migrations.

## Resultado observable

El schema Client se genera y valida una vez, sin datos de plataforma, y queda listo para aplicarse independientemente en A y B mediante DB-003.

## Requisitos relacionados

- SAAS-001.
- EPIC-DATA-01.
- PDD 04.3, 05.2 y 44.5/44.6.
- Gate 2.

## ADR relacionados

- ADR-018.
- ADR-020.
- ADR-021.
- DEC-CLI-002.
- DEC-TEST-001.

## Gate de entrada

- FND-003 y FND-005 completadas.

## Gate de salida

- Schema Client base revisado y listo para DB-003 y la migración AssetItem posterior.

## Scope

### Incluye

- Prisma schema Client separado, generación/validación y definición de migration base.
- Marcador/versionado de schema y guardas de target.

### No incluye

- `AssetItem`, idempotencia o auditoría funcional; llegan en Wave 3/4.
- Consultas cross-client.
- Client Catalog o secretos.

## Dependencias

- FND-003.
- FND-005.

## Precondiciones

- DB A/B reales saludables y vacías/recreables.

## Supuestos

- A y B comparten versión de schema, no datos ni conexión.

## Bloqueos/TBD

- ADR-018 exige spike antes de definir pooling/manager, pero no bloquea crear el schema base.

## Diseño

### Componentes afectados

- Prisma Client schema e infrastructure de migración local.

### Cambios esperados

- Un schema lógico aplicado a dos DB físicas distintas.

### Frontend

- Sin Prisma ni acceso DB.

### API/OpenAPI

- No aplica.

### Application/Domain/Policy

- Sin reglas.

### ClientContext y aislamiento

- Las migraciones reciben target administrativo validado; el runtime futuro sólo usa DatabaseReference autorizada.

### Prisma y migraciones

- Schema/migration Client únicos; DB-003 los aplica por separado y registra estado por A/B.

### Permisos

- Usuario local de migration separado del runtime cuando el diseño lo permita.

### Eventos y auditoría

- Schema validation report; migration report llega en DB-003.

### Observabilidad

- Duración, versión y error por target sin secretos.

## Contratos API

- No aplica.

## Persistencia

- Define el schema para Client DB; DB-003 demuestra A/B reales y separadas.

## Archivos o módulos esperados

- Prisma schema/migration Client, client generado interno y validación de separación.

## Criterios de aceptación

- [ ] El schema Client genera/valida de forma determinista.
- [ ] No contiene entidades de Platform DB.
- [ ] Está listo para aplicación independiente A/B en DB-003.
- [ ] Schema no anticipa contabilidad ni módulos fuera de alcance.
- [ ] Prisma Client no cruza infrastructure.

## Casos negativos

- [ ] Un target no autorizado falla antes de migrar.
- [ ] Drift en sólo una DB queda visible y bloquea gate.
- [ ] Una sola DB con columna ClientId no satisface aceptación.

## Pruebas obligatorias

```text
npm run db:client:generate
npm run db:client:validate
npm run test:architecture
npm run typecheck
```

## Comandos locales

- Cada comando debe imprimir identidad lógica del target, nunca credenciales.

## Definition of Done

- [ ] Generate/validate.
- [ ] Typecheck/architecture.
- [ ] Separación Platform/Client evidenciada.
- [ ] Runbook local.
- [ ] Sin secretos ni scope extra.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- Schema diff, generación determinista y prueba de ausencia de entidades Platform.

## Riesgos

- Drift de schema.
- Migrar todas las DB sin control.

## Rollback o reversibilidad

- Revertir el schema en la branch antes de DB-003; una migration aplicada posteriormente se corrige con forward migration.

## Condiciones de bloqueo

- No se pueden distinguir A/B.
- Schema no puede validarse o mezcla Platform/Client.
