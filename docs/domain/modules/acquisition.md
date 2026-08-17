# Acquisition

- Plane: Data Plane
- Epic P0: EPIC-ACQ-01

## Responsabilidad y propiedad

Owns adquisición, orden referenciada, recepción, aceptación, factura referenciada
y distribución de costos. No posee períodos contables ni decide posting.

## Invariantes

- Orden, recepción, aceptación, factura, creación física y capitalización son
  hechos separados.
- Recepción puede ser parcial.
- Distribución de costos cuadra con su fuente.
- Compra o recepción no inicia depreciación.

## Contratos

API base: `POST /api/v1/acquisitions` y
`POST /api/v1/acquisitions/{id}/receipts`. Entrega hechos aprobados a Asset
Registry y una solicitud evaluable a Accounting/Policy Engine.

## Pruebas y bloqueos

Casos P0: ACQ-001, cantidades parciales, asignación que no cuadra, fechas y
separación reconocimiento/capitalización.

## DoD local

Payload fuente conservado, evidencia vinculada, idempotencia y transiciones
auditadas, sin crear automáticamente un activo contable posted.

Fuente: PDD 18, 24 y ACQ-001.
