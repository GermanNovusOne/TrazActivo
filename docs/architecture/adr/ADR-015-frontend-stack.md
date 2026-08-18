# ADR-015: Frontend Stack

- Estado: Accepted
- Fecha de decisión: 2026-08-17
- Alcance: Sprint 1.5 Frontend Foundation

## Contexto

ADR-012 exige un Design System común y providers consistentes, pero dejó el
framework frontend sin seleccionar. Sprint 1.5 necesita una primera experiencia
web real, compilable y servida por el monolito API-first existente, sin habilitar
Identity, Data Plane ni decisiones de hosting productivo pendientes.

## Decisión

Adoptar React con TypeScript y Vite para una SPA. npm administra dependencias y
`package-lock.json` fija el grafo reproducible. El frontend reside en
`src/TrazActivo.Web` y su salida estática se incorpora al artefacto publicado de
`TrazActivo.Api`.

En DEV, la SPA y ASP.NET Core .NET 10 se sirven desde el mismo host y el mismo
App Service existente. Sólo `/`, `/login` y `/preview` entregan el índice SPA.
Los prefijos `/control`, `/api`, `/health` y `/openapi` quedan reservados para el
backend y nunca participan de un fallback global.

## Alternativas no seleccionadas

- Blazor: no seleccionado para esta foundation frontend.
- Angular u otro framework SPA: no seleccionado para evitar más de un stack.
- Renderizado frontend separado del backend: no seleccionado en Sprint 1.5.
- Static Web Apps, storage static website o segundo App Service: no seleccionados.
- Microfrontends: no corresponden al monolito modular actual.

## Consecuencias

- Node y npm pasan a ser prerrequisitos de build y publish.
- `dotnet publish src/TrazActivo.Api` compila e incluye la SPA.
- Los assets permanecen same-origin; no se agrega CORS.
- React sólo presenta estado y consume los health checks aprobados.
- La autorización backend continúa deny-by-default y no depende de rutas o
  visibilidad frontend.
- Tests frontend cubren comportamiento, teclado, axe y contraste de tokens.

## Límites

Esta decisión no implementa autenticación, sesión, tenant switching,
TenantContext, branding por tenant, features, permisos, módulos funcionales,
Data Plane ni PWA. No autoriza un segundo despliegue ni cambia la separación
Control Plane/Data Plane.

El uso del App Service DEV actual no decide el runtime Azure productivo.
`TBD-AZR-001` continúa abierto, igual que los demás TBD de producción.

## Relación con ADR-012

ADR-015 concreta el stack de implementación para la foundation definida por
ADR-012. No reemplaza sus reglas: componentes comunes, accesibilidad, ausencia
de autorización implícita en UI y limpieza futura de estado tenant-scoped.

Fuente: PDD secciones 03, 05, 06, 15, 16 y 40; ADR-012; decisión aprobada de
Sprint 1.5.