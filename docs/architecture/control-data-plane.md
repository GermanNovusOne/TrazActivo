# Frontera Control Plane / Data Plane

| Control Plane | Data Plane |
|---|---|
| Lifecycle de tenants | Gestión patrimonial |
| Planes, suscripciones y features | Inventario y movimientos |
| Asignación y migración de stamp | Contabilidad y Policy Engine |
| Provisionamiento DB/storage | Mantenimiento y evidencia |
| Identidad y administrador inicial | Aprobaciones y reportes |
| Branding y dominios | TenantAudit |
| Health, consumo y PlatformAudit | Operaciones limitadas al tenant resuelto |

## Prohibiciones

- No existen endpoints cross-tenant en Data Plane.
- Un rol `Platform Admin` no concede permisos contables de tenant.
- Control Plane no modifica directamente activos, depreciaciones ni asientos.
- Una intervención excepcional requiere operación administrativa nominativa,
  justificación, privilegio temporal y `PlatformAuditEvent` con tenant objetivo.
- Las credenciales de plataforma y tenant no se comparten.

## Provisionamiento

El workflow reserva código, asigna stamp, provisiona DB y storage, aplica
schema, crea configuración, identidad, branding, administrador y features,
valida y sólo entonces activa. Debe ser idempotente, reintentable y auditable;
un fallo termina en `ProvisioningFailed`.

Fuente: PDD secciones 06, 08.5, 09.4 y SAAS-003.
