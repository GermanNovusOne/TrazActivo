# FND-002 — Shells Next.js y design tokens mínimos

## Estado

`DRAFT`

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

- FND-001 completada.

## Gate de salida

- Shells frontend construibles y listos para consumir exclusivamente el cliente OpenAPI futuro.

## Scope

### Incluye

- App shell, ruta de health/smoke visual, estados loading/error y tokens base.
- Separación portal/control.
- Tests de componente y accesibilidad del shell.

### No incluye

- Pantalla de activos, Client Selector funcional, autenticación o branding configurable.
- Fetch directo a DB o API ad hoc.
- Reglas de autorización o contabilidad en frontend.

## Dependencias

- FND-001.

## Precondiciones

- Toolchain aprobado y dependencias frontend justificadas.

## Supuestos

- Sólo se usan los tokens y responsabilidades ya definidos por la baseline.

## Bloqueos/TBD

- La matriz comercial de navegadores queda fuera de alcance y no posee un TBD autoritativo; fijar Playwright local no decide soporte comercial.

## Diseño

### Componentes afectados

- `apps/portal-web`, `apps/control-web` y design tokens mínimos.

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

- `apps/portal-web`, `apps/control-web` y superficie mínima de `packages/design-system`.

## Criterios de aceptación

- [ ] Portal y Control construyen y levantan por separado.
- [ ] No existen imports entre aplicaciones.
- [ ] No hay Prisma, connection strings ni DTO internos en frontend.
- [ ] Tokens respetan baseline y contraste básico.
- [ ] Los shells funcionan con teclado y axe sin defectos bloqueantes.

## Casos negativos

- [ ] Un import desde backend/Prisma falla architecture test.
- [ ] Control Plane no aparece como navegación del portal.
- [ ] Un error no expone stack ni configuración sensible.

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

- [ ] Build, lint y typecheck.
- [ ] Component/architecture/a11y.
- [ ] Separación de apps documentada.
- [ ] Sin API ad hoc, Prisma, secretos o lógica anticipada.
- [ ] Evidencia visual y de teclado.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- Builds, screenshots de shells, reporte axe y matriz de imports.

## Riesgos

- Sobreconstruir design system.
- Mezclar Control Plane con portal.

## Rollback o reversibilidad

- Los shells son aditivos y se revierten por workspace sin afectar datos.

## Condiciones de bloqueo

- FND-001 no completada.
- Dependencias frontend no aprobadas.
