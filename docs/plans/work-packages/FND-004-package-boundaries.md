# FND-004 — Packages y pruebas de arquitectura

## Estado

`DRAFT`

## Objetivo

Crear sólo los packages compartidos necesarios y automatizar límites que mantengan dominio, contexto, contratos y aplicaciones desacoplados.

## Resultado observable

Packages construibles con responsabilidades explícitas y una suite que falla ante dependencias prohibidas, incluido Prisma antes del boundary Client.

## Requisitos relacionados

- EPIC-FND-03/04.
- PDD 05.3, 12 y 44.
- Gate 1.

## ADR relacionados

- ADR-015.
- ADR-017.
- ADR-019.
- ADR-021.

## Gate de entrada

- FND-001 completada.

## Gate de salida

- Límites de packages disponibles para implementar API, ClientContext y AssetItem.

## Scope

### Incluye

- Creación inicial de `domain`, `client-context`, `authorization`, `contracts`, `observability` y
  `testkit` mínimos.
- Boundary de `policy-engine` sin reglas publicadas ni cálculos.
- Validación de límites arquitectónicos de `packages/design-system` ya creado por FND-002 y consumo
  o extensión de interfaces existentes únicamente cuando el scope de FND-004 lo requiera.
- Tests de imports, framework independence y stack prohibido.

### No incluye

- Crear o recrear `packages/design-system` ni sus design tokens mínimos.
- Package genérico `common`.
- Modelos Prisma o DTO NestJS expuestos al frontend.
- Reglas contables, AssetItem funcional o adaptadores Azure.

## Dependencias

- FND-001.

## Precondiciones

- Responsabilidad y consumidores de cada package documentados.
- La ausencia de `packages/design-system` no autoriza a FND-004 a crearlo; su creación inicial
  pertenece exclusivamente a FND-002.

## Supuestos

- No se crea un package sin consumidor inmediato ni se presume una regla contable.

## Bloqueos/TBD

- TBD contables no bloquean crear el límite vacío de Policy Engine; sí bloquean cualquier regla/cálculo.

## Diseño

### Componentes afectados

- `packages/domain`, `packages/client-context`, `packages/authorization`, `packages/contracts`,
  `packages/observability`, `packages/testkit`, el boundary de `packages/policy-engine` y la suite de
  arquitectura. `packages/design-system` sólo participa como límite existente sujeto a validación o
  a extensión acotada de interfaces cuando corresponda.

### Cambios esperados

- APIs públicas mínimas, mapas de dependencias y reglas automatizadas.

### Frontend

- Sólo contracts y las interfaces existentes de design-system están autorizados; nunca domain
  interno, Nest DTO o Prisma. Esta autorización de consumo no transfiere ownership a FND-004.

### API/OpenAPI

- Contracts prepara artefactos generados, no duplica DTO manuales.

### Application/Domain/Policy

- Domain y Policy Engine son TypeScript puro sin NestJS, Prisma, Next.js, Azure ni HTTP.

### ClientContext y aislamiento

- El tipo inmutable no contiene secretos ni connection strings.

### Prisma y migraciones

- Prisma sólo será permitido en infrastructure adapters y DataSource Manager futuro.

### Permisos

- Authorization define contratos, no decisiones de UI.

### Eventos y auditoría

- Sólo puertos/tipos mínimos cuando tengan consumidor inmediato.

### Observabilidad

- CorrelationId como tipo/puerto sin SDK Azure.

## Contratos API

- Ningún contrato HTTP funcional aún.

## Persistencia

- Ninguna.

## Archivos o módulos esperados

- Packages domain, client-context, authorization, contracts, observability y testkit, además del
  límite vacío de policy-engine.
- Reglas de arquitectura para `packages/design-system` existente, sin recrearlo ni duplicar sus
  design tokens.

## Criterios de aceptación

- [ ] Cada package tiene responsabilidad y API pública explícitas.
- [ ] FND-004 no crea ni recrea `packages/design-system`; sólo valida sus límites o extiende
  interfaces existentes cuando su scope lo exige.
- [ ] No existe `common` genérico.
- [ ] Domain/Policy compilan sin framework ni infraestructura.
- [ ] Frontend no puede importar Prisma/Nest internos.
- [ ] Architecture test falla si Prisma se obtiene sin ClientContext autorizado.

## Casos negativos

- [ ] Fixtures de imports prohibidos son rechazados por la suite.
- [ ] Agregar `.csproj` o dependencia .NET falla el control.
- [ ] Un cálculo contable sin golden aprobado falla el guard de alcance.

## Pruebas obligatorias

```text
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:architecture
npm run test:golden
npm run build
```

## Comandos locales

`test:golden` debe reportar `NOT_APPLICABLE_SCOPE` mediante un control real y fallar si detecta cálculo/política publicada; no puede marcar PASS contable.

## Definition of Done

- [ ] Build/lint/typecheck.
- [ ] Unit/architecture reales.
- [ ] Golden applicability real, no placeholder.
- [ ] Mapa de dependencias documentado.
- [ ] Sin secretos ni reglas anticipadas.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- Grafo de imports, resultados de fixtures negativas y estado golden `NOT_APPLICABLE_SCOPE`.

## Riesgos

- Crear abstracciones sin consumidor.
- Duplicar el ownership de `packages/design-system` asignado a FND-002.
- Permitir dependencias transitivas de framework en domain.

## Rollback o reversibilidad

- Packages bajo ownership de FND-004 son aditivos y revertibles antes de consumidores funcionales;
  `packages/design-system` no se recrea ni se toma en ownership.

## Condiciones de bloqueo

- Responsabilidad de un package no definida.
- Propuesta de regla contable o acceso Prisma fuera de límites.
