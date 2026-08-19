# FND-005 — Reporte de implementación

## Resultado

FND-005 implementa el proyecto Docker Compose local canónico de SQL Server, los comandos
`local:preflight`, `local:up`, `local:status`, `local:reset` y `local:down`, y el proyecto de
integración real `local-infrastructure`. La topología fija tres databases distintas y tres identidades
SQL locales segregadas, sin Prisma, migraciones, schemas o datos de negocio.

- Work Package: `FND-005-local-three-databases`.
- Estado de entrada: `READY`.
- Estado durante implementación: `IN_PROGRESS`.
- Estado final: `DONE` por decisión humana de cierre; `BLK-FND-005-001` permanece históricamente
  `RESOLVED`.
- Branch: `codex/FND-005-local-three-databases`.
- Base: `architecture/v1.1-typescript`.
- Dependencia satisfecha: FND-001 (`DONE`).
- FND-002, FND-003 y FND-004 permanecen `DONE`.
- Todas las demás WPs permanecen `DRAFT` y no autorizadas.

## Baseline previo

Antes de modificar código, el test aislado informado como fallido en
`apps/control-api/tests/control-api.test.ts` se repitió mediante:

```text
npm run test:unit --workspace apps/control-api -- tests/control-api.test.ts
```

Resultado: exit 0, 1 archivo y 4/4 tests; duración de tests 411 ms. El timeout de 10 segundos no se
reprodujo y se clasifica como fallo transitorio preexistente. FND-005 no modifica `apps/control-api`
ni aumenta timeouts.

## Topología y versión SQL Server

Proyecto Compose: `trazactivo-local-fnd005`.

Imagen fijada:

```text
mcr.microsoft.com/mssql/server:2022-CU26-ubuntu-22.04@sha256:ba4c8329f48fb8f02e1416be6a930ebfd71268caee78aa985f3af4315e457c89
```

La selección corresponde a SQL Server 2022 CU26 sobre Ubuntu 22.04, Microsoft Container Registry,
edición Developer para uso local. El tag y digest se verificaron en el
[Microsoft Artifact Registry](https://mcr.microsoft.com/en-us/artifact/mar/mssql/server/tag/2022-CU26-ubuntu-22.04).
No se utiliza `latest` ni otro motor.

| Rol      | Database              | DatabaseReference | Usuario local               |
| -------- | --------------------- | ----------------- | --------------------------- |
| Platform | `platform_catalog`    | `platform-local`  | `trazactivo_platform_local` |
| Client A | `trazactivo_client_a` | `client-a-local`  | `trazactivo_client_a_local` |
| Client B | `trazactivo_client_b` | `client-b-local`  | `trazactivo_client_b_local` |

Los tres targets comparten una instancia y puerto, pero `local:status` y la integración consultan
`DB_NAME()`, `ORIGINAL_LOGIN()` y `USER_NAME()` con cada identidad. La integración real denegó los
accesos A→B, B→A y Platform→A.

## Defecto histórico de bootstrap y corrección

Después de recuperar Docker Engine, `local:up` falló dos veces desde el estado inicial con
`Msg 911: Database 'platform_catalog' does not exist`. El bootstrap enviaba en un único input SQL la
creación dinámica de cada database, el `DEFAULT_DATABASE` del login y el `USE`/usuario posterior. SQL
Server resolvía las referencias del batch antes de que la database creada dinámicamente estuviera
disponible.

La corrección separa el bootstrap en invocaciones `sqlcmd` reales y fail-closed:

1. conectado a `master` como `sa`, crea sólo las databases faltantes y cierra el batch;
2. consulta `sys.databases` y exige exactamente los tres targets antes de continuar;
3. crea o normaliza logins en `master` y verifica `default_database_name`, `CHECK_POLICY` y
   `CHECK_EXPIRATION`;
4. para cada database abre una conexión explícita, comprueba `DB_NAME()`, crea o reasocia el user,
   otorga `CONNECT` y valida la identidad con su login segregado.

La segunda ejecución no vuelve a crear databases, logins o users. Tampoco intenta reasignar el mismo
password a un login existente, evitando que la política de historial rompa la idempotencia. Los
passwords continúan llegando a `sqlcmd` mediante stdin/`SQLCMDPASSWORD`, nunca como argumentos.

La regresión architecture construye el workflow desde un conjunto vacío, lo ejecuta dos veces y
rechaza logins antes de verificar databases o users antes de validar su target. También inspecciona
que el SQL de creación no contenga `DEFAULT_DATABASE`/`USE`, que el SQL de logins no cree databases y
que la guardia `DB_NAME()` preceda a `CREATE USER`.

## Secretos

`.env.example` sólo versiona la señal local, el puerto de ejemplo y placeholders vacíos. Los cuatro
passwords efectivos se suministran mediante variables de proceso o `.env.local`, ignorado por Git.
Los scripts:

- exigen valores distintos y una política mínima compatible con SQL Server;
- envían passwords a `sqlcmd` por entrada estándar, no por argumentos;
- redactan valores efectivos de errores de Docker/SQL;
- no imprimen connection strings;
- rechazan variables que alteren Docker host/context, Compose file/project o target de database.

## Operaciones locales y alcance destructivo

- `local:preflight` valida Windows, PowerShell 7, WSL2, Docker Compose, context `desktop-linux`,
  endpoint local, Engine, puerto, paths canónicos, secrets y configuración estática.
- `local:up` usa sólo el Compose canónico, espera health SQL, crea las tres databases y sus logins y
  verifica identidad y accesos cruzados.
- `local:status` exige container/network/volume y labels exactas antes de consultar SQL.
- `local:reset` valida los recursos, ejecuta únicamente `compose down --volumes` y reconstruye la
  topología.
- `local:down` ejecuta sólo `compose down` y conserva el volumen local.

No existen comandos de prune global, globs destructivos, project names o paths suministrables por el
usuario. Container, network y volume tienen nombres y labels canónicas; un recurso homónimo con labels
distintas bloquea la operación.

## Integración real

`npm run test:integration -- --project local-infrastructure` despacha exclusivamente
`scripts/fnd-005-integration.mjs`. La integración:

1. verifica SQL Server y los tres recursos Compose;
2. consulta realmente las tres databases con sus identidades autorizadas;
3. valida las tres `DatabaseReference` contra sus targets;
4. exige denegación de accesos cruzados;
5. pone Client A offline de forma local y controlada, comprueba que Client B sigue disponible y
   restaura A en un bloque `finally`;
6. falla ante recursos, databases, identidades o aislamiento incompletos;
7. no imprime secretos o connection strings.

Cuando `test:integration` se ejecuta sin `--project`, el contrato raíz ejecuta primero
`local-infrastructure` y conserva `NOT_IMPLEMENTED_SCOPE` para
`future-application-integration`, owner QA-001. Ningún proyecto futuro se presenta como implementado.

## Pruebas negativas

La suite architecture de FND-005 cubre:

- Docker endpoint TCP/SSH remoto;
- Docker context no canónico;
- colisión de puerto, salvo que el container canónico ya sea quien lo ocupa;
- overrides `DOCKER_HOST`, `COMPOSE_FILE`, `COMPOSE_PROJECT_NAME` y database target;
- argumentos CLI que intentan inyectar project/path/target;
- labels, nombres y recursos no reconocidos;
- reutilización de secretos y redacción de diagnósticos;
- topología de una sola database compartida para A/B;
- ampliación de la allowlist destructiva;
- proyecto de integración no autorizado;
- ausencia de comandos Docker de borrado global;
- separación y orden de las fases database/login/user desde cero y en una segunda ejecución
  idempotente.

## Archivos creados o modificados

### Infraestructura y configuración

- `.env.example`.
- `.gitattributes`.
- `infra/local/docker-compose.yml`.
- `infra/README.md`.

### Scripts y pruebas

- `scripts/fnd-005-rules.mjs`.
- `scripts/fnd-005-runtime.mjs`.
- `scripts/fnd-005-integration.mjs`.
- `scripts/fnd-005.architecture.test.mjs`.
- `scripts/local-preflight.mjs`.
- `scripts/local-up.mjs`.
- `scripts/local-status.mjs`.
- `scripts/local-reset.mjs`.
- `scripts/local-down.mjs`.
- `scripts/run-suite.mjs`.
- `scripts/architecture-rules.mjs`.
- `scripts/toolchain.architecture.test.mjs`.
- `scripts/format.mjs`.
- `package.json`.

### Documentación y trazabilidad

- `README.md`.
- `docs/02-architecture/local-development.md`.
- `docs/04-development/workspace-toolchain.md`.
- `docs/plans/PLAN-walking-skeleton-2026-08-18.md`.
- `docs/plans/work-packages/FND-005-local-three-databases.md`.
- Este reporte.

## Dependencias

No se agregan dependencias npm runtime o de desarrollo. La implementación utiliza Node.js built-in,
Docker Compose y `sqlcmd` incluido en la imagen SQL Server fijada. `package-lock.json` no requiere
cambios.

## Validación y resultados

| Comando                                                 | Resultado | Evidencia                                                                                           |
| ------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| Test aislado control-api                                | Exit 0    | 4/4; fallo baseline no reproducido; tests 411 ms.                                                   |
| `npm ci`                                                | Exit 0    | 369 packages instalados; 383 auditados; 0 vulnerabilidades.                                         |
| `docker compose ... config --quiet`                     | Exit 0    | Compose válido, variables suministradas en memoria y sin contactar Engine.                          |
| Fallo ambiental inicial                                 | Exit 1    | Docker Engine no respondía; origen histórico de `BLK-FND-005-001`.                                  |
| `local:up` previo a la corrección                       | Exit 16   | Reproducido dos veces con `Msg 911` al referenciar `platform_catalog` dentro del batch de creación. |
| Reset canónico desde cero                               | Exit 0    | Container/volume/network con ownership validada; recreó la topología completa.                      |
| `npm run local:preflight`                               | Exit 0    | Context `desktop-linux`, Engine 29.6.1 y puerto 14333.                                              |
| `npm run local:up` #1                                   | Exit 0    | Tres databases creadas/verificadas.                                                                 |
| `npm run local:up` #2                                   | Exit 0    | Segunda ejecución idempotente; sin duplicar databases, logins o users.                              |
| `npm run local:status`                                  | Exit 0    | Observó `platform-local`, `client-a-local` y `client-b-local` en sus databases exactas.             |
| Integración `local-infrastructure`                      | Exit 0    | Ejecutada explícitamente y dentro de verify; 3 DB, denegaciones cruzadas e independencia A/B.       |
| `npm run format:check` final                            | Exit 0    | 159 archivos conformes.                                                                             |
| `npm run lint`                                          | Exit 0    | Sin errores ni warnings.                                                                            |
| `npm run typecheck`                                     | Exit 0    | Raíz y 13 workspaces.                                                                               |
| `npm run test:unit` dentro de `verify`                  | Exit 0    | 8 archivos, 26/26; control-api 4/4 sin timeout.                                                     |
| `npm run test:architecture`                             | Exit 0    | 5 archivos, 50/50.                                                                                  |
| Regresiones fail-closed FND-005                         | Exit 0    | 1 archivo, 15/15, incluidas fases de bootstrap e idempotencia desde cero.                           |
| `npm run verify` final                                  | Exit 0    | `VERIFY_COMPLETE result=CONTROLS_EXECUTED_WITH_EXPLICIT_SCOPE_STATUSES`.                            |
| Contract / multiclient / E2E                            | Exit 0    | Conservan `NOT_IMPLEMENTED_SCOPE` bajo sus owners futuros.                                          |
| `npm run test:golden`                                   | Exit 0    | `NOT_APPLICABLE_SCOPE`, owner QA-002.                                                               |
| `npm run test:a11y`                                     | Exit 0    | 3 archivos, 5/5.                                                                                    |
| `npm run build`                                         | Exit 0    | 5 apps y 8 packages construidos.                                                                    |
| `npm run test:backend-smoke`                            | Exit 0    | Data/control health 200 y worker idle; shutdown liberado.                                           |
| `npm run local:down`                                    | Exit 0    | Removió container/network canónicos y preservó el volumen etiquetado de FND-005.                    |
| Búsqueda de secretos y comandos destructivos prohibidos | Exit 0    | Placeholders vacíos, `.env.local` ignorado/no trackeado y ningún prune global en runtime.           |
| `git diff --check`                                      | Exit 0    | Sin errores de whitespace.                                                                          |

La evidencia runtime prueba SQL Server real, tres databases distintas, identidad segregada,
idempotencia, denegación A↔B e independencia de Client B durante una indisponibilidad dirigida de A.
Las credenciales de validación fueron efímeras, distintas, generadas en memoria y no se escribieron
ni imprimieron.

No hay cambios en `apps/`, PDD, ADR Accepted, `package-lock.json` o WPs distintas de FND-005. La
implementación validada reside en el commit candidato local
`ea0e14cee984d7cf2bc672d21a0233449c91803b`.

## Validación desde clean checkout

Se creó un directorio temporal nuevo fuera del repositorio fuente y se clonó directamente desde el
repositorio Git local, sin hardlinks, fetch de GitHub ni branch auxiliar. La ruta lógica fue
`%TEMP%/trazactivo-fnd005-clean-ea0e14c-<unique>/checkout`; el `HEAD` del clon coincidió exactamente
con `ea0e14cee984d7cf2bc672d21a0233449c91803b` en
`codex/FND-005-local-three-databases`.

El estado inicial cumplió:

- `git status --short` vacío;
- ausencia de `node_modules`, `.env.local`, `.next`, `dist`, `build` y `artifacts`;
- ningún archivo no committed del checkout fuente;
- ningún output, path absoluto del checkout fuente o dependencia de una branch local auxiliar.

Antes del clon existía únicamente el volumen canónico preservado de la validación anterior, con
labels `trazactivo-local-fnd005`, `local-infrastructure` y `FND-005`; container y network estaban
ausentes. Para no reutilizar datos SQL ni credenciales previas, el clon ejecutó su propio
`local:reset` después de `npm ci` y `local:preflight`. Las guardas verificaron ownership antes de
eliminar y recrear exclusivamente ese volumen mediante Compose. No se usó eliminación manual, prune
ni operación Docker global.

| Gate del clean checkout            | Resultado | Evidencia                                                                              |
| ---------------------------------- | --------- | -------------------------------------------------------------------------------------- |
| Estado inicial                     | PASS      | Árbol limpio y artefactos ausentes.                                                    |
| `npm ci`                           | Exit 0    | 369 packages; 383 auditados; 0 vulnerabilidades; status Git todavía vacío.             |
| `npm run local:preflight`          | Exit 0    | Context `desktop-linux`, Engine 29.6.1, puerto 14333.                                  |
| `npm run local:reset`              | Exit 0    | Volumen previo reemplazado sólo después de validar ownership canónica.                 |
| `npm run local:up`                 | Exit 0    | SQL Server real y las tres databases disponibles.                                      |
| `npm run local:status`             | Exit 0    | `platform-local`, `client-a-local` y `client-b-local` resolvieron sus targets exactos. |
| Integración `local-infrastructure` | Exit 0    | Tres DB, consultas reales, A→B/B→A/Platform→A denegados e independencia A/B.           |
| `npm run test:architecture`        | Exit 0    | 5 archivos, 50/50.                                                                     |
| `npm run verify`                   | Exit 0    | Unit 26/26, scopes futuros preservados y `VERIFY_COMPLETE` con estados explícitos.     |
| `npm run local:down`               | Exit 0    | Removió container/network canónicos y preservó el volumen.                             |
| Estado final                       | PASS      | `git status --short` vacío, `.env.local` ausente y ningún output runtime trackeado.    |

Los cuatro secretos fueron distintos, conformes a `safePasswordPattern`, generados únicamente en la
memoria del proceso del clon y descartados al finalizar; no se imprimieron ni persistieron. El reset
demuestra que la prueba no dependió del contenido del volumen anterior ni de outputs de otra
ejecución.

## Cierre post-merge

- PR de implementación: #14 — FND-005: add reproducible local SQL Server databases.
- Merge en `architecture/v1.1-typescript`:
  `4084e3a436ef62636eb4ec523f95dd6c39967696`.
- Head implementado y commit de evidencia documental:
  `21a90e430a73d1ed9855720ea3da415ca54f1ebb`.
- Commit candidato validado en clean checkout:
  `ea0e14cee984d7cf2bc672d21a0233449c91803b`.

La validación humana post-merge aprobada registró:

- `npm ci`: exit 0; 369 packages instalados, 383 auditados y 0 vulnerabilidades;
- `local:preflight`: exit 0 con `desktop-linux`, Engine 29.6.1 y puerto 14333;
- `local:reset` y `local:status`: exit 0, con las tres referencias resolviendo sus databases y users
  exactos;
- integración `local-infrastructure`: PASS real con tres `DATABASE_VERIFIED`, aislamiento cruzado e
  independencia de disponibilidad A/B;
- architecture 50/50, unit 26/26, a11y 5/5, build y backend-smoke: PASS;
- contract, multiclient, future application integration y e2e conservaron `NOT_IMPLEMENTED_SCOPE`;
  golden conservó `NOT_APPLICABLE_SCOPE` bajo QA-002;
- `npm run verify`: exit 0 con
  `VERIFY_COMPLETE result=CONTROLS_EXECUTED_WITH_EXPLICIT_SCOPE_STATUSES`;
- `local:down` y `git diff --check`: exit 0; working tree post-merge limpio y secretos no
  persistidos.

El timeout histórico de control-api no reapareció. Esta evidencia cierra FND-005, pero no autoriza
DB-001, DB-002, DB-003 ni ninguna otra Work Package.

## Riesgos y limitaciones

- La instancia compartida prueba aislamiento a nivel database y login, no aislamiento físico ni alta
  disponibilidad.
- El test de indisponibilidad usa una database local desechable y restaura A en `finally`; un cierre
  abrupto puede requerir `local:reset`.
- La selección exacta de context/endpoint es intencionalmente fail-closed para Windows 11 con Docker
  Desktop WSL2.
- Docker Engine debe ser iniciado manualmente por el operador; los scripts no alteran Docker Desktop o
  WSL2. La indisponibilidad inicial quedó resuelta por el operador y se conserva como historia.

## Estado de cierre

`BLK-FND-005-001` está `RESOLVED` y conserva la historia del Engine indisponible, el posterior
`Msg 911`, la separación del bootstrap, las regresiones y las validaciones runtime, clean checkout y
post-merge. FND-005 queda `DONE` por decisión humana; ninguna Work Package adicional queda autorizada
por este cierre.

No existe Decision Request: la imagen y el comportamiento usados no evidenciaron incompatibilidad
semántica relevante entre SQL Server local y Azure SQL para el alcance de FND-005.

## Evidencia de alcance negativo

- No se agrega Prisma, schema, migración, seed o tabla de negocio.
- No se implementa Client Catalog, Client Resolver, `ClientContext` o DataSource Manager.
- No se implementa Azure SQL, Azurite, mensajería o infraestructura productiva.
- No se modifica PDD ni ADR Accepted.
- No se modifica `apps/control-api` ni se aumenta su timeout.
- No se implementa DB-001, DB-002, DB-003 ni otra WP `DRAFT`.
