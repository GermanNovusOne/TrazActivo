# CLI-004 — ClientDataSourceManager acotado e invalidable

## Estado

`DRAFT`

## Objetivo

Implementar el único mecanismo runtime para obtener Prisma Client DB desde una DatabaseReference autorizada después de validar ClientContext.

## Resultado observable

El manager enruta A→DB A y B→DB B, limita/cachea según diseño aprobado, invalida clientes suspendidos o referencias reemplazadas y cierra conexiones de forma observable.

## Requisitos relacionados

- SAAS-001.
- CLI-001.
- MC-007, MC-012 y MC-016.
- PDD 05.4, 36 y 37.
- Gate 2.

## ADR relacionados

- ADR-018.
- ADR-020.
- ADR-021.

## Gate de entrada

- SPI-001 completada.
- `DR-WS-DS-001` cerrado con evidencia por Germán/Eduardo y Arquitectura/Backend/Data.

## Gate de salida

- Gate 2 puede probar routing, invalidación, lifecycle y cero acceso cruzado.

## Scope

### Incluye

- Manager con cache/límites/TTL o cierre aprobados.
- Revalidación de Client activo y config/schema version.
- Invalidación por suspensión, cambio de referencia/contexto y shutdown.
- Métricas y protección contra thundering herd/apertura ilimitada según diseño aprobado.

### No incluye

- Pool/sizing productivo o Azure.
- Consultas cross-client.
- Connection strings provenientes de request o ClientContext.

## Dependencias

- SPI-001.
- CLI-001.
- CLI-003.
- DB-002.
- Cierre de `DR-WS-DS-001`.

## Precondiciones

- Informe del spike revisado y límites exactos aprobados.

## Supuestos

- Sólo se implementan límites y lifecycle aprobados después de SPI-001; no se infieren tamaños, TTL, pool, cierre o reemplazo.

## Bloqueos/TBD

- `DR-WS-DS-001` bloquea esta WP hasta disponer de evidencia de SPI-001 y aprobación de los parámetros locales.
- `TBD-DATA-002` conserva su efecto autoritativo sobre la prueba de carga; esta WP no lo cierra ni fija el límite por instancia/stamp.
- `TBD-NFR-003` mantiene capacity/sizing productivo fuera de alcance.

## Diseño

### Componentes afectados

- data-api/worker infrastructure, client-context y observability.

### Cambios esperados

- Factory/manager, cache key versionada, invalidation hooks y shutdown.

### Frontend

- No aplica.

### API/OpenAPI

- Errores de DB/contexto se traducen a Problem Details seguros.

### Application/Domain/Policy

- Repositories reciben un datasource acotado; dominio no conoce Prisma.

### ClientContext y aislamiento

- Requiere contexto válido e inmutable; cache key incluye ClientId y versión de contexto/configuración.

### Prisma y migraciones

- Prisma se obtiene sólo aquí para runtime Client DB; lifecycle controlado.

### Permisos

- El manager no autoriza acciones; exige contexto ya autorizado y revalida estado operativo.

### Eventos y auditoría

- Invalidaciones operacionales trazables; no registrar connection strings.

### Observabilidad

- Cache hit/miss, clientes abiertos, conexión, saturación, eviction, disconnect y error por Client pseudonimizado.

## Contratos API

- Códigos seguros para `CLI-CONTEXT-INVALID`, `CLI-SUSPENDED` y dependencia no disponible.

## Persistencia

- Una sola Client DB por operación; prohibida transacción A+B.

## Archivos o módulos esperados

- ClientDataSourceManager/factory, cache versionada, invalidation/shutdown hooks, métricas y adapters repository.

## Criterios de aceptación

- [ ] No existe camino para obtener Prisma sin ClientContext válido.
- [ ] DatabaseReference proviene del catálogo server-side.
- [ ] A y B obtienen clients distintos y nunca intercambiables.
- [ ] Suspender A bloquea incluso una conexión previamente cacheada.
- [ ] Reemplazar referencia/contexto invalida y cierra/controla la anterior según diseño aprobado.
- [ ] Shutdown libera recursos dentro de la política aprobada.

## Casos negativos

- [ ] Contexto expirado/manipulado abre cero conexiones.
- [ ] Cache key sin ClientId/versión falla architecture test.
- [ ] Error A no revela DBRef, datos ni identidad operacional de B.

## Pruebas obligatorias

```text
npm run test:unit -- --project client-data-source-manager
npm run test:integration -- --project client-data-source-manager
npm run test:multiclient -- --case MC-007,MC-012,MC-016
npm run test:architecture
```

## Comandos locales

- Ejecutar con Platform DB y DB A/B reales, observando conexiones antes/durante/después.

## Definition of Done

- [ ] Unit/integration/architecture/multi-client.
- [ ] Diseño del spike implementado y trazado.
- [ ] Invalidación/shutdown/observabilidad.
- [ ] Errores seguros y documentación.
- [ ] Sin secretos.
- [ ] `DR-WS-DS-001` cerrado con evidencia del spike; `TBD-DATA-002` permanece correctamente trazado para la prueba de carga.

## Evidencia esperada

- Matriz contexto→DB, métricas de lifecycle, pruebas de suspensión/reemplazo y cero conexiones inválidas.

## Riesgos

- Conexión stale después de suspensión.
- Cache global sin versión.
- Agotamiento de pool.

## Rollback o reversibilidad

- Feature boundary local permite deshabilitar el manager y detener API; connections se cierran controladamente. No se hace fallback a DB compartida.

## Condiciones de bloqueo

- `DR-WS-DS-001` abierto.
- Spike incompleto.
- Diseño no garantiza orden ClientContext→Prisma.
