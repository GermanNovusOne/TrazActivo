# Workspace y toolchain de TrazActivo v1.1

## Alcance

FND-001 establece el monorepo npm, fija el toolchain y entrega el contrato raíz de comandos. No
crea aplicaciones, packages funcionales, bases de datos, schemas Prisma, OpenAPI ni lógica de
dominio.

## Versiones fijadas

| Componente | Versión | Evidencia en repositorio                                |
| ---------- | ------: | ------------------------------------------------------- |
| Node.js    | 24.13.0 | `.nvmrc`, `.node-version`, `package.json#engines.node`  |
| npm        |  11.6.2 | `package.json#engines.npm`, `packageManager` y lockfile |
| TypeScript |   5.9.3 | devDependency exacta y lockfile                         |
| ESLint     |  10.8.1 | devDependency exacta y lockfile                         |
| Prettier   |   3.9.6 | devDependency exacta y lockfile                         |
| Vitest     |  4.1.10 | devDependency exacta y lockfile                         |

Node.js 24 LTS es la versión mayor aprobada por `DEC-DEV-001`. El patch se fija para obtener una
instalación reproducible. npm 11.6.2 es compatible con ese runtime; npm 12.0.2 no se seleccionó
porque declara Node.js `^24.15.0` como mínimo dentro de la línea 24. TypeScript se mantiene en
5.9.3 porque `typescript-eslint` 8.67.0 declara compatibilidad con TypeScript `<6.1.0`.

## Dependencias directas

| Package             | Versión | Licencia   | Justificación                                        |
| ------------------- | ------: | ---------- | ---------------------------------------------------- |
| `@eslint/js`        |  10.0.1 | MIT        | Reglas base oficiales de ESLint flat config          |
| `eslint`            |  10.8.1 | MIT        | Lint ejecutable para JavaScript y TypeScript         |
| `globals`           | 17.11.0 | MIT        | Globals Node explícitos para scripts del repositorio |
| `prettier`          |   3.9.6 | MIT        | Formato reproducible y `format:check` real           |
| `typescript`        |   5.9.3 | Apache-2.0 | Compilador y `typecheck` estricto                    |
| `typescript-eslint` |  8.67.0 | MIT        | Parser y reglas TypeScript compatibles con ESLint    |
| `vitest`            |  4.1.10 | MIT        | Pruebas reales del contrato de arquitectura          |

Todas las versiones son exactas, sin `latest`, rangos `^`/`~` ni tolerancia silenciosa. La revisión
de seguridad se ejecuta con `npm audit` después de `npm ci` y se registra en el reporte de la WP.

## Bootstrap desde clon limpio

1. Instalar o activar Node.js `24.13.0`.
2. Confirmar que npm sea `11.6.2`.
3. Ejecutar:

```text
npm ci
npm run verify
```

`.npmrc` activa `engine-strict`, lockfile obligatorio y versiones exactas. `preinstall` ejecuta el
preflight y detiene `npm ci` si Node/npm difieren de los pins.

## Workspaces

El manifiesto raíz declara exclusivamente:

```text
apps/*
packages/*
```

FND-001 sólo crea los contenedores y sus reglas. Las aplicaciones y packages reales pertenecen a
FND-002, FND-003 y FND-004. El architecture gate impide dependencias o imports entre apps, acceso
Prisma desde frontend, Prisma fuera de infraestructura, frameworks dentro de packages puros,
packages `common`, dependencias sin versión exacta y extensión de la foundation .NET preservada.

## Contrato de comandos

| Comando                            | Comportamiento en FND-001                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `npm run format:check`             | Comprueba formato de toolchain, apps, packages y documentos de implementación       |
| `npm run lint`                     | Ejecuta ESLint con cero warnings permitidos                                         |
| `npm run typecheck`                | Ejecuta TypeScript estricto y despacha typecheck de workspaces existentes           |
| `npm run test:architecture`        | Ejecuta Vitest sobre reglas positivas y negativas del repositorio                   |
| `npm run verify`                   | Ejecuta todos los controles obligatorios en orden y se detiene ante el primer fallo |
| `npm run verify:failure-probe`     | Demuestra que un hijo con exit 73 se propaga y corta la secuencia                   |
| `npm run dev` / `local:*` / `db:*` | Devuelven exit 2 y `NOT_IMPLEMENTED_SCOPE` hasta la WP propietaria                  |

`test:unit`, `test:integration`, `test:contract`, `test:multiclient`, `test:e2e`, `test:a11y` y
`build` despachan scripts reales de workspaces cuando existen. Mientras la superficie no fue
entregada, imprimen `NOT_IMPLEMENTED_SCOPE` con la WP propietaria. `test:golden` imprime
`NOT_APPLICABLE_SCOPE`, con QA-002 como WP propietaria de consolidar esa aplicabilidad, porque el
walking skeleton no publica cálculo contable. Esto no aprueba ni publica un golden dataset. Estos
estados no se presentan como PASS.

Las WPs propietarias deben agregar los scripts de workspace y sus pruebas al entregar cada
superficie. Un comando ejecutable que falla conserva su código no cero y `verify` no continúa.

## Finales de línea

LF es el terminador canónico del toolchain TypeScript y de la documentación Markdown. Prettier y
EditorConfig usan LF, mientras `.gitattributes` fuerza `eol=lf` para los archivos raíz del
toolchain, `apps/`, `packages/`, `scripts/` y `docs/**/*.md`, con independencia de
`core.autocrlf`. La política no incluye extensiones del código histórico .NET y no realiza una
renormalización masiva de ese legado.

## Foundation anterior

El tag `foundation-pre-v1.1-typescript-2026-08-18` preserva el commit `ba0a3b5`. El architecture
gate permite leer o eliminar esa evidencia del árbol actual, pero bloquea archivos .NET nuevos o
modificaciones a archivos preservados. La baseline v1.1 no ejecuta comandos `dotnet`.
