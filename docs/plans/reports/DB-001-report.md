# DB-001 — Reporte de implementación

## Resultado

DB-001 entrega exclusivamente la foundation Prisma de Platform DB: schema SQL Server separado,
Prisma Client interno generado, guardas fail-closed del target Platform, consulta técnica real de
`DB_NAME()` y cierre explícito. No crea modelos, tablas, migrations, seeds, repositories ni
comportamiento funcional.

- Work Package: `DB-001-platform-prisma-foundation`.
- Estado de entrada y salida de implementación: `READY`; el cierre como `DONE` requiere decisión
  humana posterior.
- Branch: `codex/DB-001-platform-prisma-foundation`.
- Base: `architecture/v1.1-typescript`.
- Dependencias satisfechas: FND-003 y FND-005 (`DONE`).
- DB-002, DB-003, CLI-001 y todas las demás Work Packages permanecen `DRAFT` y no autorizadas.

## Alcance entregado

- Schema canónico: `database/platform/prisma/schema.prisma`.
- Output generado e ignorado: `database/platform/generated/client`.
- Política LF explícita para archivos authored bajo `database/`, reproducible en clones Windows.
- Infrastructure técnica: guardas de target, construcción del adapter, consulta read-only de
  identidad de database y desconexión.
- Scripts raíz reales: `db:platform:generate` y `db:platform:validate`.
- Proyectos reales: unit e integration `platform-prisma-foundation` y regresiones architecture.
- Integración de generate/validate, unit e integration en el contrato raíz fail-fast de `verify`.

No se implementaron Client Prisma, Client Catalog, Client Resolver, ClientContext,
ClientDataSourceManager, AssetItem, identidad funcional, endpoints, UI, Azure, migrations, `db push`,
seeds ni sentinelas. DB-003 conserva migrations/seeds y CLI-001 conserva el catálogo funcional.

## Prisma y dependencias

Versiones exactas:

| Paquete                 | Versión  | Uso                                             |
| ----------------------- | -------- | ----------------------------------------------- |
| `prisma`                | `7.9.1`  | CLI de generación y validación, sólo desarrollo |
| `@prisma/client`        | `7.9.1`  | runtime interno del client generado             |
| `@prisma/adapter-mssql` | `7.9.1`  | adapter oficial para SQL Server                 |
| `@types/mssql`          | `12.3.0` | tipos transitivos requeridos para el adapter    |

La selección usa la release estable
[Prisma ORM 7.9.1](https://github.com/prisma/prisma/releases/tag/7.9.1), sin `latest`, rangos o
preview features. Los [requisitos oficiales](https://docs.prisma.io/docs/orm/reference/system-requirements)
incluyen Node.js `^24.0.0` y Windows; la baseline Node.js 24.13.0 queda incluida. La documentación
oficial de [SQL Server](https://docs.prisma.io/docs/orm/core-concepts/supported-databases/sql-server)
confirma SQL Server 2017 o posterior, el provider `sqlserver` y el adapter
`@prisma/adapter-mssql`; FND-005 entrega SQL Server 2022. El generator
[`prisma-client`](https://www.prisma.io/docs/orm/prisma-schema/overview/generators) exige output
explícito y permite generación TypeScript/ESM. Prisma 7.9.1 genera un client model-free por defecto;
la CLI rechaza el flag antiguo `--allow-no-models` y ofrece `--require-models` como restricción
optativa, que DB-001 no usa porque su schema deliberadamente no tiene modelos.

`package-lock.json` fija toda la resolución. `npm audit --audit-level=high` informa tres hallazgos
high relacionados entre sí: `prisma -> @prisma/config -> deepmerge-ts <8`
([GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx)). El fix automático
propuesto degrada a Prisma 6.12.0, que no satisface la selección estable para Node.js 24. DB-001 no
acepta config/schema arbitrarios ni datos no confiables en el CLI, lo que reduce exposición, pero el
hallazgo permanece como riesgo abierto hasta una release estable compatible corregida; no se usó
`--force` ni override transitorio no soportado.

## Schema y política del generated client

El schema contiene sólo:

- generator `prisma-client`, runtime Node.js, ESM y extensiones TypeScript;
- datasource `platform` con provider `sqlserver`;
- cero `model`, `view`, `enum` o `type` funcionales;
- cero URL, `env()`, `directUrl`, shadow database o preview features.

El output se borra únicamente mediante una comprobación de path canónico y se regenera. Un
manifest ignorado registra hashes SHA-256 del schema y los archivos generados; `validate` compara
ambos y falla ante drift. Las generaciones repetidas desde output removido produjeron el mismo
hash:

```text
b45520129fb9cf3ed3b432fda5e81ece599ee7cc1f6037639c1128f979e3f08a
```

El directorio está en `.gitignore`, no está trackeado y no es API pública. Sólo
`database/platform/infrastructure/platform-prisma.ts` puede importar Prisma o el generated client.

## Target Platform, conexión y secretos

La allowlist exacta es:

| Campo       | Valor permitido             |
| ----------- | --------------------------- |
| `reference` | `platform-local`            |
| `database`  | `platform_catalog`          |
| `server`    | `127.0.0.1`                 |
| `user`      | `trazactivo_platform_local` |

El puerto proviene del preflight canónico FND-005. Propiedades extra, host/user/reference/database
distintos, contraseña fuera de política, argumentos CLI y overrides `DATABASE_URL`,
`PRISMA_CONFIG_PATH` o `PRISMA_SCHEMA` se rechazan antes de construir Prisma. La integración observó
realmente `DB_NAME() = platform_catalog`; el bloque `finally` ejecutó `$disconnect()` y no dejó
handles abiertos.

Los passwords se suministraron como variables efímeras del proceso, nunca se escribieron en
`.env.local`, argumentos, snapshots o documentación. Los diagnósticos eliminan valores secretos,
connection strings y pares `DATABASE_URL`/`password`/`pwd`. Los logs de integración sólo publican
reference/database permitidas y estados de resultado.

## Pruebas positivas y negativas

La suite unit DB-001 cubre 9/9 guardas puras: target canónico, rechazo Client A/B, propiedades
arbitrarias, host/usuario, política de password y redacción.

Las regresiones architecture verifican:

- versiones exactas, coincidentes y sin `latest`, `^` o `~`;
- ausencia de modelos, preview features, migrations, seeds y Client Prisma;
- output separado y generado no trackeado;
- Prisma prohibido en frontend, contracts, domain y client-context;
- import Prisma permitido sólo en infrastructure Platform;
- despacho real de los proyectos unit/integration y orden generate -> validate -> typecheck en
  `verify`;
- argumento/schema arbitrario rechazado por el wrapper real;
- schema SQL Server inválido rechazado por el validador Prisma real;
- drift de generated client rechazado por el gate fail-closed.

La integración real rechazó antes de Prisma:

```text
client-a-local -> trazactivo_client_a: REJECTED
client-b-local -> trazactivo_client_b: REJECTED
```

Después conectó exclusivamente a `platform-local -> platform_catalog`, obtuvo
`DB_NAME() = platform_catalog` y registró `connect=PASS disconnect=PASS`. La integración FND-005
`local-infrastructure` continuó PASS real con tres databases y aislamiento A/B. El proyecto futuro
`future-application-integration` continúa `NOT_IMPLEMENTED_SCOPE`.

## Validación principal

| Comando                                                            | Resultado                                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `npm ci`                                                           | exit 0; 553 packages instalados, 567 auditados                                  |
| `npm run db:platform:generate`                                     | exit 0; client model-free generado en path canónico                             |
| `npm run db:platform:validate`                                     | exit 0; schema válido y hashes sin drift                                        |
| `npm run format:check`                                             | exit 0; 170 archivos                                                            |
| `npm run lint`                                                     | exit 0                                                                          |
| `npm run typecheck`                                                | exit 0; root, DB-001 y workspaces                                               |
| `npm run test:unit -- --project platform-prisma-foundation`        | exit 0; 9/9                                                                     |
| `npm run test:architecture`                                        | exit 0; 63/63                                                                   |
| `npm run test:integration -- --project platform-prisma-foundation` | exit 0; PASS real                                                               |
| `npm run test:integration -- --project local-infrastructure`       | exit 0; PASS real preservado                                                    |
| `npm run build`                                                    | exit 0                                                                          |
| `npm run verify`                                                   | exit 0; `VERIFY_COMPLETE result=CONTROLS_EXECUTED_WITH_EXPLICIT_SCOPE_STATUSES` |
| `git diff --check`                                                 | exit 0                                                                          |

En el `verify` completo, unit totalizó 35/35 (26 previas + 9 DB-001), architecture 63/63,
integration ejecutó ambos proyectos reales, a11y conservó 5/5, build y backend-smoke pasaron. Las
suites futuras contract, multiclient y e2e mantuvieron `NOT_IMPLEMENTED_SCOPE`; golden mantuvo
`NOT_APPLICABLE_SCOPE`.

El primer intento runtime reutilizó un volumen canónico preservado con un password anterior y el
healthcheck rechazó el nuevo secreto efímero. Las labels confirmaron ownership FND-005; se ejecutó
exclusivamente `local:reset`, que removió recursos del proyecto canónico y reconstruyó un volumen
nuevo. La repetición pasó `local:reset`, `local:up`, `local:status`, ambas integraciones, build,
`verify` y `local:down`. No se usó prune ni eliminación global.

## Archivos creados o modificados

- `.gitattributes`.
- `.gitignore`.
- `eslint.config.mjs`.
- `package.json`.
- `package-lock.json`.
- `database/platform/prisma/schema.prisma`.
- `database/platform/infrastructure/platform-target.ts`.
- `database/platform/infrastructure/platform-prisma.ts`.
- `database/platform/tests/platform-target.test.ts`.
- `database/platform/tsconfig.json`.
- `database/platform/vitest.config.ts`.
- `scripts/db-001-cli.mjs`.
- `scripts/db-001-integration.ts`.
- `scripts/db-001-rules.mjs`.
- `scripts/db-001.architecture.test.mjs`.
- `scripts/format.mjs`.
- `scripts/run-suite.mjs`.
- `scripts/typecheck.mjs`.
- `scripts/verify.mjs`.
- `docs/plans/reports/DB-001-report.md`.

## Criterios y Definition of Done

La implementación presenta evidencia para los 8 criterios de aceptación, los 7 casos negativos y
los 8 elementos de Definition of Done de DB-001. Permanecen sin marcar en la Work Package porque
DB-001 continúa `READY`; su acreditación y transición a `DONE` requieren cierre humano posterior.

## Riesgos, limitaciones y pendientes

- Riesgo abierto de auditoría transitive `deepmerge-ts` descrito arriba. Requiere actualización a
  una release estable compatible cuando Prisma publique una resolución soportada.
- Node.js emite una advertencia de deprecación TLS al usar la IP loopback canónica como server name;
  la conexión cifrada local con certificado confiado por FND-005 funciona. No se cambió la topología
  autorizada y debe reevaluarse antes de endurecer TLS productivo.
- El schema no crea tablas: migration history y ejecución pertenecen a DB-003.
- Los modelos de catálogo y su semántica pertenecen a CLI-001; identidad sigue sin resolverse aquí.
- Client Prisma, pooling/cache y ClientDataSourceManager permanecen fuera de alcance.
- La validación desde clean checkout del commit candidato se registra en este reporte antes de
  publicar la branch.

## Comandos no ejecutados por alcance

- `prisma migrate dev`, `prisma migrate deploy`, `prisma db push`: ownership DB-003.
- seeds/sentinelas: ownership DB-003.
- proyectos Client Prisma o funcionales futuros: WPs no autorizadas.
- operaciones Docker globales o Azure: prohibidas/no aplicables.
