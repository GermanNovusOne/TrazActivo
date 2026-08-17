# Foundation del monolito modular

Sprint 1 selecciona .NET 10 LTS para la foundation ejecutable y conserva la
estructura lógica del PDD sin crear microservicios. Los proyectos actuales son:

```text
TrazActivo.ControlPlane.Domain
TrazActivo.ControlPlane.Application
TrazActivo.ControlPlane.Infrastructure
TrazActivo.Tenancy.Abstractions
TrazActivo.Api
```

`ControlPlane` contiene Platform Management y PlatformAudit. `Tenancy` sólo
expone contratos para resolución y TenantContext server-side; no implementa un
Data Plane. La API es el composition root del monolito modular.

Las pruebas de arquitectura impiden dependencias inversas y confirman que no
existe un ensamblado Data Plane en Sprint 1. Infrastructure contiene sólo
adaptadores en memoria y su registro falla fuera de `Development` o `Testing`.
