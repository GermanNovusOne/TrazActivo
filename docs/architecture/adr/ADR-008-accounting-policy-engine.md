# ADR-008: Accounting Policy Engine

- Estado: Accepted
- Fecha de baseline: 2026-08-17

## Decisión

Mantener reglas contables versionadas y reproducibles en Domain/Policy Engine,
fuera de frontend, controllers y adaptadores de infraestructura.

## Consecuencias

- El frontend presenta explicaciones y resultados del backend; no replica
  fórmulas.
- Una política publicada no se edita; se crea una nueva versión.
- Cada cálculo conserva snapshot/version y fuente de regla.
- El motor se prueba sin UI ni infraestructura contra golden dataset aprobado.

## Gate

No se implementa posting de depreciación hasta cerrar `TBD-ACC-002`,
`TBD-ACC-003` y la matriz normativa del perfil piloto.

Fuente: PDD ADR-008, secciones 23, 25, 41 y 46.2.
