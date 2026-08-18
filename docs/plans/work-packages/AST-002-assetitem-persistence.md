# AST-002 — Persistencia AssetItem en Client DB

## Estado

`DRAFT`

## Objetivo

Persistir AssetItem mediante un adapter Prisma que sólo obtiene datasource desde ClientDataSourceManager y conserva invariantes/versión.

## Resultado observable

Una migration Client DB crea la persistencia mínima en A y B; repository tests escriben/leen exclusivamente la DB indicada por un ClientContext válido.

## Requisitos relacionados

- AST-001.
- SAAS-001.
- PDD 13.4, 39.2 y 44.5.
- EPIC-AST-01.
- Gate 3.

## ADR relacionados

- ADR-018.
- ADR-019.
- ADR-020.
- ADR-021.

## Gate de entrada

- AST-001, DB-002, CLI-004 y CLI-005 completadas.

## Gate de salida

- Repository y migration listos para casos de uso.

## Scope

### Incluye

- Mapping domain↔persistence, migration AssetItem, repository create/get/list y version field.
- Unicidad de inventoryNumber en el scope baseline aprobado.
- Aplicación separada de migration a A/B.

### No incluye

- Controllers, idempotency records, ClientAuditEvent o lógica contable.
- Prisma types fuera de infrastructure.
- Queries simultáneas A+B en una operación.

## Dependencias

- AST-001.
- DB-002.
- CLI-004.
- CLI-005.

## Precondiciones

- Client DB schema base A/B en misma versión.
- ClientDataSourceManager aprobado.

## Supuestos

- El scope de unicidad usado debe provenir de baseline o decisión registrada, nunca de conveniencia técnica.

## Bloqueos/TBD

- Si la unicidad visible requiere scope no definido por baseline, debe registrarse Decision Request antes de migration.

## Diseño

### Componentes afectados

- Client Prisma schema/migration y data-api infrastructure adapter.

### Cambios esperados

- Tabla/modelo AssetItem y repository implementando un puerto de aplicación.

### Frontend

- No aplica.

### API/OpenAPI

- No aplica todavía.

### Application/Domain/Policy

- Repository rehidrata domain; no decide reglas.

### ClientContext y aislamiento

- Contexto explícito por operación; no acepta ClientId como query selector de una DB compartida.

### Prisma y migraciones

- Prisma se obtiene después del contexto válido; migration versionada A/B.

### Permisos

- Aplicación autoriza; repository no interpreta roles.

### Eventos y auditoría

- No ClientAudit todavía; deja unidad transaccional extensible para AUD-001.

### Observabilidad

- Operación, duración y CorrelationId sin payload sensible.

## Contratos API

- No aplica.

## Persistencia

- Client DB propia, version field y timestamps autoritativos.

## Archivos o módulos esperados

- Migration/modelo Client de AssetItem, mapper y Prisma repository adapter.

## Criterios de aceptación

- [ ] Migration aplica independientemente en A/B.
- [ ] Repository A nunca accede a B y viceversa.
- [ ] Contexto inválido produce cero llamadas Prisma.
- [ ] Mapping conserva todos los campos/invariantes.
- [ ] Prisma types permanecen en infrastructure.

## Casos negativos

- [ ] InventoryNumber duplicado en el scope aprobado produce conflicto estable.
- [ ] ResourceId de B consultado desde A no devuelve metadata de B.
- [ ] Repository capturado bajo contexto anterior no puede reutilizarse tras switch.

## Pruebas obligatorias

```text
npm run db:client:migrate:local -- --client A
npm run db:client:migrate:local -- --client B
npm run test:unit -- --project assetitem-mapping
npm run test:integration -- --project assetitem-repository
npm run test:multiclient -- --project assetitem-repository
npm run test:migration -- --project assetitem
npm run test:architecture
```

## Comandos locales

- Se ejecutan con Platform DB y A/B levantadas; repository obtiene target a través del manager.

## Definition of Done

- [ ] Migration versionada.
- [ ] Unit/integration/migration/architecture/multi-client.
- [ ] Observabilidad.
- [ ] Sin Prisma expuesto ni secretos.
- [ ] Documentación y trazabilidad.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- Schema diff, migration logs A/B, matriz context→DB y queries verificadas.

## Riesgos

- Repository singleton conserva Prisma de otro Client.
- Unicidad definida en scope incorrecto.

## Rollback o reversibilidad

- DB de prueba recreable; migration publicada se corrige con forward migration.

## Condiciones de bloqueo

- CLI-004 o CLI-005 no aprobada.
- Scope de unicidad no puede derivarse de baseline.
