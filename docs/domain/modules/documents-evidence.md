# Documents & Evidence

- Plane: Data Plane
- Epic P0: EPIC-DOC-01

## Responsabilidad y propiedad

Owns metadata, versiones, checksum, clasificación, lifecycle, retención y
referencia de storage. No posee lógica contable.

## Invariantes

- Container segregado por tenant y autorización server-side antes de URL.
- Nombres no predecibles, tipo real validado y malware scan con cuarentena.
- Evidencia de período cerrado queda bloqueada.
- Borrado lógico no implica purga física.

## Contratos

API base: upload y download. Publica `DocumentVersionAdded`; expone referencias
versionadas a otros módulos sin entregar referencias de storage no autorizadas.

## Pruebas y bloqueos

DOC-001, MT-006, malware/type/checksum/versioning. Retención/purga depende de
`TBD-PRIV-001`; tamaños/tipos dependen de `TBD-DOC-001`.

## DoD local

Lifecycle completo, audit de descarga, URLs temporales tenant-scoped, hold y
purga gobernada, sin payload documental en logs.

Fuente: PDD 30 y DOC-001.
