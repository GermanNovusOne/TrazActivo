# DB-002 — Reporte de implementación

## Resultado

DB-002 entrega exclusivamente la foundation Prisma model-free de Client DB: schema SQL Server
separado, Prisma Client interno generado, generate/validate reproducibles y guardas administrativas
fail-closed para A/B. No abre Prisma Client DB, no conecta a A/B y no crea migrations, seeds, tablas o
comportamiento funcional.

- Work Package: `DB-002-client-prisma-foundation`.
- Estado: `READY`; no se cambia a `DONE` durante implementación.
- Branch: `codex/DB-002-client-prisma-foundation`.
- Base: `architecture/v1.1-typescript` después del merge de autorización PR #19,
  `35da8649dbc483e5da7d80b17bc887020fbedb1d`.
- Única Work Package autorizada: DB-002.
- Dependencias satisfechas: FND-003 y FND-005 (`DONE`).
- DB-001 (`DONE`) se reutiliza sólo como baseline técnica; no se acoplan schemas, datasources ni
  generated clients.
- DB-003, API-001, AST-001, CLI-001 y todas las demás WPs futuras permanecen `DRAFT`.

## Alcance entregado

- Schema canónico Client: `database/client/prisma/schema.prisma`.
- Output generado e ignorado: `database/client/generated/client`.
- Generator `prisma-client`, runtime Node.js, ESM y TypeScript.
- Datasource `client` con provider `sqlserver`, sin URL/configuración de conexión authored.
- Scripts raíz reales `db:client:generate` y `db:client:validate`.
- Guarda administrativa pura para las tuples canónicas A/B y redacción de diagnósticos.
- Proyecto unit real `client-prisma-foundation` y regresiones architecture DB-002.
- Integración fail-fast de generate/validate, typecheck y unit al contrato raíz `verify`.
- Runbook acotado en `database/README.md`.

Fuera de alcance y no implementado: Client Resolver, Client Catalog, ClientContext,
ClientDataSourceManager, adapter/factory runtime, pooling/cache, conexión Prisma Client DB, migrations,
`db push`, seeds, sentinelas, migration history/state, drift real A/B, modelos funcionales, AssetItem,
API, UI y Azure.

## Prisma y dependencias

DB-002 reutiliza sin cambios la baseline exacta aprobada por DB-001:

| Paquete                 | Versión  | Uso                                                            |
| ----------------------- | -------- | -------------------------------------------------------------- |
| `prisma`                | `7.9.1`  | CLI de generación y validación                                 |
| `@prisma/client`        | `7.9.1`  | dependencia del client generado interno                        |
| `@prisma/adapter-mssql` | `7.9.1`  | baseline SQL Server preservada; DB-002 no instancia el adapter |
| `@types/mssql`          | `12.3.0` | baseline de tipos preservada                                   |

No se agregaron dependencias ni se modificó `package-lock.json`. Las versiones permanecen exactas,
sin `latest`, `^`, `~`, beta, rc, canary, dev o preview features. La selección y compatibilidad oficial
quedaron justificadas en `docs/plans/reports/DB-001-report.md`; DB-002 no abre una divergencia de
versión Platform/Client.

## Schema model-free y generated client

El schema contiene exclusivamente generator y datasource SQL Server. La inspección real confirma:

- cero `model`, `view`, `enum` o `type` funcionales;
- cero Platform entities, AssetItem, identidad, membership, auditoría o contabilidad;
- cero `url`, `env()`, `directUrl`, shadow database o preview features;
- output Client distinto de `database/platform/generated/client`.

El wrapper valida la configuración authored antes de ejecutar Prisma, elimina exclusivamente el path
canónico después de comprobar tipo/symlink, genera `client.ts` y escribe un manifest ignorado con
hashes SHA-256 del schema y output. `validate` ejecuta la CLI Prisma real y falla ante output ausente o
drift del manifest/schema/generated client.

Dos generaciones consecutivas, cada una desde output removido por el wrapper seguro, produjeron:

```text
first  = aad12b466d145cf42466e9c84118ea82b4646fad9386b3c0b4f8668e9791ebbf
second = aad12b466d145cf42466e9c84118ea82b4646fad9386b3c0b4f8668e9791ebbf
equal  = true
```

El output está ignorado, no trackeado, no se edita manualmente y ninguna fuente authored lo importa.

## Guardas administrativas A/B

Allowlist exacta, contrastada automáticamente con la topología FND-005:

| Reference        | Database              | Server      | Usuario local               |
| ---------------- | --------------------- | ----------- | --------------------------- |
| `client-a-local` | `trazactivo_client_a` | `127.0.0.1` | `trazactivo_client_a_local` |
| `client-b-local` | `trazactivo_client_b` | `127.0.0.1` | `trazactivo_client_b_local` |

El puerto debe coincidir con el valor entregado por el preflight local canónico. La guarda rechaza:

- `platform-local`, `platform_catalog` y usuario Platform;
- A→database/user B y B→database/user A;
- reference, database, host, user o port arbitrarios;
- `connectionString`, schema/config/Docker overrides y propiedades no reconocidas;
- `clientId`, header, query, body, cookie, browser state o request input como selector.

Los errores usan códigos estables sin incluir valores secretos. La redacción elimina passwords,
connection strings y pares sensibles. Estas guardas no consultan bases ni producen una referencia
runtime utilizable.

## Separación Platform/Client y ownership DB-003

- Los schemas usan paths, datasource names y outputs diferentes.
- Platform conserva su único import Prisma runtime técnico en
  `database/platform/infrastructure/platform-prisma.ts`.
- DB-002 no importa `@prisma/*`, adapter ni generated Client desde código runtime.
- Frontend, contracts, domain y client-context permanecen sin Prisma.
- DB-002 no contiene `migrations/`, seeds, sentinelas o comandos de mutación.
- DB-003 conserva exclusivamente artifacts/aplicación de migrations, migration history/state, seeds,
  sentinelas, rebuild y drift real entre A/B.

## Pruebas positivas y negativas

Unit DB-002 cubre 20/20 casos:

- A y B canónicos aceptados por separado;
- Platform rechazado;
- tuples A→B y B→A rechazadas;
- reference/database/host/user/port arbitrarios rechazados;
- propiedades y selectores request/browser rechazados;
- password fuera de política rechazado y diagnósticos redactados.

Architecture cubre 88/88 total después de DB-002 y agrega controles de:

- schema model-free, SQL Server, sin connection config/preview features;
- outputs Platform/Client distintos y targets alineados con FND-005;
- versiones Prisma exactas y coincidentes;
- imports Prisma/generated Client prohibidos fuera del boundary vigente;
- ausencia de migrations, seeds, sentinelas y comandos de mutación;
- ausencia de selector ClientId/request;
- wrapper real cerrado a argumentos y environment overrides;
- Prisma validator real fallando ante schema inválido;
- generated output ignorado/no trackeado y drift fail-closed.

## Baseline y validación de implementación

El primer `npm run verify` de baseline ejecutó correctamente hasta integration y falló porque la
topología FND-005 estaba detenida (`FND005_RESOURCE_MISSING container/network`). No fue un blocker
técnico ni una regresión DB-002. Sin cambios, se ejecutó `local:reset` canónico con cuatro secretos
efímeros distintos sólo en memoria y se repitió el baseline: PASS completo, unit 35/35, architecture
63/63, ambas integraciones reales y
`VERIFY_COMPLETE result=CONTROLS_EXECUTED_WITH_EXPLICIT_SCOPE_STATUSES`.

Resultados finales de la validación principal:

| Comando                                                   | Resultado                                      |
| --------------------------------------------------------- | ---------------------------------------------- |
| `npm ci`                                                  | exit 0; 553 packages instalados, 567 auditados |
| `npm run db:client:generate`                              | exit 0; hash reproducible documentado          |
| `npm run db:client:validate`                              | exit 0; schema y generated evidence válidos    |
| `npm run format:check`                                    | exit 0; 178 archivos                           |
| `npm run lint`                                            | exit 0                                         |
| `npm run typecheck`                                       | exit 0; DB-001, DB-002 y workspaces            |
| `npm run test:unit -- --project client-prisma-foundation` | exit 0; 20/20                                  |
| `npm run test:architecture`                               | exit 0; 88/88                                  |
| `npm run build`                                           | exit 0                                         |
| `npm run verify`                                          | exit 0; unit total 55/55, architecture 88/88   |
| `npm run local:down`                                      | exit 0; runtime detenido, datos preservados    |
| `git diff --check`                                        | exit 0                                         |

`verify` preservó `local-infrastructure` y `platform-prisma-foundation` como integraciones reales;
`future-application-integration`, contract, multiclient y e2e conservaron `NOT_IMPLEMENTED_SCOPE`, y
golden conservó `NOT_APPLICABLE_SCOPE`. A11y permaneció 5/5 para las superficies implementadas. Build
y backend-smoke pasaron; Data API y Control API observaron health HTTP 200 y shutdown liberado, y el
worker mantuvo runtime idle con shutdown liberado. El resultado final fue:

```text
VERIFY_COMPLETE result=CONTROLS_EXECUTED_WITH_EXPLICIT_SCOPE_STATUSES
```

El clean checkout y SHA candidato se registrarán en este mismo reporte antes de publicar el Draft PR.

## Riesgos abiertos y limitaciones

- Advisory transitivo `prisma -> @prisma/config -> deepmerge-ts <8`: permanece abierto bajo las
  condiciones documentadas por DB-001. `npm ci` reportó tres hallazgos high. No se aplicó force,
  downgrade ni override inseguro.
- Advertencia TLS Node sobre loopback local: permanece abierta como limitación local heredada. DB-002
  no abre una conexión y no cambia la topología.
- Spike/pooling ADR-018: permanece pendiente para SPI-001/CLI-004; DB-002 no fija parámetros ni crea
  lifecycle runtime.
- Database migration drift y estado aplicado A/B permanecen pendientes y bajo ownership de DB-003.

## Archivos creados o modificados

- `.gitignore`.
- `package.json`.
- `database/README.md`.
- `database/client/prisma/schema.prisma`.
- `database/client/infrastructure/client-target.ts`.
- `database/client/tests/client-target.test.ts`.
- `database/client/tsconfig.json`.
- `database/client/vitest.config.ts`.
- `scripts/db-001-rules.mjs`.
- `scripts/db-001.architecture.test.mjs`.
- `scripts/db-002-cli.mjs`.
- `scripts/db-002-rules.mjs`.
- `scripts/db-002.architecture.test.mjs`.
- `scripts/run-suite.mjs`.
- `scripts/typecheck.mjs`.
- `scripts/verify.mjs`.
- `docs/plans/reports/DB-002-report.md`.

## Commits y clean checkout

- Commit candidato: pendiente de validación principal completa.
- Clean checkout: pendiente.
- Draft PR: pendiente.

## Comandos no ejecutados por alcance

- `prisma migrate dev`, `prisma migrate deploy`, `prisma db push`: prohibidos; ownership DB-003.
- migrations, seeds, sentinelas y drift runtime A/B: ownership DB-003.
- integration Prisma Client A/B: no se simula; la adquisición runtime pertenece a CLI-004.
- proyectos contract, multiclient, future application integration y e2e: conservan sus estados de
  scope explícitos.
- Azure y operaciones Docker globales: fuera de alcance/prohibidas.
