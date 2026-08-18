# DB-001 — Prisma foundation de Platform DB

## Estado

`DRAFT`

## Objetivo

Establecer el schema y acceso Prisma exclusivos de Platform DB sin mezclar datos patrimoniales; la aplicación coordinada de migrations/seed corresponde a DB-003.

## Resultado observable

El schema Platform se genera y valida de forma independiente, con un Prisma client de plataforma que no abre Client DB ni cruza tipos al frontend.

## Requisitos relacionados

- SAAS-002.
- EPIC-DATA-01.
- PDD 05.2, 05.7, 13.1/13.2 y 44.5.
- Gate 2, prerequisito.

## ADR relacionados

- ADR-018.
- ADR-019.
- ADR-020.
- DEC-CLI-003.

## Gate de entrada

- FND-003 y FND-005 completadas.

## Gate de salida

- Schema Platform revisado y listo para DB-003; catálogo funcional queda para CLI-001.

## Scope

### Incluye

- Prisma schema de plataforma separado.
- Schema, generación de Prisma client, validación y health.
- Base mínima técnica para evolucionar Client/identity/catalog mediante WPs dueñas.

### No incluye

- Datos AssetItem, documentos o contabilidad.
- Inventar campos de catálogo fuera del mínimo definido por PDD/DEC-CLI-003.
- Secretos o acceso desde Next.js.

## Dependencias

- FND-003.
- FND-005.

## Precondiciones

- Platform DB local saludable.
- Convención de migrations separada aprobada.

## Supuestos

- El schema base no decide identidad funcional ni amplía los campos mínimos del catálogo.

## Bloqueos/TBD

- No tiene TBD directo de catálogo: `DEC-CLI-003` está Aceptada y exige Catalog/Resolver server-side antes de Prisma Client DB.
- El modelo de identidad local funcional espera `DR-WS-IDENTITY-001`, pero no bloquea el schema técnico.

## Diseño

### Componentes afectados

- Prisma Platform e infrastructure de control-api/data-api según puertos autorizados.

### Cambios esperados

- Schema técnico separado, client generado y validación; DB-003 aplica migrations/seed.

### Frontend

- Sin acceso ni tipos Prisma.

### API/OpenAPI

- Ningún endpoint de negocio.

### Application/Domain/Policy

- Persistence adapter, no reglas.

### ClientContext y aislamiento

- Platform DB resuelve metadata; no contiene activos de Client.

### Prisma y migraciones

- Schema Platform independiente; el historial se aplica y verifica en DB-003.

### Permisos

- Usuario de DB local de mínimo privilegio.

### Eventos y auditoría

- Schema validation report; auditoría de plataforma funcional llega después.

### Observabilidad

- Health, duración y error de conexión sin connection string.

## Contratos API

- No aplica.

## Persistencia

- Platform DB exclusivamente.

## Archivos o módulos esperados

- Prisma schema Platform, client generado interno, validación y adapter health de plataforma.

## Criterios de aceptación

- [ ] Schema genera/valida de forma determinista y queda listo para DB-003.
- [ ] Platform schema no contiene AssetItem ni datos contables.
- [ ] Client Prisma schema no se importa.
- [ ] Los tipos Prisma no salen de infrastructure.
- [ ] Logs no revelan credenciales.

## Casos negativos

- [ ] Apuntar accidentalmente a DB A/B falla guardas de identidad de DB.
- [ ] Drift o schema inválido falla el check.

## Pruebas obligatorias

```text
npm run db:platform:generate
npm run db:platform:validate
npm run test:architecture
npm run typecheck
```

## Comandos locales

- Se ejecutan sólo contra Platform DB local identificada por preflight.

## Definition of Done

- [ ] Generate/validate.
- [ ] Typecheck/architecture.
- [ ] Health y observabilidad.
- [ ] Documentación de schema separado.
- [ ] Sin secretos.
- [ ] DEC-CLI-003 trazada sin inventar un TBD.

## Evidencia esperada

- Schema diff, generación determinista y validación de separación Platform/Client.

## Riesgos

- Introducir datos patrimoniales en Platform DB.
- Acoplar tipos Prisma a contracts.

## Rollback o reversibilidad

- Revertir el schema en la branch antes de DB-003; migrations aplicadas posteriormente no se reescriben.

## Condiciones de bloqueo

- No puede distinguirse el target Platform.
- La propuesta necesita decidir campos de catálogo pendientes.
