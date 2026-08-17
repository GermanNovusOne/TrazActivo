# Custody & Movement

- Plane: Data Plane
- Epic relacionado: gestión patrimonial P0; movimientos ampliados P1

## Responsabilidad y propiedad

Owns asignaciones de custodio, traslados, préstamos, comodatos, devoluciones y
reversiones operativas. No posee políticas contables.

## Invariantes

- Custodia, ubicación física, unidad organizacional y centro de costo son
  dimensiones separadas.
- Traslado conserva origen, destino, tránsito, recepción y evidencia.
- Un movimiento aprobado se revierte; no se borra.
- Movimiento físico no genera asiento salvo regla contable explícita backend.

## Contratos

API base: transfers create/approve, loans create/returns. Publica
`CustodianAssigned`, `AssetTransferred`, `LoanIssued` y `LoanReturned`.

## Pruebas y bloqueos

Casos: MOV-001, recepción parcial/rechazada, autorización, concurrencia,
idempotencia y aislamiento de scope.

## DoD local

Historia íntegra, evidencia, workflow y segregación definidos; proyecciones de
Asset Registry se actualizan sólo por eventos aprobados.

Fuente: PDD 19, 21 y MOV-001.
