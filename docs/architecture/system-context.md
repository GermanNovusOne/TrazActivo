# Contexto del sistema

```text
Usuario / integración
        |
        v
Entrada pública + WAF
        |
        +----------------------+----------------------+
        |                                             |
        v                                             v
TrazActivo Control                             Data Plane Stamp
Control Plane                            Web/PWA + API + Workers
        |                                             |
        v                         +-------------------+------------------+
Tenant Catalog                    |                   |                  |
                                  v                   v                  v
                            Tenant Database   Tenant Storage       Messaging
```

Key Vault/App Configuration y observabilidad son capacidades transversales.
El runtime Azure, SKU, redundancia zonal, región secundaria e IaC permanecen
pendientes según sus TBD.

## Flujos de confianza

1. La identidad autentica al usuario.
2. El servidor identifica un candidato de tenant por una fuente permitida.
3. Tenant Resolver valida membership, estado, stamp y referencias contra el
   Tenant Catalog.
4. El servidor construye `TenantContext`.
5. Sólo una referencia resuelta por servidor permite abrir DB, storage, cache,
   búsqueda, exportación o integración del tenant.
6. Toda operación crítica produce auditoría y `CorrelationId`.

Fuente: PDD secciones 04.5, 04.6 y 05.2.
