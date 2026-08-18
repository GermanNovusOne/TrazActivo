# Especificaciones de pruebas

`specifications/` conserva el comportamiento P0 independiente del framework.
Sprint 1 añade cuatro proyectos xUnit sobre .NET 10:

- `TrazActivo.UnitTests`: matriz de lifecycle, snapshots, separación Tenant/Catalog
  y contratos de tenancy inmutables.
- `TrazActivo.IntegrationTests`: API, OpenAPI, Problem Details, seguridad,
  atomicidad, idempotencia y concurrencia coordinada.
- `TrazActivo.ArchitectureTests`: solución y ProjectReference reales, allowlist de
  capas, assemblies compilados y ausencia de Data Plane.
- `TrazActivo.MultiTenancyTests`: MT-002 parcial al alcance Sprint 1, MT-008
  parcial y MT-015.

Los demás escenarios MT se registran como `NotApplicableToSprint1`; no se
consideran aprobados ni ejecutados. El objetivo de cobertura continúa sujeto a
`NFR-MAINT-001` y no se completa silenciosamente.

Sprint 1.5 añade tests frontend junto a sus componentes para landing, login,
preview, health, timeout, teclado, axe y contraste. IntegrationTests verifica
las tres rutas HTML y bloquea fallback SPA en prefijos backend reservados.
