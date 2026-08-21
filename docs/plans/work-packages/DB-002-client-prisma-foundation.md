# DB-002 — Prisma foundation de Client DB A/B

## Estado

`READY`

## Autorización

- Autorización humana explícita: 2026-08-20.
- Única Work Package autorizada por esta decisión: DB-002.
- Dependencias de entrada satisfechas: FND-003 `DONE` y FND-005 `DONE`.
- DB-001 `DONE` aporta la baseline técnica Prisma existente, pero no se agrega como dependencia formal de entrada ni se acoplan los clientes generados Platform y Client.
- La autorización permite implementar y validar DB-002; no acredita todavía criterios de aceptación ni Definition of Done.

## Objetivo

Establecer una foundation Prisma separada y model-free para Client DB, destinada a las dos bases físicas A y B con un único schema lógico, sin usar `ClientId` en una base compartida como barrera y sin abrir acceso runtime a Client DB antes de `ClientContext`.

## Resultado observable

El schema Client se genera y valida de forma determinista desde su path canónico, produce un Prisma Client interno distinto del de Platform y reconoce administrativamente sólo las referencias locales A/B aprobadas. DB-003 conserva la creación y aplicación de migrations y la evidencia del estado aplicado en cada base.

## Requisitos relacionados

- SAAS-001.
- EPIC-DATA-01.
- PDD 04.3, 05.2 y 44.5/44.6.
- Gate 2.

## ADR y decisiones relacionados

- ADR-018.
- ADR-020.
- ADR-021.
- DEC-DATA-001.
- DEC-CLI-002.
- DEC-TEST-001.

## Gate de entrada

- FND-003 `DONE`.
- FND-005 `DONE`, con `platform_catalog`, `trazactivo_client_a` y `trazactivo_client_b` como bases SQL Server reales y separadas.
- Prisma 7.9.1 validado como baseline común por DB-001, sin incompatibilidad técnica conocida para DB-002.

## Gate de salida

- Schema Client model-free generado y validado desde paths canónicos.
- Prisma Client generado interno, reproducible y separado del output Platform.
- Guardas administrativas A/B y límites de imports cubiertos por pruebas reales.
- Ningún artifact, ejecución o estado de migration/seed entregado por DB-002.

## Scope

### Incluye

- Schema Prisma Client separado con datasource SQL Server y generator compatibles con la baseline Prisma 7.9.1.
- Generación y validación deterministas mediante `npm run db:client:generate` y `npm run db:client:validate`.
- Prisma Client generado interno, ignorado por Git y regenerable desde cero.
- Guardas fail-closed para las referencias administrativas locales canónicas A/B.
- Validaciones de separación Platform/Client y de ausencia de modelos, migrations y seeds fuera de alcance.
- Pruebas unitarias y de arquitectura aplicables, documentación y reporte de implementación.

### No incluye

- Migrations, migration history, aplicación de schema, `prisma migrate dev`, `prisma migrate deploy`, `prisma db push`, seeds, sentinelas ni mutación de A/B; todo ello pertenece a DB-003.
- `AssetItem`, `Client`, `ClientCatalogEntry`, `User`, `Membership`, `Role`, `Permission`, `AccountingAsset`, `Document`, `AuditEvent` funcional ni modelos contables.
- Client Catalog, Client Resolver, ClientContext, ClientDataSourceManager, pooling, cache o adquisición runtime de Prisma Client por request/job.
- Idempotencia, auditoría funcional, endpoints, API/OpenAPI, UI, Azure o consultas cross-client.
- Selección de database mediante `ClientId` proveniente de browser, request o input arbitrario.

## Dependencias

- FND-003 (`DONE`).
- FND-005 (`DONE`).

DB-001 (`DONE`) es baseline técnica que debe reutilizarse para versiones y convenciones, no una dependencia formal ni autorización para compartir schema, datasource, output o tipos generados.

## Precondiciones

- La topología canónica FND-005 conserva dos referencias, bases e identidades Client distintas.
- Los comandos de generate/validate no requieren conectar ni mutar A/B.
- Si implementar DB-002 exigiera cambiar la versión Prisma global, agregar un modelo técnico o abrir Client Prisma antes de `ClientContext`, se debe registrar un bloqueo/Decision Request y detener esa parte.

## Supuestos

- A y B comparten exactamente el schema lógico y su versión, pero no database, conexión, usuario ni datos.
- Un único schema Client puede permanecer sin modelos funcionales en esta foundation, como ya se validó para Platform en DB-001.
- ADR-018 mantiene el acceso runtime futuro detrás de ClientResolver → ClientCatalog → ClientContext → ClientDataSourceManager.

## Bloqueos/TBD

- ADR-018 exige un spike antes de definir pooling/manager, pero no bloquea crear y generar el schema model-free de DB-002.
- No hay blocker P0 ni Decision Request aplicable abierto para esta autorización.
- `DR-WS-IDENTITY-001`, el spike de conexiones y cualquier decisión de pooling permanecen abiertos para sus WPs propietarias; DB-002 no los resuelve.

## Diseño

### Paths canónicos

- Schema authored: `database/client/prisma/schema.prisma`.
- Prisma Client generado: `database/client/generated/client`.
- El output generado se ignora, no se trackea, no se edita manualmente y no es API pública.
- El output Client nunca comparte path con `database/platform/generated/client`.

### Versión Prisma

- Reutilizar exactamente `prisma` 7.9.1, `@prisma/client` 7.9.1 y `@prisma/adapter-mssql` 7.9.1 ya seleccionados y validados en DB-001.
- Mantener versiones exactas y coincidentes, sin `latest`, `^`, `~`, preview features ni una versión divergente entre Platform y Client.
- Una incompatibilidad demostrada que exija cambiar la baseline bloquea DB-002 y requiere decisión humana; no se selecciona otra versión silenciosamente.

### Schema inicial y API pública

- El schema inicial contiene datasource/generator técnicos y cero modelos.
- No se inventan tablas, campos, defaults funcionales ni marker tables para poblar el schema.
- El Prisma Client generado sólo puede ser consumido desde infrastructure autorizada por una WP futura; DB-002 no publica un factory/repository runtime ni exporta tipos Prisma a frontend, contracts, domain o client-context.

### Targets administrativos y fail-closed

La foundation reconoce exclusivamente estas identidades canónicas de FND-005:

| Reference | Database | Usuario local |
|---|---|---|
| `client-a-local` | `trazactivo_client_a` | `trazactivo_client_a_local` |
| `client-b-local` | `trazactivo_client_b` | `trazactivo_client_b_local` |

- El host debe ser el loopback local canónico y el puerto procede únicamente de la configuración local FND-005 aprobada.
- La referencia, database y usuario deben coincidir como tuple; A no puede resolverse a B ni B a A.
- Se rechazan `platform-local`, `platform_catalog`, el usuario Platform, targets/databases/hosts/users arbitrarios, connection strings o paths `--schema` suministrados por CLI y overrides de configuración no autorizados.
- Estas guardas son administrativas y de tooling: no implementan Client Resolver, ClientContext ni ClientDataSourceManager, y no habilitan al browser para seleccionar DB.
- Los secretos efectivos permanecen fuera de Git y nunca aparecen en argumentos, logs o diagnósticos.

### Frontera de ownership

| Owner | Responsabilidad |
|---|---|
| DB-001 | Schema/generator/generated client y foundation técnica exclusivos de Platform DB. |
| DB-002 | Schema/generator/generated client Client model-free, generate/validate y guardas administrativas A/B sin conexión runtime. |
| DB-003 | Creación/finalización de artifacts de migration, aplicación Platform/A/B, seeds, sentinelas, migration history/state, rebuild y evidencia de drift real entre databases. |
| CLI-001 | Client Catalog funcional y sus datos autorizados. |
| CLI-004 | Adquisición, cache, lifecycle y observabilidad del Prisma Client runtime después de ClientContext y del spike requerido. |

DB-002 no crea un directorio `migrations`, no produce una migration base y no ejecuta ninguna operación que modifique A/B.

### Ownership de drift

- DB-002 detecta schema authored inválido, generación no determinista/drift del output generado y mezcla de paths o tipos Platform/Client.
- DB-003 detecta database migration drift, migration history/state y diferencias de versión realmente aplicadas entre A y B.
- DB-002 no representa el estado de una database como prueba del estado de la otra.

### Frontend

- Sin Prisma ni acceso DB.

### API/OpenAPI

- No aplica.

### Application/Domain/Policy

- Sin reglas ni imports Prisma.

### Eventos, auditoría y observabilidad

- Sólo diagnósticos técnicos de generate/validate y guardas, con datos sensibles redactados.
- Migration reports y estado por target pertenecen a DB-003.

## Contratos API

- No aplica.

## Persistencia

- DB-002 define el schema lógico Client, pero no crea tablas ni muta bases.
- DB-003 será responsable de aplicar de forma independiente la misma versión a `trazactivo_client_a` y `trazactivo_client_b`.

## Archivos o módulos esperados

- `database/client/prisma/schema.prisma`.
- Configuración mínima necesaria para generar `database/client/generated/client` sin trackearlo.
- Scripts raíz cerrados para generate/validate, guardas puras, fixtures negativas, pruebas y reporte DB-002.
- Ningún directorio `migrations` ni seed.

## Criterios de aceptación

- [ ] El schema Client model-free genera y valida de forma determinista desde los paths canónicos.
- [ ] El output generado Client es interno, reproducible, ignorado y distinto del output Platform.
- [ ] El schema contiene cero modelos Platform, Client funcionales, AssetItem o contables y no usa preview features.
- [ ] Prisma 7.9.1 se reutiliza con versiones exactas y coincidentes entre CLI, client y adapter.
- [ ] Las tuples administrativas A y B son aceptadas de forma independiente y cualquier mezcla entre ellas falla cerrada.
- [ ] Platform y targets/configuración arbitrarios se rechazan antes de cualquier adquisición Prisma.
- [ ] Ningún tipo/import Prisma cruza fuera de infrastructure autorizada y no existe selección por `ClientId` del browser/request.
- [ ] DB-002 no crea ni ejecuta migrations, `db push`, seeds o mutaciones sobre A/B; queda lista para que DB-003 sea el único owner de ese trabajo.

## Casos negativos

- [ ] `platform-local`, `platform_catalog` o la identidad Platform son rechazados como target Client.
- [ ] Una tuple cruzada (`client-a-local` → B o `client-b-local` → A) es rechazada antes de cualquier acceso.
- [ ] Database, host, user, connection string, `--schema` o config override arbitrarios son rechazados fail-closed y sin filtrar secretos.
- [ ] Un schema authored inválido o un output generado no reproducible hace fallar el gate.
- [ ] Compartir path/output con Platform o importar Prisma desde frontend/contracts/domain/client-context hace fallar architecture.
- [ ] Agregar migrations, seeds, un modelo fuera de scope o un comando de mutación hace fallar architecture.
- [ ] Usar `ClientId` de browser/request como selector de database o representar A/B con una sola DB/columna hace fallar architecture.

## Pruebas obligatorias

```text
npm ci
npm run db:client:generate
npm run db:client:validate
npm run format:check
npm run lint
npm run typecheck
npm run test:unit -- --project client-prisma-foundation
npm run test:architecture
npm run build
npm run verify
git diff --check
```

- La generación debe probarse desde output ausente y repetirse para demostrar reproducibilidad.
- Las fixtures negativas deben activar fallos reales de guardas y arquitectura, no falso PASS ni skips.
- `local-infrastructure` de FND-005 continúa como integración real; DB-002 no convierte projects futuros de integration, contract, multiclient, golden o e2e en PASS.
- La aplicación y drift runtime de A/B se validan en DB-003, no se simulan en DB-002.

## Comandos locales

- `db:client:generate` y `db:client:validate` usan exclusivamente el schema canónico y no aceptan `--schema` arbitrario.
- Ningún comando imprime credenciales, passwords, tokens, connection strings ni configuración completa.

## Definition of Done

- [ ] Generate/validate reales y reproducibles desde output ausente.
- [ ] Unit, typecheck, architecture, build y verify pasan sin falso PASS.
- [ ] Separación Platform/Client y outputs generados distintos quedan evidenciados.
- [ ] Guardas A/B/Platform y fixtures negativas quedan cubiertas.
- [ ] Schema permanece model-free y no existen migrations, seeds ni comandos de mutación Client.
- [ ] Generated client permanece interno, ignorado, sin imports fuera de infrastructure.
- [ ] Reporte/runbook documenta paths, versiones, comandos, riesgos, scopes no implementados y ausencia de secretos.
- [ ] No existe TBD/DR P0 aplicable ni se autorizó o anticipó una WP futura.

## Evidencia esperada

- Hashes/resultados de generación repetida desde output ausente y validate real.
- Pruebas de la API administrativa A/B, rechazos Platform/tuples cruzadas/config arbitraria y redacción de secretos.
- Architecture tests de separación de outputs/imports y ausencia de models/migrations/seeds.
- Reporte DB-002 con comandos, conteos reales, clean checkout y riesgos abiertos heredados.

## Riesgos

- Drift del schema authored o del generated output; DB-002 lo bloquea con generate/validate reproducibles.
- Drift de migration state entre A/B; permanece bajo DB-003 y no se declara cubierto por DB-002.
- Advisory transitivo `prisma` → `@prisma/config` → `deepmerge-ts <8`, heredado de DB-001, permanece abierto y no bloqueante bajo las mismas condiciones documentadas; no se declara resuelto ni se fuerza downgrade/override.
- Advertencia TLS Node sobre loopback local, heredada de DB-001/FND-005, permanece como limitación local no bloqueante y no autoriza cambiar la topología.
- El spike de conexiones/pooling requerido por ADR-018 permanece futuro y bloquea CLI-004, no esta foundation model-free.

## Rollback o reversibilidad

- Revertir schema, scripts y guardas de DB-002 antes de DB-003 no altera A/B porque DB-002 no aplica migrations ni muta bases.
- Una migration aplicada posteriormente sólo se corrige mediante el flujo versionado y forward de DB-003.

## Condiciones de bloqueo

- No se pueden distinguir de forma fail-closed las tuples A/B o se admite Platform como Client.
- Prisma 7.9.1 no puede generar/validar el schema Client model-free sin preview feature o requiere una versión global divergente.
- El schema exige inventar un modelo/campo técnico o funcional no autorizado.
- La implementación requiere abrir Client Prisma antes de ClientContext o asumir decisiones de pooling/manager.
- Se mezcla output, tipos o schema Platform/Client, o no se puede preservar a DB-003 como único owner de migrations y drift runtime.
