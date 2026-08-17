# Scaffolding del monolito modular

No se crea código de aplicación hasta seleccionar y registrar el stack. La
estructura lógica obligatoria será:

```text
ControlPlane/
  PlatformManagement/
  TenantConfiguration/
  PlatformAudit/
DataPlane/
  IdentityAccess/
  OrganizationLocation/
  AssetRegistry/
  Acquisition/
  CustodyMovement/
  Inventory/
  Accounting/
  PolicyEngine/
  ImpairmentValuation/
  Maintenance/
  DocumentsEvidence/
  Workflow/
  TenantAudit/
  Integration/
  ReportingSearch/
BuildingBlocks/
  TenantContext/
  TenantConfigurationContracts/
  ApiContracts/
  Messaging/
  Observability/
```

Es una separación de módulos dentro de un monolito, no una autorización para
crear microservicios. Cada módulo tendrá capas de dominio/aplicación/adaptadores
según el stack elegido, sin referencias que violen `docs/domain/`.
