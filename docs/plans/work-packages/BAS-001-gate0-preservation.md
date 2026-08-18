# BAS-001 — Evidencia de preservación externa de Gate 0

## Estado

`DRAFT`

## Disposición

`PRECONDICIÓN_SATISFECHA_EXTERNAMENTE`

Esta WP se conserva por trazabilidad con el backlog. No pertenece a la cola de implementación: el tag/respaldo de la foundation anterior fue ejecutado externamente antes de esta planificación.

## Objetivo

Registrar y verificar la evidencia ya existente de preservación de la foundation anterior, sin crear ni modificar tags.

## Resultado observable

Evidencia de Gate 0 referenciada como precondición satisfecha: el tag `foundation-pre-v1.1-typescript-2026-08-18` apunta al commit `ba0a3b5`, los documentos v1.1 están presentes y la foundation .NET queda congelada.

## Requisitos relacionados

- Gate 0 del roadmap.
- PDD secciones 00, 44, 47 y 48.
- Política AGENTS.md, secciones 1, 2 y 8.

## ADR relacionados

- ADR-015.
- ADR-016.
- ADR-019.

## Gate de entrada

- Evidencia externa de tag/respaldo disponible para lectura.
- Repositorio y Git history accesibles.

## Gate de salida

- Evidencia externa registrada en el plan como satisfecha.
- BAS-001 no genera branch de implementación ni trabajo pendiente.

## Scope

### Incluye

- Verificar de sólo lectura branch, status, tag/respaldo y trazabilidad de la foundation preservada.
- Verificar presencia y precedencia de PDD, ADR Accepted, AGENTS y registro de TBD.
- Identificar referencias vigentes que contradigan la baseline v1.1.
- Declarar explícitamente que el legado es evidencia, no implementación objetivo.

### No incluye

- Crear, mover o modificar tags/respaldo.
- Borrar, portar o modificar código anterior.
- Crear toolchain TypeScript.
- Resolver o aprobar el PDD.
- Commit, push, merge o release dentro de esta planificación.

## Dependencias

- Ninguna WP técnica.

## Precondiciones

- El tag/respaldo ya fue creado externamente y debe poder demostrarse sin reescribir historia.
- Se conservan cambios preexistentes no relacionados.

## Supuestos

- La ejecución externa informada se acepta como hecho de entrada, sujeto a verificación de evidencia.

## Bloqueos/TBD

- Ningún TBD bloquea BAS-001.
- `TBD-PROD-001` significa alcance final del MVP comercial y no bloquea preservación, baseline ni foundation.
- Si la evidencia externa falta o se detecta una contradicción autoritativa, se registra la condición sin recrear el tag por cuenta de esta WP.

## Diseño

### Componentes afectados

- Git metadata y documentación de gobernanza; ningún componente ejecutable.

### Cambios esperados

- Sólo referencia/verificación de evidencia existente; no hay cambios de Git ni implementación.

### Frontend

- No aplica.

### API/OpenAPI

- No aplica.

### Application/Domain/Policy

- No aplica.

### ClientContext y aislamiento

- Verificar que la baseline establece `Client` y DB propia; no implementar.

### Prisma y migraciones

- No aplica.

### Permisos

- No aplica.

### Eventos y auditoría

- La aprobación del gate queda registrada en la evidencia del WP.

### Observabilidad

- No aplica.

## Contratos API

- No aplica.

## Persistencia

- No aplica.

## Archivos o módulos esperados

- Reporte de Gate 0 y trazabilidad documental; ningún módulo ejecutable.

## Criterios de aceptación

- [ ] La evidencia externa identifica un tag/respaldo recuperable de la foundation anterior.
- [ ] No se planifica nueva funcionalidad .NET.
- [ ] PDD v1.1 y ADR Accepted están inventariados con precedencia correcta.
- [ ] Las contradicciones, si existen, están bloqueadas y no resueltas por supuesto.
- [ ] Germán/Eduardo reconocieron BAS-001 como precondición satisfecha y no como WP ejecutable.

## Casos negativos

- [ ] Un tag/respaldo inexistente o no verificable invalida la precondición satisfecha y exige coordinación externa.
- [ ] Una referencia vigente a .NET como nueva baseline se registra como bloqueo.
- [ ] No se elimina historia para “limpiar” el repositorio.

## Pruebas obligatorias

```text
git status --short --branch
git tag --list
git log --oneline --decorate -n 20
rg -n "dotnet|\.csproj|ASP\.NET|nueva baseline" AGENTS.md docs
git diff --check
```

## Comandos locales

Los comandos son de sólo lectura. No existe implementación futura ni se ejecuta npm.

## Definition of Done

- [ ] Requisitos y fuentes trazados.
- [ ] Evidencia de preservación revisada.
- [ ] Scope y exclusiones respetados.
- [ ] Bloqueos registrados.
- [ ] Sin código ni dependencias.
- [ ] Sin secretos.
- [ ] Sin TBD P0 aplicable cerrado por inferencia.

## Evidencia esperada

- Tag `foundation-pre-v1.1-typescript-2026-08-18` en `ba0a3b5`, status de la rama e inventario documental ya existentes.

## Riesgos

- Confundir “preservado” con “arquitectura vigente”.
- Confundir evidencia externa con una nueva tarea de implementación.

## Rollback o reversibilidad

- No se reescribe Git history ni se recrea el tag; cualquier anomalía se reporta al propietario externo.

## Condiciones de bloqueo

- Evidencia externa ausente o no verificable.
- Contradicción entre PDD y ADR Accepted.
