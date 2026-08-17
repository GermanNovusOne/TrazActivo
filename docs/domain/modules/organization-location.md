# Organization & Location

- Plane: Data Plane
- Epic P0: EPIC-ORG-01

## Responsabilidad y propiedad

Owns `LegalEntity`, `BusinessContext`, `Establishment`, `Location`,
`OrganizationalUnit`, `CostCenter` y referencias de persona. No posee
depreciación ni confunde organigrama, ubicación física y dimensión contable.

## Invariantes

- Tenant, LegalEntity, BusinessContext y AccountingBook no son equivalentes.
- Jerarquías de ubicación y organización no tienen ciclos.
- CostCenter tiene vigencia; PersonReference minimiza y restringe PII.
- Ubicación y custodia conservan historia, no se sobrescriben.

## Contratos

Proporciona scopes válidos a Asset Registry, Inventory, Accounting y Workflow.
Los módulos consumidores guardan referencias, no modifican sus catálogos.

## Pruebas y bloqueos

Casos P0: LOC-001, jerarquía sin ciclos, vigencia, scope cross-entity y
autorización bajo `TenantContext`.

## DoD local

Cardinalidades validadas, historia temporal consultable, PII clasificada y
eventos/auditoría de cambios sensibles definidos.

Fuente: PDD 04.1, 07, 13.3, 19 y LOC-001.
