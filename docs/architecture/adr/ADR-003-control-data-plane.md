# ADR-003: Control Plane / Data Plane

- Estado: Accepted
- Fecha de baseline: 2026-08-17

## Decisión

Separar TrazActivo Control de la aplicación cliente mediante responsabilidades,
APIs, permisos, identidades y auditorías distintas.

## Consecuencias

- Los endpoints cross-tenant sólo existen en Control Plane.
- Control Plane registra `PlatformAuditEvent`; Data Plane registra
  `TenantAuditEvent`.
- Un operador SaaS no obtiene acceso funcional al tenant por defecto.
- Intervenciones excepcionales son nominativas, temporales y auditadas.

Fuente: PDD ADR-003, secciones 06, 09.4, 32 y 35.
