# Glosario canónico

| Término | Definición | Uso |
|---|---|---|
| Cliente | Organización que utiliza TrazActivo | Interfaz y documentación comercial |
| `Client` | Frontera técnica de aislamiento y configuración | Código, API y Platform DB |
| multi-tenant | Nombre general del patrón SaaS | Arquitectura, no entidad de dominio |
| `ClientCatalog` | Catálogo central de estado y referencias | Control Plane |
| `ClientResolver` | Resuelve y valida el cliente candidato | Backend y worker |
| `ClientContext` | Contexto inmutable por operación | Application, Domain, jobs, audit |
| `ClientMembership` | Relación de un usuario con un cliente | Identidad y autorización |
| `LegalEntity` | Sociedad, institución o entidad pública | Dentro de Client |
| `BusinessContext` | Partición operacional opcional | Dentro de LegalEntity |
| `AccountingBook` | Contexto contable por marco, moneda y política | Dentro de LegalEntity |
| `AssetItem` | Bien físico individual | Gestión patrimonial |
| `AccountingAsset` | Representación contable en un libro | Contabilidad |
| `PolicyEngine` | Motor de reglas versionadas | Backend puro |
| Control Plane | Administración de la plataforma | TrazActivo Control |
| Data Plane | Operación de cada cliente | Portal y Data API |
| Platform DB | Datos de plataforma y Client Catalog | No contiene activos del cliente |
| Client DB | Base propia con datos de negocio de un cliente | Aislamiento |

## Regla de equivalencia MVP

```text
Cliente comercial 1:1 Client 1:1 Client DB
```

Una empresa o entidad legal dentro de un cliente no obtiene otra DB salvo una decisión futura aprobada.

## Mapeo desde documentos anteriores

| Anterior | v1.1 |
|---|---|
| Tenant | Client |
| Tenant Catalog | Client Catalog |
| Tenant Resolver | Client Resolver |
| TenantContext | ClientContext |
| TenantMembership | ClientMembership |
| TenantAuditEvent | ClientAuditEvent |
| TEN-001/002 | CLI-001/002 |
| MT-001..015 | MC-001..015 |
