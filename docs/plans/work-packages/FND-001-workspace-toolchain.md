# FND-001 — Workspace, toolchain y contrato de verificación

## Estado

`DRAFT`

## Objetivo

Establecer el monorepo npm reproducible, fijar versiones aprobadas y definir scripts raíz que ejecuten controles reales y propaguen fallos.

## Resultado observable

Desde un clon limpio, el workspace reconoce apps/packages, usa versiones fijadas y dispone de comandos raíz sin `echo-success`, placeholders ni tolerancia silenciosa a fallos.

## Requisitos relacionados

- EPIC-FND-01.
- PDD 44.1, 44.2, 44.4 y 44.6.
- Gate 1.

## ADR relacionados

- ADR-015.
- ADR-019.
- ADR-020.
- ADR-021.

## Gate de entrada

- Evidencia BAS-001 registrada como `PRECONDICIÓN_SATISFECHA_EXTERNAMENTE`.
- `TBD-DEV-001` cerrado.

## Gate de salida

- Toolchain reproducible y contrato de scripts disponible para las WPs siguientes.

## Scope

### Incluye

- npm workspaces, TypeScript base, formato y lint.
- Fijación de Node/npm conforme a la decisión aprobada y lockfile.
- Scripts raíz para build, pruebas y operación local.
- `npm run verify` fail-fast/fail-closed, completado progresivamente por las WPs dueñas de cada suite.
- Comprobación automatizada de stack prohibido y dependencias no permitidas.

### No incluye

- Crear aplicaciones o packages funcionales.
- Instalar una versión de Node no aprobada.
- Convertir suites inexistentes en PASS.
- Azure, CI/CD remoto o lógica de dominio.

## Dependencias

- Gate 0/BAS-001 satisfecho externamente.

## Precondiciones

- `TBD-DEV-001` debe resolverse antes del primer `npm install` o `npm ci`.
- Toda dependencia nueva debe tener justificación, versión fijada y revisión de licencia/seguridad.

## Supuestos

- No se presupone versión Node, npm, runner ni plataforma CI/CD.

## Bloqueos/TBD

- `TBD-DEV-001` bloquea completamente esta WP.
- `DEC-CICD-001` permanece Propuesta; CI/CD remoto queda fuera de esta WP.

## Diseño

### Componentes afectados

- Raíz del monorepo, configuración TypeScript, formatter/linter y scripts de verificación.

### Cambios esperados

- Archivos de workspace/toolchain y documentación de comandos.
- Cada suite todavía no entregada debe fallar o declarar estado explícito aplicable; nunca aprobar por vacío.

### Frontend

- Sólo configuración compartida, sin UI.

### API/OpenAPI

- Sólo reserva de comandos; generación llega en API-001/API-002.

### Application/Domain/Policy

- Reglas de dependencia base; sin dominio funcional.

### ClientContext y aislamiento

- Architecture check impide Prisma fuera de infraestructura o antes del boundary autorizado cuando esos módulos existan.

### Prisma y migraciones

- No se crean schemas ni migraciones.

### Permisos

- No aplica.

### Eventos y auditoría

- No aplica.

### Observabilidad

- Salida de comandos clara y códigos de retorno preservados.

## Contratos API

- No aplica todavía.

## Persistencia

- No aplica.

## Archivos o módulos esperados

- Manifiesto raíz/workspaces, lockfile, configuración TypeScript/lint/formato y scripts raíz de verificación.

## Criterios de aceptación

- [ ] Node/npm están fijados conforme a `TBD-DEV-001` cerrado.
- [ ] Un clon limpio puede instalar con `npm ci` sin pasos ocultos.
- [ ] Workspaces no permiten imports internos entre apps.
- [ ] Los scripts raíz no contienen placeholders ni éxito simulado.
- [ ] `npm run verify` retorna no cero si cualquier comando hijo falla.
- [ ] Una suite aún no implementada no aparece como PASS.

## Casos negativos

- [ ] Una versión Node distinta falla en preflight.
- [ ] Un `.csproj`, comando `dotnet` o dependencia prohibida falla architecture/format gate.
- [ ] Una prueba controlada de comando fallido produce salida no cero.

## Pruebas obligatorias

```text
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test:architecture
npm run verify
git diff --check
```

## Comandos locales

No se ejecutan hasta cerrar `TBD-DEV-001` y aprobar la WP. Durante esta ejecución de planificación no se ejecuta npm.

## Definition of Done

- [ ] Build/tooling reproducible.
- [ ] Lint y typecheck reales.
- [ ] Architecture checks reales.
- [ ] Contrato de integration/contract/multi-client/E2E/a11y/golden documentado.
- [ ] Documentación de bootstrap.
- [ ] Sin secretos ni dependencias sin justificar.
- [ ] Sin TBD P0 aplicable.

## Evidencia esperada

- Versiones fijadas, lockfile, árbol de workspaces, log de clon limpio y prueba de propagación de fallo.

## Riesgos

- Elegir versiones antes de aprobación.
- Permitir que Vitest u otra herramienta pase sin encontrar tests.
- Crear configuración común sin responsabilidad definida.

## Rollback o reversibilidad

- Revertir archivos de toolchain en la branch; no reescribir código legado ni lockfiles ajenos.

## Condiciones de bloqueo

- `TBD-DEV-001` abierto.
- Evidencia externa de BAS-001 ausente o inválida.
- Dependencias propuestas sin justificación.
