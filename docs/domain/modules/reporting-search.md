# Reporting & Search

- Plane: Data Plane, lectura
- Prioridad: P0 para consultas base; reporting avanzado P1

## Responsabilidad y propiedad

Owns proyecciones de lectura, consultas, reportes, búsqueda y preparación de
exports. No escribe directamente agregados de dominio.

## Invariantes

- Búsqueda MVP usa consulta SQL tenant-scoped.
- Resultados, conteos, sugerencias y timing no filtran existencia de otro tenant.
- Export job y manifest quedan ligados al `TenantContext` solicitante.
- Datos restringidos requieren autorización y step-up según política aprobada.

## Contratos

API base: `GET /api/v1/search`, `POST /api/v1/exports` y lecturas de Centro de
Control/reportes. Usa proyecciones alimentadas por eventos.

## Pruebas y bloqueos

MT-011..013, filtros allowlist, paginación, permisos y export concurrente.
Volúmenes/performance dependen de `TBD-NFR-003`.

## DoD local

Proyecciones reconciliables, no escritura de dominio, aislamiento de cache e
índice, manifest/checksum y observabilidad por tenant.

Fuente: PDD 33, 35.3 y MT-011..013.
