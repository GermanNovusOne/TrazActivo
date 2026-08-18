# ADR-016: Client como frontera canónica

## Estado

Accepted.

## Decisión

`Client` es la entidad técnica y Cliente es el término de interfaz. El sistema sigue el patrón SaaS multi-tenant, pero no expone `Tenant` como entidad canónica.

```text
Client
  ├── ClientMemberships
  ├── LegalEntities
  ├── AccountingBooks
  ├── Configuration
  ├── Client DB
  └── Client Storage
```

Para el MVP, un cliente comercial equivale a un Client y una DB.

## Consecuencias

- renombrar artefactos `Tenant*` a `Client*`;
- migrar requisitos `TEN-001/002` a `CLI-001/002`;
- mapear los casos históricos `MT-001..015` a `MC-001..015` y conservar la trazabilidad;
- no crear `CustomerAccount` hasta existir un caso real 1:N.
