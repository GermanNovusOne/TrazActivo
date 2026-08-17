# Trazabilidad de requisitos canónicos

Esta matriz asigna los 43 requisitos del Apéndice A del PDD a su artefacto de
Sprint 0. `Baseline` significa que puede detallarse sin resolver reglas
pendientes; no equivale a implementación terminada.

| ID | Artefacto principal | Estado Sprint 0 |
|---|---|---|
| SAAS-001 | Architecture / tenant isolation | Baseline P0 |
| SAAS-002 | Platform Management / Tenant Catalog | Bloqueado en detalle por TBD-TEN-002 |
| SAAS-003 | Platform Management / provisioning | Baseline P0 |
| TEN-001 | TenantContext schema / ADR-005 | Baseline P0 |
| TEN-002 | Identity & Access / tenant switch | Baseline P0 |
| SEC-001 | Security baseline / Identity & Access | NO IMPLEMENTADO; TBD-SEC-001/002 |
| SEC-002 | Identity & Access | Baseline P0 |
| SEC-003 | Workflow / security baseline | Bloqueado por TBD-SEC-003 |
| SEC-004 | Workflow / Identity & Access | Baseline P0 |
| BRD-001 | Tenant Configuration / ADR-007 | Baseline; comercial TBD-BRD-001 |
| SUB-001 | Tenant Configuration | Baseline P0 |
| AST-001 | Asset Registry | Baseline P0 |
| AST-002 | Asset Registry | Baseline P0 |
| ACQ-001 | Acquisition | Baseline P0 |
| LOC-001 | Organization & Location | Baseline P0 |
| INV-001 | Inventory | Baseline P0 |
| INV-002 | Inventory | Baseline P0 |
| INV-003 | Inventory / MT tests | Diseño bloqueado por TBD-INV-001 |
| MOV-001 | Custody & Movement | Baseline |
| ACC-001 | Accounting | Parcial; TBD-ACC-001/005 |
| ACC-002 | Accounting / decision gates | Modelo final pendiente |
| POL-001 | Policy Engine / ADR-008 | Gobernanza; fuentes pendientes |
| REC-001 | Acquisition / Accounting | Baseline; política pendiente |
| DEP-001 | Policy Engine / golden governance | Bloqueado para posting por G3 |
| DEP-002 | Policy Engine / golden governance | Bloqueado para posting por G3 |
| DEP-003 | Policy Engine / pilot matrix | Bloqueado por TBD-ACC-002/003 |
| DEP-004 | Policy Engine / golden governance | Diseño; no posting antes de G3 |
| DEP-005 | Policy Engine / golden governance | Diseño; no posting antes de G3 |
| DEP-006 | Policy Engine / Workflow | Diseño; no posting antes de G3 |
| DEP-007 | Policy Engine / Accounting | Diseño; alcance normativo pendiente |
| IMP-001 | Impairment & Valuation | Baseline P1 |
| CMP-001 | Impairment/Maintenance | Baseline P1 |
| DSP-001 | Asset Registry/Accounting/Workflow | Modelo transversal; implementación no iniciada |
| MNT-001 | Maintenance | Baseline P1 |
| DOC-001 | Documents & Evidence / ADR-010 | Parcial; TBD-PRIV-001/DOC-001 |
| AUD-001 | Audit / ADR-009 | Baseline P0 |
| INT-001 | Integration | Baseline P1; TBD-ERP-001 |
| API-001 | API common contract | Baseline P0 |
| JOB-001 | Job envelope / ADR-011 | Baseline; servicio depende de TBD-AZR-001 |
| OBS-001 | Architecture / testing strategy | Baseline; runtime pendiente |
| NFR-A11Y-001 | Testing / ADR-012 | Baseline; browsers TBD-NFR-004 |
| NFR-PORT-001 | Database/infra strategy / MT-010 | Baseline; RPO/RTO/DR pendientes |
| DEV-001 | Database migrations | Baseline P0; toolchain pendiente |

## Regla de avance

Antes de mover un requisito a implementación debe existir contrato detallado,
permisos/scopes, eventos/auditoría, errores, pruebas aplicables y ningún TBD P0
del módulo. Aplica el Definition of Done del Apéndice E.

Fuente: PDD Apéndices A, D y E.

## Evidencia ejecutable Sprint 1

| ID | Evidencia Sprint 1 | Estado |
|---|---|---|
| SAAS-001 | Boundaries de Control Plane, contratos de tenancy y architecture tests; no existe Data Plane ni base compartida | Parcial |
| SAAS-002 | Tenant, TenantCatalogEntry, lifecycle, catálogo en memoria y API de administración | Parcial; TBD-TEN-002 abierto |
| SAAS-003 | Intención idempotente de provisionamiento hasta estado Provisioning | Parcial; sin recursos ni activación |
| TEN-001 | ITenantResolver, TenantContext inmutable, factory/accessor y resultado con validación obligatoria | Sólo abstracciones; resolver real pendiente |
| TEN-002 | Sin implementación de selección/cambio de tenant | No implementado |
| SEC-001 | Autenticación por tenant, OIDC, MFA y membership | NO IMPLEMENTADO. El deny-by-default es foundation transversal de autorización; identity/MFA TBD abiertos |
| AUD-001 | PlatformAudit append-only en adaptador de test, con operador, tenant objetivo, stamp, permiso, motivo, correlación y campos JIT | Parcial |
| API-001 | API versionada, Idempotency-Key, ETag/If-Match, Problem Details, CorrelationId y OpenAPI contractual | Parcial implementado |
| OBS-001 | Health live/ready y CorrelationId | Parcial implementado |

No se mueve ningún requisito contable, de Policy Engine, depreciación, posting,
ERP, PWA o infraestructura Azure a estado implementado en Sprint 1.
