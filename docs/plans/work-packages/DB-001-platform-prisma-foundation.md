# DB-001 — Prisma foundation de Platform DB

## Estado

`READY`

## Autorización

- Autorización humana: 2026-08-19.
- Alcance autorizado: exclusivamente DB-001.
- Dependencias verificadas: FND-003 `DONE` y FND-005 `DONE`.
- DB-002, DB-003, CLI-001, API-001, AST-001 y todas las demás Work Packages permanecen `DRAFT` y no están autorizadas.
- La transición a `READY` autoriza implementación y validación; no acredita criterios de aceptación ni Definition of Done.

## Objetivo

Establecer la foundation Prisma exclusiva de Platform DB, con schema, generación, validación,
cliente generado interno y guardas de target separados de la futura foundation Prisma de Client DB.
DB-001 no implementa todavía el Client Catalog funcional ni ejecuta migrations o seeds; DB-003
conserva la aplicación de migrations/seed y CLI-001 conserva el catálogo funcional.

## Resultado observable

Desde un clon limpio, el schema Platform se valida y su Prisma Client se genera de forma
determinista mediante comandos raíz reales. La validación runtime permitida identifica
inequívocamente `platform-local -> platform_catalog`, rechaza los targets Client A/B antes de usar
Prisma y no expone tipos Prisma, secretos ni connection strings fuera de infrastructure.

## Requisitos relacionados

- SAAS-002.
- EPIC-DATA-01.
- PDD 04.4, 05.2, 05.7, 06.1, 06.5, 13.1/13.2 y 44.4/44.5.
- Gate 2 como precondición futura; DB-001 no lo declara satisfecho.

## ADR y decisiones relacionados

- ADR-018.
- ADR-019.
- ADR-020.
- DEC-DATA-001.
- DEC-CLI-002.
- DEC-CLI-003.

## Gate de entrada

- FND-003 `DONE`: shells NestJS y boundary de infrastructure disponibles sin Prisma anticipado.
- FND-005 `DONE`: SQL Server local real con `platform-local -> platform_catalog` y Client A/B
  separados.
- Autorización humana específica del 2026-08-19.

## Gate de salida

- Foundation Platform generable, validable y revisada, lista para que DB-003 sea evaluada
  posteriormente junto con DB-002.
- La salida de DB-001 no autoriza DB-002, DB-003, CLI-001 ni otra WP.
- El Client Catalog funcional continúa siendo responsabilidad de CLI-001.

## Scope

### Incluye

- Schema Prisma Platform separado y canónico en `database/platform/prisma/schema.prisma`.
- Generator y datasource SQL Server exclusivos de Platform.
- Prisma Client Platform generado en `database/platform/generated/client`; el output es generado,
  no se edita manualmente y no se versiona.
- Scripts raíz reales y fail-fast:
  - `npm run db:platform:generate`;
  - `npm run db:platform:validate`.
- Adapter o factory técnico mínimo dentro de infrastructure de backend para validar conexión,
  identidad de DB y cierre controlado, sin repository ni comportamiento funcional.
- Guardas que aceptan únicamente la referencia lógica `platform-local` y la base canónica
  `platform_catalog` para cualquier operación runtime de DB-001.
- Pruebas unitarias, de arquitectura e integración técnica aplicables a esta foundation.
- Documentación y reporte de implementación de DB-001.

### Superficie inicial del schema

- El schema inicial es deliberadamente técnico y no publica modelos funcionales de catálogo,
  identidad, membership, autorización, suscripción, auditoría ni negocio.
- No se crean `Client`, `ClientCatalogEntry`, `DeploymentStamp`, `User`, `ClientMembership`, `Role`,
  `Permission` ni otros modelos funcionales en DB-001.
- Los campos de PDD 04.4 y 13.1 son el límite autoritativo para la futura CLI-001, no una autorización
  para materializarlos anticipadamente en esta WP.
- `IdentityMode` tampoco se materializa en DB-001: hacerlo no resolvería por sí solo
  `DR-WS-IDENTITY-001`, pero pertenece al catálogo funcional futuro.
- No se inventan modelos o campos técnicos sólo para que el schema tenga tablas. La ausencia inicial
  de modelos funcionales no permite un falso PASS: generación, carga del cliente, conexión SQL real,
  `DB_NAME()`, rechazo de targets y cierre se validan mediante pruebas reales.

### No incluye

- Schema Prisma Client, `ClientDataSourceManager` o acceso a Client DB.
- Modelos o datos funcionales de Client Catalog, identidad, membership, roles o permisos.
- `AssetItem`, entidades legales, inventario, documentos, contabilidad o datos patrimoniales.
- Client Resolver, ClientContext, autorización real, endpoints funcionales u OpenAPI funcional.
- Migrations, aplicación de migrations, seeds o sentinelas.
- Cambios sobre `platform_catalog`, `trazactivo_client_a` o `trazactivo_client_b` fuera de health
  técnico no mutante.
- UI, Azure, secrets productivos, pooling/cache del futuro DataSource Manager o cierre de su spike.

## Dependencias

- FND-003 `DONE`.
- FND-005 `DONE`.
- No existe otra dependencia de entrada para DB-001.
- DB-002 y DB-003 son consumidores posteriores, no dependencias de DB-001.

## Precondiciones verificadas

- El shell backend separa presentation/application/domain/infrastructure.
- FND-005 identifica de forma inequívoca `platform-local -> platform_catalog`.
- Client A y Client B conservan referencias y bases diferentes.
- DEC-DATA-001 acepta Prisma y ADR-018 fija la separación Platform/Client.
- DEC-CLI-003 está `Aceptada`; no se crea un nuevo TBD de catálogo.

## Bloqueos/TBD y Decision Requests

- No existe un bloqueo P0 aplicable a la foundation técnica de DB-001.
- `DR-WS-IDENTITY-001` permanece abierto y no se resuelve aquí; DB-001 no crea estructuras
  funcionales de identidad ni memberships.
- El spike de ADR-018 y `TBD-DATA-002` aplican al futuro `ClientDataSourceManager` y a capacidad, no
  a un único Prisma Client técnico de Platform con cierre controlado.
- Si la implementación requiriera preview features, cambiar el motor SQL Server, compartir un
  generated client Platform/Client o adoptar semántica de catálogo no documentada, debe detenerse y
  registrar un Decision Request. Ninguna de esas decisiones es necesaria para el scope aprobado.

## Ownership y fronteras

| Artefacto o responsabilidad | Owner | Frontera en DB-001 |
|---|---|---|
| Schema/generator/generated client técnico Platform | DB-001 | Se crea y valida sin modelos funcionales ni migrations |
| Schema Prisma Client | DB-002 | No se crea ni importa |
| Ejecución de migrations Platform/A/B, seed y sentinelas | DB-003 | No se ejecuta ni se genera migration history en DB-001 |
| Modelos, repository, service, estados, versionado y auditoría de Client Catalog | CLI-001 | No se anticipan modelos ni comportamiento |
| Client Resolver y ClientContext | CLI-002/CLI-003 | No se implementan |
| ClientDataSourceManager y acceso Prisma Client DB | CLI-004 | No se implementan |

DB-003 deberá recibir schemas revisados y ejecutar migrations de forma explícita por target. DB-001
no ejecuta `migrate`, `db push`, seed ni comandos destructivos. Cualquier reconciliación futura del
seed técnico de DB-003 con los modelos de CLI-001 se revisará antes de autorizar DB-003 y no amplía
DB-001.

## Prisma y versionado

- La tecnología está gobernada por DEC-DATA-001 y ADR-018: Prisma sobre SQL Server.
- La baseline no fija todavía un número exacto de versión de los paquetes. Seleccionar una versión
  exacta compatible es una decisión de dependencia de la implementación autorizada, no un cambio de
  arquitectura, siempre que se mantenga este contrato.
- `prisma` y `@prisma/client` deben usar la misma versión exacta, sin `latest`, `^` ni `~`.
- La versión elegida debe ser compatible con Node.js 24.13.0, npm 11.6.2, SQL Server local de
  FND-005 y generación separada Platform/Client.
- La justificación, versión exacta, fuente de compatibilidad y resultado de validación deben quedar
  en `package-lock.json` y en el reporte de DB-001.
- No se autorizan preview features. Si la única alternativa viable las exige o cambia la semántica
  aceptada, la implementación se bloquea y solicita decisión humana.
- El generated client Platform permanece interno a infrastructure. No se exporta desde
  `packages/contracts`, ningún frontend, `packages/domain` ni `packages/client-context`.

## Target Platform y guardas

- Referencia lógica permitida: `platform-local`.
- Database name permitido: `platform_catalog`.
- `trazactivo_client_a`, `trazactivo_client_b`, `client-a-local`, `client-b-local` y cualquier target
  arbitrario se rechazan antes de instanciar o conectar Prisma Platform.
- Los comandos no aceptan `--schema`, project name, database name, host o connection string
  arbitrarios suministrados por CLI.
- La validación runtime observa `DB_NAME()` y falla si no es exactamente `platform_catalog`.
- El health es técnico, read-only y seguro; no crea tablas, no aplica migrations y no muestra
  configuración, credenciales, connection strings o stacks.
- Secretos efectivos se suministran sólo mediante entorno local no versionado y nunca como argumento
  de línea de comandos ni output.

## Diseño

### Componentes afectados

- `database/platform/prisma/schema.prisma`.
- Output generado `database/platform/generated/client` no versionado.
- Infrastructure mínima de Platform en backend.
- Scripts y pruebas acotados a DB-001.

### Frontend

- Sin Prisma, generated client, imports de backend ni acceso DB.

### API/OpenAPI

- No se agregan endpoints de negocio ni contratos públicos.
- Un health técnico existente puede usar el adapter interno sólo si conserva su respuesta segura y
  no expone identidad/configuración de la DB.

### Application/Domain/Policy

- Sin reglas, modelos, invariantes ni imports Prisma.

### ClientContext y aislamiento

- Prisma Platform no abre una Client DB y no produce un `ClientContext`.
- La regla de ADR-018 para Client DB sigue intacta: Catalog/Resolver y contexto válido preceden al
  futuro Prisma Client DB.

### Persistencia y migraciones

- DB-001 define y valida la foundation del schema, pero no muta bases.
- DB-003 conserva ownership de generar/aplicar migrations, seeds y evidencia de migration state por
  Platform/A/B.

### Observabilidad y redacción

- Se permite reportar target lógico, database name esperado/observado, duración y resultado.
- No se imprimen URLs, passwords, tokens, connection strings ni configuración completa.

## Criterios de aceptación

- [ ] `db:platform:generate` genera el Prisma Client Platform desde el path canónico y es
  determinista desde clon limpio.
- [ ] `db:platform:validate` valida el schema Platform y falla ante schema o configuración de
  generación inválidos.
- [ ] La superficie inicial no contiene modelos funcionales, `AssetItem`, entidades Client DB,
  identidad, membership ni datos contables.
- [ ] El schema/client Platform no importa ni comparte el futuro schema/client de DB-002.
- [ ] Los tipos y el generated client Prisma permanecen dentro de infrastructure y no llegan a
  contracts, frontend, domain o client-context.
- [ ] La validación runtime conecta sólo a `platform-local -> platform_catalog`, observa
  `DB_NAME() = platform_catalog` y cierra el cliente sin handles abiertos.
- [ ] Targets A/B o arbitrarios son rechazados antes de abrir Prisma Platform.
- [ ] Logs, errores, snapshots y documentación no contienen secretos ni connection strings.

## Casos negativos

- [ ] `client-a-local` o `trazactivo_client_a` como target Platform falla antes de conectar.
- [ ] `client-b-local` o `trazactivo_client_b` como target Platform falla antes de conectar.
- [ ] Un schema path, database name, host o connection string arbitrario por CLI se rechaza.
- [ ] Un schema Prisma inválido hace fallar `db:platform:validate` con código distinto de cero.
- [ ] Drift entre el schema canónico y el generated client detectable hace fallar el gate; DB drift
  de migrations sigue reservado para DB-003.
- [ ] Un import Prisma fuera de infrastructure o un import del futuro Client Prisma falla en
  architecture tests.
- [ ] Un fixture con password/connection string en output falla la prueba de redacción.

## Pruebas obligatorias

```text
npm ci
npm run db:platform:generate
npm run db:platform:validate
npm run format:check
npm run lint
npm run typecheck
npm run test:unit -- --project platform-prisma-foundation
npm run test:architecture
npm run test:integration -- --project platform-prisma-foundation
npm run build
npm run verify
git diff --check
```

- Las pruebas de generación deben partir sin output generado y comparar resultados reproducibles.
- Las fixtures negativas deben ejercitar las guardas reales y el validador real, no mocks que hagan
  imposible detectar target, imports, drift o redacción incorrectos.
- Sólo el proyecto de integración `platform-prisma-foundation` cambia de scope por DB-001. Los
  proyectos de WPs futuras conservan su estado explícito `NOT_IMPLEMENTED_SCOPE` o
  `NOT_APPLICABLE_SCOPE`.
- Ningún comando puede usar skips, `allowEmptyTests`, echo-success o ocultar códigos de salida.

## Definition of Done

- [ ] Dependencias Prisma exactas, justificadas, compatibles y registradas.
- [ ] Generate/validate deterministas desde clon limpio sin output previo.
- [ ] Unit, architecture e integration técnica reales pasan y están integradas al contrato raíz.
- [ ] Platform target y rechazo A/B demostrados sin mutar las bases.
- [ ] Separación Platform/Client e infrastructure/public boundaries evidenciada.
- [ ] Health/cierre técnico seguro, sin handles abiertos ni secretos en output.
- [ ] Documentación y reporte DB-001 registran comandos, resultados, riesgos y pendientes.
- [ ] `npm run verify`, `git diff --check` y revisión de secretos pasan sin falsear suites futuras.

## Evidencia esperada

- Versión exacta y justificación de `prisma`/`@prisma/client`.
- Paths canónicos de schema y generated client.
- Generación limpia repetible y validación negativa de schema/drift.
- Integration real con `DB_NAME() = platform_catalog` y cierre liberado.
- Matriz de imports que demuestra que Prisma no sale de infrastructure.
- Pruebas de rechazo de Platform apuntando a A/B o a un target arbitrario.
- Búsqueda/redacción de secretos y connection strings.
- Reporte `docs/plans/reports/DB-001-report.md`.

## Riesgos

- Compartir accidentalmente generated client Platform/Client.
- Permitir que una variable o argumento arbitrario cambie el target.
- Convertir la foundation en implementación anticipada de Client Catalog o identidad.
- Confundir validación de schema/generación con migration state; este último pertenece a DB-003.
- Exponer tipos Prisma fuera de infrastructure.

## Rollback o reversibilidad

- Revertir schema, scripts, generated-output policy y dependencias en la branch antes de DB-003.
- DB-001 no aplica migrations ni escribe datos, por lo que no define rollback de datos.
- Una migration futura publicada se corrige mediante forward migration bajo ownership de DB-003 o
  la WP funcional correspondiente; no se edita historia aplicada.

## Condiciones de bloqueo durante implementación

- El target Platform no puede distinguirse inequívocamente de Client A/B.
- La versión compatible de Prisma requiere preview features o cambia la arquitectura aceptada.
- Generate/validate necesitan secretos versionados o argumentos de conexión visibles.
- La implementación necesita modelos/campos funcionales no autorizados para producir evidencia.
- Las guardas no pueden impedir que el Prisma Platform abra una Client DB.
- La integración real no puede observar `platform_catalog` o cerrar el cliente limpiamente.
