# QA-002 — E2E, accesibilidad y gate final npm run verify

## Estado

`DRAFT`

## Objetivo

Ejecutar la aceptación local completa del Walking Skeleton y consolidar todos los controles reales bajo `npm run verify`.

## Resultado observable

Un clon limpio levanta el sistema, ejecuta recorridos A/B, cambio de Client, accesibilidad y todas las suites; `npm run verify` retorna cero sólo si todo control aplicable pasa y retorna no cero ante cualquier fallo obligatorio.

## Requisitos relacionados

- Gate 1, Gate 2 y Gate 3.
- NFR-A11Y-001.
- NFR-SEC-001.
- PDD 41, 43 y 44.
- Walking Skeleton.

## ADR relacionados

- ADR-017.
- ADR-018.
- ADR-020.
- ADR-021.

## Gate de entrada

- UX-001, CLI-005 y QA-001 completadas.

## Gate de salida

- Walking Skeleton aprobado localmente por Germán/Eduardo.

## Scope

### Incluye

- E2E real A/B por UI/API.
- Switch A→B/B→A, respuesta stale, suspensión y reautorización.
- Axe y revisión manual mínima de teclado/foco/labels/errores.
- Build de cinco apps/packages.
- Orquestación final de format, lint, typecheck, unit, architecture, integration, contract, multi-client, golden applicability, E2E, a11y y build.
- Prueba controlada de propagación de código no cero.

### No incluye

- Azure deploy/smoke, performance contractual, DR o UAT comercial.
- Aprobar golden dataset contable.
- Deshabilitar tests inestables para obtener verde.

## Dependencias

- UX-001.
- CLI-005.
- QA-001.
- Todas las WPs anteriores del critical path.

## Precondiciones

- Clon/checkout limpio, toolchain aprobada y tres DB reales disponibles.
- Todos los WP previos tuvieron transición humana DRAFT→READY y cumplieron DoD.

## Supuestos

- Aprobación local no equivale a Azure DEV, UAT, producción ni conformidad contable.

## Bloqueos/TBD

- Cualquier TBD/DR aplicable pendiente bloquea esta WP.
- TBD Azure/NFR/contables permanecen fuera y no se presentan como resueltos.

## Diseño

### Componentes afectados

- Root scripts, Playwright, accessibility harness, reporters y documentación de aceptación.

### Cambios esperados

- Suite E2E final, evidencia a11y, verify orchestration y runbook local.

### Frontend

- Recorridos reales en portal-web; control-web sólo shell/build en este gate.

### API/OpenAPI

- Cliente generado real y endpoints context/assets.

### Application/Domain/Policy

- Unit/architecture reales; Policy Engine sin cálculo.

### ClientContext y aislamiento

- E2E observa cambio, limpieza visual y suspensión; CLI-005/QA-001 conservan evidencia DB.

### Prisma y migraciones

- Bootstrap/migrate/seed reproducible para Platform/A/B.

### Permisos

- Roles mínimos read/create y negativas sin membership/feature.

### Eventos y auditoría

- CorrelationId y ClientAuditEvent de creación en el recorrido.

### Observabilidad

- Logs y reportes enlazados, sin secretos.

## Contratos API

- OpenAPI y cliente deben estar limpios antes de iniciar E2E.

## Persistencia

- Tres DB reales; fixtures deterministas y recreables.

## Archivos o módulos esperados

- Playwright E2E, harness/reporte a11y, orquestador `verify`, reportes de suites y runbook de aceptación local.

## Criterios de aceptación

- [ ] E2E A y B crea/lista/consulta sus propios activos.
- [ ] Ataques cruzados y switch no muestran datos residuales.
- [ ] Suspensión bloquea sesión/conexión cacheada.
- [ ] Axe y revisión manual no tienen defecto bloqueante.
- [ ] `npm run verify` ejecuta todos los comandos obligatorios reales.
- [ ] Una suite fallida provoca código final no cero.
- [ ] Golden reporta `NOT_APPLICABLE_SCOPE`, no PASS contable, y falla si aparece cálculo/política publicada.

## Casos negativos

- [ ] Quitar/renombrar una suite obligatoria hace fallar verify.
- [ ] Configurar una sola Client DB aborta multi-client/E2E.
- [ ] Marcar N/A como PASS falla reporter/gate.
- [ ] Test disabled/skipped sin waiver aprobada bloquea cierre.

## Pruebas obligatorias

```text
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:architecture
npm run test:integration
npm run test:contract
npm run test:multiclient
npm run test:golden
npm run test:e2e
npm run test:a11y
npm run build
npm run verify
```

## Comandos locales

```text
npm ci
npm run local:up
npm run db:generate
npm run db:migrate:local
npm run db:seed:local
npm run verify
```

## Definition of Done

- [ ] Build/lint/typecheck.
- [ ] Unit/architecture/integration/contract/multi-client/E2E/a11y reales.
- [ ] Golden applicability real y correctamente clasificada.
- [ ] OpenAPI/cliente sincronizados.
- [ ] Migraciones A/B/Platform reproducibles.
- [ ] Auditoría/observabilidad/runbook.
- [ ] Sin secrets, skips no aprobados o TBD P0 aplicable.
- [ ] Aprobación local Germán/Eduardo.

## Evidencia esperada

- Logs verify, código de salida, reportes JUnit/cobertura/OpenAPI/MC/Playwright/axe, DB manifests y acta de aceptación local.

## Riesgos

- Falso verde por suite vacía o skip.
- Flakiness oculta race/context leaks.
- Confundir aceptación local con Azure/producción.

## Rollback o reversibilidad

- Un fallo bloquea el gate; se corrige mediante WP/bug de regresión. No se desactiva una suite ni se declara PASS manual.

## Condiciones de bloqueo

- Cualquier suite aplicable falla o no existe.
- DB A/B no son reales/distintas.
- OpenAPI drift.
- TBD/DR aplicable abierto.
- Evidencia incompleta o aprobación humana ausente.
