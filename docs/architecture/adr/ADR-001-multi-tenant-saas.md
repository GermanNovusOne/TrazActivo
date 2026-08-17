# ADR-001: Multi-Tenant SaaS

- Estado: Accepted
- Fecha de baseline: 2026-08-17

## Contexto

TrazActivo presta un servicio SaaS a múltiples clientes con configuración,
identidad, recursos y datos propios.

## Decisión

Modelar multi-tenancy desde el dominio, seguridad, pruebas e infraestructura.
`Tenant` es una frontera de seguridad y operación, no sólo un filtro de datos.

## Consecuencias

- Toda operación Data Plane requiere tenant resuelto y validado por servidor.
- Caches, archivos, jobs, búsquedas, reportes, backups e integraciones forman
  parte de la superficie de aislamiento.
- Las pruebas cross-tenant son P0 y bloquean release.

## Alternativa descartada

Comenzar single-tenant y adaptar después, por el retrabajo y el riesgo de
aislamiento incompleto.

Fuente: PDD ADR-001, secciones 03, 04 y 09.
