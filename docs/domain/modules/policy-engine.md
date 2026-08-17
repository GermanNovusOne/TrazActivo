# Policy Engine

- Plane: Data Plane, backend/domain
- Epic P0: EPIC-DEP-01, sujeto a gates contables

## Responsabilidad y propiedad

Owns policy sets/rules versionados, resolución de vigencia, elegibilidad,
estimaciones y cálculo reproducible. No persiste UI ni obtiene reglas desde el
frontend.

## Invariantes

- Política publicada es inmutable; una modificación crea nueva versión.
- Cada resultado conserva policy snapshot, inputs, explicación y checksum.
- Cálculos monetarios usan decimal, nunca float/double para montos posted.
- Redondeo y residual pertenecen al libro/política aprobada.
- El motor se prueba sin UI ni infraestructura.

## Contratos

Publica `PolicyPublished`, `DepreciationRunSimulated`, `EstimateChanged` y, sólo
tras gates e implementación autorizada, resultados para posting/reversal.

## Gate obligatorio

No iniciar posting de depreciación hasta cerrar `TBD-ACC-002`, `TBD-ACC-003` y
la matriz normativa del perfil piloto. El golden dataset debe estar aprobado y
versionado antes de publicar el motor.

## Pruebas y bloqueos

Golden dataset GD-DEP-001..018 y NFR-DATA-001 son bloqueantes. Alcance IFRS,
perfil CGR, monedas y cuentas mantienen TBD explícitos.

## DoD local

Fuente normativa aprobada, schema de reglas, determinismo, idempotencia,
concurrencia, explicación y regresión exacta contra golden dataset.

Fuente: PDD 23, 25, 42, 46.2 y POL/DEP-001..007.
