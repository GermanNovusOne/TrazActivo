# FND-001 — Reporte de implementación

## Resultado

FND-001 establece el monorepo npm reproducible, fija Node/npm y dependencias del toolchain,
entrega configuración estricta de TypeScript/ESLint/Prettier y define un `npm run verify`
fail-fast que conserva el código no cero del primer control fallido.

- Work Package: `FND-001-workspace-toolchain`.
- Estado de entrada: `READY`.
- Branch: `codex/FND-001-workspace-toolchain`.
- Base: `architecture/v1.1-typescript`.
- Gate 0: tag `foundation-pre-v1.1-typescript-2026-08-18` verificado en `ba0a3b5`.
- Decisión habilitante: `DEC-DEV-001`, Node.js 24 LTS.

No se implementó FND-002 ni otra WP.

## Objetivo cumplido

- npm workspaces declarados exclusivamente como `apps/*` y `packages/*`.
- Node.js `24.13.0` y npm `11.6.2` fijados y validados antes de instalar.
- Lockfile npm generado con dependencias exactas.
- TypeScript base estricto y typecheck raíz ejecutable.
- ESLint flat config y Prettier reproducibles.
- Suite de arquitectura real con casos positivos y negativos.
- Contrato raíz completo para pruebas, build y operación local.
- Suites no entregadas identificadas como `NOT_IMPLEMENTED_SCOPE`.
- Golden identificado como `NOT_APPLICABLE_SCOPE`; no se presenta como aprobación contable.
- Operaciones futuras `dev`, `local:*` y `db:*` bloqueadas con exit 2, sin éxito simulado.

## Archivos cambiados

### Toolchain raíz

- `package.json`, `package-lock.json`.
- `.nvmrc`, `.node-version`, `.npmrc`.
- `.prettierrc.json`, `eslint.config.mjs`.
- `tsconfig.base.json`, `tsconfig.json`.
- `vitest.architecture.config.mjs`.

### Contratos y controles

- `scripts/preflight.mjs`.
- `scripts/format.mjs`.
- `scripts/typecheck.mjs` y `scripts/typecheck-contract.ts`.
- `scripts/toolchain.mjs`.
- `scripts/run-suite.mjs`.
- `scripts/not-implemented.mjs`.
- `scripts/verify.mjs` y `scripts/verify-failure-probe.mjs`.
- `scripts/architecture-rules.mjs`.
- `scripts/toolchain.architecture.test.mjs`.

### Documentación y límites de workspace

- `README.md`.
- `apps/README.md`.
- `packages/README.md`.
- `docs/04-development/workspace-toolchain.md`.
- `docs/plans/reports/FND-001-report.md`.

## Versiones y decisiones

| Componente | Versión | Razón                                                                 |
| ---------- | ------: | --------------------------------------------------------------------- |
| Node.js    | 24.13.0 | Patch reproducible dentro de la versión mayor 24 LTS aprobada         |
| npm        |  11.6.2 | Compatible con Node 24.13.0; npm 12.0.2 exige Node 24.15.0 o superior |
| TypeScript |   5.9.3 | Compatible con el peer range `<6.1.0` de `typescript-eslint` 8.67.0   |
| ESLint     |  10.8.1 | Lint flat config actual, versión exacta                               |
| Prettier   |   3.9.6 | Formato reproducible, versión exacta                                  |
| Vitest     |  4.1.10 | Runner real para pruebas de arquitectura                              |

Dependencias directas revisadas: `@eslint/js`, `eslint`, `globals`, `prettier`, `typescript`,
`typescript-eslint` y `vitest`. Sus licencias directas son MIT o Apache-2.0. npm 11.6.2 usa
Artistic-2.0. No se agregaron dependencias runtime.

## Decisiones aplicadas

- Se fijan versiones exactas; architecture test rechaza `latest`, `^`, `~` u otros rangos.
- `.npmrc` habilita `engine-strict`, lockfile y `save-exact`.
- `preinstall` ejecuta el preflight para detener `npm ci` con Node/npm incorrectos.
- `verify` ejecuta secuencialmente todas las capas exigidas y se detiene en el primer exit no cero.
- El dispatcher ejecuta scripts reales de cada workspace cuando existen. La ausencia autorizada por
  el alcance actual genera estado explícito y propietario, nunca PASS.
- Los scripts operacionales aún no implementados fallan con exit 2.
- El gate de arquitectura bloquea archivos o comandos .NET nuevos y cambios a la foundation
  preservada; permite que el legado sea retirado posteriormente porque Git conserva el tag.
- El gate también bloquea app→app, frontend→Prisma/datos, Prisma fuera de infraestructura,
  frameworks en packages puros, package `common` y dependencias no fijadas.

## Pruebas y resultados

| Comando                                   | Resultado | Evidencia                                                              |
| ----------------------------------------- | --------- | ---------------------------------------------------------------------- |
| `npm ci`                                  | Exit 0    | 130 packages instalados; preflight Node/npm OK; 0 vulnerabilidades     |
| `npm run format:check`                    | Exit 0    | Archivos seleccionados conformes                                       |
| `npm run lint`                            | Exit 0    | ESLint, cero warnings permitidos                                       |
| `npm run typecheck`                       | Exit 0    | `tsconfig.json` estricto; workspaces futuros declarados explícitamente |
| `npm run test:architecture`               | Exit 0    | 1 archivo, 8 pruebas aprobadas                                         |
| `npm run verify`                          | Exit 0    | Todas las capas ejecutadas en orden; estados de scope preservados      |
| `npm run verify:failure-probe`            | Exit 0    | Hijo controlado exit 73; verify propagó 73 y no continuó               |
| `npm audit --audit-level=high`            | Exit 0    | 0 vulnerabilidades                                                     |
| Clon aislado: `npm ci` + `npm run verify` | Exit 0    | Instalación y verificación completas fuera del working tree            |
| `git diff --check`                        | Exit 0    | Sin whitespace errors                                                  |

### Casos negativos automatizados

- Node.js distinto de 24.13.0 falla preflight.
- Un `.csproj` nuevo se rechaza.
- Un comando `dotnet` se rechaza.
- Una app no puede depender de otra app.
- Una app no puede importar código interno de otra app.
- Frontend no puede depender ni importar Prisma.
- Una dependencia con rango no exacto se rechaza.
- Un hijo fallido corta `verify` y propaga su exit code.

### Estados explícitos de suites futuras

- `test:unit`: `NOT_IMPLEMENTED_SCOPE`, propietario FND-002/FND-003/FND-004.
- `test:integration`: `NOT_IMPLEMENTED_SCOPE`, propietario QA-001.
- `test:contract`: `NOT_IMPLEMENTED_SCOPE`, propietario API-001/API-002/QA-001.
- `test:multiclient`: `NOT_IMPLEMENTED_SCOPE`, propietario CLI-005/QA-001.
- `test:e2e` y `test:a11y`: `NOT_IMPLEMENTED_SCOPE`, propietario QA-002.
- `build`: `NOT_IMPLEMENTED_SCOPE`, propietario FND-002/FND-003.
- `test:golden`: `NOT_APPLICABLE_SCOPE`, sin cálculo o política contable publicada.

Estos estados no constituyen PASS funcional, contable, multi-client, E2E, accesibilidad ni build.

## Evidencia de reproducibilidad

`npm ci` reconstruyó `node_modules` desde el lockfile sin pasos ocultos y ejecutó el preflight
automático. Antes del push se creó un clon local aislado de la branch; allí `npm ci` y
`npm run verify` terminaron en exit 0, con 8 pruebas de arquitectura aprobadas. El clon temporal se
eliminó después de conservar el resultado en este reporte.

## Riesgos y controles

| Riesgo                                         | Control                                                        | Residual                                                           |
| ---------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| Desalineación Node/npm                         | Pins redundantes, `engine-strict` y preflight                  | Cambiar patch exige actualizar pins y lockfile de forma coordinada |
| Falso positivo por suite vacía                 | No se usa `--passWithNoTests`; estados de scope son explícitos | Cada WP propietaria debe agregar su script ejecutable              |
| Extensión accidental del legado .NET           | Comparación contra tag Gate 0 y casos negativos                | Un clone shallow debe disponer del tag preservado                  |
| Dependencia vulnerable o sin licencia revisada | Versiones exactas, tabla de licencias y `npm audit`            | Revisar nuevamente en cada actualización                           |
| TypeScript 7 incompatible con lint actual      | TypeScript 5.9.3 fijado por peer range comprobado              | Reevaluar sólo en WP de upgrade aprobada                           |

## Limitaciones y pendientes

- FND-001 no crea ninguna app ni package funcional.
- No existen todavía UI, API, OpenAPI, Prisma, bases locales ni dominio.
- No se ejecuta Azure ni CI/CD remoto; `DEC-CICD-001` permanece propuesta.
- Las suites futuras deben ser implementadas por sus WPs antes de presentarse como evidencia.
- El gate de legado requiere el tag Gate 0; un checkout shallow debe obtenerlo antes de verificar.

No queda TBD P0 aplicable a FND-001.

## Comandos no ejecutados y motivo

- `npm run dev`: FND-002/FND-003 no están autorizadas; el comando devuelve exit 2.
- `npm run local:up` y `npm run local:down`: pertenecen a FND-005; devuelven exit 2.
- `npm run db:generate`, `db:migrate:local` y `db:seed:local`: pertenecen a DB-001/002/003;
  devuelven exit 2.
- No se ejecutaron comandos `dotnet`, migraciones, despliegues, merge ni otra Work Package.

## Trazabilidad

- PDD v1.1: secciones 44.1, 44.2, 44.4 y 44.6; Gate 1.
- ADR-015: TypeScript end-to-end.
- ADR-019: monorepo y límites desplegables.
- ADR-020: desarrollo local reproducible.
- ADR-021: baseline de pruebas.
- Plan: `PLAN-walking-skeleton-2026-08-18`.
- WP: `FND-001-workspace-toolchain`.
