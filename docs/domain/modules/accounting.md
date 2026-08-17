# Accounting

- Plane: Data Plane
- Epic P0: EPIC-ACC-01

## Responsabilidad y propiedad

Owns `AccountingBook`, períodos, `AccountingAsset`, capitalización,
`JournalBatch`, líneas y conciliación. No posee autenticación ni define fórmulas
fuera del Policy Engine.

## Invariantes

- Un LegalEntity mantiene uno o más libros separados por marco/moneda/política.
- Posted no se edita; corrección usa reversión y nueva operación.
- JournalBatch siempre cuadra y es trazable al evento fuente.
- Posting y reapertura usan concurrencia/lock y controles de aprobación.
- Dinero usa decimal; fecha efectiva se separa de timestamp UTC.

## Contratos

API base: books read, capitalization y operaciones de períodos/runs definidas
en catálogo. Publica `AccountingAssetRecognized`, `PeriodClosed` y
`PeriodReopened`; consume resultados explicables/versionados del Policy Engine.

## Pruebas y bloqueos

Casos P0: ACC-001/002, REC-001, balance, período cerrado, duplicados,
concurrencia y segregación. `TBD-ACC-001/005/006` y cierre del modelo de posting
condicionan el diseño final.

## DoD local

Estados, locks, scopes, asientos/reversiones, auditoría y contract tests
aprobados; sin regla contable duplicada en controller o frontend.

Fuente: PDD 22, 24, 39.2/39.3, ACC-001/002 y REC-001.
