# ADR-011: Background Jobs

- Estado: Accepted conceptualmente
- Dependencia: TBD-AZR-001
- Fecha de baseline: 2026-08-17

## Decisión

Usar mensajes versionados con contexto de tenant y workers idempotentes. La
selección del servicio Azure queda pendiente.

## Consecuencias

- Cada job incluye tenant, correlación, operación, actor solicitante, recurso,
  versión de schema e intento.
- El worker revalida tenant, stamp, schema y permiso antes de abrir recursos.
- No existe una transacción de negocio sobre varios tenants.
- Se requieren retries, DLQ, poison handling y replay administrativo auditado.

Fuente: PDD ADR-011 y sección 36.
