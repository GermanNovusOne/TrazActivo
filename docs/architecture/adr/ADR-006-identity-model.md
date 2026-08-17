# ADR-006: Identity Model

- Estado: Accepted
- Fecha de baseline: 2026-08-17

## Decisión

Mantener un `User` global relacionado con `TenantMembership` y asignaciones de
rol/permiso con scope y vigencia. El correo no es clave de negocio inmutable.

## Consecuencias

- Un usuario puede pertenecer a varios tenants sin compartir autorización.
- La selección de tenant sólo muestra memberships válidas.
- Roles de plataforma y tenant no se mezclan.
- Suspensión, revocación y expiración se aplican por membership y sesión.

Fuente: PDD ADR-006, secciones 08 y 13.2.
