# QA-001 — Integración, contrato, idempotencia, auditoría y seguridad

## Estado

`DRAFT`

## Objetivo

Validar que el comportamiento HTTP real coincide con OpenAPI y que idempotencia, transacciones, auditoría y errores seguros funcionan sobre el sistema levantado.

## Resultado observable

Reporte combinado demuestra create/list/get aislado para A/B, contrato sin drift, replay/conflict correcto, audit atómico y ausencia de fugas en errores/logs.

## Requisitos relacionados

- API-001.
- AUD-001.
- NFR-INT-001.
- NFR-CONC-001.
- NFR-OBS-001.
- Gate 3.

## ADR relacionados

- ADR-017.
- ADR-018.
- ADR-021.

## Gate de entrada

- API-002, AST-003, AUD-001, OBS-001 y CLI-005 completadas.

## Gate de salida

- Contrato y safeguards del backend aceptados para E2E final.

## Scope

### Incluye

- Contract tests documento↔comportamiento↔cliente generado.
- Creación, listado y consulta de AssetItem para A y B sobre sus DB reales, con ataques cruzados bidireccionales.
- Requests válidos/invalidos, Problem Details y CorrelationId.
- Idempotencia misma key/fingerprint, conflicto y concurrencia simultánea.
- Atomicidad Asset/Idempotency/Audit y redacción de logs.

### No incluye

- UI/a11y final, performance productiva o Azure smoke.
- Contratos de módulos no implementados.

## Dependencias

- API-002.
- AST-003.
- CMD-001.
- AUD-001.
- OBS-001.
- CLI-005.

## Precondiciones

- Sistema real levantado con tres DB y cliente generado actual.

## Supuestos

- Los mocks sólo prueban fallos unitarios y nunca sustituyen evidencia contractual, transaccional o multi-client real.

## Bloqueos/TBD

- Ningún endpoint puede declararse conforme si AUD-001 o idempotencia están incompletos.

## Diseño

### Componentes afectados

- Contract/integration/security suites y reportería.

### Cambios esperados

- Fixtures contractuales, concurrency harness, log assertions y OpenAPI diff.

### Frontend

- Cliente generado se compila y se usa en smoke contractual.

### API/OpenAPI

- Valida schemas, status, headers, Problem Details y comportamiento.

### Application/Domain/Policy

- Verifica errores de dominio traducidos sin alterar códigos estables.

### ClientContext y aislamiento

- Extiende la evidencia de frontera de CLI-005 al comportamiento real de AssetItem; ninguna entrada HTTP selecciona otra DB.

### Prisma y migraciones

- Verifica efectos persistidos y rollback transaccional.

### Permisos

- 401/403/404/409/422 según contrato sin escalación.

### Eventos y auditoría

- Conteo/campos permitidos y fallo bloqueante de audit.

### Observabilidad

- CorrelationId end-to-end y redacción de stack, DBRef, secretos y payload ajeno.

## Contratos API

- Context y assets completos del skeleton.

## Persistencia

- Platform DB, Client DB A y Client DB B participan realmente; cada efecto AssetItem/Audit/Idempotency ocurre sólo en la Client DB autorizada.

## Archivos o módulos esperados

- Suites/reporters contract, integration, concurrency, audit y security/log-redaction.

## Criterios de aceptación

- [ ] OpenAPI y cliente generado coinciden con cada endpoint real.
- [ ] A crea/lista/consulta sus activos y B crea/lista/consulta los suyos sobre DB distintas.
- [ ] A no consulta activos de B y B no consulta activos de A; el error no revela existencia ni datos ajenos.
- [ ] Manipular ClientId/header/query/path/body/cookie no cambia DatabaseReference.
- [ ] Replay igual no duplica; fingerprint incompatible retorna conflicto definido.
- [ ] Corrida simultánea no duplica Asset/Audit.
- [ ] Fallo audit revierte operación.
- [ ] Errores/logs no revelan otro Client ni infraestructura sensible.

## Casos negativos

- [ ] Drift manual de OpenAPI/cliente falla.
- [ ] Error no documentado o header ausente falla contract test.
- [ ] Stack/DBRef/connection string en respuesta/log falla security test.

## Pruebas obligatorias

```text
npm run test:integration
npm run test:contract
npm run test:security
npm run openapi:check
npm run test:multiclient -- --project contract-errors
```

## Comandos locales

- La suite levanta/usa el sistema real; mocks sólo se permiten para fallos unitarios no usados como evidencia de aislamiento.

## Definition of Done

- [ ] Integration/contract/security/multi-client.
- [ ] OpenAPI diff cero.
- [ ] Idempotencia/concurrencia/auditoría.
- [ ] Errores y logs seguros.
- [ ] Evidencia machine-readable.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- OpenAPI diff, reportes HTTP, conteos transaccionales, log scan y cliente compilado.

## Riesgos

- Contract tests sólo validan schema y no comportamiento.
- Audit/idempotencia verificadas con mocks.

## Rollback o reversibilidad

- Tests aditivos; no se suavizan para recuperar un build.

## Condiciones de bloqueo

- Sistema real no puede levantarse.
- Contrato y comportamiento divergen.
