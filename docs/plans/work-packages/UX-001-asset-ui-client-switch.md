# UX-001 — UI mínima AssetItem y cambio seguro de Client

## Estado

`DRAFT`

## Objetivo

Entregar en `portal-web` una experiencia mínima accesible para seleccionar Client autorizado, crear, listar y consultar AssetItem sin conservar estado del Client anterior.

## Resultado observable

Un usuario local aprobado opera A o B mediante cliente OpenAPI; al cambiar Client desaparecen cache, filtros, datos, formularios, branding/presentación y contexto anteriores antes de cargar el destino.

## Requisitos relacionados

- CLI-002.
- AST-002, UX-002 y UX-003 en su mínimo de skeleton.
- MC-003, MC-004 y MC-005.
- PDD 15, 16 y walking-skeleton.
- Gate 3.

## ADR relacionados

- ADR-016.
- ADR-017.
- ADR-019.
- ADR-021.

## Gate de entrada

- API-002, AST-003, AUD-001 y CLI-003 completadas.

## Gate de salida

- Recorrido UI mínimo listo para E2E/a11y y prueba de switch.

## Scope

### Incluye

- Client selector sólo con memberships autorizadas.
- Context provider, branding/presentación segura por contexto, feature/permission visibility.
- Formulario mínimo, listado y detalle AssetItem.
- Cache/store/query keys por ClientId+context version y teardown atómico al cambiar.
- Estados loading/empty/error y navegación por teclado.

### No incluye

- Ficha 360 completa, dashboard, saved views persistidas, bulk actions o administración de branding.
- Autorización final en frontend.
- `fetch` directo fuera del cliente generado.

## Dependencias

- API-002.
- AST-003.
- AUD-001.
- CLI-003.
- FND-002.

## Precondiciones

- El modo de identidad local fue aprobado en `DR-WS-IDENTITY-001`.
- La respuesta de contexto entrega sólo una proyección de presentación segura; esta WP no decide almacenamiento productivo de branding.

## Supuestos

- La presentación mínima por Client es una proyección de lectura del contexto aprobado, no un portal de branding ni una decisión de storage productivo.

## Bloqueos/TBD

- `DR-WS-IDENTITY-001` debe estar cerrado.
- Custom domain, white label y matriz comercial de navegadores quedan fuera; no se inventan TBD para esas exclusiones.

## Diseño

### Componentes afectados

- `portal-web`, design-system mínimo, cliente generado y adapters de estado.

### Cambios esperados

- Rutas create/list/detail, providers y estrategia explícita de teardown/switch.

### Frontend

- UI Next.js/React; formularios UX-validan, backend decide.

### API/OpenAPI

- Sólo cliente generado para context/switch/assets.

### Application/Domain/Policy

- No replica invariantes ni reglas de elegibilidad.

### ClientContext y aislamiento

- Cambio invalida requests, caches, stores, filtros, formularios, URLs, permisos/features y branding antes de aceptar respuesta destino.

### Prisma y migraciones

- Prohibidos en Next.js.

### Permisos

- Visibilidad `assets.read/create`; backend vuelve a validar siempre.

### Eventos y auditoría

- Switch produce security audit backend; creación ya produce ClientAuditEvent.

### Observabilidad

- CorrelationId en error/support y telemetría sin Asset payload sensible.

## Contratos API

```text
GET  /api/v1/context
POST /api/v1/context/switch
POST /api/v1/assets
GET  /api/v1/assets
GET  /api/v1/assets/{id}
```

## Persistencia

- Ninguna DB desde frontend; estado visual por Client en memoria/cache controlada.

## Archivos o módulos esperados

- Rutas/componentes portal create/list/detail, Client selector/providers, adapters del cliente generado y tests de teardown/a11y.

## Criterios de aceptación

- [ ] A crea/lista/consulta A; B crea/lista/consulta B desde UI.
- [ ] Switch A→B elimina todo estado A antes de mostrar B.
- [ ] Un request A en vuelo se cancela/descarta tras switch.
- [ ] UI sólo usa cliente OpenAPI.
- [ ] Flujo mínimo cumple teclado, foco, labels y axe.

## Casos negativos

- [ ] Manipular ClientId en estado/URL no cambia DB.
- [ ] Membership revocada/suspendida fuerza salida segura.
- [ ] Cache key sin Client/version falla unit/architecture test.
- [ ] Respuesta tardía A no repuebla UI B.

## Pruebas obligatorias

```text
npm run test:unit -- --project portal-assets
npm run test:component -- --project portal-assets
npm run test:architecture
npm run test:contract -- --project portal-client
npm run test:e2e -- --project client-switch-assets
npm run test:a11y -- --project portal-assets
npm run build
```

## Comandos locales

- Portal/data-api y tres DB reales; los tests de UI no sustituyen QA-001 de DB.

## Definition of Done

- [ ] Build/lint/typecheck.
- [ ] Unit/component/architecture/contract/E2E/a11y.
- [ ] Cliente generado y teardown verificados.
- [ ] Permisos/branding/contexto seguros.
- [ ] Sin Prisma, secretos o reglas de negocio frontend.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- Video/screenshots A→B, snapshots de cache vacía, reporte Playwright/axe y network trace sanitizada.

## Riesgos

- Respuesta asíncrona stale después del switch.
- Branding/proyección anterior queda visible.

## Rollback o reversibilidad

- UI/adapters se revierten sin migraciones; no se conserva estado cross-client como fallback.

## Condiciones de bloqueo

- Identidad local no aprobada.
- Context API expone DBRef/secreto o no permite invalidación segura.
