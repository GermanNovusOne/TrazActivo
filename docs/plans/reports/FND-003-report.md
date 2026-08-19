# FND-003 — Reporte de implementación

## Resultado

FND-003 entrega shells NestJS independientes para Data Plane, Control Plane y worker. Las APIs
exponen únicamente health técnico seguro; el worker funciona como application context standalone
idle, sin jobs ni mensajería funcional. Los tres runtimes tienen configuración local validada,
startup y shutdown controlados, y límites automatizados.

- Work Package: `FND-003-nestjs-shells`.
- Estado durante la implementación: `READY`; no se cambia a `DONE`.
- Branch: `codex/FND-003-nestjs-shells`.
- Base: `architecture/v1.1-typescript`.
- Dependencia satisfecha: FND-001 (`DONE`).
- FND-002 permanece `DONE`; FND-004, FND-005 y todas las demás WPs permanecen sin autorización.

No se implementó Prisma, base de datos, Client Resolver, Client Catalog, ClientContext, identidad,
OpenAPI funcional, `AssetItem`, Service Bus, job funcional ni otra Work Package.

## Objetivo cumplido

- `data-api`, `control-api` y `worker` son workspaces, procesos y builds independientes.
- Data API y Control API exponen `GET /health` con respuestas distintas por plano.
- El health no consulta ni simula Prisma o una Client DB.
- Los controllers delegan en application y no contienen invariantes.
- El worker conserva vivo únicamente el application context mediante un timer idle técnico.
- Startup y shutdown emiten registros JSON construidos con campos allowlist.
- Los servidores HTTP y el handle idle se liberan de forma idempotente.
- Las pruebas unitarias y de arquitectura reales están integradas al contrato raíz.

## Archivos creados o modificados

### Data API

- `apps/data-api/package.json`, `tsconfig.json`, `tsconfig.build.json` y `vitest.config.ts`.
- `apps/data-api/src/data-api.module.ts`, `bootstrap.ts` y `main.ts`.
- `apps/data-api/src/application/technical-health.service.ts`.
- `apps/data-api/src/presentation/health.controller.ts`.
- `apps/data-api/src/infrastructure/runtime-config.ts` y `graceful-shutdown.ts`.
- `apps/data-api/src/domain/README.md`.
- `apps/data-api/tests/data-api.test.ts`.

### Control API

- `apps/control-api/package.json`, `tsconfig.json`, `tsconfig.build.json` y `vitest.config.ts`.
- `apps/control-api/src/control-api.module.ts`, `bootstrap.ts` y `main.ts`.
- `apps/control-api/src/application/technical-health.service.ts`.
- `apps/control-api/src/presentation/health.controller.ts`.
- `apps/control-api/src/infrastructure/runtime-config.ts` y `graceful-shutdown.ts`.
- `apps/control-api/src/domain/README.md`.
- `apps/control-api/tests/control-api.test.ts`.

### Worker

- `apps/worker/package.json`, `tsconfig.json`, `tsconfig.build.json` y `vitest.config.ts`.
- `apps/worker/src/worker.module.ts`, `bootstrap.ts` y `main.ts`.
- `apps/worker/src/application/worker-runtime.service.ts`.
- `apps/worker/src/infrastructure/runtime-config.ts`, `worker-runtime.token.ts` y
  `graceful-shutdown.ts`.
- `apps/worker/src/domain/README.md`.
- `apps/worker/tests/worker.test.ts`.

### Toolchain, arquitectura y documentación

- `package.json` y `package-lock.json`.
- `scripts/fnd-003-rules.mjs`, `scripts/fnd-003.architecture.test.mjs` y
  `scripts/fnd-003-smoke.mjs`.
- `apps/README.md`.
- `docs/04-development/backend-shells.md`.
- Este reporte.

## Dependencias y versiones

Todas las dependencias directas nuevas usan versión exacta, sin `latest`, `^` ni `~`.

| Dependencia                | Versión | Licencia   | Uso y justificación                                   |
| -------------------------- | ------: | ---------- | ----------------------------------------------------- |
| `@nestjs/common`           |  11.2.1 | MIT        | Módulos, controllers, providers y lifecycle           |
| `@nestjs/core`             |  11.2.1 | MIT        | Bootstrap HTTP y application context standalone       |
| `@nestjs/platform-express` |  11.2.1 | MIT        | Adaptador HTTP mínimo para Data API y Control API     |
| `reflect-metadata`         |   0.2.2 | Apache-2.0 | Metadata de decorators requerida por NestJS           |
| `rxjs`                     |   7.8.2 | Apache-2.0 | Peer runtime requerido por NestJS                     |
| `tsx`                      | 4.23.12 | MIT        | Ejecución local directa de los entrypoints TypeScript |

`@nestjs/core` declara Node.js `>=20` y `tsx` declara Node.js `>=18`; las versiones seleccionadas
son compatibles con Node.js 24.13.0 y npm 11.6.2. `npm audit` no reporta vulnerabilidades.

## Arquitectura aplicada

- ADR-015: NestJS y TypeScript para backend y worker.
- ADR-019: tres aplicaciones desplegables, sin imports ni dependencias app→app.
- ADR-021: Vitest real para unit y architecture, sin suites vacías.
- Data API y Control API conservan límites `presentation`, `application`, `domain` e
  `infrastructure`; domain queda deliberadamente sin invariantes funcionales.
- El controller de health sólo traduce HTTP y delega en un servicio técnico de application.
- No se creó package compartido: FND-004 continúa sin autorización. La duplicación mínima del
  shutdown y la configuración evita transferir ownership o acoplar aplicaciones.
- No existe Prisma; el architecture gate lo rechaza en los shells y específicamente en health.

## Separación Data / Control / Worker

- Nombres, manifests, módulos, entrypoints, procesos, puertos y builds son independientes.
- Data API responde `plane=data`; Control API responde `plane=control`.
- Ninguna app importa otra app o reutiliza sus módulos internos.
- Sólo existen controllers de health técnico; no hay endpoint funcional de negocio.
- El worker no abre HTTP, no importa SDK de mensajería y no contiene handlers o consumidores.
- Un fixture de worker funcional sin `ClientContext`/`JobEnvelope` es rechazado por arquitectura.

## Configuración y redacción de secretos

- Data API acepta sólo `DATA_API_PORT`, default 3100, rango 1024-65535.
- Control API acepta sólo `CONTROL_API_PORT`, default 3101, rango 1024-65535.
- Worker acepta sólo `WORKER_IDLE_INTERVAL_MS`, default 60000, rango 1000-300000.
- Las APIs enlazan exclusivamente a `127.0.0.1` en este shell local.
- Una entrada inválida genera un código estable que no refleja el valor recibido.
- Los registros allowlist contienen aplicación, evento, plano/modo, host, puerto y señal.
- `process.env`, errores, stacks, connection strings y secretos no se serializan.
- Unit tests inyectan strings sensibles sintéticas y comprueban que no aparecen en health/logs.

## Health

Data API:

```json
{ "service": "data-api", "plane": "data", "status": "ok", "version": "0.0.0" }
```

Control API:

```json
{ "service": "control-api", "plane": "control", "status": "ok", "version": "0.0.0" }
```

El smoke construye y levanta ambas APIs en puertos aislados, obtiene HTTP 200 y valida el body. No
hay dependencia, indicador o simulación de DB.

## Shutdown

- Cada entrypoint registra `SIGINT` y `SIGTERM` mediante un controlador idempotente.
- Las APIs ejecutan `app.close()` y liberan el listener HTTP.
- El worker ejecuta hooks NestJS y libera el único timer idle.
- Una segunda solicitud de cierre reutiliza la misma promesa y no cierra dos veces.
- Los fallos de cierre producen sólo `APPLICATION_STOP_FAILED`, sin imprimir la excepción.
- El smoke llama el mismo controlador con señal técnica `TEST` y verifica los tres handles
  liberados.

## Pruebas ejecutadas y resultados

| Comando                                      | Resultado | Evidencia                                                  |
| -------------------------------------------- | --------- | ---------------------------------------------------------- |
| `npm ci`                                     | Exit 0    | 362 packages instalados; 369 auditados; 0 vulnerabilidades |
| `npm run format:check`                       | Exit 0    | Fuentes y documentación conformes                          |
| `npm run lint`                               | Exit 0    | ESLint sin errores ni warnings                             |
| `npm run typecheck`                          | Exit 0    | Raíz y seis workspaces conformes                           |
| `npm run test:unit`                          | Exit 0    | 7 archivos, 24/24 pruebas aprobadas                        |
| `npm run test:architecture`                  | Exit 0    | 3 archivos, 20/20 pruebas aprobadas                        |
| `npm run build --workspace apps/data-api`    | Exit 0    | Build TypeScript independiente                             |
| `npm run build --workspace apps/control-api` | Exit 0    | Build TypeScript independiente                             |
| `npm run build --workspace apps/worker`      | Exit 0    | Build TypeScript independiente                             |
| `npm run test:backend-smoke`                 | Exit 0    | Health 200 y shutdown liberado en las tres aplicaciones    |
| `npm run build`                              | Exit 0    | Tres backends, dos frontends y design-system construidos   |
| `npm run verify`                             | Exit 0    | `CONTROLS_EXECUTED_WITH_EXPLICIT_SCOPE_STATUSES`           |
| `git diff --check`                           | Exit 0    | Sin errores de whitespace                                  |

`verify` conserva `test:integration`, `test:contract`, `test:multiclient` y `test:e2e` como
`NOT_IMPLEMENTED_SCOPE`, y `test:golden` como `NOT_APPLICABLE_SCOPE`. No se presentan como PASS.
La suite a11y de FND-002 continúa ejecutándose; FND-003 no agrega superficie visual.

## Criterios de aceptación

| Criterio                                              | Estado   | Evidencia                                   |
| ----------------------------------------------------- | -------- | ------------------------------------------- |
| Tres apps construyen y levantan independientemente    | Cumplido | Builds por workspace y smoke real           |
| Data API y Control API no mezclan módulos ni permisos | Cumplido | Módulos separados y architecture gate       |
| Worker no procesa mensajes sin envelope/contexto      | Cumplido | Worker idle y fixture negativo automatizado |
| Controllers no contienen invariantes                  | Cumplido | Delegación simple y regla de control flow   |
| Shutdown no deja procesos o handles abiertos          | Cumplido | Unit tests y smoke de los tres runtimes     |

No queda criterio de aceptación pendiente dentro del alcance de FND-003.

## Casos negativos

- Un import app→app genera `APP_TO_APP_IMPORT`.
- Prisma en manifest o source genera `FND003_PRISMA_DEPENDENCY`/`FND003_PRISMA_IMPORT`.
- Un controller que importa domain/infrastructure genera `FND003_CONTROLLER_LAYER_BYPASS`.
- Control flow de invariantes en un controller genera `FND003_CONTROLLER_INVARIANT_LOGIC`.
- Configuración sensible en health genera `FND003_HEALTH_SENSITIVE_CONFIG`.
- Un consumidor worker sin contexto explícito genera `FND003_WORKER_CONTEXT_MISSING`.
- Valores sensibles sintéticos no aparecen en records de startup o respuestas health.

Los tres casos negativos definidos por la WP están cubiertos y aprobados.

## Riesgos y controles

| Riesgo                                          | Control                                              | Residual                                      |
| ----------------------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| Mezclar Control Plane y Data Plane              | Workspaces/módulos/puertos y gates separados         | Mantener el gate en API-001 y WPs posteriores |
| Convertir health en endpoint de infraestructura | Body fijo y regla que rechaza Prisma/config sensible | Health profundo pertenece a OBS-001           |
| Activar jobs antes del contexto                 | Worker idle y fixture que exige contexto explícito   | Mensajería futura requiere WP autorizada      |
| Filtrar secretos por errores/configuración      | Logger deshabilitado y records allowlist             | OBS-001 definirá logging productivo           |
| Duplicación técnica entre apps                  | Duplicación mínima y explícita para evitar acoplar   | FND-004 podrá definir packages autorizados    |

## Limitaciones y pendientes

- El health es técnico y local; no representa DB, Azure, dependencias externas ni readiness
  productivo.
- No hay OpenAPI funcional; API-001 permanece pendiente y sin autorización.
- No hay autenticación, autorización final, Client Resolver, ClientContext ni persistencia.
- El worker no procesa ningún mensaje o job.
- No hay integración/E2E backend porque no existe aún una superficie funcional ni infraestructura
  local de datos.
- La selección de hosting Azure (`TBD-DEV-002`/`DEC-AZR-002`) permanece abierta y fuera de scope.

## Comandos no ejecutados y motivo

- No se ejecutaron suites funcionales de integration, contract, multiclient o E2E: `verify` las
  reporta con owner futuro y `NOT_IMPLEMENTED_SCOPE`.
- No se ejecutaron Prisma, schemas, migraciones, DB, `local:*` ni Docker porque pertenecen a WPs
  posteriores.
- No se ejecutaron OpenAPI, autenticación, Entra ID, Service Bus, Azure ni despliegues porque están
  prohibidos o fuera de alcance para FND-003.

## Trazabilidad

- PDD v1.1: secciones 05.2, 05.3, 06, 36, 37, 41 y 44; Gate 1.
- ADR-015: TypeScript end-to-end.
- ADR-019: monorepo y límites desplegables.
- ADR-021: baseline de pruebas.
- Plan: `PLAN-walking-skeleton-2026-08-18`.
- WP: `FND-003-nestjs-shells`.
