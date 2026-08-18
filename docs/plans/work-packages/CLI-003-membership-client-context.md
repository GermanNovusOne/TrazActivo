# CLI-003 — Validación de ClientMembership y ClientContext inmutable

## Estado

`DRAFT`

## Objetivo

Validar identidad, Client activo y membership vigente antes de construir un ClientContext inmutable propagable a toda operación.

## Resultado observable

`GET /api/v1/context` devuelve sólo el contexto autorizado y `POST /api/v1/context/switch` reconstruye un contexto nuevo; una identidad sin membership o un Client suspendido no obtiene contexto válido.

## Requisitos relacionados

- CLI-001.
- CLI-002.
- SEC-004.
- SUB-001.
- MC-003, MC-005, MC-008 y MC-009.
- Gate 2.

## ADR relacionados

- ADR-016.
- ADR-017.
- ADR-018.
- ADR-021.

## Gate de entrada

- CLI-002 completada.
- `DR-WS-IDENTITY-001` cerrado.

## Gate de salida

- Contexto validado requerido por application services, repositories y DataSource Manager.

## Scope

### Incluye

- Frontera de identidad local aprobada.
- Modelo/migration Platform para memberships/roles/features mínimas del skeleton.
- Validación de Client activo, membership activa/vigente, feature Assets y permisos iniciales.
- ClientContext inmutable por request y cambio de membership.

### No incluye

- MFA, step-up, onboarding o identidad productiva completa.
- Autorización contable.
- Selección de conexión Prisma.

## Dependencias

- CLI-002.
- DB-001.
- API-001.
- Cierre de `DR-WS-IDENTITY-001`.

## Precondiciones

- La decisión de identidad define actor local, emisión/validación y prohibición de bypass productivo.

## Supuestos

- No se presume MFA, step-up ni proveedor productivo; la frontera local debe quedar aprobada explícitamente.

## Bloqueos/TBD

- `DR-WS-IDENTITY-001` bloquea sólo la integración de identidad controlada del skeleton local.
- `TBD-SEC-001` (modo de identidad inicial definitivo) y `TBD-SEC-002` (MFA/step-up) permanecen abiertos para login piloto/Gate 4; esta WP no los cierra.

## Diseño

### Componentes afectados

- data-api security/application, Platform Prisma y package client-context/authorization.

### Cambios esperados

- Guard/middleware, membership repository, context factory y endpoints context.

### Frontend

- Recibe una representación segura del contexto; no secretos, DBRef ni roles fuera de scope.

### API/OpenAPI

```text
GET  /api/v1/context
POST /api/v1/context/switch
```

### Application/Domain/Policy

- Use cases reciben contexto por dependencia explícita, no global mutable.

### ClientContext y aislamiento

- Campos baseline, inmutabilidad, versionado de configuración y reconstrucción total en switch.

### Prisma y migraciones

- Platform Prisma para membership; Client Prisma todavía prohibido.

### Permisos

- `authenticated`, `cliente.switch`, `assets.read`, `assets.create`; deny-by-default.

### Eventos y auditoría

- `ClientContextCreated/Rejected/Changed` y security audit.

### Observabilidad

- CorrelationId/SessionId y reason code, sin tokens ni datos sensibles.

## Contratos API

- Respuestas y Problem Details reales, con 401/403/404 seguros según contrato aprobado.

## Persistencia

- Platform DB para User/Membership/roles/features mínimos aprobados.

## Archivos o módulos esperados

- Migration Platform de membership mínima, guard/middleware, context factory, authorization policy y endpoints context/switch.

## Criterios de aceptación

- [ ] Contexto sólo se crea tras identidad, Client y membership válidos.
- [ ] Es inmutable y se reconstruye al cambiar Client.
- [ ] Suspended o membership expirada invalida acceso.
- [ ] Contexto no contiene DBRef, secreto ni connection string.
- [ ] Repository/DataSource no puede invocarse sin contexto válido.

## Casos negativos

- [ ] User sin membership no ve ni selecciona Client.
- [ ] Membership A no permite contexto B.
- [ ] Mutar el objeto contexto durante request falla unit/architecture test.
- [ ] Identidad DEV no aprobada o flag fuera de ambiente permitido falla cerrado.

## Pruebas obligatorias

```text
npm run db:platform:migrate:local
npm run test:unit -- --project client-context
npm run test:integration -- --project membership-context
npm run test:contract -- --project context
npm run test:multiclient -- --case MC-003,MC-005,MC-008,MC-009
npm run test:architecture
```

## Comandos locales

- Seeds de identidad/membership se ejecutan sólo con el modo local aprobado.

## Definition of Done

- [ ] Migration versionada.
- [ ] Unit/integration/contract/architecture/multi-client.
- [ ] Permisos y security audit.
- [ ] OpenAPI actualizado.
- [ ] Documentación de identidad local y prohibición productiva.
- [ ] `DR-WS-IDENTITY-001` cerrado.

## Evidencia esperada

- Decisión aprobada, matriz identity/membership/status, snapshots de contexto y audit.

## Riesgos

- Bypass DEV desplegable accidentalmente.
- Contexto global mutable o stale.

## Rollback o reversibilidad

- Revocar seeds/sesiones locales y revertir migration mediante forward fix en DB de prueba.

## Condiciones de bloqueo

- `DR-WS-IDENTITY-001` abierto.
- No puede garantizarse deny-by-default o inmutabilidad.
