# Identity & Access

- Plane: Control y Data Plane con roles separados
- Epic P0: EPIC-SEC-01

## Responsabilidad y propiedad

Owns `User`, `TenantMembership`, roles, permisos, assignments, `MfaMethod`,
recovery codes y sesiones. No posee reglas contables ni aprobaciones de negocio.

## Invariantes

- Membership activa y tenant activo son precondiciones de Data Plane.
- Roles de plataforma y tenant nunca se mezclan.
- TOTP rechaza replay, usa rate limiting, cifra el secreto y hashea recovery
  codes; cambios de factor revocan sesiones y se auditan.
- Autenticación, autorización y aprobación son controles distintos.

## Contratos

Construye identidad autenticada para Tenant Resolver. Participa en
`GET /api/v1/context` y `POST /api/v1/context/switch`; el servidor publica
`TenantContextChanged` tras reconstrucción válida.

## Pruebas y bloqueos

Casos P0: SEC-001..004, MT-003, MT-008, MT-009 y pruebas MFA/replay. Política
MFA, passkeys y timeout de step-up siguen en `TBD-SEC-001..003`.

## DoD local

Sesiones revocables, permisos/scopes auditables, no secrets en logs, cambio de
tenant sin estado residual y step-up implementado sólo después de su decisión.

Fuente: PDD 08, 09, 13.2 y SEC-001..004.
