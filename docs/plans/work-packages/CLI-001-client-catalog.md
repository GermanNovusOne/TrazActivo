# CLI-001 — Client Catalog autorizado

## Estado

`DRAFT`

## Objetivo

Implementar en Platform DB el catálogo central que resuelve estado, stamp, referencias y versiones de Client sin guardar secretos ni datos patrimoniales.

## Resultado observable

Un servicio/repository de plataforma devuelve para Client A/B la metadata aprobada, rechaza estados o referencias inconsistentes y registra cambios auditables.

## Requisitos relacionados

- SAAS-002.
- PDD 04.4, 05.2, 05.4 y 13.1.
- EPIC-SAAS-01.
- Gate 2.

## ADR relacionados

- ADR-016.
- ADR-018.
- ADR-019.
- DEC-CLI-002.
- DEC-CLI-003.

## Gate de entrada

- DB-001, DB-002 y DB-003 completadas.

## Gate de salida

- Catálogo A/B versionado y disponible para Client Resolver.

## Scope

### Incluye

- Modelo/migración Platform DB aprobado para `Client` y `ClientCatalogEntry`.
- Campos mínimos definidos por baseline y separación de referencias/secretos.
- Repository/application service, seed A/B, estado y versionado.
- Invalidación/evento de actualización necesario para consumers.

### No incluye

- Resolver candidatos HTTP.
- Abrir Client DB.
- Lifecycle/provisionamiento completo de Gate 5.
- Connection strings o credenciales en catálogo.

## Dependencias

- DB-001.
- DB-002.
- DB-003.

## Precondiciones

- Se usan los campos mínimos establecidos por PDD y la decisión Accepted DEC-CLI-003; no se agregan secretos ni datos patrimoniales.

## Supuestos

- DEC-CLI-002 y DEC-CLI-003 son autoritativas: DB propia por Client y resolución server-side antes de Prisma.

## Bloqueos/TBD

- No se agrega un TBD de catálogo: DEC-CLI-002/003 son suficientes y autoritativas.
- Cualquier ampliación fuera de los campos mínimos requiere una decisión registrada, no un TBD inventado.

## Diseño

### Componentes afectados

- Platform Prisma, control-api/platform application y testkit de catálogo.

### Cambios esperados

- Modelo, migration, repository, validación y seed local A/B.

### Frontend

- Sin acceso directo al catálogo.

### API/OpenAPI

- No se expone DatabaseReference en Data Plane ni al navegador.

### Application/Domain/Policy

- Servicio de resolución metadata; sin reglas patrimoniales.

### ClientContext y aislamiento

- El catálogo es fuente server-side; `ClientId` controlado por cliente no basta para leerlo.

### Prisma y migraciones

- Sólo Prisma Platform; migration versionada después de decisión.

### Permisos

- Lectura por identidad de servicio/resolver; cambios por permisos de plataforma.

### Eventos y auditoría

- `ClientCatalogEntryCreated/Updated` y PlatformAudit antes/después.

### Observabilidad

- Latencia, hit/error y versión sin DatabaseReference o secretos en logs.

## Contratos API

- Puerto interno `ClientCatalog`; no endpoint público de Data Plane.

## Persistencia

- Platform DB exclusivamente.

## Archivos o módulos esperados

- Migration/modelo Platform de catálogo, repository/service, seed A/B y tests de resolución/estado.

## Criterios de aceptación

- [ ] A/B tienen entradas distintas y DB references correctas.
- [ ] No se persisten secretos, contraseñas ni activos.
- [ ] Suspended/Deleted no se resuelve como operativo.
- [ ] Cambio de referencia incrementa versión y emite invalidación/auditoría.
- [ ] Una referencia manipulada desde request nunca se usa.

## Casos negativos

- [ ] Entrada ausente/inconsistente falla de forma segura.
- [ ] Campo secreto detectado falla schema/security test.
- [ ] Cliente suspendido no retorna una referencia utilizable.

## Pruebas obligatorias

```text
npm run db:platform:migrate:local
npm run test:unit -- --project client-catalog
npm run test:integration -- --project client-catalog
npm run test:architecture
npm run test:multiclient -- --project catalog-a-b
```

## Comandos locales

```text
npm run db:seed:local -- --scope client-catalog
```

## Definition of Done

- [ ] Migration versionada.
- [ ] Unit/integration/architecture/multi-client.
- [ ] Permisos y PlatformAudit.
- [ ] Observabilidad y documentación.
- [ ] Sin secretos.
- [ ] DEC-CLI-002/003 están trazadas y se respetan sin ampliarlas.

## Evidencia esperada

- Decisión aprobada, schema diff, seed A/B, pruebas de estado y audit.

## Riesgos

- Catálogo como almacén de secretos.
- Metadata obsoleta habilita conexión incorrecta.

## Rollback o reversibilidad

- Migration compensatoria en datos locales; cambios de referencia por workflow versionado, no overwrite silencioso.

## Condiciones de bloqueo

- Modelo mezcla datos patrimoniales/secretos.
- El diseño intenta abrir Prisma Client DB antes de ClientContext válido.
