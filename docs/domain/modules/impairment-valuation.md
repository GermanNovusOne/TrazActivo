# Impairment & Valuation

- Plane: Data Plane
- Epic P1: EPIC-IMP-01

## Responsabilidad y propiedad

Owns evaluaciones de deterioro, mediciones, estimaciones y revaluaciones. No
posee inventario físico ni confunde revaluación con erogación posterior.

## Invariantes

- Indicador, medición, aprobación y reconocimiento son pasos separados.
- Reversión conserva el evento original y aplica límites de la política.
- Resultado técnico no produce posting sin decisión contable aprobada.

## Contratos

API base: impairment assessments create/approve. Publica
`ImpairmentRecognized` y contratos de cambio de estimación al Policy Engine.

## Pruebas y bloqueos

IMP-001, GD-IMP-001..003 y casos de segregación/step-up. Perfil normativo y
alcance IFRS deben cerrarse antes del comportamiento final.

## DoD local

Workflow, evidencia, permisos, medición explicable, reversión y asientos
derivados con política versionada.

Fuente: PDD 26, 27.3 e IMP-001.
