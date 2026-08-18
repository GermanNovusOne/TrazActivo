# SPI-001 — Spike Prisma database-per-client

## Estado

`DRAFT`

## Objetivo

Medir el comportamiento real de Prisma con DB A/B y producir evidencia para decidir límites de conexión, cache y cierre sin violar el orden de ClientContext.

## Resultado observable

Informe reproducible con clientes simultáneos, conexiones por proceso, apertura fría, cache/TTL, pool, recovery, invalidación, migración y saturación; aporta evidencia a `TBD-DATA-002` y la base de decisión para `DR-WS-DS-001`, sin cerrar ninguno por sí mismo.

## Requisitos relacionados

- SAAS-001.
- NFR-SEC-001.
- PDD 05.2/05.4, 37 y 44.5.
- Gate 2.

## ADR relacionados

- ADR-018, spike obligatorio.
- ADR-020.
- ADR-021.

## Gate de entrada

- CLI-003, DB-002 y DB-003 completadas.

## Gate de salida

- Evidencia suficiente para que Arquitectura/Data cierre `DR-WS-DS-001`.

## Scope

### Incluye

- Harness controlado que sólo abre DB desde un ClientContext válido de prueba.
- Medición de A/B, cold open, concurrencia, límites, failure/recovery y cierre.
- Pruebas de suspensión e invalidación de referencia.

### No incluye

- Implementación productiva del manager.
- Elegir valores de pool/TTL sin aprobación.
- Azure sizing o SLA.

## Dependencias

- CLI-003.
- DB-002.
- DB-003.

## Precondiciones

- DB A/B reales con observación de conexiones disponible.
- Escenarios y métricas aprobados antes de ejecutar.

## Supuestos

- Los resultados locales no se extrapolan a producción ni fijan valores sin revisión humana.

## Bloqueos/TBD

- Resultados alimentan `TBD-DATA-002` y `DR-WS-DS-001`; el spike no cierra ninguna decisión por sí solo. `TBD-DATA-002` conserva su efecto autoritativo sobre la prueba de carga; `DR-WS-DS-001` bloquea los parámetros locales de CLI-004.
- `TBD-NFR-003` impide extrapolar a capacidad comercial/productiva.

## Diseño

### Componentes afectados

- Testkit/harness de infrastructure y documentación de resultados.

### Cambios esperados

- Instrumentación temporal/reutilizable de tests, no API de negocio.

### Frontend

- No aplica.

### API/OpenAPI

- No aplica.

### Application/Domain/Policy

- No aplica.

### ClientContext y aislamiento

- Cada escenario usa contexto inmutable aprobado; un contexto inválido debe producir cero conexiones.

### Prisma y migraciones

- Clientes acotados por harness; medir disconnect, replacement, pool y DB no disponible.

### Permisos

- Credenciales locales mínimas; sin exposición al navegador.

### Eventos y auditoría

- No ClientAudit; reporte operacional del spike.

### Observabilidad

- Conteos de conexiones, tiempos, errores, saturación y cleanup.

## Contratos API

- No aplica.

## Persistencia

- Lecturas/escrituras de prueba desechables y separadas en A/B.

## Archivos o módulos esperados

- Harness de spike, escenarios, instrumentación, resultados machine-readable e informe para `TBD-DATA-002`/`DR-WS-DS-001`.

## Criterios de aceptación

- [ ] Se miden todos los puntos exigidos por ADR-018.
- [ ] Contexto inválido abre cero conexiones.
- [ ] Suspensión/reemplazo muestra comportamiento de invalidación/cierre.
- [ ] Fallo de A no se reporta como acceso o fallo de B.
- [ ] No se extrapolan SLA/capacidad productiva sin `TBD-NFR-003`.

## Casos negativos

- [ ] Prisma por request sin límite no se acepta como diseño.
- [ ] Resultados sin métricas de cleanup no cierran el spike.
- [ ] Connection string recibida por request es rechazada.

## Pruebas obligatorias

```text
npm run local:up
npm run test:integration -- --project prisma-spike
npm run test:multiclient -- --project prisma-spike
npm run test:architecture
```

## Comandos locales

- El harness debe limpiar sólo datos de prueba identificados y producir reporte machine-readable.

## Definition of Done

- [ ] Integration/multi-client/architecture.
- [ ] Métricas y escenarios completos.
- [ ] Informe reproducible.
- [ ] Riesgos y límites explicitados.
- [ ] Sin secretos.
- [ ] Decision Request presentado, no cerrado por el ejecutor.

## Evidencia esperada

- Reporte de métricas, gráficos/tablas de conexiones, logs de cleanup y propuesta para revisión.

## Riesgos

- Benchmark local no representa producción.
- Harness omite conexión stale/suspensión.

## Rollback o reversibilidad

- Datos de prueba recreables; instrumentación temporal se retira si no tiene consumidor posterior.

## Condiciones de bloqueo

- No hay DB A/B reales.
- El harness necesita Prisma antes de ClientContext válido.
