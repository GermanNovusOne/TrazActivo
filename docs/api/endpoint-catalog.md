# Catálogo API

Este índice conserva el catálogo PDD y marca la superficie implementada en
Sprint 1. Una ruta listada para etapas posteriores no equivale a implementación.

## Control Plane P0

| Método | Ruta | Permiso | Auditoría | Sprint 1 |
|---|---|---|---|---|
| POST | `/control/v1/tenants` | `platform.tenants.create` | PlatformAudit | Implementado |
| GET | `/control/v1/tenants/{id}` | `platform.tenants.read` | Lectura | Implementado como lectura/Location/ETag |
| POST | `/control/v1/tenants/{id}/provision` | `platform.tenants.provision` | PlatformAudit | Implementado sólo como intención -> Provisioning |
| POST | `/control/v1/tenants/{id}/suspend` | `platform.tenants.suspend` | PlatformAudit | Implementado; transición válida exige Active |

La API no acepta referencias de DB/storage ni selección de stamp desde el
cliente. El selector server-side de Sprint 1 no tiene configuración productiva.
Por tanto, el endpoint de provisionamiento no crea recursos, no simula éxito y
no activa el tenant.

El documento OpenAPI describe autorización requerida, `Idempotency-Key`,
`If-Match`, `ETag`, respuestas 400/401/403/404/409/415/428/503 aplicables y
contenido `application/problem+json`. El esquema de autorización es sólo un
contrato; SEC-001 e identity productiva permanecen no implementados.

## Frontend público Sprint 1.5

| Método | Ruta | Estado |
|---|---|---|
| GET | `/` | Landing pública |
| GET | `/login` | Experiencia visual; Identity no implementada |
| GET | `/preview` | AppShell DEV sin datos ni módulos funcionales |

Las rutas son literales. No existe fallback SPA para rutas desconocidas bajo
`/control`, `/api`, `/health` u `/openapi`.

## Operación
| Método | Ruta | Autorización | Sprint 1 |
|---|---|---|---|
| GET | `/health/live` | Anónimo | Implementado |
| GET | `/health/ready` | Anónimo | Implementado |
| GET | `/openapi/v1.json` | Anónimo | Implementado |

## Contexto y patrimonio P0

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/api/v1/context` | authenticated |
| POST | `/api/v1/context/switch` | `tenant.switch` |
| GET/POST | `/api/v1/assets` | `assets.read/create` |
| GET/PATCH | `/api/v1/assets/{id}` | `assets.read/update` |
| POST | `/api/v1/assets/{id}/labels` | `assets.label.generate` |
| POST | `/api/v1/acquisitions` | `acquisitions.create` |
| POST | `/api/v1/acquisitions/{id}/receipts` | `acquisitions.receive` |
| POST | `/api/v1/accounting-assets/{id}/capitalize` | `accounting.capitalize` |

## Inventario y movimientos

| Método | Ruta | Permiso |
|---|---|---|
| POST | `/api/v1/inventory-campaigns` | `inventory.create` |
| POST | `/api/v1/inventory-campaigns/{id}/activate` | `inventory.activate` |
| POST | `/api/v1/inventory-campaigns/{id}/observations` | `inventory.observe` |
| POST | `/api/v1/reconciliations/{id}/decisions` | `inventory.reconcile` |
| POST | `/api/v1/transfers` | `movements.transfer.create` |
| POST | `/api/v1/transfers/{id}/approve` | `movements.transfer.approve` |
| POST | `/api/v1/loans` | `movements.loan.create` |
| POST | `/api/v1/loans/{id}/returns` | `movements.loan.return` |

## Contabilidad y políticas

| Método | Ruta | Estado Sprint 0 |
|---|---|---|
| GET | `/api/v1/accounting-books` | Contrato base permitido |
| POST | `/api/v1/policies` | Diseño; publicación exige política aprobada |
| POST | `/api/v1/policies/{id}/publish` | Bloqueado por fuentes/TBD aplicables |
| POST | `/api/v1/depreciation-runs/simulate` | Diseño/golden; no posting |
| POST | `/api/v1/depreciation-runs` | Diseño/golden; no posting |
| POST | `/api/v1/depreciation-runs/{id}/submit` | No implementar en Sprint 0 |
| POST | `/api/v1/depreciation-runs/{id}/approve` | No implementar en Sprint 0 |
| POST | `/api/v1/depreciation-runs/{id}/post` | Gate G3 obligatorio |
| POST | `/api/v1/depreciation-runs/{id}/reverse` | Depende de posting aprobado |

El resto del catálogo (bajas, deterioro, documentos, imports, búsqueda y
exports) permanece definido en PDD 35.3 y se detalla en el sprint de su módulo.

Fuente: PDD sección 35.3.
