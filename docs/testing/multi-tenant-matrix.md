# Matriz P0 de aislamiento multi-tenant

| ID | Vector | Resultado obligatorio | Capa | Estado Sprint 1 |
|---|---|---|---|---|
| MT-001 | IDOR con ID conocido | 404/403 sin fuga | API/security | NotApplicableToSprint1 |
| MT-002 | TenantId manipulado | Ignorado o rechazado | API/security | PARTIAL / Sprint1 scope |
| MT-003 | Cambio A -> B | Sin contexto/cache/filtros/branding A | E2E | NotApplicableToSprint1 |
| MT-004 | Branding diferente | Configuración aislada | Visual/E2E | NotApplicableToSprint1 |
| MT-005 | Feature sólo A | Endpoint bloqueado en B | API | NotApplicableToSprint1 |
| MT-006 | ID/URL documento A en B | Acceso denegado | Storage/API | NotApplicableToSprint1 |
| MT-007 | Jobs A/B concurrentes | Sólo recursos correctos | Integration | NotApplicableToSprint1 |
| MT-008 | Tenant suspendido | Sesión/contexto bloqueados | E2E | ImplementedPartialSprint1 |
| MT-009 | Sin membership | No selección ni contexto | Identity | NotApplicableToSprint1 |
| MT-010 | Restore A | B intacto | DR | NotApplicableToSprint1 |
| MT-011 | Buscar término B desde A | Sin resultados ni inferencia | Search | NotApplicableToSprint1 |
| MT-012 | Misma clave lógica A/B | Cache separado | Component | NotApplicableToSprint1 |
| MT-013 | Exports A/B concurrentes | Archivos/manifests separados | Jobs | NotApplicableToSprint1 |
| MT-014 | Host no verificado | No resolución/bloqueo | Routing | NotApplicableToSprint1 |
| MT-015 | Soporte plataforma sobre A | PlatformAudit con target A | Audit | ImplementedSprint1 |

Los estados Sprint 1 son evidencia limitada al alcance ejecutable actual. No
constituyen aprobación de release. `MT-002` sólo prueba que entradas manipuladas
no controlan la creación del catálogo de Control Plane; el caso canónico sigue
pendiente hasta existir Tenant Resolver y Data Plane aplicables. `MT-008` sólo
valida que un tenant suspendido no puede producir un resultado de resolución
válido; sesión, resolver real y Data Plane siguen fuera de alcance. Todos los
casos `NotApplicableToSprint1` permanecen P0 y pendientes, no aprobados.

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

## Alcance Sprint 1.5

La Frontend Foundation no incorpora TenantProvider, memberships, tenant
switching, branding por tenant ni features. Por tanto `MT-003`, `MT-004`,
`MT-005` y `MT-009` permanecen no aplicables y no aprobados. La SPA no conserva
estado tenant-scoped; esta propiedad estructural es foundation solamente y no
constituye evidencia del cambio A -> B requerido por `MT-003`.
