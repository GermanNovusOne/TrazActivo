# ADR-021: Baseline de pruebas

## Estado

Accepted.

## Decisión

- Vitest para unit/component y packages puros.
- Integración NestJS contra bases reales.
- Contract tests de OpenAPI.
- Playwright para E2E.
- axe-core y revisión manual para accesibilidad.
- Golden dataset para Policy Engine.
- Matriz multi-client P0.

## Gate

Una Work Package no termina con sólo unit tests. Debe ejecutar las capas que correspondan a su riesgo y superficie.
