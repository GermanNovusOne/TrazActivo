# Documentación de ingeniería

Estos documentos convierten la baseline del PDD en artefactos utilizables por
desarrollo sin reemplazarla como fuente de verdad.

## Mapa

- `governance/`: estado de Sprint 0, TBD y gates.
- `architecture/`: contexto, límites, aislamiento y ADR.
- `domain/`: bounded contexts y contratos entre módulos.
- `api/`: convenciones comunes y catálogo base.
- `security/`: threat model y controles de seguridad.
- `testing/`: estrategia, cobertura y criterios bloqueantes.
- `accounting/`: gobernanza normativa y golden dataset, sin reglas inventadas.

## Regla de trazabilidad

Todo artefacto derivado debe indicar las secciones o requisitos canónicos del
PDD que lo sustentan. Una divergencia se resuelve actualizando primero la
baseline aprobada o registrando una decisión formal; no se resuelve desde el
código.

La cobertura uno-a-uno se mantiene en
`governance/requirements-traceability.md`.
