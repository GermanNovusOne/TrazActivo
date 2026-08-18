# Política obligatoria para agentes de TrazActivo v1.1

Este archivo aplica a todo el repositorio. `DEBE`, `NO DEBE` y `NUNCA` son reglas obligatorias. Una herramienta o agente no puede rebajarlas por rapidez, costo, preferencia técnica o limitación de contexto.

## 1. Fuente de verdad

Prioridad:

1. `docs/01-product/TrazActivo_PDD_v1.1_RC1.md`.
2. ADR con estado `Accepted`.
3. Especificación del bounded context aplicable.
4. Plan aprobado.
5. Work Package aprobada.
6. Código y pruebas existentes.

Ante contradicción, se detiene el área afectada y se registra un bloqueo. No se selecciona silenciosamente una interpretación.

## 2. Arquitectura bloqueada

- Frontend: Next.js, React y TypeScript.
- Backend: NestJS y TypeScript.
- Contrato: REST + Swagger/OpenAPI.
- Dominio: TypeScript puro.
- Policy Engine: TypeScript puro, determinista y versionado.
- Persistencia: Prisma.
- Aislamiento: una DB propia por `Client`.
- Resolución: `ClientResolver`, `ClientCatalog` y `ClientContext` server-side.
- Cloud: Microsoft Azure.
- Primera forma: monolito modular con aplicaciones desplegables separadas.

NUNCA:

- desarrollar la nueva baseline en .NET, C# o ASP.NET;
- crear proyectos `.csproj` o usar comandos `dotnet`;
- acceder a una DB de negocio desde Next.js;
- usar un `ClientId` del navegador para seleccionar conexión;
- abrir Prisma antes de validar `ClientContext`;
- implementar reglas contables en frontend, controllers o repositories;
- crear microservicios sin ADR aprobado.

## 3. Nomenclatura

- `Client`: cliente SaaS y frontera técnica.
- Cliente: etiqueta de interfaz y negocio.
- `LegalEntity`: sociedad o institución dentro del cliente.
- `AccountingBook`: libro contable dentro de una entidad legal.
- `ClientContext`: contexto inmutable por request, job u operación.
- El prefijo `CLI` reemplaza requisitos técnicos anteriores con prefijo `TEN`.

Para el MVP:

```text
1 cliente comercial = 1 Client = 1 DB propia
```

## 4. Separación de responsabilidades

### Next.js

PUEDE:

- renderizar UI;
- manejar navegación y estado visual;
- validar formularios para experiencia;
- consumir el cliente OpenAPI;
- aplicar branding y permisos para visibilidad.

NO PUEDE:

- decidir autorización final;
- calcular elegibilidad contable;
- calcular depreciación;
- construir asientos;
- conectarse a Prisma o a Azure SQL;
- confiar en datos de otro cliente conservados en cache.

### NestJS

DEBE:

- autenticar y autorizar;
- construir `ClientContext`;
- coordinar use cases;
- aplicar idempotencia y concurrencia;
- publicar OpenAPI real;
- producir auditoría y eventos;
- devolver errores seguros y estables.

Controllers sólo traducen HTTP. No contienen invariantes.

### Domain Layer

- No depende de NestJS, Prisma, Next.js, Azure ni HTTP.
- Contiene entidades, value objects, estados e invariantes.
- Los montos usan decimal. NUNCA `number` binario como fuente autoritativa para dinero.
- Los hechos posted o aprobados se revierten; no se sobrescriben.

### Policy Engine

- No depende de UI ni infraestructura.
- Recibe datos explícitos y una versión de política.
- Devuelve resultado, explicación, warnings, errores y hash.
- Toda política publicada es inmutable.
- No inventa vida útil, residual, método, fecha, convención, cuentas o redondeo.
- El golden dataset aprobado es obligatorio para publicar cálculo contable.

### Prisma

- Implementa persistencia, no reglas de negocio.
- Usa schemas separados para Platform DB y Client DB.
- Se obtiene mediante `ClientDataSourceManager` después de resolver el cliente.
- No expone sus tipos directamente al frontend.
- Las migraciones se versionan y registran por cliente.

## 5. Aislamiento multi-cliente

Toda operación debe asegurar:

```text
Identity válida
AND Client activo
AND ClientMembership activa
AND feature habilitada
AND permiso válido
AND scope válido
AND estado de negocio permitido
AND recursos resueltos server-side
```

NUNCA:

- consultar varias DB de clientes dentro de una transacción de negocio;
- compartir cache sin incluir ClientId y versión de contexto;
- reutilizar URLs de documentos entre clientes;
- emitir exportaciones, jobs o logs sin ClientId/CorrelationId;
- revelar si existe un recurso de otro cliente.

Los casos MC aplicables son P0 y bloquean release.

## 6. APIs

- Data Plane: `/api/v1`.
- Control Plane: `/control/v1`.
- `Idempotency-Key` en creaciones y comandos de alto impacto.
- `ETag`, versión o mecanismo equivalente para concurrencia.
- errores basados en Problem Details extendido;
- cada endpoint crítico declara permiso, scope, auditoría, transición y step-up;
- OpenAPI debe describir el comportamiento real;
- el cliente TypeScript se genera desde OpenAPI.

Una diferencia entre código, OpenAPI y cliente generado bloquea la entrega.

## 7. Pruebas

Antes de declarar una Work Package terminada, ejecutar:

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
```

Si un script aún no existe, la Work Package de foundation debe crearlo. No se omite silenciosamente.

Reglas:

- todo bug agrega regresión;
- aislamiento se prueba con DB A y DB B reales;
- Policy Engine se prueba sin NestJS ni Prisma;
- contract tests validan OpenAPI y cliente generado;
- E2E usa el sistema levantado, no sólo mocks;
- tests no se desactivan para aprobar un build.

## 8. Git

Antes:

1. leer PDD, ADR, plan y Work Package;
2. revisar `git status`;
3. conservar cambios preexistentes no relacionados;
4. declarar scope y exclusiones.

Durante:

- una Work Package por branch;
- cambios acotados;
- no refactors laterales;
- no dependencias nuevas sin justificación;
- no secretos, tokens, OTP o connection strings en repositorio.

Después:

- ejecutar `npm run verify`;
- revisar `git diff --check` y `git status`;
- actualizar trazabilidad y documentación aplicable;
- generar reporte de cambios, pruebas, riesgos y pendientes.

El agente nocturno PUEDE crear branch, commit, push y Draft PR sólo cuando el protocolo nocturno lo autorice. NUNCA hace merge a `main` ni despliega producción.

## 9. Criterio de bloqueo

Detener la parte afectada si falta una decisión que altere:

- arquitectura;
- aislamiento;
- seguridad;
- identidad;
- modelo de datos;
- reglas contables;
- posting;
- migraciones;
- infraestructura productiva;
- SLA, RPO o RTO.

Registrar el bloqueo con ID, impacto, alternativas y propietario. Continuar sólo con trabajo independiente.

## 10. Definition of Done

Un módulo termina cuando cumple, según alcance:

- requisito e IDs trazables;
- dominio y estados;
- API y OpenAPI;
- permisos, auditoría e idempotencia;
- migraciones;
- unit, architecture, integration, contract, multi-client y E2E;
- accesibilidad;
- observabilidad;
- documentación y runbook;
- sin TBD P0 aplicable.
