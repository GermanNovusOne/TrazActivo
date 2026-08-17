# Matriz P0 de aislamiento multi-tenant

| ID | Vector | Resultado obligatorio | Capa |
|---|---|---|---|
| MT-001 | IDOR con ID conocido | 404/403 sin fuga | API/security |
| MT-002 | TenantId manipulado | Ignorado o rechazado | API/security |
| MT-003 | Cambio A -> B | Sin contexto/cache/filtros/branding A | E2E |
| MT-004 | Branding diferente | Configuración aislada | Visual/E2E |
| MT-005 | Feature sólo A | Endpoint bloqueado en B | API |
| MT-006 | ID/URL documento A en B | Acceso denegado | Storage/API |
| MT-007 | Jobs A/B concurrentes | Sólo recursos correctos | Integration |
| MT-008 | Tenant suspendido | Sesión/contexto bloqueados | E2E |
| MT-009 | Sin membership | No selección ni contexto | Identity |
| MT-010 | Restore A | B intacto | DR |
| MT-011 | Buscar término B desde A | Sin resultados ni inferencia | Search |
| MT-012 | Misma clave lógica A/B | Cache separado | Component |
| MT-013 | Exports A/B concurrentes | Archivos/manifests separados | Jobs |
| MT-014 | Host no verificado | No resolución/bloqueo | Routing |
| MT-015 | Soporte plataforma sobre A | PlatformAudit con target A | Audit |

## Dataset mínimo

Cada suite usa al menos Tenant A y B, usuarios exclusivos, un usuario con ambas
memberships, un usuario sin membership, features/branding diferentes, recursos
equivalentes, documentos, cache keys, jobs y datos buscables. Los fixtures no
comparten credenciales ni referencias de DB/storage.

## Diagnóstico permitido

Los reportes de CI pueden identificar fixtures sintéticos, correlation IDs y
operaciones. No deben imprimir secretos, tokens, OTP, connection strings ni
payloads documentales.

Fuente: PDD sección 41.3 y NFR-SEC-001.
