# DB-003 — Migraciones y seed local Platform/A/B

## Estado

`DRAFT`

## Objetivo

Aplicar de forma reproducible y observable los schemas aprobados sobre Platform DB, Client DB A y Client DB B, y preparar datos técnicos diferenciados para catálogo y aislamiento.

## Resultado observable

Desde bases vacías, un comando controlado migra primero Platform DB y luego Client DB A y B como targets independientes, registra sus versiones y crea sentinelas/datos técnicos A/B sin secretos ni datos compartidos.

## Requisitos relacionados

- SAAS-001 y SAAS-002.
- PDD 44.5 y 44.6.
- Gate 2.
- Backlog inicial DB-003.

## ADR relacionados

- ADR-018.
- ADR-020.
- ADR-021.
- DEC-CLI-002.
- DEC-TEST-001.

## Gate de entrada

- DB-001, DB-002 y FND-005 completadas.

## Gate de salida

- Platform DB, Client DB A y Client DB B en versiones conocidas y listas para la frontera Client.

## Scope

### Incluye

- Orquestación local Platform → A → B con targets explícitos.
- Migration status por DB, seed técnico determinista y preflight contra targets equivocados.
- Rebuild desde vacío y fallo aislado de una Client DB.

### No incluye

- Provisionamiento productivo, migraciones masivas por stamp o Azure SQL.
- Definir credenciales, límites de pool o campos no aprobados.
- Consultar A y B dentro de una transacción de negocio.

## Dependencias

- DB-001.
- DB-002.
- FND-005.

## Precondiciones

- Los schemas Platform/Client fueron revisados.
- Las tres DB locales se identifican inequívocamente.

## Supuestos

- Los datos técnicos son exclusivamente locales y no deciden el modelo de identidad definitivo.

## Bloqueos/TBD

- `TBD-DEV-001` debe estar cerrado por dependencia transitiva de FND-001.
- Esta WP no crea identidades ni memberships ejecutables y, por tanto, no depende de `DR-WS-IDENTITY-001` ni cierra `TBD-SEC-001`.

## Diseño

### Componentes afectados

- Scripts de migración/seed, Prisma Platform/Client y testkit local.

### Cambios esperados

- Orquestador fail-closed, manifests de versión y fixtures A/B diferenciadas.

### Frontend

- No aplica.

### API/OpenAPI

- No aplica.

### Application/Domain/Policy

- No contiene reglas de negocio.

### ClientContext y aislamiento

- Los seeds preparan referencias de catálogo y sentinelas A/B; identidad/membership ejecutable llega en CLI-003 después de `DR-WS-IDENTITY-001`. No construyen contexto runtime.

### Prisma y migraciones

- Platform y Client histories separados; A y B reciben la misma ClientSchemaVersion mediante ejecuciones independientes.

### Permisos

- Credenciales locales de migración separadas del navegador; mínimo privilegio cuando corresponda.

### Eventos y auditoría

- Reporte de migration/seed por target; no ClientAuditEvent funcional todavía.

### Observabilidad

- Target lógico, versión, duración, resultado y error sin connection strings.

## Contratos API

- No aplica.

## Persistencia

- Platform DB, Client DB A y Client DB B reales y separadas.

## Archivos o módulos esperados

- Scripts `db:generate`, `db:migrate:local`, `db:seed:local`, manifests de versión y fixtures locales.

## Criterios de aceptación

- [ ] Rebuild desde vacío deja las tres DB en versiones conocidas.
- [ ] Platform se procesa antes de A y B; A y B se ejecutan independientemente.
- [ ] Un fallo en A no cambia silenciosamente B ni marca A como exitosa.
- [ ] Datos técnicos A/B son distinguibles y no contienen secretos.
- [ ] Repetir migrate/seed no duplica registros ni oculta drift.

## Casos negativos

- [ ] Una sola DB usada como A y B aborta preflight.
- [ ] Target no local o no identificado se rechaza antes de escribir.
- [ ] Estado de migration desconocido bloquea Gate 2.

## Pruebas obligatorias

```text
npm run local:up
npm run db:generate
npm run db:migrate:local
npm run db:seed:local
npm run test:migration
npm run test:integration -- --project local-seed
npm run test:multiclient -- --project database-baseline
```

## Comandos locales

- Los comandos verifican ambiente/target antes de cualquier reset o migration destructiva.

## Definition of Done

- [ ] Migration/integration/multi-client reales.
- [ ] Versiones Platform/A/B evidenciadas.
- [ ] Rebuild e idempotencia verificados.
- [ ] Fallos parciales observables.
- [ ] Documentación y runbook local.
- [ ] Sin secretos ni TBD P0 aplicable.

## Evidencia esperada

- Manifests/versiones, logs de migración/seed, conteos A/B y prueba de fallo aislado.

## Riesgos

- Ejecutar contra target equivocado.
- Ocultar drift o fallo parcial.
- Usar fixtures locales como decisión de identidad productiva.

## Rollback o reversibilidad

- Las DB locales son recreables; migrations publicadas se corrigen mediante forward migration, no editando historia.

## Condiciones de bloqueo

- DB-001/DB-002 no revisadas.
- No se pueden distinguir Platform/A/B.
- La operación requiere una decisión de identidad o datos no aprobada.
