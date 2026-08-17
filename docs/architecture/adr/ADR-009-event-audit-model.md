# ADR-009: Event and Audit Model

- Estado: Accepted
- Fecha de baseline: 2026-08-17

## Decisión

Registrar hechos críticos como eventos append-only y mantener auditoría separada
de los eventos de dominio. Operaciones aprobadas o posted se revierten mediante
un evento compensatorio; no se borran ni reescriben.

## Consecuencias

- Las proyecciones pueden reconstruir historia y estado vigente.
- Auditoría registra actor, tenant objetivo, correlación, razón y resultado sin
  capturar secretos ni payloads sensibles innecesarios.
- `TenantAuditEvent` y `PlatformAuditEvent` tienen scopes distintos.

Fuente: PDD ADR-009, secciones 03, 14 y 32.
