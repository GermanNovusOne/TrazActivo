# Integration

- Plane: Data Plane mediante adaptadores tenant-scoped
- Epic P1: EPIC-INT-01

## Responsabilidad y propiedad

Owns configuración, referencias a credenciales, mappings, ejecuciones y estado
de adaptadores. No posee reglas internas del ERP ni reglas contables del núcleo.

## Invariantes

- Credencial de A nunca se usa en ejecución B.
- Credenciales reales permanecen en Key Vault/referencia segura.
- Operaciones financieras son idempotentes y timeout puede quedar en estado
  desconocido consultable, no repetirse ciegamente.
- Egress aplica allowlist y cada ejecución se audita.

## Contratos

Publica `IntegrationExecutionCompleted`; usa contratos versionados y conserva
request metadata, response hash y external ID.

## Pruebas y bloqueos

INT-001, MT isolation, contract tests y timeout/duplicate. Primer ERP depende de
`TBD-ERP-001`; Mercado Público de `TBD-MKT-001`.

## DoD local

Sandbox/contract tests, idempotencia, reconciliación, rotación de credenciales y
observabilidad tenant-scoped.

Fuente: PDD 34, INT-001 y NFR-INT-001.
