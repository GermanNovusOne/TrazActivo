# Infraestructura

Sprint 0 reserva esta frontera pero no selecciona ni implementa IaC.

## Decisiones abiertas

- Runtime: App Service versus Container Apps (`TBD-AZR-001`).
- SKU y configuración zonal Chile Central (`TBD-AZR-002`).
- Región secundaria (`TBD-AZR-003`).
- IaC: Bicep versus Terraform (`TBD-AZR-004`).
- CI/CD: GitHub Actions versus Azure DevOps (`TBD-AZR-005`).
- Sizing: `TBD-NFR-003`.

## Invariantes para la futura solución

Chile Central primaria, ambientes separados, database-per-tenant, storage
segregado, secretos mediante Key Vault/referencias, Managed Identity cuando sea
viable, TLS/WAF, observabilidad por tenant/stamp y restore por tenant.

No se añadirá código IaC hasta aprobar ADR-013/014 y las dependencias del
entorno productivo. Fuente: PDD secciones 05, 38, 44 y 45.

## Entorno SQL local

`infra/local/docker-compose.yml` pertenece a FND-005 y no es IaC de Azure. Define exclusivamente la
instancia SQL Server local y las tres databases requeridas para Platform, Client A y Client B. Su
operación y guardas se documentan en `docs/02-architecture/local-development.md`.
