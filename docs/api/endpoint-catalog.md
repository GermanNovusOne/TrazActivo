# Catálogo API base

Este índice conserva el catálogo PDD. Los payloads detallados se versionarán
por módulo antes de implementación.

## Control Plane P0

| Método | Ruta | Permiso | Auditoría |
|---|---|---|---|
| POST | `/control/v1/tenants` | `platform.tenants.create` | PlatformAudit |
| POST | `/control/v1/tenants/{id}/provision` | `platform.tenants.provision` | PlatformAudit |
| POST | `/control/v1/tenants/{id}/suspend` | `platform.tenants.suspend` | PlatformAudit |

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
