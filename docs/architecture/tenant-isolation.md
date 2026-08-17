# Arquitectura de aislamiento por tenant

## Invariante P0

Ningún usuario, proceso, API, job, búsqueda, archivo, reporte, backup o
integración del Tenant A puede acceder directa o indirectamente a información
del Tenant B.

## Resolución de recursos

```text
request autenticado
  -> candidato de tenant
  -> validar host/claim/selección
  -> validar membership activa
  -> validar tenant activo
  -> resolver stamp y referencias desde Tenant Catalog
  -> construir TenantContext server-side
  -> abrir exactamente los recursos resueltos
```

Un `TenantId` de header, query, ruta o payload se trata como dato no confiable.
Puede rechazarse o ignorarse, pero jamás gobierna la selección de DB, storage,
cache, índice, exportación, backup o credencial de integración.

## Capas de defensa

- Database-per-tenant.
- Container de documentos segregado por tenant en baseline Standard.
- Claves de cache y proyecciones ligadas al contexto validado.
- Jobs con tenant explícito y revalidación antes de abrir recursos.
- Consultas de búsqueda tenant-scoped en MVP.
- Autorización del recurso después de resolver el tenant.
- Invalidación completa al suspender tenant o membership.
- Auditoría tenant/plataforma separada.
- MT-001 a MT-015 bloqueantes de release.

## Cambio de tenant

Se reconstruye el contexto y se eliminan cache, filtros, vistas temporales,
store, uploads, permisos, branding, features, entidad y libro previos. No se
reutilizan objetos de acceso a datos ni URLs temporales entre contextos.

Fuente: PDD secciones 04, 09 y 41.3; requisitos SAAS-001 y TEN-001/002.
