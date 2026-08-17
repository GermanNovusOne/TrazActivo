# Registro operativo de TBD

Este registro refleja el PDD RC1. Todos los elementos permanecen `OPEN` hasta
que exista una decisión aprobada con evidencia y, cuando corresponda, un ADR.

| ID | Decisión requerida | Responsable PDD | Gate principal |
|---|---|---|---|
| TBD-PROD-001 | Aprobadores formales de alcance y baseline | Sponsor / Product Owner | G0 |
| TBD-ACC-001 | IFRS completas, IFRS para PYMES o ambas | Contabilidad / Product Owner | G2 |
| TBD-ACC-002 | Fuente formal de convención 30 días | Contabilidad pública / cliente | G3 |
| TBD-ACC-003 | Aprobación de tres cargos corregidos | Contabilidad | G3 |
| TBD-ACC-004 | Versión íntegra de normativa CGR 2027 | Especialista NICSP | G2/G3 |
| TBD-ACC-005 | Monedas habilitadas en MVP | Producto / Contabilidad | G2 |
| TBD-ACC-006 | Plan de cuentas inicial e integración | Cliente piloto / Contabilidad | UAT contable |
| TBD-ERP-001 | Primer ERP integrado | Product Owner / cliente piloto | Integración |
| TBD-AZR-001 | App Service o Container Apps | Arquitectura / DevOps | G1/G5 |
| TBD-AZR-002 | SKU y configuración zonal en Chile Central | Arquitectura / Finanzas | G5 |
| TBD-AZR-003 | Región secundaria | Arquitectura / Legal / cliente | G5 |
| TBD-AZR-004 | Bicep o Terraform | DevOps | G1 |
| TBD-AZR-005 | GitHub Actions o Azure DevOps Pipelines | DevOps | G4 |
| TBD-TEN-001 | Criterios de infraestructura dedicada | Producto / Finanzas / Arquitectura | Oferta enterprise |
| TBD-TEN-002 | Límite Catalog versus stamp | Arquitectura / Data | Implementación catálogo |
| TBD-SEC-001 | Obligatoriedad MFA en plan Standard | Product Owner / Seguridad | Onboarding piloto |
| TBD-SEC-002 | Passkeys en MVP | Seguridad / Producto | Diseño identidad |
| TBD-SEC-003 | Timeout de step-up | Seguridad | Implementación SEC-003 |
| TBD-PRIV-001 | Retención y borrado contractual | Legal / Producto | G5/documentos |
| TBD-DOC-001 | Tamaños y tipos de archivo | Producto / Seguridad | DocumentUploader |
| TBD-NFR-001 | SLA comercial | Comercial / Operaciones | G5 |
| TBD-NFR-002 | RPO/RTO por plan | Comercial / Arquitectura | G5 |
| TBD-NFR-003 | Volúmenes objetivo | Producto / cliente piloto | Performance/sizing |
| TBD-NFR-004 | Navegadores soportados | Producto / UX | UAT |
| TBD-INV-001 | Datos offline y duración | Producto / Seguridad | PWA offline |
| TBD-INV-002 | Impresión y modelos certificados | Producto / cliente piloto | Impresión |
| TBD-BRD-001 | Custom domain/white label en MVP | Producto / Comercial | Oferta comercial |
| TBD-SUP-001 | Horarios y canales de soporte | Operaciones / Comercial | G5/contrato |
| TBD-MKT-001 | Mercado Público en MVP o fase posterior | Producto | Backlog fase 1 |
| TBD-MIG-001 | Cliente y dataset de migración piloto | Product Owner | UAT migración |

## Proceso de cierre

Cada cierre debe registrar decisión, aprobador, fecha, evidencia, requisitos y
artefactos impactados. Una decisión arquitectónica actualiza o crea ADR. Una
decisión contable actualiza la matriz normativa y los casos golden asociados.

Fuente: PDD registro E.
