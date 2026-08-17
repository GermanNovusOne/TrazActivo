# Inventory

- Plane: Data Plane
- Epic P0: EPIC-INV-01

## Responsabilidad y propiedad

Owns campañas, scope, equipos, locks, observaciones append-only y decisiones de
reconciliación. No modifica directamente saldos, ubicación ni custodia.

## Invariantes

- Campañas concurrentes se permiten sólo sin superposición de scope.
- El universo se congela/snapshotea al activar.
- Un scan registra observación; una decisión posterior produce efectos.
- Sync offline, cuando sea habilitado, es idempotente y detecta conflictos.

## Contratos

API base: campañas create/activate, observations y reconciliation decisions.
Publica `InventoryObservationRecorded` y `ReconciliationApproved`.

## Pruebas y bloqueos

Casos P0: INV-001..003, `INV-SCOPE-OVERLAP`, observación duplicada, QR de otro
tenant y MT-002/011/012. Offline depende de `TBD-INV-001`.

## DoD local

Algoritmo de overlap probado, observaciones inmutables, idempotency keys,
conflictos visibles y cero mutación directa por scan.

Fuente: PDD 20, INV-001..003 y GD-INV-001..003.
