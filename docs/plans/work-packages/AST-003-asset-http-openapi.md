# AST-003 — POST/GET AssetItem y OpenAPI real

## Estado

`DRAFT`

## Objetivo

Exponer create/list/get de AssetItem mediante controllers delgados, contrato OpenAPI real y errores seguros.

## Resultado observable

Los endpoints mínimos funcionan para el Client autorizado, requieren safeguards apropiados y actualizan un OpenAPI que describe su comportamiento real; API-002 genera después el cliente TypeScript.

## Requisitos relacionados

- API-001.
- AST-001.
- SAAS-001.
- PDD 35.3/35.4.
- EPIC-API-01.
- Backlog inicial AST-003.
- Gate 3.

## ADR relacionados

- ADR-016.
- ADR-017.
- ADR-018.
- ADR-021.

## Gate de entrada

- API-001, APP-001, CMD-001 y CLI-004 completadas.

## Gate de salida

- Backend HTTP del skeleton disponible; queda pendiente auditoría concreta de AUD-001 para aprobación final.

## Scope

### Incluye

```text
POST /api/v1/assets
GET  /api/v1/assets
GET  /api/v1/assets/{id}
```

- DTO HTTP, mapping, paginación mínima, Problem Details, CorrelationId, Idempotency-Key y version/ETag.
- Actualización del OpenAPI que API-002 usará para generar el cliente TypeScript.

### No incluye

- PATCH, delete, ficha 360 completa o campos contables.
- Lógica de dominio en controllers.
- Endpoints cross-client.

## Dependencias

- API-001.
- APP-001.
- CMD-001.
- CLI-004.

## Precondiciones

- Use cases, datasource e idempotencia cumplen sus pruebas.

## Supuestos

- El endpoint mínimo no incorpora actualización ni campos fuera del Walking Skeleton.

## Bloqueos/TBD

- AUD-001 es dependencia de salida de Gate 3, aunque no bloquea definir/implementar el contrato HTTP.

## Diseño

### Componentes afectados

- data-api presentation y OpenAPI Data.

### Cambios esperados

- Controllers, DTOs, mappers, decorators contractuales y error mapping.

### Frontend

- El consumo mediante cliente generado llega en API-002; UI funcional llega en UX-001.

### API/OpenAPI

- Permisos, scope, auditoría requerida, idempotencia, version y errores declarados por operación.

### Application/Domain/Policy

- Controllers llaman casos de uso; no invariantes ni Policy Engine.

### ClientContext y aislamiento

- Contexto viene del guard CLI-003; IDs del request nunca cambian datasource.

### Prisma y migraciones

- Ningún acceso directo desde controller.

### Permisos

- POST `assets.create`; GET `assets.read`; feature Assets; LegalEntity scope.

### Eventos y auditoría

- Contrato declara ClientAudit en POST; implementación atómica se completa en AUD-001.

### Observabilidad

- CorrelationId, status, duración, endpoint; sin payload cross-client.

## Contratos API

- OpenAPI Data es fuente para inputs/outputs/errores; API-002 genera el cliente después de esta WP.

## Persistencia

- Vía use cases/repository en una Client DB autorizada.

## Archivos o módulos esperados

- Asset controller/DTO/mappers, decorators de contrato y OpenAPI Data actualizado.

## Criterios de aceptación

- [ ] A/B pueden invocar sus endpoints con contexto válido.
- [ ] POST exige Idempotency-Key y devuelve version/ETag.
- [ ] List/Get no revelan recursos de otro Client.
- [ ] OpenAPI describe el comportamiento real; la generación y el drift gate final quedan para API-002.
- [ ] Controllers no contienen invariantes ni Prisma.

## Casos negativos

- [ ] ID de B desde A devuelve error seguro sin datos inferibles.
- [ ] ClientId manipulado no cambia DB.
- [ ] DTO inválido no llega a dominio/persistencia.
- [ ] Error interno no expone stack/DBRef.

## Pruebas obligatorias

```text
npm run test:unit -- --project asset-http
npm run test:integration -- --project asset-api
npm run test:contract -- --project assets
npm run test:multiclient -- --project asset-api
npm run openapi:generate
npm run openapi:check
npm run test:architecture
```

## Comandos locales

- data-api levantada con Platform DB y DB A/B reales.

## Definition of Done

- [ ] Unit/integration/contract/multi-client/architecture.
- [ ] OpenAPI actualizado y listo para API-002.
- [ ] Permisos/scopes/idempotencia/version.
- [ ] Errores/observabilidad.
- [ ] Sin Prisma/controller rules/secretos.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- Requests/responses A/B, OpenAPI validado, Problem Details y dependency trace.

## Riesgos

- Contrato declara auditoría que todavía no es atómica; Gate 3 permanece abierto hasta AUD-001.
- Error 403/404 revela existencia por diferencias observables.

## Rollback o reversibilidad

- Retirar endpoints/cambio OpenAPI en la branch; no borrar datos creados para simular rollback.

## Condiciones de bloqueo

- Contrato diverge de implementación.
- Controller necesita seleccionar DB.
