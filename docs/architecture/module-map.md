# Mapa de módulos

## Control Plane

- Platform Management
- Tenant Configuration (administración de configuración, branding y features)
- Platform Audit

## Data Plane

- Identity & Access
- Tenant Configuration contracts/read model
- Organization & Location
- Asset Registry
- Acquisition
- Custody & Movement
- Inventory
- Accounting
- Policy Engine
- Impairment & Valuation
- Maintenance
- Documents & Evidence
- Workflow
- Tenant Audit
- Integration
- Reporting & Search

## Capacidades transversales

- Tenant resolution y `TenantContext`
- API contract y Problem Details
- Jobs y messaging
- Observabilidad
- Migraciones por tenant

## Reglas de dependencia

1. Los módulos se comunican mediante contratos de aplicación o eventos; no
   escriben directamente las tablas propiedad de otro módulo.
2. El dominio no depende del frontend, infraestructura Azure ni adaptadores de
   integración.
3. Policy Engine pertenece al backend y no persiste estado de UI.
4. Asset Registry no contiene posting, depreciación ni asientos.
5. Inventory produce observaciones append-only; no modifica saldos ni ubicación
   sin reconciliación aprobada.
6. Reporting & Search consume proyecciones; no escribe el dominio.
7. Control Plane no referencia servicios de aplicación que mutan contabilidad
   o patrimonio del tenant.
8. Toda entrada Data Plane exige un `TenantContext` válido.
9. La configuración se administra desde Control Plane y se consume en Data
   Plane como snapshot tenant-scoped; no existen dos autoridades de escritura.

Los contratos detallados por bounded context se mantienen en `docs/domain/`.

Fuente: PDD secciones 03 y 12.1.
