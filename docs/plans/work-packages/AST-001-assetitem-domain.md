# AST-001 — Dominio mínimo de AssetItem

## Estado

`DRAFT`

## Objetivo

Modelar `AssetItem` y sus invariantes mínimas en TypeScript puro, sin contabilidad, framework ni persistencia.

## Resultado observable

El package domain crea y rehidrata activos válidos con `id`, `inventoryNumber`, `name`, `classCode`, `operationalStatus`, `legalEntityId`, `createdAt` y `version`, rechazando estados inválidos de forma determinista.

## Requisitos relacionados

- AST-001.
- PDD 12.2/12.3, 13.4 y 14.1.
- EPIC-AST-01.
- Gate 3.

## ADR relacionados

- ADR-015.
- ADR-019.
- ADR-021.

## Gate de entrada

- FND-004 completada.

## Gate de salida

- Dominio listo para adapter y casos de uso.

## Scope

### Incluye

- Entidad/value objects mínimos, factory de creación, rehidratación y versión.
- Invariantes de identificadores, campos obligatorios y estado inicial permitido.
- Eventos de dominio mínimos requeridos por creación.

### No incluye

- `AccountingAsset`, montos, depreciación, documentos, ubicación/custodia completa o workflows.
- NestJS, Prisma, HTTP o Azure.

## Dependencias

- FND-004.

## Precondiciones

- Usar exactamente los campos mínimos del Walking Skeleton; cualquier campo adicional necesita requisito.

## Supuestos

- AssetItem representa control físico y no implica reconocimiento contable.

## Bloqueos/TBD

- Los TBD contables no aplican porque no se modela contabilidad.
- Si una regla no está en baseline, se registra Decision Request y no se inventa default.

## Diseño

### Componentes afectados

- `packages/domain` y unit tests puros.

### Cambios esperados

- Aggregate/entity, value objects, errores de dominio y evento `AssetItemCreated`.

### Frontend

- No aplica.

### API/OpenAPI

- No aplica; DTO se define posteriormente.

### Application/Domain/Policy

- Dominio TypeScript puro; Policy Engine no participa.

### ClientContext y aislamiento

- El dominio recibe `LegalEntityId`/scope ya autorizado; no resuelve Client ni DB.

### Prisma y migraciones

- No aplica.

### Permisos

- No aplica dentro del dominio.

### Eventos y auditoría

- Evento de dominio mínimo, distinto de ClientAuditEvent.

### Observabilidad

- No aplica.

## Contratos API

- No aplica.

## Persistencia

- Sólo contrato de rehidratación, sin repository.

## Archivos o módulos esperados

- Aggregate/entity AssetItem, value objects, errores/evento de dominio y unit tests puros.

## Criterios de aceptación

- [ ] Crea un AssetItem mínimo válido con versión inicial.
- [ ] Rechaza inventario/nombre/clase/legalEntity/estado inválidos.
- [ ] No contiene campos ni reglas contables.
- [ ] Compila y prueba sin NestJS/Prisma/Next/Azure.
- [ ] Hechos creados no se sobrescriben mediante setters libres.

## Casos negativos

- [ ] Identificador vacío o mal formado falla.
- [ ] Estado no permitido falla con error estable.
- [ ] Import de framework falla architecture test.

## Pruebas obligatorias

```text
npm run test:unit -- --project assetitem-domain
npm run test:architecture
npm run typecheck
npm run build
```

## Comandos locales

- No requiere DB ni servicios.

## Definition of Done

- [ ] Unit/architecture.
- [ ] Typecheck/build.
- [ ] Invariantes y estados trazados.
- [ ] Sin framework, dinero o reglas anticipadas.
- [ ] Documentación de dominio.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- Matriz regla→test y reporte de dependencias puro.

## Riesgos

- Convertir el aggregate en CRUD anémico.
- Anticipar el modelo contable.

## Rollback o reversibilidad

- Código puro sin persistencia; reversible antes de publicar contratos.

## Condiciones de bloqueo

- Se requieren campos/reglas no documentados.
- Domain depende de framework.
