# Asset Registry

- Plane: Data Plane
- Epic P0: EPIC-AST-01

## Responsabilidad y propiedad

Owns `AssetItem`, identificadores, fotos referenciadas, condición, estado
operativo y proyecciones actuales de ubicación/custodio. No contiene posting,
depreciación ni asientos.

## Invariantes

- `AssetItem` físico y `AccountingAsset` contable son conceptos distintos.
- IDs técnicos son UUID/ULID inmutables; RUT, email e inventario no son PK.
- Estados siguen máquina de estado; hechos aprobados se revierten.
- `OutOfService` por sí solo no cambia la depreciación.

## Contratos

API base: listado, creación, detalle, patch con ETag y generación de labels.
Publica `AssetItemCreated`, `AssetItemReceived`, `AssetAvailableForUse` según la
transición propietaria o contrato del proceso de adquisición.

## Pruebas y bloqueos

Casos P0: AST-001/002, concurrencia 409, IDOR MT-001/002, ficha 360 e historia.

## DoD local

Máquina de estado aprobada, timeline reproducible, optimistic concurrency,
autorización por entity/scope y cero campos contables calculados en UI.

Fuente: PDD 12.2/12.3, 13.4, 14.1, 17 y AST-001/002.
