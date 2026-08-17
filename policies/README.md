# Policy definitions y golden dataset

Directorio reservado para schemas de reglas, definiciones publicables y casos
golden aprobados. Sprint 0 no incorpora reglas contables ejecutables porque la
matriz normativa y aprobaciones P0 continúan abiertas.

Reglas de gobernanza:

- Política publicada inmutable y versionada.
- Fuente formal, vigencia y aprobador obligatorios.
- Snapshot de política en cada cálculo.
- Cálculo determinista con decimal y explicación.
- Ninguna fórmula duplicada en frontend/controllers.
- Golden dataset aprobado y bloqueante de pipeline.

Véase `docs/accounting/` y ADR-008.
