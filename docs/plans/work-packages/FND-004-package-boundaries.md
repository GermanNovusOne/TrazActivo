# FND-004 — Packages y pruebas de arquitectura

## Estado

`DONE`

Autorizada exclusivamente para implementación por decisión humana del 2026-08-19, después de
resolver `BLK-FND-004-001` mediante la matriz aprobada de responsabilidad, API pública mínima,
consumidores y prohibiciones. FND-001 está `DONE`, por lo que la dependencia y el gate de entrada
están satisfechos. El cierre fue aprobado humanamente tras la implementación mediante el PR #11 y
su merge en `architecture/v1.1-typescript` mediante
`7a9e35aac22fff1b6c0ad36d5547875d4c45f9de`. Este cierre no autoriza FND-005 ni ninguna otra Work
Package.

## Objetivo

Crear sólo los packages compartidos necesarios y automatizar límites que mantengan dominio, contexto, contratos y aplicaciones desacoplados.

## Resultado observable

Packages construibles con responsabilidades explícitas y una suite que falla ante dependencias prohibidas, incluido Prisma antes del boundary Client.

## Requisitos relacionados

- EPIC-FND-03/04.
- PDD 05.3, 12 y 44.
- Gate 1.

## ADR relacionados

- ADR-015.
- ADR-017.
- ADR-019.
- ADR-021.

## Gate de entrada

- FND-001 completada (`DONE`); gate de entrada satisfecho.

## Gate de salida

- Límites de packages disponibles para implementar API, ClientContext y AssetItem.

## Scope

### Incluye

- Creación inicial de `domain`, `client-context`, `authorization`, `contracts`, `observability` y
  `testkit` mínimos.
- Boundary de `policy-engine` sin reglas publicadas ni cálculos.
- Validación de límites arquitectónicos de `packages/design-system` ya creado por FND-002, sin
  modificarlo ni extenderlo.
- Tests de imports, framework independence y stack prohibido.

### No incluye

- Crear o recrear `packages/design-system` ni sus design tokens mínimos.
- Package genérico `common`.
- Modelos Prisma o DTO NestJS expuestos al frontend.
- Reglas contables, AssetItem funcional o adaptadores Azure.

## Dependencias

- FND-001 (`DONE`; satisfecha).

## Precondiciones

- Responsabilidad, API pública mínima, consumidores y prohibiciones de cada package documentados en
  la matriz aprobada; precondición satisfecha.
- `packages/design-system` existe y su creación inicial pertenece exclusivamente a FND-002; FND-004
  sólo valida sus límites existentes.

## Supuestos

- No se crea un package sin consumidor inmediato ni se presume una regla contable.

## Bloqueos/TBD

- TBD contables no bloquean crear el límite vacío de Policy Engine; sí bloquean cualquier regla/cálculo.
- `BLK-FND-004-001` — `RESOLVED` por decisión humana del 2026-08-19. Hallazgo original preservado:
  faltaba una matriz aprobada que asignara a cada package bajo ownership de FND-004 su
  responsabilidad concreta, API pública mínima y consumidor inmediato; el plan sólo permitía
  identificar consumidores futuros generales y `testkit` no tenía responsabilidad específica
  documentada. El impacto original mantenía FND-004 `DRAFT` para impedir abstracciones sin
  consumidor. La decisión humana definió que un consumidor inmediato puede ser una WP del Walking
  Skeleton explícitamente identificada o la propia suite architecture/golden cuando el artefacto
  es exclusivamente boundary, guard o soporte de testing. La matriz aprobada siguiente satisface
  la evidencia requerida sin anticipar la implementación de las WPs consumidoras.

## Matriz aprobada de packages

La decisión humana del 2026-08-19 no autoriza comportamiento funcional futuro. Una API puede ser
deliberadamente mínima o vacía cuando el artefacto sea sólo un boundary verificable.

| Package | Responsabilidad | API pública mínima | Consumidor identificado | Prohibiciones |
|---|---|---|---|---|
| `packages/domain` | Boundary TypeScript puro de dominio | Sólo la superficie necesaria para independencia de framework; FND-004 no crea tipos funcionales de `AssetItem` | AST-001 | `AssetItem` funcional, invariantes, value objects de negocio, persistencia, NestJS, Prisma, HTTP, Azure y contabilidad |
| `packages/client-context` | Boundary TypeScript puro para tipos mínimos de contexto e inmutabilidad | Sólo tipos/boundaries que impidan secretos, connection strings y dependencia de framework | CLI-003 | Membership, resolver, context factory funcional, switch, identidad y selección de DB |
| `packages/authorization` | Contratos y puertos mínimos framework-agnostic | Sólo interfaces/boundaries sin policies funcionales | CLI-003; posteriormente APP-001 | Roles efectivos, permisos funcionales, autorización real y decisiones de UI |
| `packages/contracts` | Boundary para contratos públicos o generados | Superficie mínima para que API-001 establezca contratos sin compartir DTO internos | API-001 | OpenAPI funcional anticipado, DTO NestJS manual compartido y endpoints de negocio |
| `packages/observability` | Boundary vendor-neutral de observabilidad | Tipos o puertos técnicos mínimos, como `CorrelationId`, sólo cuando el boundary los justifique | OBS-001 | Application Insights, Azure Monitor, SDK Azure, logging productivo y métricas productivas |
| `packages/testkit` | Helpers, fixtures y assertions sólo para testing | Únicamente utilidades consumidas realmente por las pruebas de FND-004 | Suites reales architecture/alcance de FND-004; posteriormente OBS-001 y WPs QA cuando sean autorizadas | Código runtime, package `common` genérico y abstracciones sin uso real |
| `packages/policy-engine` | Sólo boundary y guard de alcance | Vacía o limitada al marcador/boundary mínimo requerido por architecture/golden applicability | Suites architecture/golden de FND-004; ningún consumidor funcional autorizado | Reglas, policies funcionales, cálculos, lógica contable y motores de decisión |
| `packages/design-system` | Límite existente bajo ownership de FND-002 | Ninguna API nueva en FND-004; se valida la API pública existente | `portal-web` y `control-web` ya entregados; FND-004 sólo valida el límite | Crear, recrear, extender o tomar ownership del package o de sus design tokens |

### Evidencia de resolución

- AST-001 declara `packages/domain` como componente afectado y depende de FND-004.
- CLI-003 declara `client-context` y `authorization` como packages consumidores.
- APP-001 consume posteriormente authorization y confirma que Policy Engine no participa.
- API-001 declara `package contracts` como componente afectado sin compartir DTO internos.
- OBS-001 declara `package observability` y `testkit` como componentes afectados, sin SDK Azure.
- Las suites architecture/golden de FND-004 consumen inmediatamente `testkit` y el boundary/guard
  de `policy-engine`.
- `packages/design-system` ya existe por FND-002; FND-004 no lo crea, recrea, extiende ni toma en
  ownership.

## Diseño

### Componentes afectados

- `packages/domain`, `packages/client-context`, `packages/authorization`, `packages/contracts`,
  `packages/observability`, `packages/testkit`, el boundary de `packages/policy-engine` y la suite de
  arquitectura. `packages/design-system` sólo participa como límite existente sujeto a validación.

### Cambios esperados

- APIs públicas mínimas, mapas de dependencias y reglas automatizadas.

### Frontend

- El boundary de contracts prepara la separación futura; nunca expone domain interno, Nest DTO o
  Prisma. FND-004 sólo valida los límites existentes de design-system y no modifica su API.

### API/OpenAPI

- Contracts prepara artefactos generados, no duplica DTO manuales.

### Application/Domain/Policy

- Domain y Policy Engine son TypeScript puro sin NestJS, Prisma, Next.js, Azure ni HTTP.

### ClientContext y aislamiento

- El tipo inmutable no contiene secretos ni connection strings.

### Prisma y migraciones

- Prisma sólo será permitido en infrastructure adapters y DataSource Manager futuro.

### Permisos

- Authorization define contratos, no decisiones de UI.

### Eventos y auditoría

- Sólo puertos/tipos mínimos cuando tengan consumidor inmediato.

### Observabilidad

- CorrelationId como tipo/puerto sin SDK Azure.

## Contratos API

- Ningún contrato HTTP funcional aún.

## Persistencia

- Ninguna.

## Archivos o módulos esperados

- Packages domain, client-context, authorization, contracts, observability y testkit, además del
  límite vacío de policy-engine.
- Reglas de arquitectura para `packages/design-system` existente, sin recrearlo ni duplicar sus
  design tokens.

## Criterios de aceptación

- [x] Cada package tiene responsabilidad y API pública explícitas.
- [x] FND-004 no crea, recrea ni extiende `packages/design-system`; sólo valida sus límites.
- [x] No existe `common` genérico.
- [x] Domain/Policy compilan sin framework ni infraestructura.
- [x] Frontend no puede importar Prisma/Nest internos.
- [x] Architecture test falla si Prisma se obtiene sin ClientContext autorizado.

## Casos negativos

- [x] Fixtures de imports prohibidos son rechazados por la suite.
- [x] Agregar `.csproj` o dependencia .NET falla el control.
- [x] Un cálculo contable sin golden aprobado falla el guard de alcance.

## Pruebas obligatorias

```text
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:architecture
npm run test:golden
npm run build
```

## Comandos locales

`test:golden` debe reportar `NOT_APPLICABLE_SCOPE` mediante un control real y fallar si detecta cálculo/política publicada; no puede marcar PASS contable.

## Definition of Done

- [x] Build/lint/typecheck.
- [x] Unit/architecture reales.
- [x] Golden applicability real, no placeholder.
- [x] Mapa de dependencias documentado.
- [x] Sin secretos ni reglas anticipadas.
- [x] Sin TBD P0 aplicable.

## Evidencia esperada

- Grafo de imports, resultados de fixtures negativas y estado golden `NOT_APPLICABLE_SCOPE`.

## Evidencia de cierre

- PR #11 implementado y mergeado en `architecture/v1.1-typescript`.
- Merge commit integrado:
  `7a9e35aac22fff1b6c0ad36d5547875d4c45f9de`.
- Reporte de implementación: `docs/plans/reports/FND-004-report.md`.
- `npm ci`: exit 0.
- `npm run verify`: exit 0.
- `npm run test:unit`: 26/26.
- `npm run test:architecture`: 35/35.
- `npm run test:golden`: `NOT_APPLICABLE_SCOPE`, owner QA-002, mediante inspección real.
- `npm run build`: exit 0; backend-smoke de FND-003 continúa exit 0.
- `git diff --check`: exit 0.
- `git status`: working tree limpio post-merge.
- El checkout limpio previo validó architecture 35/35 y `npm run verify` exit 0.
- `packages/design-system` no fue modificado; `testkit` se consume mediante
  `@trazactivo/testkit`; domain y policy-engine conservan pureza deny-by-default.
- No existe Prisma, persistencia, `AssetItem`, membership, Client Resolver, OpenAPI funcional,
  reglas contables ni cálculos. FND-005 y las WPs posteriores no fueron implementadas ni
  autorizadas por este cierre.

## Riesgos

- Crear abstracciones sin consumidor.
- Duplicar el ownership de `packages/design-system` asignado a FND-002.
- Permitir dependencias transitivas de framework en domain.

## Rollback o reversibilidad

- Packages bajo ownership de FND-004 son aditivos y revertibles antes de consumidores funcionales;
  `packages/design-system` no se recrea ni se toma en ownership.

## Condiciones de bloqueo

- `BLK-FND-004-001` está resuelto por la matriz aprobada; una responsabilidad, API o consumidor que
  se aparte de ella vuelve a bloquear la parte afectada.
- Una propuesta de regla contable o acceso Prisma fuera de los límites futuros autorizados vuelve a
  bloquear FND-004; ninguna está autorizada por esta transición.
