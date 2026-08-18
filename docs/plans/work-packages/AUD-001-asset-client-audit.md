# AUD-001 — ClientAuditEvent atómico para AssetItem

## Estado

`DRAFT`

## Objetivo

Registrar la creación de AssetItem en un ClientAuditEvent append-only dentro de la misma unidad transaccional y Client DB.

## Resultado observable

Cada creación nueva produce exactamente un evento permitido y trazable; replay idempotente no duplica creación ni evento.

## Requisitos relacionados

- AUD-001.
- AST-001.
- PDD 32 y 35.3/35.4.
- EPIC-AUD-01.
- Gate 3.

## ADR relacionados

- ADR-009 según PDD.
- ADR-018.
- ADR-021.

## Gate de entrada

- AST-003 y AST-002 completadas.

## Gate de salida

- POST assets cumple la auditoría requerida y queda listo para QA final.

## Scope

### Incluye

- Modelo/migration ClientAuditEvent mínimo.
- Writer append-only y atomicidad AssetItem+audit+idempotency result.
- Actor, membership, Client, LegalEntity, acción, recurso, timestamp, CorrelationId, OperationId y before/after permitido.

### No incluye

- PlatformAudit, exportación de auditoría o event store general.
- Guardar tokens, secretos, DBRef, payload completo o datos de otro Client.
- Auditoría de todos los módulos futuros.

## Dependencias

- AST-003.
- AST-002.
- CMD-001.
- CLI-003.

## Precondiciones

- Clasificación del payload mínimo revisada contra PDD y seguridad.

## Supuestos

- No se presume retención contractual; el evento mínimo sigue siendo append-only y no se purga por conveniencia.

## Bloqueos/TBD

- Si se requiere retención contractual para auditoría, queda fuera y se registra dependencia de `TBD-PRIV-001`; no se inventa plazo.

## Diseño

### Componentes afectados

- Client Prisma migration, application unit of work y audit adapter.

### Cambios esperados

- Tabla append-only, puerto/writer y transacción de creación.

### Frontend

- No recibe datos de auditoría; sólo CorrelationId de la operación.

### API/OpenAPI

- POST mantiene metadato de auditoría declarado; no expone evento interno completo.

### Application/Domain/Policy

- Application compone evento; dominio no depende de auditoría técnica.

### ClientContext y aislamiento

- Evento deriva Client/User/Membership/roles efectivos del contexto validado, no del body.

### Prisma y migraciones

- Audit y AssetItem en la misma Client DB/transacción.

### Permisos

- Actor debe conservar `assets.create`; no existe permiso para modificar eventos.

### Eventos y auditoría

- Append-only; corrección mediante nuevo evento, nunca UPDATE/DELETE funcional.

### Observabilidad

- Métrica de audit write/failure; una operación crítica no completa si falla audit.

## Contratos API

- CorrelationId/OperationId verificables; payload audit no forma parte del contrato público.

## Persistencia

- Client DB A/B separadas, migration versionada.

## Archivos o módulos esperados

- Migration/modelo ClientAuditEvent, audit port/writer, unidad transaccional y tests de atomicidad/append-only.

## Criterios de aceptación

- [ ] Crear AssetItem produce exactamente un ClientAuditEvent en la misma DB.
- [ ] Replay de misma key/fingerprint no duplica el evento de creación.
- [ ] Fallo de audit revierte creación/idempotency como unidad.
- [ ] Actor/contexto provienen server-side.
- [ ] Evento no contiene secretos ni información de otro Client.

## Casos negativos

- [ ] Intento de actualizar/borrar audit es rechazado por adapter/permiso.
- [ ] Client A no puede consultar o inferir audit B.
- [ ] Fallo simulado de writer no deja AssetItem sin audit.

## Pruebas obligatorias

```text
npm run db:client:migrate:local -- --client A
npm run db:client:migrate:local -- --client B
npm run test:unit -- --project client-audit
npm run test:integration -- --project asset-audit-transaction
npm run test:multiclient -- --project audit-a-b
npm run test:contract -- --project asset-audit
npm run test:architecture
```

## Comandos locales

- Validar conteos de AssetItem/IdempotencyRecord/ClientAuditEvent en A y B.

## Definition of Done

- [ ] Migration versionada.
- [ ] Unit/integration/contract/architecture/multi-client.
- [ ] Atomicidad y append-only.
- [ ] Auditoría/observabilidad documentadas.
- [ ] Sin secretos.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- Conteos DB, evento sanitizado, prueba de rollback y replay.

## Riesgos

- Audit best-effort fuera de transacción.
- Before/after excesivo filtra datos.

## Rollback o reversibilidad

- No borrar eventos creados; correcciones por evento/forward migration. Datos locales completos pueden recrearse sólo como ambiente de prueba.

## Condiciones de bloqueo

- No se puede garantizar atomicidad.
- Payload permitido no ha sido revisado.
