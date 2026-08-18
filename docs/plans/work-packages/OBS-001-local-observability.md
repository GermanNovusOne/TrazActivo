# OBS-001 — Observabilidad local del Walking Skeleton

## Estado

`DRAFT`

## Objetivo

Instrumentar el recorrido local del Walking Skeleton con logging estructurado, trazas, `CorrelationId`, métricas y health/readiness seguros, sin convertir telemetría en una vía de fuga entre Clients.

## Resultado observable

Una operación de contexto o AssetItem puede seguirse de extremo a extremo mediante `CorrelationId`; health/readiness distingue dependencias locales y los logs/métricas no exponen secretos, DatabaseReference ni datos de otro Client.

## Requisitos relacionados

- NFR-OBS-001.
- SAAS-001.
- PDD 40, 43 y 44.
- Backlog inicial OBS-001.
- Gate 3.

## ADR relacionados

- ADR-016.
- ADR-017.
- ADR-018.
- ADR-021.

## Gate de entrada

- AST-003 y CLI-004 completadas.

## Gate de salida

- Observabilidad local y redacción de datos listas para QA-001/QA-002.

## Scope

### Incluye

- Propagación/generación de `CorrelationId` en frontend generado, NestJS, application, resolver, datasource y persistencia.
- Logging estructurado y métricas mínimas de resolución, conexión, comandos, auditoría y errores.
- Health/readiness de apps y Platform/Client DB locales con detalle seguro.
- Tests de redacción, cardinalidad y correlación del recorrido A/B.

### No incluye

- Azure Monitor/Application Insights, alertas, dashboards o retención productiva.
- SLA, SLO, sizing, load test o selección de plataforma de observabilidad.
- Registrar payloads completos, tokens, connection strings, DatabaseReference o datos patrimoniales.

## Dependencias

- AST-003.
- CLI-004.
- FND-003.

## Precondiciones

- Convenciones de error y `CorrelationId` de API-001 disponibles.
- Eventos y campos permitidos revisados contra PDD/seguridad.

## Supuestos

- La instrumentación local valida el contrato técnico, no demuestra capacidad, SLA ni operación Azure.

## Bloqueos/TBD

- `TBD-NFR-001`, `TBD-NFR-002` y `TBD-NFR-003` permanecen abiertos para producción/DR/load tests y no se cierran con esta WP.
- Azure Monitor, retención y backend remoto requieren decisiones futuras; no bloquean instrumentación local vendor-neutral.

## Diseño

### Componentes afectados

- Package observability, cinco apps objetivo, middleware/interceptors, health/readiness y testkit.

### Cambios esperados

- Contrato de campos, propagación de contexto, redacción central, métricas locales, probes y assertions automáticas.

### Frontend

- Propaga `CorrelationId` mediante el cliente generado y limpia cualquier telemetría/estado asociado al Client anterior durante switch.

### API/OpenAPI

- Header y Problem Details coinciden con API-001/AST-003; health no expone topología sensible.

### Application/Domain/Policy

- Dominio permanece libre de SDKs; application emite puertos/eventos con datos permitidos.

### ClientContext y aislamiento

- Logs, métricas y trazas de operación incluyen `ClientId`/versión de contexto cuando corresponde y nunca reutilizan contexto de otro Client; no incluyen DatabaseReference.

### Prisma y migraciones

- Instrumenta lifecycle y duración sin registrar connection strings, queries sensibles ni payloads.

### Permisos

- Endpoints de diagnóstico detallado no son públicos; health externo entrega sólo estado mínimo.

### Eventos y auditoría

- Telemetría no reemplaza ClientAuditEvent ni PlatformAudit y conserva su separación.

### Observabilidad

- `CorrelationId`, operación, resultado, duración y reason code estables; cardinalidad acotada y redacción deny-by-default.

## Contratos API

- `CorrelationId` request/response y Problem Details conforme a OpenAPI; probes con respuesta mínima documentada.

## Persistencia

- No agrega persistencia de negocio; cualquier sink local es desechable y no mezcla datos A/B.

## Archivos o módulos esperados

- Package/adapters de observabilidad, middleware/interceptors, health/readiness, configuración local y tests de redacción/correlación.

## Criterios de aceptación

- [ ] Un `CorrelationId` une UI/API/application/datasource/audit en el recorrido permitido.
- [ ] Logs y errores no contienen tokens, secretos, DatabaseReference, connection strings ni datos de otro Client.
- [ ] Switch de Client no conserva telemetría o tags del contexto anterior.
- [ ] Health/readiness detecta indisponibilidad de dependencias sin revelar topología sensible.
- [ ] Métricas del DataSource Manager respetan los parámetros aprobados en DR-WS-DS-001.

## Casos negativos

- [ ] Un campo prohibido inyectado en error/log hace fallar security test.
- [ ] CorrelationId ausente o cambiado dentro de una operación hace fallar integration test.
- [ ] Tag de Client anterior después de switch hace fallar multi-client test.

## Pruebas obligatorias

```text
npm run test:unit -- --project observability
npm run test:integration -- --project correlation-health
npm run test:multiclient -- --project observability-context
npm run test:architecture
npm run test:security -- --project telemetry-redaction
```

## Comandos locales

- Se ejecutan con el sistema y las tres DB locales levantadas; los reportes deben ser reproducibles y sanitizados.

## Definition of Done

- [ ] Unit/integration/architecture/security/multi-client reales.
- [ ] CorrelationId y probes documentados.
- [ ] Redacción y cardinalidad verificadas.
- [ ] Sin dependencia Azure ni SDK dentro de domain.
- [ ] Runbook local y evidencia machine-readable.
- [ ] Sin TBD P0 aplicable cerrado por inferencia.

## Evidencia esperada

- Traza correlacionada A/B, snapshots de logs sanitizados, métricas/probes y pruebas negativas de redacción/contexto stale.

## Riesgos

- Telemetría de alta cardinalidad o con datos sensibles.
- Confundir health local con disponibilidad contractual.
- Mezclar ClientAuditEvent con logs operacionales.

## Rollback o reversibilidad

- Instrumentación local y adapters se revierten en la branch; no se elimina auditoría para recuperar un build.

## Condiciones de bloqueo

- No puede garantizarse redacción de campos sensibles.
- La instrumentación requiere elegir Azure/sizing/retención aún no aprobados.
- El contexto observable puede quedar stale después de switch.
