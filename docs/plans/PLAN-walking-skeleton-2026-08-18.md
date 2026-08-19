# PLAN-walking-skeleton-2026-08-18

## Estado

`DRAFT`

La transición de este plan y de cualquiera de sus Work Packages a `READY` requiere revisión humana
de Germán/Eduardo y el cierre de los bloqueos aplicables. BAS-001, FND-001, FND-002 y FND-003 están
`DONE` por decisiones humanas aprobadas. FND-004 es la única Work Package en `READY`, autorizada
por decisión humana después de resolver `BLK-FND-004-001` mediante la matriz aprobada de packages.
FND-005 y todas las demás Work Packages permanecen `DRAFT` y no están autorizadas para
implementación.

## 1. Decisión o resultado buscado

Evolucionar desde la foundation preservada hacia la baseline TypeScript de TrazActivo v1.1 y demostrar localmente el Walking Skeleton de `AssetItem` de extremo a extremo:

```text
portal-web Next.js
→ cliente TypeScript generado desde OpenAPI
→ data-api NestJS
→ identidad validada
→ ClientResolver
→ ClientCatalog
→ ClientMembership activa
→ ClientContext inmutable
→ Application/Domain
→ ClientDataSourceManager
→ Prisma Client DB obtenido después del contexto válido
→ Client DB A o Client DB B
→ ClientAuditEvent
```

El resultado final debe probar creación, listado y consulta de `AssetItem`, idempotencia, concurrencia, auditoría, aislamiento real entre Client A/B, contrato OpenAPI, UI mínima accesible y `npm run verify` sin controles ficticios.

## 2. Contexto

La foundation anterior queda preservada como evidencia y fuente funcional, pero no es la arquitectura objetivo ni recibe funcionalidad nueva. El alcance termina cuando Gate 3 queda aprobado localmente. Azure DEV, identidad productiva completa, contabilidad, documentos y módulos posteriores no se anticipan.

La rama observada al elaborar el plan fue `planning/walking-skeleton-v1.1`. BAS-001 (tag/respaldo de la foundation anterior) fue ejecutada externamente antes de esta planificación: el tag `foundation-pre-v1.1-typescript-2026-08-18` apunta al commit `ba0a3b5`. Se conserva sólo como evidencia de una precondición satisfecha, no como trabajo pendiente.

## 3. Requisitos y fuentes

| ID | Fuente | Aplicación |
|---|---|---|
| SAAS-001 | PDD v1.1 | Aislamiento de toda operación por Client resuelto server-side |
| SAAS-002 | PDD v1.1 | Client Catalog sin secretos ni datos patrimoniales |
| CLI-001 | PDD v1.1 | ClientContext inmutable, trazable y validado |
| CLI-002 | PDD v1.1 | Cambio de Client sin estado residual |
| SEC-004 | PDD v1.1 | Separación de autenticación, autorización y aprobación |
| SUB-001 | PDD v1.1 | Feature y permiso validados por backend |
| AST-001 | PDD v1.1 | `AssetItem` físico sin contabilidad anticipada |
| API-001 | PDD v1.1 | REST/OpenAPI, Problem Details, idempotencia y concurrencia |
| AUD-001 | PDD v1.1 | `ClientAuditEvent` append-only |
| JOB-001 | PDD v1.1 | Contexto explícito en procesos asíncronos; sólo se prepara el límite, no jobs funcionales |
| NFR-SEC-001 | PDD v1.1 | Cero acceso cruzado en casos MC aplicables |
| NFR-OBS-001 | PDD v1.1 | `CorrelationId` en operación y evidencia |
| NFR-CONC-001 | PDD v1.1 | Sin pérdidas silenciosas por concurrencia |
| NFR-A11Y-001 | PDD v1.1 | UI mínima bajo objetivo WCAG 2.2 AA |
| MC-001/002/003/005/008/009/012/016/017 | PDD v1.1 | Matriz de aislamiento aplicable al skeleton |
| ADR-015..021 | ADR Accepted | Stack, frontera Client, contrato, Prisma, monorepo, local y pruebas |
| DEC-CLI-002 | Decision register | Una DB propia por Client; decisión Aceptada |
| DEC-CLI-003 | Decision register | Client Resolver/Catalog server-side antes de Prisma; decisión Aceptada |
| DEC-DATA-001 | Decision register | Prisma aceptado, sujeto a spike de conexiones/migraciones |
| DEC-TEST-001 | Decision register | Client DB A y B reales obligatorias |

## 4. Alcance

### Incluye

- Evidencia Gate 0/BAS-001 ya satisfecha externamente y prohibición automatizada de extender la foundation .NET.
- Monorepo npm workspaces y toolchain Node.js fijado después de resolver `TBD-DEV-001`.
- Shells mínimos de `portal-web`, `control-web`, `data-api`, `control-api` y `worker`.
- Packages estrictamente necesarios: domain, client-context, authorization, contracts, design-system, observability y testkit; Policy Engine sólo como límite vacío verificable, sin reglas contables.
- OpenAPI Control/Data base, Problem Details y cliente TypeScript generado.
- Entorno local reproducible con Platform DB, Client DB A y Client DB B reales.
- Prisma separado para Platform DB y Client DB.
- Client Catalog, Client Resolver, validación de membership, ClientContext y DataSource Manager.
- Spike obligatorio de conexiones/capacidad de Prisma antes del DataSource Manager definitivo.
- Dominio, casos de uso, persistencia y API mínima de `AssetItem`.
- `GET /api/v1/context`, `POST /api/v1/context/switch`, `POST /api/v1/assets`, `GET /api/v1/assets` y `GET /api/v1/assets/{id}`.
- `Idempotency-Key`, fingerprint, versión/ETag, auditoría y errores seguros.
- UI mínima para cambiar Client, crear, listar y consultar activos.
- Pruebas unitarias, de arquitectura, integración, contrato, multi-client, seguridad negativa, E2E y accesibilidad.
- Orquestación real de `npm run verify`.

### Excluye

- Nueva funcionalidad en .NET o traducción línea a línea de la foundation anterior.
- Contabilidad, depreciación, posting, Policy Engine funcional y publicación de golden datasets.
- Documentos, Blob, inventario, adquisiciones, movimientos, mantenimiento, ERP y jobs de negocio.
- Identidad productiva completa, MFA y step-up de Gate 4; sólo la frontera local aprobada necesaria para membership/context.
- Provisionamiento de clientes, lifecycle completo y TrazActivo Control funcional de Gate 5.
- Azure DEV, IaC, CI/CD remoto, App Service/Container Apps, SKU, sizing, SLA, RPO/RTO y producción.
- Deployment stamps múltiples, restore y migración de stamp.

## 5. Supuestos

- No se usan supuestos para cerrar decisiones humanas. Los únicos hechos de partida son la baseline documental y la existencia de la foundation preservada en Git.
- El Walking Skeleton utiliza `AssetItem` con los campos mínimos documentados y no incorpora campos contables.
- Para el MVP local, `1 cliente comercial = 1 Client = 1 DB propia`.
- La ejecución es local; ningún resultado se presenta como evidencia de Azure, producción, SLA o DR.
- La herramienta Playwright podrá fijar navegadores de prueba sin declarar por ello una matriz comercial de navegadores; el registro autoritativo no asigna un TBD a esa matriz y este plan no inventa uno.

## 6. TBD y bloqueos

| ID | Pregunta/decisión | Impacto y WP bloqueada | Responsable | Momento y evidencia de cierre |
|---|---|---|---|---|
| TBD-PROD-001 | Alcance final del MVP comercial | No bloquea BAS-001, Gate 0 ni foundation; bloquea la fase funcional completa | Product Owner | Antes de cerrar el alcance funcional completo; decisión y backlog comercial actualizados |
| TBD-DEV-001 | Cerrado: Node.js 24 LTS es la versión mayor aprobada | Ya no bloquea FND-001; habilita el primer `npm install`/`npm ci` dentro de su implementación autorizada | Eduardo/Arquitectura | Decisión humana formal del 2026-08-18; reflejada en FND-001 |
| DR-WS-IDENTITY-001 | Mecanismo de identidad controlada exclusivamente local/test para el skeleton | Bloquea integración local de CLI-003 y los recorridos UX/QA; no cierra TBD-SEC-001 ni Gate 4 | Germán/Eduardo con Seguridad/Arquitectura | Antes de CLI-003; aprobación del harness local, guardas de ambiente, threat review y evidencia de que no habilita bypass desplegable |
| TBD-DATA-002 | Límite de conexiones Prisma por instancia/stamp | Bloquea la prueba de carga, conforme al registro; SPI-001 aporta evidencia, pero el skeleton local no lo cierra ni fija sizing productivo | Backend/Data | Antes de la prueba de carga; evidencia y cierre conforme al registro autoritativo |
| DR-WS-DS-001 | Parámetros locales de cache, TTL, pool, cierre, invalidación y reemplazo del DataSource Manager | Bloquea CLI-004 después de SPI-001 | Germán/Eduardo con Arquitectura/Backend/Data | Después de SPI-001; informe, métricas y aprobación explícita de los parámetros locales, sin extrapolarlos a Azure o producción |
| TBD-SEC-001 | Modo de identidad inicial: Entra, local o ambos | No se resuelve en el skeleton; bloquea login piloto/Gate 4 | Seguridad/Producto | Antes del login piloto; decisión definitiva de identidad registrada |
| TBD-SEC-002 | Política MFA y step-up | No bloquea el asset skeleton local; bloquea operaciones críticas/Gate 4 | Seguridad | Antes de operaciones críticas; política aprobada |
| TBD-ACC-001, TBD-ACC-002, TBD-ACC-003, TBD-ACC-004 | Alcance IFRS, fuente 30 días, golden y perfil CGR 2027 | No bloquean Gate 1-3; bloquean Policy Engine contable/Gate 7 según alcance | Contabilidad/Producto/Especialista | Según el registro; evidencia normativa y datasets aprobados |
| TBD-DEV-002, TBD-DEV-003, TBD-DATA-001 | Hosting Azure DEV, IaC y Azure SQL/elastic pool | Fuera de alcance; bloquean Azure DEV/IaC/producción según el registro | DevOps/Arquitectura/Data | Antes de los gates Azure correspondientes |
| TBD-NFR-001, TBD-NFR-002, TBD-NFR-003 | SLA, RPO/RTO y volúmenes | Fuera de alcance local; bloquean producción/DR/load tests | Comercial/Ops/Producto | Antes de producción o pruebas de carga, según el registro |

### Reglas de Decision Request

- Ninguna WP afectada puede pasar a `READY` mientras su TBD/DR aplicable siga abierto.
- `DR-WS-IDENTITY-001` sólo aprueba un harness local/test; no selecciona Entra/local/ambos, no define MFA y no adelanta Gate 4.
- `SPI-001` aporta evidencia a `TBD-DATA-002`, pero no lo cierra: el registro exige resolverlo antes de la prueba de carga. `DR-WS-DS-001` sí debe resolverse después del spike y antes de CLI-004. No se fijan números de pool, capacidad, TTL, cierre o reemplazo en este plan.
- No se agrega ningún TBD de catálogo: DEC-CLI-002 y DEC-CLI-003 están Aceptadas y se aplican directamente.
- Los DR `DR-WS-IDENTITY-001` y `DR-WS-DS-001` son solicitudes de decisión acotadas a este plan. No se listan alternativas porque las fuentes revisadas no documentan alternativas autorizadas; Germán/Eduardo deben aprobar la evidencia indicada para cerrarlas.
- Las decisiones Azure y contractuales se mantienen fuera del plan; no se crea una WP de despliegue.

### Decisiones registradas aplicables

| ID | Estado autoritativo | Efecto en este plan |
|---|---|---|
| DEC-CLI-002 | Aceptada | Una DB propia por Client; no requiere TBD adicional |
| DEC-CLI-003 | Aceptada | Resolver y Catalog server-side antes de Prisma |
| DEC-DATA-001 | Aceptada | Prisma sujeto a spike de conexiones/migraciones |
| DEC-TEST-001 | Aceptada | Platform DB y dos Client DB locales reales |
| DEC-AZR-001 | Propuesta heredada | No autoriza producción ni SKU |
| DEC-AZR-002 | Pendiente | Azure DEV no se planifica hasta resolver hosting |
| DEC-IAC-001 | Propuesta | No se selecciona IaC en este plan |
| DEC-CICD-001 | Propuesta | No se selecciona CI/CD remoto en este plan |

### Estado de bloqueo recalculado

| Clasificación | WP | Motivo |
|---|---|---|
| Finalizada | BAS-001 | `DONE`; tag externo `foundation-pre-v1.1-typescript-2026-08-18` y commit preservado `ba0a3b5` como evidencia |
| Finalizada | FND-001 | `DONE`; PR #1 mergeado en `architecture/v1.1-typescript` y reporte `docs/plans/reports/FND-001-report.md` como evidencia de cierre |
| Finalizada | FND-002 | `DONE`; PR #5 mergeado mediante `a5707e6` y reporte `docs/plans/reports/FND-002-report.md` como evidencia de cierre |
| Finalizada | FND-003 | `DONE`; PR #8 mergeado mediante `860910a` y reporte `docs/plans/reports/FND-003-report.md` como evidencia de cierre |
| Autorizada | FND-004 | `READY`; FND-001 `DONE` y `BLK-FND-004-001` resuelto por decisión humana y matriz aprobada de packages |
| Bloqueo directo futuro | CLI-003 | `DR-WS-IDENTITY-001`; sólo identidad controlada local/test, sin decidir identidad definitiva, MFA ni Gate 4 |
| Bloqueo directo futuro | CLI-004 | `DR-WS-DS-001`, que sólo puede resolverse con evidencia de SPI-001 |
| No bloquea el skeleton local | TBD-PROD-001 | Afecta el alcance final del MVP comercial, no Gate 0 ni foundation |
| No bloquea CLI-004 | TBD-DATA-002 | Conserva su bloqueo autoritativo sobre la prueba de carga; no se declara cerrado |

En el snapshot actual, FND-001, FND-002 y FND-003 están finalizadas, y FND-004 es la única WP en
`READY`. FND-005 y todas las demás WPs permanecen `DRAFT` y no están autorizadas. Ninguna otra WP
puede pasar a `READY` sólo por despejar dependencias: todas requieren revisión humana de
Germán/Eduardo; la ejecución vuelve a detenerse en CLI-003 y CLI-004 si sus DR respectivos siguen
abiertos.

## 7. Arquitectura afectada

- Frontend: shells Next.js separados; `portal-web` consume exclusivamente cliente OpenAPI y limpia todo estado al cambiar Client.
- Backend: NestJS separa Data/Control Plane; controllers sólo traducen HTTP.
- Client Resolver/Catalog: Platform DB y resolución server-side antes de Prisma de negocio.
- Domain/Policy: `AssetItem` en TypeScript puro; Policy Engine sin funcionalidad contable en esta fase.
- Prisma/datos: schemas Platform/Client separados; DB A/B reales; manager acotado y observable.
- Orden runtime: CLI-002 resuelve un candidato y consulta Platform/Catalog sin producir una conexión utilizable. Después de identidad, estado y membership válidos, CLI-003 crea el contexto; sólo entonces CLI-004 revalida server-side el catálogo, obtiene DatabaseReference y entrega Prisma Client DB. El acceso Prisma Platform necesario para catálogo/membership permanece separado y nunca habilita datos de negocio.
- Azure: no afectado en ejecución; sólo se preservan puertos y límites compatibles con la baseline.
- Seguridad: deny-by-default, membership activa, permisos `assets.read/create`, feature Assets, errores sin inferencia cruzada.
- Observabilidad: CorrelationId, métricas de resolución/conexión y auditoría sin secretos.

## 8. Estrategia

1. Conservar BAS-001/Gate 0, FND-001, FND-002 y FND-003 como `DONE`; las tres WPs FND finalizadas
   quedan respaldadas por sus PR y reportes de implementación respectivos.
2. Crear una foundation mínima con shells y límites automatizados, sin lógica funcional anticipada.
3. Levantar tres DB reales, separar schemas Platform/Client y ejecutar DB-003 Platform → A → B.
4. Establecer OpenAPI y el cliente generado antes de construir la UI funcional.
5. Implementar la frontera Client, ejecutar SPI-001 y mantener DataSource Manager bloqueado hasta cerrar DR-WS-DS-001 con evidencia; TBD-DATA-002 permanece abierto para la prueba de carga.
6. Construir `AssetItem` desde dominio hacia HTTP, incorporando idempotencia, concurrencia y auditoría.
7. Agregar UI mínima y demostrar los 18 controles solicitados con DB A/B reales.
8. Cerrar con `npm run verify`; cualquier suite fallida debe producir código distinto de cero.

## 9. Waves

### Wave 0 — Precondición Gate 0 y foundation reproducible

| WP | Resultado | Dependencia | Complejidad | Riesgo |
|---|---|---|---|---|
| BAS-001 | Evidencia externa de tag/respaldo registrada; no ejecutable | Satisfecha externamente | S | Bajo |
| FND-001 | Workspaces, toolchain y contrato de scripts reales | Gate 0 satisfecho,TBD-DEV-001 | M | Alto |
| FND-002 | Shells Next.js y tokens mínimos | FND-001 | M | Medio |
| FND-003 | Shells NestJS Data/Control/worker | FND-001 | M | Medio |
| FND-004 | Packages y architecture tests de límites | FND-001 | M | Alto |

### Wave 1 — Contrato y datos locales

| WP | Resultado | Dependencia | Complejidad | Riesgo |
|---|---|---|---|---|
| API-001 | OpenAPI foundation y Problem Details | FND-003 | M | Medio |
| FND-005 | Platform DB y Client DB A/B locales reproducibles | FND-001 | M | Alto |
| DB-001 | Prisma schema Platform separado | FND-003,FND-005 | M | Alto |
| DB-002 | Prisma schema Client separado | FND-003,FND-005 | M | Alto |
| DB-003 | Migraciones/seed Platform, A y B | DB-001,DB-002,FND-005 | L | Alto |

### Wave 2 — Frontera Client

| WP | Resultado | Dependencia | Complejidad | Riesgo |
|---|---|---|---|---|
| CLI-001 | Client Catalog autorizado y seed A/B | DB-001,DB-002,DB-003,DEC-CLI-002,DEC-CLI-003 | L | Crítico |
| CLI-002 | Client Resolver server-side | CLI-001,API-001 | M | Crítico |
| CLI-003 | Membership validada y ClientContext inmutable | CLI-002,DB-001,API-001,DR-WS-IDENTITY-001 | L | Crítico |
| SPI-001 | Spike Prisma database-per-client con evidencia | CLI-003,DB-002,DB-003 | M | Crítico |
| CLI-004 | ClientDataSourceManager acotado e invalidable | SPI-001,CLI-001,CLI-003,DB-002,DR-WS-DS-001 | L | Crítico |

### Wave 3 — Vertical backend AssetItem

| WP | Resultado | Dependencia | Complejidad | Riesgo |
|---|---|---|---|---|
| CLI-005 | Suite MC foundation de frontera Client | CLI-003,CLI-004,DB-003 | L | Crítico |
| AST-001 | Dominio mínimo AssetItem en TypeScript puro | FND-004 | M | Medio |
| AST-002 | Migración y adapter Prisma de AssetItem | AST-001,DB-002,CLI-004,CLI-005 | L | Alto |
| APP-001 | Casos de uso create/list/get con permisos | AST-001,AST-002,CLI-003 | M | Alto |
| CMD-001 | Idempotencia y concurrencia optimista | APP-001,AST-002 | L | Alto |

### Wave 4 — API, auditoría, UI y contrato

| WP | Resultado | Dependencia | Complejidad | Riesgo |
|---|---|---|---|---|
| AST-003 | POST/GET assets con OpenAPI real | API-001,APP-001,CMD-001,CLI-004 | L | Alto |
| API-002 | Cliente TypeScript generado y drift gate | API-001,AST-003,FND-002 | M | Alto |
| AUD-001 | ClientAuditEvent atómico para creación | AST-003,AST-002,CMD-001,CLI-003 | M | Alto |
| OBS-001 | Logging, trazas, CorrelationId y health locales | AST-003,CLI-004,FND-003 | M | Alto |
| UX-001 | UI mínima y cambio seguro de Client | API-002,AST-003,AUD-001,CLI-003,FND-002 | L | Alto |

### Wave 5 — Verificación y aceptación local

| WP | Resultado | Dependencia | Complejidad | Riesgo |
|---|---|---|---|---|
| QA-001 | Integración, contrato, seguridad, idempotencia y aislamiento AssetItem | API-002,AST-003,CMD-001,AUD-001,OBS-001,CLI-005 | L | Alto |
| QA-002 | E2E, accesibilidad, build y `npm run verify` | UX-001,CLI-005,QA-001 | L | Crítico |

### Trazabilidad con el backlog inicial

- BAS-001 conserva su ID/resultado, pero su ejecución es una precondición externa ya satisfecha y evidenciada. La baseline documental de BAS-002/BAS-003 está presente en el commit actual; cualquier contradicción futura vuelve a bloquear Gate 0.
- FND-001..005, API-001/002, DB-001..003, CLI-001..005, AST-001..003, AUD-001, UX-001 y OBS-001 conservan el significado del backlog. `APP-001`, `CMD-001`, `SPI-001` y `QA-002` son cortes adicionales necesarios para mantener implementación/pruebas acotadas y representar la secuencia técnica obligatoria.
- La fila QA-001 del backlog se descompone en QA-001 (integración/contrato/seguridad sobre sistema real) y QA-002 (E2E/accesibilidad/build/verify); ambas deben cerrar antes de aprobar Gate 3.
- CICD-001, AZR-001 y AZR-002 quedan diferidas fuera del Walking Skeleton local. DEC-CICD-001, DEC-AZR-002, DEC-IAC-001 y TBD-DEV-002/003 impiden seleccionar pipeline, hosting o IaC por supuesto; no se crea una WP Azure en este plan.

## 10. Pruebas

### Mapeo de evidencia obligatoria

| Evidencia solicitada | WP principal |
|---|---|
| A crea/consulta A; B crea/consulta B | QA-001 |
| A no consulta B y B no consulta A | QA-001 |
| Manipulación de ClientId/header/query/body/cookie no cambia DB | CLI-002,QA-001 |
| DatabaseReference sólo desde Catalog después de identidad/membership/estado | CLI-001,CLI-002,CLI-003,CLI-004,CLI-005,QA-001 |
| Prisma Client DB no se obtiene antes de ClientContext válido; Prisma Platform queda limitado a catálogo/membership | FND-004,CLI-003,CLI-004,CLI-005,QA-001 |
| Cambio de Client limpia cache/filtros/datos/branding | UX-001,QA-002 |
| Client suspendido no reutiliza conexión | CLI-005,QA-001 |
| Conexión reemplazada/invalidada se controla y cierra | CLI-004,CLI-005,QA-001 |
| OpenAPI coincide con API | API-002,QA-001 |
| Idempotency-Key igual no duplica; fingerprint distinto da conflicto | CMD-001,QA-001 |
| Creación genera ClientAuditEvent permitido | AUD-001,QA-001 |
| Errores no revelan otro Client | AST-003,OBS-001,QA-001,QA-002 |
| Platform DB y DB A/B participan realmente | FND-005,DB-003,CLI-005,QA-001 |
| Cambio de contexto no reutiliza repository/Prisma/cache/estado | CLI-004,CLI-005,UX-001,QA-002 |
| `npm run verify` falla si falla cualquier suite | FND-001,QA-002 |

### Contrato final de `npm run verify`

Debe orquestar controles reales y propagar el primer código de salida no cero:

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

`test:golden` no puede simular aprobación. En Gate 3 ejecutará un control real de aplicabilidad: debe reportar `NOT_APPLICABLE_SCOPE` porque no existe cálculo/política contable en el Walking Skeleton y debe fallar si detecta una superficie contable publicada sin dataset aprobado. No se contabiliza como PASS contable. Los demás controles son aplicables y deben ejecutar pruebas reales.

## 11. Migraciones y datos

- Platform DB y Client DB tienen schemas Prisma, historiales de migración y comandos separados.
- Platform DB contiene sólo la foundation mínima exigida por PDD, DEC-CLI-002 y DEC-CLI-003; CLI-001 implementa el catálogo sin inventar campos ni un TBD adicional.
- Client DB A y B reciben la misma versión de schema mediante ejecuciones separadas y evidenciadas.
- DB-003 crea sólo referencias/sentinelas técnicos A/B. Las identidades/memberships locales ejecutables se agregan en CLI-003 sólo después de aprobar `DR-WS-IDENTITY-001`; esto no decide el modelo definitivo de identidad.
- `AssetItem`, idempotencia y auditoría llegan mediante migraciones Client DB versionadas.
- Ninguna migración consulta varias Client DB dentro de una transacción de negocio.
- No hay secretos ni connection strings versionadas; las referencias locales usan configuración segura fuera del catálogo.

## 12. Despliegue y rollback

El plan sólo contempla ejecución local. No existe despliegue Azure ni rollback productivo.

- Cada WP cabe en una branch y Draft PR independiente.
- Cambios de schema requieren base desechable de prueba, migración forward y evidencia de reconstrucción local.
- El rollback de aplicación no revierte datos automáticamente; antes de Gate 3 sólo existen datos de prueba recreables.
- Si falla una migración A/B, se detiene el gate y se conserva evidencia; no se marca la versión como conocida por inferencia.
- Si SPI-001 no aporta evidencia suficiente, DR-WS-DS-001 y CLI-004 permanecen bloqueados. Si falla una prueba MC, CLI-005/Gate 2 permanecen bloqueados.

## 13. Evidencia y aceptación

Cada WP entrega un reporte con alcance, diff, comandos, resultados, riesgos, pendientes y referencias. La evidencia final incluye:

El cierre documental de FND-001 queda respaldado por el PR #1 mergeado en
`architecture/v1.1-typescript` y por `docs/plans/reports/FND-001-report.md`. La evidencia humana
aprobada registra `npm ci` exit 0, `npm run verify` exit 0, architecture tests 9/9 y
`git diff --check` exit 0. No se implementó otra WP y ese cierre, por sí solo, no autorizó WPs
posteriores; FND-002 se autoriza mediante una decisión humana separada registrada en este plan.

El cierre documental de FND-002 queda respaldado por el PR #5, el merge commit `a5707e6` y
`docs/plans/reports/FND-002-report.md`. La evidencia humana post-merge aprobada registra
`npm run verify` exit 0, unit 12/12, architecture 14/14, a11y 5/5 sin infracciones axe, builds
independientes exitosos de portal, Control y design-system, `git diff --check` exit 0 y working tree
limpio. Al momento de ese cierre, FND-003, FND-004 y FND-005 no habían sido implementadas ni
autorizadas. La autorización posterior de FND-003 se registra separadamente en su Work Package y
en este plan, sin alterar la evidencia de cierre de FND-002.

El cierre documental de FND-003 queda respaldado por el PR #8, el merge commit `860910a` y
`docs/plans/reports/FND-003-report.md`. La evidencia humana post-merge aprobada registra `npm ci`
exit 0, `npm run verify` exit 0 con `build` antes de `test:backend-smoke`, unit 24/24, architecture
24/24, builds independientes exitosos de Data API, Control API y worker, health HTTP 200 en ambas
APIs, runtime idle correcto del worker, shutdown sin handles abiertos, `git diff --check` exit 0 y
working tree limpio. Al momento de ese cierre, no se había implementado ni autorizado FND-004,
FND-005 ni ninguna WP posterior, y no quedaba ninguna WP en `READY`. La autorización posterior de
FND-004 se registra separadamente en su Work Package y en el estado vigente de este plan.

- bootstrap desde clon limpio documentado;
- OpenAPI Control/Data y diff del cliente generado;
- inventario de Platform DB, Client DB A y Client DB B;
- reporte del spike Prisma y aprobación del diseño;
- matriz MC aplicable con resultados A/B;
- reporte de integración/contrato/idempotencia/auditoría;
- Playwright y accesibilidad;
- logs de `npm run verify` y código de salida;
- demostración UI/API de crear, listar y consultar A/B sin acceso cruzado.

## 14. Riesgos residuales

| Riesgo | Control del plan | Residual |
|---|---|---|
| Versión Node mayor | TBD-DEV-001 cerrado con Node.js 24 LTS; FND-001 `DONE` | Cerrado para FND-001 |
| Catálogo incompleto o con secretos | PDD, DEC-CLI-002/003, schema separado y revisión | Abierto hasta CLI-001/CLI-005 |
| Bypass de identidad DEV llega a producción | DR-WS-IDENTITY-001, architecture/security tests | Abierto hasta decisión |
| Prisma agota conexiones | SPI-001, TBD-DATA-002 y decisión local DR-WS-DS-001 | Riesgo productivo abierto hasta prueba de carga; implementación local bloqueada hasta CLI-004/005 |
| Estado residual al cambiar Client | limpieza UI + invalidación backend + MC-003 | Abierto hasta UX-001/QA-002 |
| API/OpenAPI/cliente divergen | generación reproducible y contract gate | Reducido al cerrar QA-001 |
| Idempotencia no es atómica | persistencia en Client DB y pruebas concurrentes | Abierto hasta CMD-001/QA-001 |
| Auditoría se escribe fuera de transacción | AUD-001 exige atomicidad y regresión | Abierto hasta QA-001 |
| `verify` da falsos positivos | scripts reales, no placeholders, prueba de fallo inducido controlado | Abierto hasta QA-002 |
| Scope creep hacia Azure/contabilidad | exclusiones y gates explícitos | Controlado por revisión |

## 15. Orden de ejecución

### Critical path

```text
Gate 0 / BAS-001 [precondición satisfecha externamente]
→ FND-001 [DONE; PR #1 y reporte de implementación]
→ FND-003 [DONE; PR #8 y merge `860910a`] + FND-005 [DRAFT; sin autorización]
→ DB-001 + DB-002
→ DB-003
→ CLI-001
→ CLI-002 [API-001 en paralelo tras FND-003]
→ CLI-003 [DR-WS-IDENTITY-001]
→ SPI-001
→ DR-WS-DS-001
→ CLI-004
→ CLI-005
→ AST-002 [AST-001 puede adelantarse tras FND-004]
→ APP-001
→ CMD-001
→ AST-003
→ AUD-001 + API-002 + OBS-001
→ UX-001 + QA-001
→ QA-002
```

`TBD-DATA-002` no se inserta como cierre ficticio del critical path local: permanece abierto para la prueba de carga. El path local sí se detiene en `DR-WS-DS-001` hasta aprobar, con evidencia de SPI-001, los parámetros necesarios para CLI-004.

### Paralelización recomendada

- FND-001, FND-002 y FND-003 están `DONE`; FND-004 es la única WP en `READY` tras resolver
  `BLK-FND-004-001`. FND-005 permanece `DRAFT` y sólo podrá avanzar tras autorización humana
  explícita.
- En Wave 1: API-001 puede avanzar tras FND-003; DB-001 y DB-002 pueden avanzar en paralelo después de FND-003/FND-005; DB-003 espera a ambos schemas.
- AST-001 puede adelantarse una vez cerrado FND-004, en paralelo con la frontera Client; AST-002 espera CLI-004/CLI-005 y DB-002.
- En Wave 4: API-002, AUD-001 y OBS-001 pueden avanzar en paralelo después de AST-003; UX-001 empieza cuando se satisfacen sus dependencias. En Wave 5, QA-001 consolida backend/contrato y QA-002 realiza la aceptación final.
- No se paralelizan pasos que alterarían el orden Catalog/Resolver/Membership/Context/DataSource Manager.

## 16. Condición de cierre

El plan se considera completado, no implementado, cuando todos sus WP existen y tienen
trazabilidad, dependencias, pruebas y bloqueos explícitos. En el estado actual, BAS-001, FND-001,
FND-002 y FND-003 están `DONE`. FND-004 es la única WP en `READY`; FND-005 y todas las demás WPs
permanecen `DRAFT` y no están autorizadas. El Walking Skeleton sólo se considera implementado y
aprobado localmente cuando:

- Gate 0, Gate 1, Gate 2 y Gate 3 tienen evidencia humana de salida;
- todos los WP aplicables fueron revisados `DRAFT → READY` antes de ejecutarse y posteriormente cumplieron su DoD;
- los TBD/DR aplicables están cerrados por sus propietarios;
- Client A/B superan los controles de aislamiento con tres DB reales;
- OpenAPI, cliente y comportamiento coinciden;
- `npm run verify` finaliza en cero y se comprobó que falla ante una suite obligatoria fallida;
- golden se registra como `NOT_APPLICABLE_SCOPE`, nunca como PASS contable;
- no se inició Azure DEV ni funcionalidad fuera de alcance.
