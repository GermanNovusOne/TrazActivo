# Threat Model P0

## Objetivo de seguridad

Evitar que cualquier actor o proceso del Tenant A acceda o infiera datos del
Tenant B a través de API, archivos, cache, búsqueda, jobs, exportaciones,
backups, integraciones, logs o soporte de plataforma.

## Fronteras de confianza

1. Navegador/cliente a entrada pública.
2. Identidad autenticada a Tenant Resolver.
3. Tenant Resolver a Tenant Catalog.
4. Aplicación a DB/storage/cache/búsqueda del tenant.
5. Publisher a broker y worker.
6. Control Plane a recursos del stamp.
7. Operador SaaS a operaciones administrativas JIT.
8. Integración a sistema externo y credencial tenant-scoped.

## Amenazas y controles PDD

| Amenaza | Control primario | Evidencia mínima |
|---|---|---|
| IDOR cross-tenant | Resolver server-side, DB por tenant, authz de recurso | MT-001/002 |
| TenantId manipulado | Ignorar/rechazar dato cliente | MT-002 |
| Tenant switch incompleto | Limpiar contexto, cache, filtros y recursos | MT-003 |
| Branding/feature cruzados | Configuración tenant-scoped y backend gate | MT-004/005 |
| Documento cruzado | Container, claims y URL temporal validados | MT-006 |
| Job con contexto incorrecto | Envelope y revalidación antes de DB | MT-007 |
| Tenant suspendido | Invalidación de contexto/sesión | MT-008 |
| Membership ausente | No selección ni resolución | MT-009 |
| Restore afecta otro tenant | Target aislado y validación | MT-010 |
| Search inference | Consulta/índice tenant-scoped | MT-011 |
| Cache poisoning | Clave tenant-scoped | MT-012 |
| Export mezclado | Job/dataset/manifest tenant-scoped | MT-013 |
| Host no verificado | Resolver bloquea candidato | MT-014 |
| Abuso de operador | JIT, SoD y PlatformAudit | MT-015 |
| MFA bypass/replay | Política de factor, replay protection, rate limit | SEC-MFA |
| Injection/SSRF | Parámetros/ORM y allowlist de egress | SEC-INJ/SSRF |
| Secret/log leakage | Key Vault, Managed Identity, redacción/scanning | SEC-SECRET/OBS-PRIV |

## Reglas de implementación

- La autorización ocurre después de resolver contexto y antes de cargar recurso.
- Una capa de repositorio Data Plane no acepta connection strings ni referencias
  de storage desde controllers o payloads.
- Workers no conservan clientes/DbContexts tenant-scoped entre mensajes.
- Logs separan diagnóstico de auditoría y minimizan PII.
- Errores cross-tenant no revelan nombre, tipo, estado ni existencia del recurso.

## Gate

MT-001 a MT-015 aplicables deben aprobar al 100 %. Un hallazgo cross-tenant es
severidad crítica y bloquea release.

Fuente: PDD secciones 09, 39 y 41.3.
