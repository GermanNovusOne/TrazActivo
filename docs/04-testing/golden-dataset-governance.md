# Gobernanza del Golden Dataset

## Propósito

Evitar que el agente invente resultados contables o convierta una práctica institucional en regla universal.

## Estado

Los casos de depreciación se mantienen como evidencia candidata. El posting del motor permanece bloqueado hasta aprobar fuente, resultados y perfil.

## Estructura de cada caso

```text
CaseId
Version
Source
ApprovalStatus
AccountingFramework
PolicyId
PolicyVersion
AlgorithmVersion
Inputs
PriorEvents
ExpectedResult
Journal
Explanation
Tolerance
Checksum
ApprovedBy
ApprovedAt
```

## Reglas

- casos no aprobados pueden usarse para diseño, no como oracle de producción;
- una corrección crea nueva versión;
- el test indica exactamente la versión usada;
- dinero usa decimal;
- el último período ajusta diferencias según política aprobada;
- una policy futura no recalcula historia;
- los resultados se ejecutan sin UI ni infraestructura.

## Casos iniciales

- GD-DEP-001 disponible 31-01-2025.
- GD-DEP-002 disponible 15-01-2025.
- GD-DEP-003 disponible 03-01-2025.
- política mes siguiente;
- fecha disponible distinta de compra;
- residual distinto;
- cambio prospectivo;
- deterioro;
- componente;
- baja;
- corrida duplicada;
- período cerrado;
- CLP y moneda con decimales.

## Gate

`npm run test:golden` bloquea cualquier cambio del Policy Engine una vez que los casos estén aprobados.
