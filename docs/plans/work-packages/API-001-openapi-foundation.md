# API-001 — OpenAPI foundation y Problem Details

## Estado

`DRAFT`

## Objetivo

Establecer contratos OpenAPI separados para Control/Data Plane y convenciones HTTP reales antes de exponer endpoints de negocio.

## Resultado observable

NestJS genera `control-v1.json` y `data-v1.json` reproducibles con autenticación, errores, CorrelationId, idempotencia y concurrencia documentables.

## Requisitos relacionados

- API-001.
- PDD 35.
- EPIC-FND-03.
- Gate 1.

## ADR relacionados

- ADR-017.
- ADR-019.
- ADR-021.

## Gate de entrada

- FND-003 completada.

## Gate de salida

- Contrato base generado desde implementación y validado estructuralmente.

## Scope

### Incluye

- Documentos Control/Data separados.
- `/api/v1` y `/control/v1`.
- Problem Details extendido, CorrelationId, `Idempotency-Key`, ETag/version y paginación base.
- Contratos mínimos previstos para `/api/v1/context` y `/api/v1/context/switch`, sin implementar resolución todavía.

### No incluye

- Endpoints AssetItem.
- Cliente TypeScript generado.
- Autenticación productiva o implementación de ClientContext.

## Dependencias

- FND-003.

## Precondiciones

- Convenciones del PDD se implementan desde código NestJS, no mediante JSON manual divergente.

## Supuestos

- No se presume mecanismo productivo de identidad; el contrato representa una frontera abstracta hasta su decisión.

## Bloqueos/TBD

- `DR-WS-IDENTITY-001` no bloquea schemas abstractos de seguridad; sí bloquea su integración real.

## Diseño

### Componentes afectados

- Presentation/shared HTTP de `data-api` y `control-api`; package contracts.

### Cambios esperados

- Generación determinista, validación y diff de contratos.

### Frontend

- No consume aún; API-002 será el único puente.

### API/OpenAPI

- Cada operación crítica futura declarará permiso, scope, errores, auditoría, idempotencia, concurrencia, transición y step-up.

### Application/Domain/Policy

- Errores de aplicación se traducen sin filtrar detalles internos.

### ClientContext y aislamiento

- Data Plane no acepta `ClientId` como selector de DB.

### Prisma y migraciones

- No aplica.

### Permisos

- Metadatos de permisos presentes en el contrato; autorización real llega en WPs Client/Asset.

### Eventos y auditoría

- Metadatos declarativos; implementación posterior.

### Observabilidad

- `CorrelationId` de request/response y Problem Details.

## Contratos API

```text
GET  /api/v1/context
POST /api/v1/context/switch
```

Las operaciones permanecen no funcionales hasta CLI-003 y no deben simular éxito.

## Persistencia

- Ninguna.

## Archivos o módulos esperados

- Generación OpenAPI en data-api/control-api, tipos HTTP comunes y `contracts/openapi/control-v1.json`/`data-v1.json`.

## Criterios de aceptación

- [ ] Dos documentos OpenAPI se generan desde las apps correctas.
- [ ] Problem Details tiene códigos estables y no stack.
- [ ] Data Plane no contiene endpoint cross-client.
- [ ] `ClientId` controlable por cliente no se declara selector de conexión.
- [ ] Un cambio incompatible requiere versionado y falla contrato.

## Casos negativos

- [ ] DTO Prisma/Nest interno exportado falla architecture/contract test.
- [ ] Error con stack o DatabaseReference falla snapshot de seguridad.
- [ ] Diferencia no regenerada deja diff y código no cero.

## Pruebas obligatorias

```text
npm run format:check
npm run lint
npm run typecheck
npm run test:architecture
npm run test:contract
npm run build
```

## Comandos locales

```text
npm run openapi:generate
npm run openapi:check
```

## Definition of Done

- [ ] Build/lint/typecheck.
- [ ] Architecture/contract.
- [ ] OpenAPI Control/Data generado.
- [ ] Errores y CorrelationId verificados.
- [ ] Documentación y trazabilidad.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- Ambos JSON, diff cero, reportes de validación y muestras de Problem Details.

## Riesgos

- Documentar comportamiento inexistente como exitoso.
- Compartir DTO internos con frontend.

## Rollback o reversibilidad

- Contratos base son regenerables; cambios incompatibles se revierten en la branch antes de consumidores.

## Condiciones de bloqueo

- Generación no proviene de implementación.
- Convenciones críticas no pueden expresarse en OpenAPI real.
