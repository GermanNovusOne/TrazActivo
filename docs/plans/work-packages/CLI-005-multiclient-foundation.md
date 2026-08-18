# CLI-005 — Fundación multi-client y suite P0 de Gate 2

## Estado

`DRAFT`

## Objetivo

Demostrar con Platform DB y dos Client DB reales que la cadena Identity→Resolver/Catalog→Membership/estado→ClientContext→DataSourceManager→Prisma Client DB nunca cruza Client y que Gate 2 puede cerrarse antes de agregar AssetItem.

## Resultado observable

Una matriz automatizada usa sentinelas A/B y produce evidencia de resolución, selección de DB, manipulación de entradas, suspensión, invalidación, cierre y cambio de contexto sin depender todavía de endpoints AssetItem.

## Requisitos relacionados

- SAAS-001.
- CLI-001/002.
- MC-001, MC-002, MC-003, MC-005, MC-008, MC-009, MC-012, MC-016 y MC-017.
- NFR-SEC-001.
- Gate 2.

## ADR relacionados

- ADR-016.
- ADR-018.
- ADR-020.
- ADR-021.

## Gate de entrada

- CLI-003, CLI-004, DB-003 y FND-005 completadas.

## Gate de salida

- Gate 2 aprobado con 100% de casos P0 aplicables y evidencia de DB reales.

## Scope

### Incluye

- Lectura de sentinelas técnicas A/B y ataques de selección cruzada bidireccionales.
- Manipulación de header/query/path/body/cookie u otra entrada controlable que intente seleccionar Client/DB.
- Orden identidad→resolver/catalog→membership/status→context→manager→Prisma Client DB; la DatabaseReference utilizable sólo se obtiene server-side después del contexto válido.
- Cambio de ClientContext, stale repository/Prisma/cache, suspensión, invalidación/reemplazo y cierre controlado.
- Inspección test-only de DB targets, conexiones y errores sanitizados.

### No incluye

- AssetItem, idempotencia, ClientAuditEvent, UI y contrato funcional; se prueban en QA-001/QA-002 después de Gate 2.
- Documentos, jobs, exportaciones, search o backups no implementados; sus MC se registran `NOT_APPLICABLE_SCOPE`, no PASS.
- Azure o pruebas de DR.

## Dependencias

- FND-005.
- DB-003.
- CLI-003.
- CLI-004.

## Precondiciones

- Platform DB, A y B identificables y con sentinelas distintas.
- Ningún mock sustituye DB en los casos de aislamiento.

## Supuestos

- Sólo se marcan aplicables los casos cuya superficie existe; los demás quedan `NOT_APPLICABLE_SCOPE` con gate futuro.

## Bloqueos/TBD

- `DR-WS-IDENTITY-001` y `DR-WS-DS-001` deben estar cerrados por dependencia de CLI-003/CLI-004.
- `TBD-DATA-002` permanece abierto para prueba de carga y no se presenta como cerrado por esta suite local.
- Casos fuera de scope se catalogan explícitamente y permanecen pendientes de sus gates.

## Diseño

### Componentes afectados

- Testkit, frontera Client, observación DB/conexiones y reportes MC.

### Cambios esperados

- Sentinelas A/B, harness de ataque y matriz machine-readable.

### Frontend

- No aplica en esta WP; la limpieza visual de MC-003 queda en UX-001/QA-002.

### API/OpenAPI

- Usa los endpoints de contexto disponibles y errores contractuales; no requiere endpoints AssetItem.

### Application/Domain/Policy

- Verifica la frontera de infraestructura; no requiere use cases AssetItem.

### ClientContext y aislamiento

- Instrumentación test-only demuestra orden y no reutilización; no expone DBRef en API.

### Prisma y migraciones

- Inspección de conexiones A/B y cero conexiones ante contexto inválido.

### Permisos

- Membership/feature/permission negativas reales.

### Eventos y auditoría

- Intentos anómalos se observan sin filtrar otro Client; ClientAuditEvent funcional queda fuera.

### Observabilidad

- CorrelationId conecta request, resolución y datasource; logs sanitizados.

## Contratos API

- Context/switch; no endpoints cross-client ni assets todavía.

## Persistencia

- Platform DB, Client DB A y Client DB B participan realmente en cada escenario de Gate 2.

## Archivos o módulos esperados

- Testkit/sentinelas A/B, harness de ataques, instrumentación segura de target/conexiones y matriz MC machine-readable.

## Criterios de aceptación

- [ ] Contexto A sólo alcanza el sentinela de DB A y contexto B sólo el de DB B.
- [ ] A no alcanza el sentinela de B y B no alcanza el de A.
- [ ] Entradas manipuladas nunca cambian DatabaseReference.
- [ ] Prisma sólo aparece después de contexto válido.
- [ ] Cambiar ClientContext no reutiliza repository/Prisma/cache/contexto anterior.
- [ ] Suspender A invalida conexión previamente válida.
- [ ] Reemplazo/invalidation controla y cierra la conexión aprobada.
- [ ] Errores no revelan existencia, IDs, datos ni operación de otro Client.

## Casos negativos

- [ ] Suite configurada con una sola DB debe abortar antes de probar.
- [ ] Sentinela A encontrada en B falla el pipeline de inmediato.
- [ ] Caso MC fuera de scope no se etiqueta PASS.

## Pruebas obligatorias

```text
npm run local:up
npm run db:migrate:local
npm run db:seed:local
npm run test:integration -- --project multiclient-foundation
npm run test:multiclient
npm run test:security -- --project cross-client
```

## Comandos locales

- El harness valida identidades de las tres DB antes de ejecutar y conserva reporte por caso MC.

## Definition of Done

- [ ] Integration/multi-client/security reales.
- [ ] 100% casos P0 aplicables.
- [ ] DB A/B/Platform evidenciadas.
- [ ] Cache/context/lifecycle verificados.
- [ ] N/A explícitos, no PASS ficticio.
- [ ] Sin secretos ni TBD P0 aplicable.

## Evidencia esperada

- Matriz MC, trazas sanitizadas, conteos A/B, conexiones antes/después y reportes de ataques.

## Riesgos

- Falso aislamiento por fixtures o mocks.
- Error/latencia permite inferir existencia de B.

## Rollback o reversibilidad

- Sentinelas recreables; un fallo bloquea release, nunca se desactiva el test.

## Condiciones de bloqueo

- No hay tres DB reales.
- No puede observarse el target de conexión de forma segura en tests.
- Algún caso P0 aplicable está omitido/desactivado.
