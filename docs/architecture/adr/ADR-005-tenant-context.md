# ADR-005: TenantContext Server-Side

- Estado: Accepted
- Fecha de baseline: 2026-08-17

## Decisión

Crear y validar `TenantContext` en el servidor después de autenticación y
validación de membership. Reconstruirlo por completo al cambiar tenant.

## Consecuencias

- Middleware/filtros de entrada establecen el contexto una sola vez.
- Servicios, jobs, mensajes, auditoría e integraciones reciben contexto
  explícito o una representación mínima validable.
- El contexto no contiene secretos ni cadenas de conexión.
- Tenant suspendido o membership expirada invalidan el contexto.
- `TenantId` del cliente nunca selecciona recursos.

Fuente: PDD ADR-005, secciones 04.5 a 04.7 y TEN-001/002.
