# ADR-010: Document Storage

- Estado: Accepted
- Fecha de baseline: 2026-08-17

## Decisión

Segregar storage por tenant y mantener metadata, clasificación, checksum,
versiones y lifecycle en el dominio.

## Consecuencias

- El servidor autoriza antes de emitir una URL temporal.
- Nombres no son predecibles y las URLs no se reutilizan entre tenants.
- Malware scan, validación de tipo, cuarentena, retención y hold forman parte
  del lifecycle.
- La eliminación es lógica; la purga física depende de `TBD-PRIV-001`.

Fuente: PDD ADR-010, secciones 30 y DOC-001.
