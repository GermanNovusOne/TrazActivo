# Contratos base

Este directorio contiene contratos neutrales al runtime. Son versionables y
deben convertirse en contract tests en cuanto se seleccione el stack.

## Schemas iniciales

- `schemas/tenant-context.schema.json`: contexto Data Plane validado por servidor.
- `schemas/job-envelope.schema.json`: mensaje/job con contexto explícito.
- `schemas/problem-details.schema.json`: error API estable y correlacionable.

Los identificadores son strings opacos porque el PDD permite UUID/ULID y no
define aún representación serializada única. Cambiar estos schemas exige
versionar el contrato y revisar compatibilidad.
