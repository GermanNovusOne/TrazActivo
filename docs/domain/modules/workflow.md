# Workflow

- Plane: Data Plane
- Prioridad: P0 transversal

## Responsabilidad y propiedad

Owns solicitudes, revisiones, aprobaciones, rechazos, segregación de funciones
y referencias de evidencia. No calcula montos contables.

## Invariantes

- Permiso técnico no equivale a aprobación de negocio.
- Solicitante/aprobador respetan la segregación definida por operación.
- Step-up es un control adicional, no reemplaza permiso ni aprobación.
- Decisiones conservan actor, fecha, razón, evidencia y correlación.

## Contratos

Orquesta transiciones declaradas por el módulo propietario y publica
`ApprovalGranted`. No modifica directamente agregados de otros módulos.

## Pruebas y bloqueos

SEC-003/004, doble aprobación cuando corresponda, rechazo, expiración,
concurrencia y auditoría. Timeout de step-up depende de `TBD-SEC-003`.

## DoD local

Matriz de permisos/scopes aprobada, SoD comprobada, estados idempotentes y
eventos/auditoría trazables a la operación de negocio.

Fuente: PDD 08.5/08.6, 31 y SEC-003/004.
