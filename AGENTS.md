# Politica obligatoria para agentes de TrazActivo

Este archivo aplica a todo el repositorio. `DEBE`, `NO DEBE` y `NUNCA` son
reglas obligatorias. Un agente no puede rebajar estas reglas por conveniencia,
velocidad ni limitaciones de una herramienta.

## 1. Fuente de verdad y gobernanza

- `TrazActivo_PDD_v1.0_RC1.md` es la fuente de verdad funcional y
  arquitectonica vigente. Debe leerse el alcance aplicable antes de disenar o
  implementar.
- Las definiciones marcadas `SUPERSEDED` no se usan para diseno, desarrollo ni
  pruebas.
- Los ADR `Accepted` conservan las decisiones del PDD. Un ADR `Proposed` no
  autoriza a seleccionar una alternativa.
- La documentacion aprobada deriva del PDD y no lo reemplaza. Ante una
  divergencia, se detiene la implementacion afectada y se registra la
  discrepancia; no se elige silenciosamente una interpretacion.
- Todos los elementos de `docs/governance/tbd-register.md` permanecen `OPEN`
  hasta que exista decision, aprobador y evidencia. Ningun agente resuelve,
  supone o cierra un TBD silenciosamente.
- No se modifica el PDD salvo instruccion explicita. Una decision contable, de
  aislamiento o seguridad nunca se completa mediante supuestos del agente.
- No se declara un requisito, gate, prueba o modulo como aprobado cuando la
  evidencia sea parcial o existan TBD P0 aplicables.

## 2. Arquitectura obligatoria

- TrazActivo es un monolito modular API-first. No se crean microservicios salvo
  un ADR futuro aprobado que modifique expresamente esta decision.
- Control Plane (`TrazActivo Control`) y Data Plane permanecen separados en
  responsabilidades, APIs, permisos, identidades y auditoria.
- Los endpoints cross-tenant solo pueden existir en Control Plane. Un operador
  SaaS no obtiene acceso funcional al Data Plane por defecto.
- La frontera de datos es database-per-tenant. No se introduce una base
  compartida multi-tenant cuyo control principal sea una columna `TenantId`.
- DB, storage, cache, indices, busquedas, jobs, reportes, exports, backups,
  integraciones y telemetria forman parte de la superficie de aislamiento.
- Deployment stamps se conservan como arquitectura evolutiva y unidad de
  despliegue/capacidad. El Tenant Catalog mantiene la asignacion server-side;
  el frontend no determina stamp ni routing.
- No se seleccionan tecnologias cuya decision este pendiente. En particular,
  no se asume App Service versus Container Apps, Bicep versus Terraform, CI/CD,
  SKU/zonalidad, region secundaria ni estrategia DR sin cierre de TBD/ADR.

## 3. Multi-tenancy

- `Tenant` es una frontera de seguridad y operacion, no un filtro de datos.
- `TenantContext` siempre se crea y valida server-side despues de autenticar y
  validar membership. Se reconstruye por completo al cambiar de tenant.
- Un `TenantId`, header, claim candidato, host o valor recibido del frontend
  NUNCA selecciona DB, connection string, storage, cache, indice, stamp ni otro
  recurso operacional. La seleccion se obtiene de catalogo/resolucion
  server-side validada.
- Un tenant suspendido, no disponible o con membership expirada no obtiene un
  contexto Data Plane valido.
- No se permiten operaciones cross-tenant en Data Plane. Un recurso de otro
  tenant responde 404/403 sin revelar existencia ni datos.
- MT-001 a MT-015 son P0 cuando resulten aplicables al alcance implementado.
  Cualquier fuga directa o indirecta bloquea release.
- Un caso `NotApplicableToSprint1`, parcial o limitado a foundation permanece
  pendiente. Los casos parciales no se declaran aprobados ni se extrapolan al
  caso canonico.

## 4. Seguridad

- La postura es deny-by-default. Toda operacion exige los controles aplicables
  de tenant activo, membership, modulo, feature, rol, permiso, scope y estado de
  negocio.
- Autenticacion, autorizacion, aprobacion de negocio y step-up son controles
  distintos; uno no sustituye a otro.
- No se almacenan ni escriben en repositorio, contexto, trazas, errores o logs:
  secretos, passwords, tokens, OTP, recovery codes, connection strings,
  credenciales, SAS, claves ni payload documental sensible.
- Problem Details y logs no exponen stack traces, excepciones internas,
  referencias sensibles ni existencia de recursos de otro tenant.
- No se implementa autenticacion ficticia que pueda ejecutarse o confundirse
  con produccion. Principales sinteticos y handlers permisivos solo existen en
  proyectos de test.
- MFA, passkeys y step-up se implementan unicamente conforme a decisiones
  aprobadas. No se inventan obligatoriedad, timeout, factores ni excepciones.
- Toda operacion de plataforma registra PlatformAudit con actor, tenant
  objetivo, permiso, motivo, correlacion y resultado. Acceso excepcional SaaS
  debe ser nominativo, temporal y auditado.

## 5. Dominio, eventos y contabilidad

- Las invariantes pertenecen al Domain. Las reglas contables son versionadas,
  reproducibles y se ejecutan exclusivamente en backend/Policy Engine; nunca
  se duplican en frontend, controllers ni adaptadores de Infrastructure.
- El frontend presenta inputs, explicaciones y resultados emitidos por backend;
  no calcula elegibilidad, formulas, asientos ni efectos contables.
- Politicas publicadas y hechos criticos/posted son inmutables. No se editan ni
  eliminan; una correccion crea nueva version o evento de reversion/compensacion
  y conserva original, motivo, actor y trazabilidad.
- No se implementa posting de depreciacion mientras permanezcan abiertos
  `TBD-ACC-002`, `TBD-ACC-003` o la matriz normativa del perfil piloto. Contratos
  y diseno no equivalen a autorizacion de posting.
- No se asumen residual, vida util, metodo, fecha disponible, convencion de
  prorrata, moneda, libro, periodo, reapertura, cuentas ni otra politica
  contable. Deben provenir de politica versionada y fuente aprobada.
- El golden dataset aprobado es obligatorio para publicar o validar el motor
  contable. Casos bloqueados o no aprobados no se usan como oracle de posting.
- Eventos de dominio y auditoria son responsabilidades separadas. Los hechos
  criticos son append-only y las operaciones atomicas no dejan estado sin su
  auditoria, eventos y resultado idempotente aplicables.

## 6. Codigo y dependencias

- Se mantiene la foundation .NET 10 (`net10.0`) y la estructura modular vigente
  mientras una decision aprobada no indique lo contrario.
- `TrazActivo.ControlPlane.Domain` depende solo de BCL y dependencias
  expresamente aprobadas; no depende de Application, Infrastructure, ASP.NET,
  Azure ni API.
- `TrazActivo.ControlPlane.Application` puede depender de Domain y de
  `TrazActivo.Tenancy.Abstractions` cuando exista necesidad concreta. No depende
  de Infrastructure, ASP.NET ni Azure.
- `TrazActivo.ControlPlane.Infrastructure` implementa ports/adapters de
  Application/Domain. No contiene reglas de negocio ni introduce Data Plane
  durante el alcance de Sprint 1.
- `TrazActivo.Api` es el composition root. Depende de Application e
  Infrastructure y evita dependencia directa de Domain; endpoints y middleware
  traducen HTTP, no alojan invariantes.
- `TrazActivo.Tenancy.Abstractions` permanece independiente de Control Plane,
  Data Plane, Infrastructure y API.
- Los architecture tests y la allowlist de `ProjectReference` son controles
  obligatorios; no se debilitan para hacer pasar una dependencia nueva.
- No se crean abstracciones, proyectos, librerias o patrones sin una necesidad
  actual demostrable. Se eliminan interfaces sin uso real.
- Se conserva el alcance aprobado. No hay scope creep, refactors no relacionados
  ni funcionalidades anticipadas para resolver trabajo futuro.

## 7. Contratos API

- Las APIs son REST versionadas: `/control/v1` para Control Plane y `/api/v1`
  para Data Plane.
- Cada endpoint declara permiso, scope, validaciones, errores, auditoria y
  step-up aplicables.
- Se usa Problem Details con codigo estable, HTTP status, detalle seguro y
  `CorrelationId`.
- `Idempotency-Key` es obligatorio en creaciones y comandos de alto impacto.
  El mismo key/fingerprint reproduce el resultado; distinto fingerprint genera
  conflicto y nunca deja ejecucion parcial.
- Optimistic concurrency usa version y `ETag`/`If-Match` cuando corresponda. Dos
  escrituras concurrentes no pueden producir perdida silenciosa.
- OpenAPI describe el comportamiento real: autorizacion, headers, request/response
  schemas, status codes, Problem Details y headers de respuesta. Un HTTP 200 del
  documento no basta como contract test.
- Antes de implementar un endpoint critico se documentan metodo/ruta, tenant y
  entity/book scope, permiso, schemas, validaciones, errores, auditoria,
  idempotencia, concurrencia, transicion y step-up.

## 8. Pruebas y evidencia

- Todo bug corregido agrega una prueba de regresion que demuestra el fallo y la
  garantia, no solo detalles triviales de implementacion.
- Build, tests y format deben pasar antes de declarar trabajo terminado.
- Unit tests protegen invariantes; integration/contract tests protegen
  comportamiento observable; architecture tests protegen limites reales de
  solucion, proyectos y assemblies.
- Las pruebas multi-tenant aplicables son P0 y bloquean release. Deben cubrir
  controles efectivos sobre API, DB, storage, cache, busqueda, jobs, exports,
  backups, logs y recursos conforme esas superficies existan.
- No se declara un requisito aprobado mediante tests triviales, parciales,
  falsos positivos o pruebas que no ejercen el control real.
- Concurrencia e idempotencia incluyen pruebas coordinadas; no basta ejecutar
  llamadas secuenciales y denominarlas concurrentes.
- Policy Engine se prueba sin UI ni infraestructura contra golden dataset
  aprobado. Integraciones requieren contract tests; migraciones concilian
  conteos, sumas, hashes y muestras.

## 9. Infraestructura y produccion

- No se presenta como production-ready ningun adaptador, autenticacion, health
  check, selector, store o configuracion limitado a Development/Testing.
- Los adaptadores en memoria solo se usan en Development/Testing y su registro
  debe fallar de forma segura en Production.
- No se implementa infraestructura Azure productiva, IaC o pipeline productivo
  mientras sus ADR/TBD sigan pendientes.
- No se inventan SLA, RPO/RTO, sizing, volumen, retencion, soporte, SKU,
  zonalidad ni region secundaria.
- Produccion no comparte datos, redes ni secretos con ambientes no productivos.
  Datos productivos solo se reutilizan mediante sanitizacion aprobada.

## 10. Definition of Done por modulo

Conforme al Apendice E del PDD, un modulo se considera terminado solo cuando
cumple todas las condiciones aplicables:

- modelo de dominio y estados aprobados;
- requisitos con ID y trazabilidad;
- APIs documentadas y contract tests;
- permisos, scopes y eventos de auditoria;
- errores de usuario y tecnicos;
- migraciones versionadas;
- unit, integration, security y E2E segun riesgo;
- casos multi-tenant aplicables;
- accesibilidad verificada;
- observabilidad y runbook;
- documentacion de operacion;
- ningun TBD P0 abierto del modulo.

Si una condicion aun no aplica por alcance, se registra expresamente como no
aplicable o parcial; no se considera satisfecha ni aprobada por omision.

## 11. Flujo obligatorio de trabajo del agente

### Antes de implementar

1. Leer el requisito PDD aplicable, ADR aceptados y documentacion derivada.
2. Revisar `docs/governance/tbd-register.md`, decision gates y bloqueos del
   modulo.
3. Identificar IDs de requisito, alcance, invariantes, permisos, auditoria,
   errores y pruebas aplicables.
4. Verificar `git status` y conservar cambios preexistentes no relacionados.
5. Declarar limites y no ampliar el sprint ni resolver trabajo futuro.
6. No modificar el PDD salvo instruccion explicita.

### Durante la implementacion

1. Mantener cambios acotados a los modulos y requisitos aprobados.
2. Preservar separacion de capas, Control/Data Plane y aislamiento por tenant.
3. Tratar cancelacion, fallo, concurrencia e idempotencia sin estado parcial.
4. Agregar pruebas negativas y de regresion proporcionales al riesgo.
5. Detener el area bloqueada y reportar cualquier decision faltante; continuar
   solo con trabajo no bloqueado.

### Despues de implementar

1. Ejecutar `dotnet build`.
2. Ejecutar `dotnet test` y reportar resultados por proyecto.
3. Ejecutar `dotnet format --verify-no-changes`.
4. Ejecutar `git diff --check` y `git status`.
5. Confirmar que el PDD y artefactos fuera de alcance permanecen intactos.
6. Revisar que no existan secretos, credenciales, tokens, OTP, connection
   strings, dumps ni archivos temporales.
7. Actualizar trazabilidad, contratos, matriz MT y documentacion aplicable sin
   sobredeclarar requisitos parciales.
8. Informar TBD, riesgos, deuda tecnica, validaciones no ejecutadas y cualquier
   diferencia respecto del alcance aprobado.
9. No hacer commit ni push salvo instruccion explicita del usuario.

## Fuentes de esta politica

- `TrazActivo_PDD_v1.0_RC1.md`, especialmente secciones 03-09, 14, 23-26,
  32, 35, 39, 41, 44, 46, ADR-001 a ADR-014 y Apendice E.
- `docs/architecture/adr/` y documentos de arquitectura aprobados.
- `docs/security/security-baseline.md`.
- `docs/api/common-contract.md`.
- `docs/testing/strategy.md` y `docs/testing/multi-tenant-matrix.md`.
- `docs/governance/decision-gates.md`, `tbd-register.md` y trazabilidad.
- `docs/accounting/golden-dataset-governance.md`.
- Restricciones de alcance aprobadas para Sprint 0 y Sprint 1.
