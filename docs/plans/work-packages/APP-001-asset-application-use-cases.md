# APP-001 — Casos de uso create/list/get de AssetItem

## Estado

`DRAFT`

## Objetivo

Orquestar creación, listado y consulta de AssetItem con ClientContext, permisos, feature, invariantes y puertos explícitos.

## Resultado observable

Casos de uso framework-agnostic crean y consultan activos sólo dentro del contexto autorizado y devuelven resultados/errores estables sin revelar recursos de otro Client.

## Requisitos relacionados

- AST-001.
- SAAS-001.
- SUB-001.
- SEC-004.
- EPIC-AST-01.
- Secuencia técnica mínima del Walking Skeleton: application use case antes de HTTP.
- Gate 3.

## ADR relacionados

- ADR-016.
- ADR-019.
- ADR-021.

## Gate de entrada

- AST-001, AST-002 y CLI-003 completadas.

## Gate de salida

- Application layer listo para safeguards de comando y adapters HTTP.

## Scope

### Incluye

- `CreateAssetItem`, `ListAssetItems`, `GetAssetItem`.
- Puertos repository, unit of work, audit e idempotency a completar por WPs posteriores.
- Validación `Assets` feature, `assets.create/read`, scope LegalEntity y estado de negocio.

### No incluye

- HTTP, Prisma directo, UI, contabilidad o actualización de activos.
- Autorización final en frontend.

## Dependencias

- AST-001.
- AST-002.
- CLI-003.

## Precondiciones

- Permisos mínimos y features seed aprobados en CLI-003.

## Supuestos

- No existen permisos implícitos; cada use case usa los códigos y scopes documentados.

## Bloqueos/TBD

- Cualquier necesidad de rol adicional no documentado se registra; no se amplían permisos por conveniencia.

## Diseño

### Componentes afectados

- data-api application y puertos domain/infrastructure.

### Cambios esperados

- Commands/queries, authorization policy y DTOs internos de aplicación.

### Frontend

- No aplica.

### API/OpenAPI

- Salidas preparadas para mapping HTTP, sin tipos HTTP en application.

### Application/Domain/Policy

- Application coordina; domain valida; Policy Engine no participa.

### ClientContext y aislamiento

- Contexto obligatorio en constructor/execute; no contexto global mutable.

### Prisma y migraciones

- Sólo vía repository/UnitOfWork.

### Permisos

- `assets.create`, `assets.read`, feature Assets y scope LegalEntity.

### Eventos y auditoría

- Emite datos necesarios hacia puerto audit sin persistir aún la implementación final.

### Observabilidad

- OperationName, CorrelationId, resultado y latencia; no payload completo.

## Contratos API

- No aplica directamente; AST-003 traduce.

## Persistencia

- Vía AST-002; una Client DB por ejecución.

## Archivos o módulos esperados

- Commands/queries create/list/get, ports repository/unit-of-work/audit/idempotency y authorization policies.

## Criterios de aceptación

- [ ] Sin ClientContext no se ejecuta ningún use case.
- [ ] Create requiere feature/permiso/scope válidos.
- [ ] List/Get no revelan existencia cross-client.
- [ ] Controllers/repositories futuros no reciben invariantes.
- [ ] Los puertos permiten atomicidad con idempotencia/auditoría.

## Casos negativos

- [ ] Feature deshabilitada rechaza aunque la URL sea conocida.
- [ ] LegalEntity fuera del scope rechaza antes de persistencia.
- [ ] ID de B desde A produce error seguro indistinguible.

## Pruebas obligatorias

```text
npm run test:unit -- --project asset-application
npm run test:integration -- --project asset-use-cases
npm run test:architecture
npm run test:multiclient -- --project asset-use-cases
```

## Comandos locales

- Integration usa manager y DB A/B reales, no repository mocks para aislamiento.

## Definition of Done

- [ ] Unit/architecture/integration/multi-client.
- [ ] Permisos/features/scopes.
- [ ] Puertos de auditoría/idempotencia documentados.
- [ ] Errores seguros y observabilidad.
- [ ] Sin framework/Prisma en application.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- Matriz use case→permiso/scope/error y trazas A/B.

## Riesgos

- Autorizar en controller.
- Repository filtra cross-client después de revelar existencia.

## Rollback o reversibilidad

- Casos de uso pueden revertirse sin migración adicional.

## Condiciones de bloqueo

- Permisos/scope no definidos.
- Unit of work no puede incorporar safeguards atómicos.
