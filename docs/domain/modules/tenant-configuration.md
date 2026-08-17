# Tenant Configuration

- Plane: administración en Control Plane; consumo en Data Plane
- Epic P0 relacionado: EPIC-SAAS-01, branding base Fase 1

## Responsabilidad y propiedad

Owns la configuración aplicada del tenant, `TenantFeature`, `TenantBranding`,
catálogos configurables y referencias de dominio validadas. Recibe el
entitlement comercial de Platform Management y publica un snapshot efectivo a
Data Plane. No posee saldos históricos ni reglas contables publicadas.

## Invariantes

- Features se evalúan server-side además de su visibilidad en frontend.
- Branding no cambia semántica, permisos, reglas ni evidencia.
- Dominio/hostname identifica un candidato; nunca autoriza por sí solo.
- Configuración y branding se limpian al cambiar tenant.

## Contratos

Entrega snapshots versionados de features, configuración y branding a los demás
módulos. `TenantSubscription` y el entitlement comercial permanecen bajo
Platform Management. No expone secretos ni referencias de infraestructura al
navegador.

## Pruebas y bloqueos

Casos P0: BRD-001, SUB-001, MT-003..005, MT-014 y validación WCAG 2.2 AA.
Custom domains/white label dependen de `TBD-BRD-001`.

## DoD local

Versiones auditables, invalidación de cache por tenant, contraste validado y
endpoint bloqueado cuando la feature está deshabilitada.

Fuente: PDD 10, 11, BRD-001 y SUB-001.
