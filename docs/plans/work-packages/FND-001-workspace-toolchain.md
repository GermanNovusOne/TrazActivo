# FND-001 — Workspace, toolchain y contrato de verificación

## Estado

`DONE`

Autorizada para implementación por Germán/Eduardo el 2026-08-18. `TBD-DEV-001` fue resuelto
formalmente con Node.js 24 LTS como versión mayor aprobada. El cierre fue aprobado humanamente tras
la implementación y merge del PR #1 en `architecture/v1.1-typescript`.

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

- Node.js 24 LTS es una decisión humana aprobada, no un supuesto; no se presupone versión de npm, runner ni plataforma CI/CD.

## Bloqueos/TBD

- `TBD-DEV-001` está cerrado: Node.js 24 LTS es la versión mayor aprobada y ya no bloquea esta WP.
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

- [x] Node/npm están fijados conforme a `TBD-DEV-001` cerrado.
- [x] Un clon limpio puede instalar con `npm ci` sin pasos ocultos.
- [x] Workspaces no permiten imports internos entre apps.
- [x] Los scripts raíz no contienen placeholders ni éxito simulado.
- [x] `npm run verify` retorna no cero si cualquier comando hijo falla.
- [x] Una suite aún no implementada no aparece como PASS.

## Casos negativos

- [x] Una versión Node distinta falla en preflight.
- [x] Un `.csproj`, comando `dotnet` o dependencia prohibida falla architecture/format gate.
- [x] Una prueba controlada de comando fallido produce salida no cero.

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

La implementación se ejecutó después de cerrar `TBD-DEV-001` y aprobar la WP. Durante este cierre
documental no se ejecuta npm; se registra la evidencia humana aprobada de la ejecución ya realizada.

## Definition of Done

- [x] Build/tooling reproducible.
- [x] Lint y typecheck reales.
- [x] Architecture checks reales.
- [x] Contrato de integration/contract/multi-client/E2E/a11y/golden documentado.
- [x] Documentación de bootstrap.
- [x] Sin secretos ni dependencias sin justificar.
- [x] Sin TBD P0 aplicable.

## Evidencia esperada

- Versiones fijadas, lockfile, árbol de workspaces, log de clon limpio y prueba de propagación de fallo.

## Evidencia de cierre

- PR #1 implementado y mergeado correctamente en `architecture/v1.1-typescript`.
- Reporte de implementación: `docs/plans/reports/FND-001-report.md`.
- `npm ci`: exit 0.
- `npm run verify`: exit 0.
- `npm run test:architecture`: 9/9.
- `git diff --check`: exit 0.
- Al cierre de FND-001 no se había implementado otra Work Package; FND-002, FND-003 y FND-004
  permanecían `DRAFT` y no estaban autorizadas. La autorización posterior de FND-002 se registra en
  su Work Package y en el plan, sin alterar la evidencia de cierre de FND-001.

## Riesgos

- Elegir versiones antes de aprobación.
- Permitir que Vitest u otra herramienta pase sin encontrar tests.
- Crear configuración común sin responsabilidad definida.

## Rollback o reversibilidad

- Revertir archivos de toolchain en la branch; no reescribir código legado ni lockfiles ajenos.

## Condiciones de bloqueo

- No quedan condiciones de bloqueo aplicables al cierre de FND-001.
- `DEC-CICD-001` permanece Propuesta y fuera de alcance; no bloquea este cierre.
