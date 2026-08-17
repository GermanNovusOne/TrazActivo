# Contrato común de APIs

## Superficies

- Control Plane: `/control/v1`; únicos endpoints que pueden operar sobre más de
  un tenant, siempre con permiso de plataforma y PlatformAudit.
- Data Plane: `/api/v1`; toda operación queda limitada al `TenantContext`
  construido por servidor.

## Reglas obligatorias

- REST versionada.
- `Idempotency-Key` en creación y comandos de alto impacto.
- `ETag` o versión para optimistic concurrency.
- Problem Details extendido con código estable y `CorrelationId`.
- Paginación consistente y filtros allowlist.
- Permiso, scope, auditoría y step-up declarados por endpoint.
- El frontend no selecciona recursos mediante `TenantId`.
- Un recurso de otro tenant responde 404/403 sin revelar datos o existencia.

## Operación crítica

Antes de implementar un endpoint crítico se documentan: método/ruta, tenant y
entity/book scope, permiso, input/output schema, validación, errores de negocio,
auditoría, idempotencia, token de concurrencia, transición y step-up.

## Códigos base

El catálogo inicial es el Apéndice C del PDD. Los códigos no incluyen stack
traces y son más estables que el texto de usuario. El contrato serializado se
encuentra en `contracts/schemas/problem-details.schema.json`.

Fuente: PDD sección 35 y API-001.
