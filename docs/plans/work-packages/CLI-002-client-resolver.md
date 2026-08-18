# CLI-002 — Client Resolver server-side

## Estado

`DRAFT`

## Objetivo

Resolver un candidato de Client desde fuentes permitidas y validarlo contra Client Catalog sin aceptar que datos controlables por navegador seleccionen DB.

## Resultado observable

El resolver produce una resolución candidata trazable o un error seguro; header, query, body, parámetro o cookie manipulados no alteran DatabaseReference.

## Requisitos relacionados

- SAAS-001.
- SAAS-002.
- PDD 04.5, 05.4 y 09.
- EPIC-SAAS-02.
- MC-002, MC-014 y MC-017.

## ADR relacionados

- ADR-016.
- ADR-018.
- ADR-021.

## Gate de entrada

- CLI-001 y API-001 completadas.

## Gate de salida

- Candidato resuelto server-side listo para validación de membership/contexto.

## Scope

### Incluye

- Adaptadores de host/subdominio, dominio validado, selección autenticada o claim firmado según la decisión de identidad posterior.
- Prioridad/conflicto de fuentes, validación de formato y lookup de catálogo.
- Errores indistinguibles para recursos cross-client.

### No incluye

- Autorizar la operación final.
- Construir ClientContext o abrir Prisma.
- Custom domains comerciales completos.

## Dependencias

- CLI-001.
- API-001.

## Precondiciones

- Client Catalog aprobado y disponible.
- Las fuentes habilitadas deben estar documentadas; dominio por sí solo no autoriza.

## Supuestos

- No se presume una fuente de identidad; sólo se habilitan las aprobadas para el ambiente local.

## Bloqueos/TBD

- `DR-WS-IDENTITY-001` puede limitar las fuentes efectivamente activas en local, pero no permite aceptar un ClientId arbitrario.

## Diseño

### Componentes afectados

- data-api presentation/security y package client-context.

### Cambios esperados

- Resolver puro/orquestador, adapters de fuentes y códigos de error.

### Frontend

- Puede solicitar cambio mediante membership aprobada; nunca envía DBRef.

### API/OpenAPI

- `/api/v1/context` y switch documentan entradas seguras y Problem Details.

### Application/Domain/Policy

- Resolver no contiene reglas de AssetItem.

### ClientContext y aislamiento

- Resultado aún no es ClientContext; no autoriza repository ni Prisma.

### Prisma y migraciones

- Sólo puede consultar Platform repository de catálogo; prohíbe Client Prisma.

### Permisos

- Requiere identidad válida para selección; dominio/host no concede permiso.

### Eventos y auditoría

- `ClientResolutionSucceeded/Failed` con datos mínimos y CorrelationId.

### Observabilidad

- Métricas de fuente/resultado sin revelar otros clientes.

## Contratos API

- GET context y POST switch permanecen sujetos a CLI-003 para respuesta válida.

## Persistencia

- Lectura Platform DB vía Client Catalog; ninguna Client DB.

## Archivos o módulos esperados

- Resolver/application port, adapters de fuentes aprobadas, error mapping y tests de manipulación.

## Criterios de aceptación

- [ ] Sólo fuentes permitidas producen candidato.
- [ ] Manipular ClientId en cualquier superficie no selecciona otra DB.
- [ ] Host/dominio no autoriza por sí mismo.
- [ ] Conflictos de fuentes fallan cerrados.
- [ ] Errores no revelan Client existente, estado interno ni DBRef.

## Casos negativos

- [ ] Header, query, body, route param y cookie con Client A desde sesión B son ignorados/rechazados.
- [ ] Claim no firmado/dominio no validado no resuelve.
- [ ] No se obtiene Prisma Client DB durante la resolución.

## Pruebas obligatorias

```text
npm run test:unit -- --project client-resolver
npm run test:integration -- --project client-resolver
npm run test:architecture
npm run test:multiclient -- --case MC-002
npm run test:contract -- --project context
```

## Comandos locales

- Ejecutar con Platform DB y catálogo A/B; Client DB A/B pueden estar levantadas pero no deben recibir conexión.

## Definition of Done

- [ ] Unit/integration/architecture/contract/multi-client.
- [ ] OpenAPI actualizado.
- [ ] Errores seguros.
- [ ] Eventos/telemetría.
- [ ] Sin Client Prisma ni secretos.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- Matriz de superficies manipulables, trazas sanitizadas y prueba de cero conexiones Client DB.

## Riesgos

- Confundir identificación candidata con autorización.
- Fuente con precedencia ambigua.

## Rollback o reversibilidad

- Adapters reversibles; ninguna Client DB se modifica.

## Condiciones de bloqueo

- Catálogo no aprobado.
- Fuente de candidato no documentada.
