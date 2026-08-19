# FND-002 — Shells Next.js y design tokens mínimos

## Estado

`DONE`

Autorizada exclusivamente para implementación por decisión humana del 2026-08-18. Esta transición
no autorizó ninguna otra Work Package. El cierre fue aprobado humanamente tras la implementación y
merge del PR #5 en `architecture/v1.1-typescript` mediante el commit `a5707e6`.

## Objetivo

Crear las foundations desplegables separadas de `portal-web` y `control-web` con navegación mínima, accesibilidad base y design tokens TrazActivo, sin funcionalidad anticipada.

## Resultado observable

Ambas apps levantan y construyen independientemente, se distinguen visual y técnicamente, y no importan backend, Prisma ni lógica de negocio.

## Requisitos relacionados

- EPIC-FND-02 y EPIC-FND-04.
- PDD 05.3, 06.1, 06.2, 10.2 y 16.
- Gate 1.

## ADR relacionados

- ADR-015.
- ADR-019.
- ADR-021.

## Gate de entrada

- FND-001 completada (`DONE`); dependencia de entrada satisfecha.

## Gate de salida

- Shells frontend construibles y listos para consumir exclusivamente el cliente OpenAPI futuro.

## Scope

### Incluye

- App shell, ruta de health/smoke visual, estados loading/error y tokens base.
- Creación inicial de `packages/design-system` y de sus design tokens mínimos; FND-002 es su único
  owner inicial.
- Separación portal/control.
- Tests de componente y accesibilidad del shell.

### No incluye

- Pantalla de activos, Client Selector funcional, autenticación o branding configurable.
- Crear otros packages compartidos o transferir a FND-004 el ownership inicial de
  `packages/design-system`.
- Fetch directo a DB o API ad hoc.
- Reglas de autorización o contabilidad en frontend.

## Dependencias

- FND-001 (`DONE`; satisfecha).

## Precondiciones

- Toolchain aprobado y dependencias frontend justificadas.

## Supuestos

- Sólo se usan los tokens y responsabilidades ya definidos por la baseline.

## Bloqueos/TBD

- La matriz comercial de navegadores queda fuera de alcance y no posee un TBD autoritativo; fijar Playwright local no decide soporte comercial.

## Diseño

### Componentes afectados

- `apps/portal-web`, `apps/control-web` y creación inicial de `packages/design-system` con design
  tokens mínimos.

### Cambios esperados

- Shells independientes, sin un shell único que mezcle planos.

### Frontend

- Next.js/React/TypeScript; estructura accesible y tokens del PDD.

### API/OpenAPI

- No se consume API aún; se deja un puerto tipado para API-002.

### Application/Domain/Policy

- No aplica.

### ClientContext y aislamiento

- No se conserva estado de cliente todavía; se prohíben caches globales de negocio.

### Prisma y migraciones

- Prohibidos.

### Permisos

- Sólo placeholders visuales no ejecutables; ninguna autorización final.

### Eventos y auditoría

- No aplica.

### Observabilidad

- Error boundary y health visual sin datos sensibles.

## Contratos API

- Ninguno hasta API-002.

## Persistencia

- No aplica.

## Archivos o módulos esperados

- `apps/portal-web`, `apps/control-web` y superficie inicial mínima de `packages/design-system`.

## Criterios de aceptación

- [x] Portal y Control construyen y levantan por separado.
- [x] No existen imports entre aplicaciones.
- [x] No hay Prisma, connection strings ni DTO internos en frontend.
- [x] Tokens respetan baseline y contraste básico.
- [x] Los shells funcionan con teclado y axe sin defectos bloqueantes.

## Casos negativos

- [x] Un import desde backend/Prisma falla architecture test.
- [x] Control Plane no aparece como navegación del portal.
- [x] Un error no expone stack ni configuración sensible.

## Pruebas obligatorias

```text
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:architecture
npm run test:a11y
npm run build
```

## Comandos locales

```text
npm run dev --workspace portal-web
npm run dev --workspace control-web
```

## Definition of Done

- [x] Build, lint y typecheck.
- [x] Component/architecture/a11y.
- [x] Separación de apps documentada.
- [x] Sin API ad hoc, Prisma, secretos o lógica anticipada.
- [x] Evidencia visual y de teclado.
- [x] Sin TBD P0 aplicable.

## Evidencia esperada

- Builds, screenshots de shells, reporte axe y matriz de imports.

## Evidencia de cierre

- PR #5 implementado y mergeado en `architecture/v1.1-typescript`.
- Merge commit integrado: `a5707e6`.
- Reporte de implementación: `docs/plans/reports/FND-002-report.md`.
- `npm ci`: exit 0.
- `npm run verify`: exit 0, con resultado
  `VERIFY_COMPLETE result=CONTROLS_EXECUTED_WITH_EXPLICIT_SCOPE_STATUSES`.
- `npm run test:unit`: 12/12.
- `npm run test:architecture`: 14/14.
- `npm run test:a11y`: 5/5, sin infracciones axe.
- Builds independientes de `portal-web`, `control-web` y `design-system`: exit 0.
- `git diff --check`: exit 0.
- `git status`: working tree limpio post-merge.
- El formatter ignora `.next` y `next-env.d.ts`; `next-env.d.ts` no está trackeado.
- FND-003, FND-004 y FND-005 no fueron implementadas, permanecen `DRAFT` y no están autorizadas.

## Riesgos

- Sobreconstruir design system.
- Mezclar Control Plane con portal.

## Rollback o reversibilidad

- Los shells son aditivos y se revierten por workspace sin afectar datos.

## Condiciones de bloqueo

- FND-001 está completada y no constituye un bloqueo vigente.
- Dependencias frontend no aprobadas.
