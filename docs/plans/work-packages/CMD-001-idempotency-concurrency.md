# CMD-001 — Idempotencia y concurrencia de creación AssetItem

## Estado

`DRAFT`

## Objetivo

Garantizar que creaciones repetidas o simultáneas no dupliquen AssetItem y que el contrato exponga versión/ETag sin pérdidas silenciosas.

## Resultado observable

Misma `Idempotency-Key` y fingerprint retorna el mismo resultado persistido; la misma clave con fingerprint distinto retorna conflicto estable; ejecuciones simultáneas producen un solo AssetItem.

## Requisitos relacionados

- API-001.
- NFR-CONC-001.
- PDD 35.1, 39.2 y 43.
- Walking Skeleton: idempotencia y optimistic concurrency.

## ADR relacionados

- ADR-017.
- ADR-018.
- ADR-021.

## Gate de entrada

- APP-001 y AST-002 completadas.

## Gate de salida

- Command handler listo para exposición HTTP segura.

## Scope

### Incluye

- Registro idempotente en Client DB, canonical fingerprint y replay de respuesta estable.
- Transacción atómica entre reserva, creación y resultado.
- Version/ETag inicial y control de condiciones concurrentes aplicables a creación.
- Pruebas simultáneas coordinadas.

### No incluye

- Un servicio global cross-client de idempotencia.
- PATCH u otros comandos no necesarios para el skeleton.
- Locks distribuidos/Azure sin evidencia de necesidad.

## Dependencias

- APP-001.
- AST-002.

## Precondiciones

- Formato y error contractual de key/fingerprint documentados en API-001.

## Supuestos

- No se presume plazo de retención; el skeleton sólo exige semántica verificable dentro del ambiente de prueba aprobado.

## Bloqueos/TBD

- Si la ventana de retención de idempotency records afecta contrato/producto, debe abrirse Decision Request; no se inventa un plazo.

## Diseño

### Componentes afectados

- Client Prisma migration, application command safeguards y contract types.

### Cambios esperados

- IdempotencyRecord, fingerprint canonical, unique constraints y response reference.

### Frontend

- Genera/envía key por intención de creación; no decide resultado.

### API/OpenAPI

- Header obligatorio, conflictos definidos y ETag/version de respuesta.

### Application/Domain/Policy

- Idempotencia orquesta alrededor del use case; no altera invariantes.

### ClientContext y aislamiento

- Records viven en la Client DB seleccionada; misma key en A/B no comparte estado.

### Prisma y migraciones

- Migration versionada A/B; transacción en una sola Client DB.

### Permisos

- Revalidar permiso incluso en replay conforme al diseño de seguridad aprobado.

### Eventos y auditoría

- Replay no duplica evento de dominio ni auditoría de creación; accesos/replays se observan según clasificación.

### Observabilidad

- Métrica new/replay/conflict/race sin registrar payload sensible.

## Contratos API

- `Idempotency-Key` y error 409 estable para fingerprint incompatible.

## Persistencia

- IdempotencyRecord y AssetItem en la misma Client DB/transacción.

## Archivos o módulos esperados

- Migration/modelo IdempotencyRecord, canonical fingerprint, command decorator/service y pruebas concurrentes.

## Criterios de aceptación

- [ ] Mismo key/fingerprint retorna mismo AssetItem y no duplica fila.
- [ ] Key igual/fingerprint distinto retorna conflicto contractual.
- [ ] Dos requests simultáneos crean una sola vez.
- [ ] La misma key en A y B permanece aislada.
- [ ] La respuesta expone version/ETag coherente.

## Casos negativos

- [ ] Key ausente/mal formada en POST se rechaza según contrato.
- [ ] Crash entre reserva y persistencia no deja éxito ambiguo.
- [ ] Replay no reusa repository/contexto de otro Client.

## Pruebas obligatorias

```text
npm run db:client:migrate:local -- --client A
npm run db:client:migrate:local -- --client B
npm run test:unit -- --project idempotency
npm run test:integration -- --project idempotency-concurrency
npm run test:multiclient -- --project idempotency-a-b
npm run test:contract -- --project idempotency
```

## Comandos locales

- Tests coordinan requests simultáneos contra sistema real, no sólo mocks.

## Definition of Done

- [ ] Migration versionada.
- [ ] Unit/integration/contract/multi-client/concurrency.
- [ ] Error y ETag documentados.
- [ ] Observabilidad.
- [ ] Sin duplicados ni secretos.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- Conteos DB, respuestas replay/conflict y reporte de carrera simultánea A/B.

## Riesgos

- Fingerprint no canónico.
- Reserva y creación en transacciones separadas.

## Rollback o reversibilidad

- Migration compensatoria en DB local; no eliminar AssetItem exitosos para “reintentar”.

## Condiciones de bloqueo

- No puede garantizarse atomicidad.
- Retención contractual necesaria pero no decidida.
