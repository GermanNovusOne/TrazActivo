# Audit

- Plane: stores y contratos separados para Control/Data Plane
- Epic P0: EPIC-AUD-01

## Responsabilidad y propiedad

Owns `TenantAuditEvent` y `PlatformAuditEvent` inmutables. No modifica las
entidades fuente ni se usa como sustituto del evento de dominio.

## Invariantes

- Evento incluye actor, acción, scope, target, timestamp, correlación, resultado
  y razón/evidencia aplicable.
- PlatformAudit identifica siempre el tenant objetivo de una intervención.
- Auditoría es append-only y el acceso a ella está autorizado/auditado.
- No registra secretos, OTP ni payloads sensibles innecesarios.

## Contratos

Cada endpoint crítico declara el evento de auditoría. Consume metadata de
operación, no conexiones ni entidades mutables de otros módulos.

## Pruebas y bloqueos

AUD-001, MT-015, descarga de evidencia, cambios de seguridad y eventos de
posting/reversión cuando estén habilitados.

## DoD local

Integridad, retención, consulta con scope, correlación y separación tenant/
platform verificadas.

Fuente: PDD 32, 35 y AUD-001.
