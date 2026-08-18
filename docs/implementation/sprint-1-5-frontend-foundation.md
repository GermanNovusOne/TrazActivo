# Sprint 1.5: Frontend Foundation

## Alcance

Sprint 1.5 incorpora la primera experiencia web real de TrazActivo mediante
React, TypeScript y Vite. La SPA se compila como archivos estáticos y se sirve
desde `TrazActivo.Api`, en el mismo artefacto ASP.NET Core .NET 10.

El ambiente DEV actual es `https://dev.trazactivo.cl/`. El frontend es público;
las APIs no se vuelven públicas por esa razón.

## Rutas implementadas

- `/`: landing con wordmark textual, descriptor, lema, acceso a `/login`,
  indicador DEV y estado combinado de live/ready.
- `/login`: experiencia visual sin formulario, credenciales, token, sesión ni
  usuario demo. Identity continúa NO IMPLEMENTADA.
- `/preview`: AppShell no funcional con la navegación PDD y un EmptyState sin
  datos de negocio.
- `/health/live` y `/health/ready`: únicos endpoints consumidos por React.

No existe fallback SPA global. Rutas desconocidas bajo `/control`, `/api`,
`/health` u `/openapi` permanecen bajo comportamiento backend y no entregan
`index.html`.

## Design System foundation

La foundation implementa los tokens exactos de color del PDD, Inter y los
componentes AppShell, Sidebar, Topbar, Breadcrumb, StatusBadge, LoadingState,
EmptyState y ErrorState. La UI aplica HTML semántico, foco visible, teclado,
touch targets, estados con texto e icono y reduced motion.

DataTable, TenantSelector, PermissionGuard y FeatureGuard no están
implementados. Tampoco existen fuentes falsas de branding, features o permisos.

## Health

El cliente health sólo conoce `GET /health/live` y `GET /health/ready`. Presenta
loading, healthy o unavailable, utiliza timeout y trata respuestas no exitosas
o fallos de red como unavailable. No es una abstracción HTTP general y no llama
Control Plane ni Data Plane.

## Hosting y publish

`TrazActivo.Api.csproj` ejecuta el build frontend y copia `dist` a `wwwroot` del
publish. En Development y Testing la API usa el directorio compilado mediante
un file provider explícito. No se incorpora CORS, Front Door, Static Web Apps,
storage static website ni un segundo App Service.

Esta composición documenta solamente el App Service B1 DEV existente. No cierra
`TBD-AZR-001` ni decide hosting Azure productivo.

## Seguridad y tenancy

La política deny-by-default, Problem Details, CorrelationId, OpenAPI anónimo,
health anónimo y autorización Control Plane permanecen vigentes. Los assets y
las tres rutas SPA son anónimos de manera explícita.

No existe autenticación ficticia, token, almacenamiento de identidad,
TenantProvider, membership, tenant falso, Tenant Resolver ni tenant switching.
`MT-003` no está implementado; la ausencia de estado tenant-scoped en esta
foundation no constituye aprobación del caso canónico.

## Trazabilidad

- `UX-001`: NO IMPLEMENTADO; `/preview` es sólo AppShell y EmptyState.
- `BRD-001`: NO IMPLEMENTADO; sólo existen tokens base del producto.
- `SUB-001`: NO IMPLEMENTADO; no hay guards ni fuentes de features/permisos.
- `TEN-002`: NO IMPLEMENTADO; no existe cambio de tenant.
- `MT-003`: NO IMPLEMENTADO; cualquier relación es foundation estructural.
- `NFR-A11Y-001`: PARCIAL; evidencia sólo para páginas y componentes de Sprint 1.5.
- `API-001`: PARCIAL; se preservan contratos backend y separación de rutas.
- `OBS-001`: PARCIAL; landing consume health y conserva CorrelationId backend.

## Limitaciones

Identity, Data Plane, módulos, persistencia, PWA/offline, tenant branding,
features, permisos y hosting productivo permanecen fuera de alcance. La matriz
de navegadores continúa bloqueada por `TBD-NFR-004`; la auditoría manual completa
WCAG y lectores de pantalla no forma parte de esta foundation.

Fuente: PDD secciones 03, 05, 06, 09, 10, 15, 16, 39, 40 y 41; ADR-012 y
ADR-015.