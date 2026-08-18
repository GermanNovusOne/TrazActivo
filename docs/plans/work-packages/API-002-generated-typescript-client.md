# API-002 — Cliente TypeScript generado y drift gate

## Estado

`DRAFT`

## Objetivo

Generar de forma reproducible el cliente TypeScript consumido por Next.js y bloquear divergencias entre API, OpenAPI y artefacto generado.

## Resultado observable

El pipeline local regenera el cliente desde ambos OpenAPI, detecta cualquier diff y los shells frontend sólo pueden consumir ese cliente o adaptadores tipados derivados.

## Requisitos relacionados

- API-001.
- PDD 06.5 y 44.2/44.3.
- Gate 1 y Gate 3.

## ADR relacionados

- ADR-017.
- ADR-019.
- ADR-021.

## Gate de entrada

- API-001, AST-003 y FND-002 completadas.

## Gate de salida

- Cliente generado integrado al workspace y drift check real.

## Scope

### Incluye

- Generador fijado, outputs deterministas y adaptador frontend mínimo.
- Diff gate y contract smoke.
- Generación sobre el contrato final de assets agregado en AST-003.

### No incluye

- DTO manuales duplicados.
- Lógica de cache, autorización o UI funcional.

## Dependencias

- API-001.
- AST-003.
- FND-002.

## Precondiciones

- Herramienta de generación aprobada y versionada.

## Supuestos

- OpenAPI generado es el único contrato autoritativo consumible por el frontend.

## Bloqueos/TBD

- Ninguno P0 adicional; cualquier dependencia nueva requiere justificación.

## Diseño

### Componentes afectados

- Package contracts/generated y adaptadores mínimos frontend.

### Cambios esperados

- Código generado claramente separado de código manual.

### Frontend

- Prohibición de `fetch` ad hoc para endpoints cubiertos por contrato.

### API/OpenAPI

- OpenAPI es el único input del generador.

### Application/Domain/Policy

- No aplica.

### ClientContext y aislamiento

- El cliente no añade headers/cookies `ClientId` para elegir DB.

### Prisma y migraciones

- No aplica.

### Permisos

- Tipos reflejan errores/permisos documentados, no autorizan localmente.

### Eventos y auditoría

- No aplica.

### Observabilidad

- Propaga CorrelationId de respuesta/error.

## Contratos API

- Control/Data, incluidos los endpoints assets entregados por AST-003.

## Persistencia

- Ninguna.

## Archivos o módulos esperados

- Package de cliente TypeScript generado, configuración del generador y adapters mínimos en los shells Next.js.

## Criterios de aceptación

- [ ] Regenerar dos veces produce output idéntico.
- [ ] Un cambio OpenAPI sin regenerar falla `openapi:check`.
- [ ] Frontend no importa DTO NestJS ni tipos Prisma.
- [ ] Cliente no permite seleccionar DatabaseReference.
- [ ] El build incluye el artefacto generado correcto.

## Casos negativos

- [ ] Alterar manualmente un archivo generado falla drift gate.
- [ ] Un endpoint no documentado no puede consumirse mediante adaptador ad hoc.

## Pruebas obligatorias

```text
npm run openapi:generate
npm run openapi:check
npm run test:contract
npm run test:architecture
npm run typecheck
npm run build
```

## Comandos locales

- Los comandos deben operar sin red no documentada y con herramientas fijadas.

## Definition of Done

- [ ] Contract/architecture.
- [ ] Typecheck/build.
- [ ] Cliente reproducible.
- [ ] Drift gate real.
- [ ] Uso frontend documentado.
- [ ] Sin secretos ni TBD P0 aplicable.

## Evidencia esperada

- Hashes de doble generación, diff limpio y prueba negativa de drift.

## Riesgos

- Editar código generado manualmente.
- Introducir un segundo modelo contractual.

## Rollback o reversibilidad

- Regenerar desde OpenAPI aprobado; no conservar artefactos divergentes.

## Condiciones de bloqueo

- Generación no determinista.
- Contrato no representa el comportamiento de API.
