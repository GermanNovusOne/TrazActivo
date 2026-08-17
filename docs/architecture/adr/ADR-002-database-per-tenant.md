# ADR-002: Database Per Tenant

- Estado: Accepted, sujeto a validación de costo
- Fecha de baseline: 2026-08-17

## Contexto

El producto requiere aislamiento, restore y portabilidad por cliente.

## Decisión

Usar una base de datos por tenant en la baseline. El Tenant Catalog conserva una
referencia resoluble por servidor; no expone cadenas de conexión al cliente.

## Consecuencias

- Provisionamiento y migraciones deben ser automatizados, reintentables y
  observables por tenant.
- Debe conocerse `SchemaVersion` de cada base.
- Restore y exportación pueden operar sobre un tenant aislado.
- Elastic Pools pueden evaluarse sin cambiar la frontera database-per-tenant.

## Riesgo abierto

Costo y operación de muchas bases; sizing depende de `TBD-NFR-003`.

Fuente: PDD ADR-002, secciones 04.3, 05.3 y 44.4.
