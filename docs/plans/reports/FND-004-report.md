# FND-004 — Reporte de implementación

## Resultado

FND-004 entrega siete packages mínimos con ownership y consumidores explícitos, además de guards
reales que protegen sus límites. Seis boundaries futuros publican deliberadamente una API vacía;
`testkit` publica sólo el fixture que consumen las pruebas de arquitectura. El `design-system`
existente conserva el ownership de FND-002 y no fue modificado.

- Work Package: `FND-004-package-boundaries`.
- Estado durante la implementación: `READY`.
- Estado documental post-merge: `DONE`, por decisión humana de cierre.
- Branch: `codex/FND-004-package-boundaries`.
- Base: `architecture/v1.1-typescript`.
- PR de implementación: #11; merge commit integrado:
  `7a9e35aac22fff1b6c0ad36d5547875d4c45f9de`.
- Dependencia satisfecha: FND-001 (`DONE`).
- FND-002 y FND-003 permanecen `DONE`; FND-005 y todas las demás WPs permanecen sin autorización.
- Bloqueo de entrada: `BLK-FND-004-001` (`RESOLVED`).

No se implementó `AssetItem`, Client Resolver, membership, identidad, OpenAPI funcional, Prisma,
persistencia, Azure, regla contable, cálculo, FND-005 ni otra Work Package.

## Packages, responsabilidad, API y consumidor

| Package                      | Responsabilidad                                          | API pública real                                | Consumidor identificado               |
| ---------------------------- | -------------------------------------------------------- | ----------------------------------------------- | ------------------------------------- |
| `@trazactivo/domain`         | Boundary TypeScript puro de dominio.                     | `export {};`                                    | AST-001.                              |
| `@trazactivo/client-context` | Boundary TypeScript puro para futuro contexto inmutable. | `export {};`                                    | CLI-003.                              |
| `@trazactivo/authorization`  | Boundary framework-agnostic de autorización.             | `export {};`                                    | CLI-003 y, posteriormente, APP-001.   |
| `@trazactivo/contracts`      | Boundary para contratos públicos o generados.            | `export {};`                                    | API-001.                              |
| `@trazactivo/observability`  | Boundary vendor-neutral de observabilidad.               | `export {};`                                    | OBS-001.                              |
| `@trazactivo/testkit`        | Fixtures aislados sólo para testing.                     | `RepositoryFixture`, `createRepositoryFixture`. | Suite architecture de FND-004.        |
| `@trazactivo/policy-engine`  | Boundary puro y guard de aplicabilidad.                  | `export {};`                                    | Suite architecture/golden de FND-004. |

Las APIs vacías son una decisión explícita: los consumidores futuros están identificados, pero sus
WPs no están autorizadas. Agregar ahora tipos o contratos funcionales inventaría comportamiento.

`packages/design-system` no forma parte de los packages creados: fue entregado por FND-002. FND-004
valida de forma estructural que continúa siendo un workspace público separado, sin comparar hashes
ni depender de una branch Git local. El changed-files del PR #11 conserva la evidencia humana de
que FND-004 no modificó el package.

## Archivos creados o modificados

### Boundaries vacíos

- `packages/domain`: manifest, configuraciones TypeScript e `src/index.ts`.
- `packages/client-context`: manifest, configuraciones TypeScript e `src/index.ts`.
- `packages/authorization`: manifest, configuraciones TypeScript e `src/index.ts`.
- `packages/contracts`: manifest, configuraciones TypeScript e `src/index.ts`.
- `packages/observability`: manifest, configuraciones TypeScript e `src/index.ts`.
- `packages/policy-engine`: manifest, configuraciones TypeScript e `src/index.ts`.

### Soporte de testing y controles

- `packages/testkit`: manifest, configuraciones TypeScript/Vitest, fixture y unit tests.
- `scripts/fnd-004-rules.mjs`: inspección reusable de boundaries, imports y alcance golden.
- `scripts/fnd-004.architecture.test.mjs`: fixtures positivas y negativas de arquitectura.
- `scripts/fnd-004-golden.mjs`: gate ejecutable de aplicabilidad golden.
- `package.json`: `test:golden` ejecuta el gate real.
- `package-lock.json`: registra los nuevos workspaces, sin dependencia externa nueva.
- `packages/README.md`: matriz pública y mapa de imports.
- Este reporte.

## Dependencias y versiones

FND-004 no agrega dependencias externas, runtime ni de desarrollo. Los boundaries vacíos no tienen
dependencias. `testkit` usa exclusivamente módulos built-in de Node.js y el Vitest ya fijado en la
raíz (`4.1.10`). Todos los manifests conservan versiones exactas y son compatibles con Node.js
24.13.0 y npm 11.6.2.

## Mapa de imports

```text
scripts/fnd-004.architecture.test.mjs -> @trazactivo/testkit (export público `.`)
packages/testkit/src/index.ts         -> node:fs/promises, node:os, node:path
packages/domain                       -> sin imports
packages/client-context               -> sin imports
packages/authorization                -> sin imports
packages/contracts                    -> sin imports
packages/observability                -> sin imports
packages/policy-engine                -> sin imports
portal-web/control-web                -> @trazactivo/design-system (límite preexistente)
```

No existen ciclos entre packages ni `packages/common`. Ningún package de FND-004 se importa desde
runtime productivo.

La suite architecture importa `createRepositoryFixture` desde `@trazactivo/testkit`, no desde una
ruta interna. Los unit tests importan además el tipo `RepositoryFixture` por el mismo export `.`;
typecheck y ejecución Vitest demuestran la resolución de npm workspaces y package exports.

## Controles de arquitectura

La validación combina las reglas previas con las reglas de FND-004 y falla ante:

- cualquier dependencia productiva en domain o policy-engine, independientemente de su nombre;
- cualquier import no relativo en domain o policy-engine, incluidos Node.js, DB drivers,
  frameworks y SDKs;
- Prisma en frontend o imports frontend hacia internos backend;
- imports o dependencias app→app;
- ciclos entre packages o creación de un package no aprobado, incluido `common`;
- dependencia/import de `testkit` desde runtime o import de producto desde el propio `testkit`;
- secretos, tokens, connection strings, `DBRef` o referencias de DB en client-context;
- Prisma fuera de infrastructure/persistence o sin un import explícito del boundary ClientContext;
- superficie funcional `AssetItem`, invariantes o value objects anticipados en domain;
- source/export adicional en cualquiera de los seis boundaries que deben seguir vacíos;
- ausencia o pérdida del boundary público estructural de `packages/design-system`;
- archivos o dependencias del stack .NET ya prohibido por el gate raíz.

Domain y policy-engine mantienen vacías `dependencies`, `optionalDependencies` y
`peerDependencies`. Sus fuentes sólo pueden usar imports relativos internos; cualquier bare import
o import `node:*` se rechaza por omisión. Tooling compartido de typecheck/build continúa permitido
únicamente desde la raíz y no se convierte en dependencia productiva de estos packages.

## Golden applicability

`npm run test:golden` inspecciona realmente `packages/policy-engine/src`. En el alcance actual
encuentra sólo el boundary vacío y reporta:

```text
[test:golden] STATUS=NOT_APPLICABLE_SCOPE OWNER=QA-002 REASON=no accounting policy or calculation surface is published
```

El comando no simula un PASS contable. Falla con exit distinto de cero si encuentra depreciación,
cálculo monetario, accounting policy o una regla/policy/cálculo exportado. Las fixtures negativas
cubren todas esas categorías. QA-002 conserva el ownership de la validación golden final.

## Pruebas positivas y negativas

Pruebas positivas:

- manifests privados y exports públicos mínimos de los siete packages;
- los seis boundaries futuros contienen exactamente `export {};`;
- el fixture de `testkit` crea, lee y elimina un repositorio temporal aislado;
- repositorio vigente sin violaciones y golden aplicable como `NOT_APPLICABLE_SCOPE`;
- boundary público de `design-system` válido sin consultar branches Git; changed-files del PR #11
  sin modificaciones del package.

Fixtures negativas:

- `node:fs`, `pg`, NestJS, Prisma, Next.js, React, Azure y HTTP rechazados en domain;
- `node:crypto` y React rechazados en policy-engine; imports relativos internos permitidos;
- Prisma y NestJS desde frontend, además de app→app;
- ciclo entre packages y package `common`;
- `testkit` en dependencia/import runtime y `testkit` importando producto;
- ClientContext con DB reference, connection string o secreto;
- Prisma desde application y Prisma en infrastructure sin ClientContext;
- `AssetItem` funcional dentro de domain;
- depreciación, cálculo monetario, accounting policy y regla funcional en policy-engine;
- path de fixture que intenta escapar su raíz temporal.

## Validación y resultados

| Comando                        | Resultado | Evidencia                                                   |
| ------------------------------ | --------- | ----------------------------------------------------------- |
| `npm ci`                       | Exit 0    | 369 packages instalados; 383 auditados; 0 vulnerabilidades. |
| `npm run format:check`         | Exit 0    | 147 archivos conformes.                                     |
| `npm run lint`                 | Exit 0    | ESLint sin errores ni warnings.                             |
| `npm run typecheck`            | Exit 0    | Raíz y 13 workspaces conformes.                             |
| `npm run test:unit`            | Exit 0    | 8 archivos, 26/26 pruebas aprobadas.                        |
| `npm run test:architecture`    | Exit 0    | 4 archivos, 35/35 pruebas aprobadas.                        |
| `npm run test:golden`          | Exit 0    | Inspección real: `NOT_APPLICABLE_SCOPE`, owner QA-002.      |
| `npm run build`                | Exit 0    | 5 apps y 8 packages construidos independientemente.         |
| `npm run verify`               | Exit 0    | `CONTROLS_EXECUTED_WITH_EXPLICIT_SCOPE_STATUSES`.           |
| `npm audit --audit-level=high` | Exit 0    | 0 vulnerabilidades.                                         |
| `git diff --check`             | Exit 0    | Sin errores de whitespace.                                  |

Dentro de `verify`, a11y conservó 5/5 pruebas aprobadas y el backend smoke de FND-003 volvió a
comprobar health HTTP 200 y shutdown liberado. Integration, contract, multiclient y E2E conservaron
`NOT_IMPLEMENTED_SCOPE`; golden fue el único `NOT_APPLICABLE_SCOPE` y no se presentó como PASS.

## Evidencia de checkout limpio

La branch se validó además desde un clon temporal `--single-branch` que no contenía una branch local
ni remote-tracking ref llamada `architecture/v1.1-typescript`:

- `npm ci`: exit 0;
- `npm run test:architecture`: exit 0, 35/35;
- resolución de `@trazactivo/testkit` por su export público: validada durante carga de architecture,
  unit y typecheck;
- `npm run verify`: exit 0, `CONTROLS_EXECUTED_WITH_EXPLICIT_SCOPE_STATUSES`;
- `git status --short`: vacío después de la validación.

`npm run verify` no ejecutó fetch ni necesitó una referencia histórica a la branch base. El control
estructural de design-system sigue funcionando después del merge porque inspecciona el workspace
vigente y permite exports adicionales legítimos.

## Criterios de aceptación

| Criterio                                                     | Evidencia                                                             |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| Cada package tiene responsabilidad y API pública explícitas. | Matriz aprobada, manifests, índices y este reporte.                   |
| FND-004 no crea, recrea ni extiende design-system.           | Control estructural portable y changed-files del PR #11.              |
| No existe `common` genérico.                                 | Regla vigente y fixture negativa.                                     |
| Domain y Policy compilan sin framework ni infraestructura.   | Typecheck/build por workspace y reglas de dependency/import.          |
| Frontend no puede importar Prisma o NestJS interno.          | Gate preexistente conservado y fixture negativa de FND-004.           |
| Prisma no se obtiene antes de ClientContext autorizado.      | Regla de ubicación/contexto y fixtures de application/infrastructure. |

Los seis criterios están respaldados por la suite y la evidencia post-merge, y quedan cerrados por
la decisión humana que cambia FND-004 de `READY` a `DONE`.

## Casos negativos

- Imports prohibidos: cubiertos por fixtures reales que producen códigos de violación estables.
- Archivo `.csproj` o dependencia .NET: cubierto por el architecture gate raíz conservado.
- Cálculo contable sin golden aprobado: cubierto por el scanner real y cuatro fixtures semánticas.

## Riesgos y controles

| Riesgo                                            | Control                                                       | Residual                                             |
| ------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| Inventar abstracciones para consumidores futuros. | Seis APIs deliberadamente vacías.                             | Cada WP consumidora deberá justificar su extensión.  |
| Acoplar dominio/policy a infraestructura.         | Dependencias productivas vacías e imports externos denegados. | Autorizar explícitamente cada futura dependencia.    |
| Usar testkit en producto.                         | Prohibición en manifests e imports productivos.               | QA futura puede extenderlo sólo con consumo real.    |
| Publicar cálculo sin golden.                      | Scanner de policy-engine dentro de `test:golden` y `verify`.  | QA-002 debe entregar el golden final cuando aplique. |
| Duplicar design-system.                           | Boundary estructural y changed-files revisado en el PR.       | FND-002 sigue siendo el único owner inicial.         |

## Limitaciones y pendientes

- Los boundaries vacíos no contienen tipos funcionales; se amplían sólo al autorizar AST-001,
  CLI-003, API-001 u OBS-001.
- Authorization no decide roles, permisos ni policies.
- Policy Engine no contiene reglas, cálculos ni motor de decisión.
- Golden sigue `NOT_APPLICABLE_SCOPE` hasta publicar una superficie contable mediante WP futura.
- No existe ClientContext funcional, Client Resolver, DataSource Manager o persistence adapter.
- Integration, contract, multiclient y E2E permanecen `NOT_IMPLEMENTED_SCOPE` con sus owners futuros.

## Estados de scope preservados

- `test:integration`: `NOT_IMPLEMENTED_SCOPE`, owner QA-001.
- `test:contract`: `NOT_IMPLEMENTED_SCOPE`, owners API-001, API-002 y QA-001.
- `test:multiclient`: `NOT_IMPLEMENTED_SCOPE`, owners CLI-005 y QA-001.
- `test:e2e`: `NOT_IMPLEMENTED_SCOPE`, owner QA-002.
- `test:golden`: `NOT_APPLICABLE_SCOPE`, owner QA-002, mediante inspección real.

## Comandos no ejecutados y motivo

- No se ejecutan Prisma, migraciones, DB ni `local:*`: pertenecen a FND-005/DB posteriores.
- No se ejecutan OpenAPI, identidad, Client Resolver, membership, Azure ni despliegues: están fuera
  de alcance o prohibidos para FND-004.
- Integration, contract, multiclient y E2E no tienen superficie implementada; `verify` debe
  conservar sus estados explícitos `NOT_IMPLEMENTED_SCOPE`, no presentarlos como PASS.

## Evidencia de alcance negativo

- No hay dependencia ni import productivo de Prisma; sus únicas menciones nuevas son fixtures
  negativas de arquitectura.
- No hay secretos, tokens, credenciales o connection strings reales agregados; las únicas
  superficies sensibles nuevas son valores sintéticos de fixtures negativas.
- No hay regla o cálculo contable; policy-engine contiene sólo `export {};`.
- No existe `packages/common`.
- `packages/design-system` no fue modificado.
- Domain no contiene `AssetItem`, invariantes o value objects funcionales.
- Client-context no contiene membership, resolver, factory, identidad ni selección de DB.
- Contracts no contiene OpenAPI, endpoint o DTO funcional.
- No se modificaron PDD ni ADR Accepted.
- No se implementó FND-005 ni ninguna WP posterior.

## Cierre post-merge

- PR #11 mergeado en `architecture/v1.1-typescript` mediante
  `7a9e35aac22fff1b6c0ad36d5547875d4c45f9de`.
- Evidencia de implementación y validación: este reporte.
- `npm ci`: exit 0; `npm run verify`: exit 0.
- Unit tests: 26/26; architecture tests: 35/35.
- `test:golden`: `NOT_APPLICABLE_SCOPE`, owner QA-002, mediante inspección real.
- Build: exit 0; el backend-smoke entregado por FND-003 continúa exit 0.
- `git diff --check`: exit 0; working tree limpio post-merge.
- El checkout limpio previo validó architecture 35/35 y `npm run verify` exit 0.
- `packages/design-system` no fue modificado; `testkit` se consume mediante su API pública
  `@trazactivo/testkit`; domain y policy-engine conservan el boundary deny-by-default.
- `BLK-FND-004-001` permanece históricamente registrado como `RESOLVED`.
- No existe Prisma, persistencia, `AssetItem`, membership, Client Resolver, OpenAPI funcional,
  reglas contables ni cálculos. No se implementó ni autorizó FND-005 o una WP posterior.

## Trazabilidad

- PDD v1.1: secciones 05.3, 12 y 44; Gate 1.
- ADR-015: TypeScript end-to-end.
- ADR-017: aislamiento por DB y resolución server-side futura.
- ADR-019: monorepo, límites y ausencia de `common` genérico.
- ADR-021: baseline de pruebas reales.
- Plan: `PLAN-walking-skeleton-2026-08-18`.
- WP: `FND-004-package-boundaries`.
