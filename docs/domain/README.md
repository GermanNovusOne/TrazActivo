# Modelo de dominio modular

Cada archivo de `modules/` define propiedad de datos, invariantes, contratos,
eventos, pruebas y bloqueos de un bounded context. Las fronteras son lógicas y
deben conservarse dentro del monolito modular.

## Convenciones

- `Owns` significa única autoridad de escritura sobre esos datos.
- Una referencia a otro módulo usa identificadores/contratos, no acceso directo
  a sus tablas.
- Todo comando Data Plane opera bajo `TenantContext` validado.
- Todo evento de tenant incluye `TenantId`; los eventos puramente de plataforma
  se registran en scope de plataforma.
- Las máquinas de estado y los eventos aprobados no se reducen a CRUD.
- El Definition of Done común del PDD aplica además del DoD local.

## Módulos

| Módulo | Plane | Prioridad inicial | Archivo |
|---|---|---:|---|
| Platform Management | Control | P0 | `platform-management.md` |
| Identity & Access | Ambos, scopes separados | P0 | `identity-access.md` |
| Tenant Configuration | Control; consumo en Data | P0 | `tenant-configuration.md` |
| Asset Registry | Data | P0 | `asset-registry.md` |
| Organization & Location | Data | P0 | `organization-location.md` |
| Acquisition | Data | P0 | `acquisition.md` |
| Custody & Movement | Data | P0/P1 | `custody-movement.md` |
| Inventory | Data | P0 | `inventory.md` |
| Accounting | Data | P0 | `accounting.md` |
| Policy Engine | Data/backend | P0, con gates | `policy-engine.md` |
| Impairment & Valuation | Data | P1 | `impairment-valuation.md` |
| Maintenance | Data | P1 | `maintenance.md` |
| Documents & Evidence | Data | P0 | `documents-evidence.md` |
| Workflow | Data | P0 transversal | `workflow.md` |
| Audit | Ambos, stores separados | P0 | `audit.md` |
| Integration | Data/adaptadores | P1 | `integration.md` |
| Reporting & Search | Data/lectura | P0/P1 | `reporting-search.md` |

Fuente: PDD secciones 12 a 14, backlog 47 y Apéndice E.
