# Platform Management

- Plane: Control Plane
- Epic P0: EPIC-SAAS-01, EPIC-PLAT-01

## Responsabilidad y propiedad

Owns `Tenant`, `TenantCatalogEntry`, `DeploymentStamp`, lifecycle,
provisionamiento y entitlement comercial de planes/features. Delega el detalle
de configuración a Tenant Configuration. No posee activos, evidencia,
depreciaciones ni asientos de clientes.

## Invariantes

- Tenant Catalog contiene sólo metadata de resolución y nunca secretos o datos
  contables.
- Cada transición de lifecycle exige permiso, motivo, evento y PlatformAudit.
- Provisionamiento es idempotente, reintentable y no activa estado parcial.
- Intervención sobre Data Plane sólo mediante operación excepcional JIT auditada.

## Contratos

API base: `POST /control/v1/tenants`, `POST /{id}/provision`,
`POST /{id}/suspend`. Publica `TenantProvisioningRequested`, `TenantActivated`
y `TenantSuspended`.

## Pruebas y bloqueos

Casos P0: SAAS-001..003, MT-008, MT-010, MT-015. `TBD-TEN-002` bloquea el
diseño final del catálogo; hosting/IaC bloquean provisionamiento productivo.

## DoD local

Workflow y errores versionados; idempotencia demostrada; recursos y auditoría
por tenant; fallo recuperable conocido; ninguna escritura directa en Data Plane.

Fuente: PDD 04.4, 04.8, 06, 35.3 y SAAS-001..003.
