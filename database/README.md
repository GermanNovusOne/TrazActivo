# Database-per-tenant y migraciones

## Baseline

Cada tenant mantiene una base propia. Tenant Catalog registra una referencia y
`SchemaVersion`; no almacena connection strings ni secretos. La herramienta de
migración se seleccionará junto con el stack.

## Workflow requerido

```text
preflight -> target stamp/batch -> lock controlado -> apply
          -> validate -> update catalog version -> observe
          -> succeeded | failed -> retry o roll-forward aprobado
```

## Controles

- Migraciones versionadas, auditables, reintentables y observables.
- Estado por tenant: Pending, Applying, Succeeded, Failed o RolledForward.
- Compatibilidad de aplicación/schema declarada por release.
- Fallo de un tenant no deja versión desconocida ni continúa sin política.
- Conteos, sumas, hashes y muestras en pruebas de migración.
- Rollout por stamp y lotes; nunca una transacción de negocio multi-tenant.
- Backup/restore y plan de roll-forward antes de una migración irreversible.

`TBD-TEN-002` bloquea el detalle final Catalog/stamp y `TBD-NFR-003` el tamaño de
lotes. Fuente: PDD 38, 44.3/44.4 y DEV-001.
