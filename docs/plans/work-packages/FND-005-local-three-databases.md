# FND-005 — Entorno local con Platform DB y Client DB A/B

## Estado

`DONE`

Autorización humana registrada el 2026-08-19 exclusivamente para FND-005, después de reconciliar la
topología local, el aislamiento observable, el manejo de secretos, las operaciones destructivas y la
superficie de integración. La implementación comenzó el 2026-08-19 en
`codex/FND-005-local-three-databases`. `BLK-FND-005-001` quedó resuelto mediante validación runtime
real. El cierre como `DONE` fue aprobado humanamente después del merge del PR #14 mediante
`4084e3a436ef62636eb4ec523f95dd6c39967696` y de la validación post-merge satisfactoria. Este cierre
no autoriza DB-001, DB-002, DB-003 ni ninguna otra Work Package.

## Objetivo

Proveer infraestructura local reproducible con tres bases SQL Server reales y controles de readiness,
reset seguro y diagnóstico para las pruebas de aislamiento.

## Resultado observable

`npm run local:up` levanta el proyecto Docker Compose canónico de TrazActivo y deja disponibles
Platform DB, Client DB A y Client DB B como tres databases reales y distintas. La evidencia distingue
nombre, identidad, `DatabaseReference`, target de conexión a nivel de database y usuario local de cada
DB. Las tres bases pueden compartir una instancia, host y puerto SQL Server; esa coincidencia no
reemplaza ni debilita la separación por database. Ningún secreto efectivo queda en Git o en logs.

## Requisitos relacionados

- EPIC-FND-05.
- SAAS-001.
- PDD 44.6.
- Gate 1 y entrada de Gate 2.

## ADR relacionados

- ADR-018.
- ADR-020.
- ADR-021.

## Gate de entrada

- FND-001 está `DONE`; dependencia satisfecha.
- La revisión humana de entrada del 2026-08-19 autorizó exclusivamente FND-005.

FND-002, FND-003 y FND-004 también están `DONE`, pero no se agregan como dependencias nuevas de
FND-005.

## Gate de salida

- Tres databases SQL Server reales disponibles, identificadas y verificadas como destinos separados
  para las migraciones independientes de WPs futuras.
- Proyecto `local-infrastructure` de integración ejecutado contra esas bases reales.

## Scope

### Incluye

- Docker Compose con un proyecto y archivos canónicos del repositorio, SQL Server local, health checks
  por database y nombres inequívocos.
- Una instancia SQL Server local puede alojar `platform_catalog`, `trazactivo_client_a` y
  `trazactivo_client_b`; no se requieren tres instancias o containers para aparentar separación física.
- Imagen SQL Server con tag versionado o digest reproducible, compatible con Windows 11, Docker Desktop
  con WSL2 y la semántica necesaria del destino Azure SQL. La selección exacta se justifica y registra
  en el reporte de implementación; `latest` queda prohibido.
- Preflight Windows y Docker, comandos `local:up`, `local:down`, `local:status` y reset de datos locales
  con guardas fail-closed.
- Identidad verificable, `DatabaseReference` lógica, target de conexión a nivel de database y
  usuario/credencial local segregados para Platform, A y B.
- Evidencia de que una operación dirigida a A no puede cambiar accidentalmente su target a B.
- Pruebas reales de readiness, identidad e independencia A/B y fixtures negativas de las guardas
  destructivas.
- Activación real y exclusiva del proyecto `local-infrastructure` dentro de la suite de integración.

### No incluye

- Schemas Prisma, `@prisma/client`, migraciones o seeds de negocio.
- Client Catalog, Client Resolver, `ClientContext` funcional o ClientDataSourceManager.
- Azure SQL, Azurite, mensajería u otra infraestructura fuera del entorno de DB local.
- Storage o servicios no requeridos por FND-005.
- Borrar recursos fuera del proyecto Compose canónico.

## Dependencias

- FND-001 — `DONE`; satisfecha.

## Precondiciones

- Windows 11.
- Docker Desktop con WSL2 disponible.
- PowerShell 7.
- Docker Engine y Docker Compose instalados, disponibles y respondiendo.
- Puertos locales validados antes de crear recursos.
- Señal explícita del ambiente local; no se infiere por ausencia de configuración ni se adopta por
  defecto para una acción destructiva.
- Secretos efectivos suministrados fuera de Git.
- Toda acción destructiva resuelve y verifica exactamente el archivo, proyecto, nombres y labels
  Compose canónicos del repositorio antes de modificar recursos.

El preflight debe fallar con un diagnóstico claro si Docker Engine o Compose no están disponibles o no
responden. No modifica ni intenta habilitar Docker Desktop, WSL2 o la configuración del host.

## Supuestos

- El entorno local es desechable y no representa SLA, capacidad, aislamiento físico ni disponibilidad
  Azure.
- La unidad de aislamiento de FND-005 es la database. Una instancia SQL Server compartida es válida
  sólo si mantiene tres databases reales, targets lógicos independientes y usuarios/referencias
  separados.

## Bloqueos/TBD

- `BLK-FND-005-001` — `RESOLVED` el 2026-08-19. Historia preservada: Docker Engine inicialmente no
  respondía; el operador recuperó Docker Desktop, el contexto `desktop-linux` y Engine 29.6.1. Al
  reanudar, `local:up` expuso `Msg 911` porque creación de databases, configuración de logins y users
  compartían un mismo batch SQL. El bootstrap se separó en creación y verificación de databases,
  configuración y verificación de logins, y verificación de target antes de configurar y verificar
  cada user. Se agregaron regresiones de orden, arranque desde cero e idempotencia. Después pasaron el
  runtime real Platform/A/B, dos `local:up`, aislamiento e independencia A/B, integración real,
  architecture 50/50, clean checkout y validación post-merge con `npm run verify` exit 0. No fue una
  incompatibilidad SQL Server/Azure SQL ni requirió Decision Request.
- `TBD-DEV-002`, `TBD-DEV-003` y `TBD-DATA-001` permanecen sin cerrar y fuera del alcance local; no
  bloquean FND-005.
- La revisión del 2026-08-19 no encontró una incompatibilidad relevante entre SQL Server local y Azure
  SQL que afecte al Walking Skeleton. No se requiere Decision Request para autorizar FND-005.
- Si la implementación descubre que la imagen SQL Server reproducible o una diferencia semántica con
  Azure SQL altera este alcance, debe registrar un Decision Request y detener la parte afectada; no se
  selecciona silenciosamente otro motor.

## Diseño

### Componentes afectados

- Docker Compose, scripts locales y testkit de infraestructura.

### Topología local aprobada

| Destino | Database SQL Server | Referencia y acceso |
|---|---|---|
| Platform DB | `platform_catalog` | `DatabaseReference`, target de database y usuario local propios |
| Client DB A | `trazactivo_client_a` | `DatabaseReference`, target de database y usuario local propios |
| Client DB B | `trazactivo_client_b` | `DatabaseReference`, target de database y usuario local propios |

La topología mínima puede usar un único servicio/instancia SQL Server del proyecto Compose. No se
exige un `host:port` distinto por database. La prueba debe consultar la identidad real de cada database
y rechazar una implementación que use una sola database con schemas A/B.

### Cambios esperados

- Proyecto Docker Compose canónico, readiness por database, guía de recuperación y comandos locales
  fail-closed.
- Prueba de indisponibilidad dirigida a la database o referencia A que demuestre que el estado de B se
  evalúa de forma independiente; no es necesario derribar una instancia compartida para simular
  separación física.

### Frontend

- No aplica.

### API/OpenAPI

- No aplica.

### Application/Domain/Policy

- No aplica.

### ClientContext y aislamiento

- Las DB no se seleccionan desde navegador y no se implementa `ClientContext`; sólo se preparan
  destinos para servicios backend locales de WPs futuras.
- Cada probe u operación de test usa una referencia explícita y comprueba que la identidad observada
  coincide con la database esperada antes de continuar.

### Prisma y migraciones

- Prepara destinos SQL Server; no crea schemas Prisma, migraciones ni seeds.

### Permisos y secretos

- Los usuarios y credenciales locales están segregados por database según el runbook y con el mínimo
  privilegio necesario para este alcance.
- Passwords reales, password de `sa`, tokens, connection strings y credenciales efectivas se resuelven
  fuera de Git.
- `.env.example` sólo puede versionar nombres o placeholders no secretos, nombres de DB, nombres de
  servicio y puertos de ejemplo. Los valores efectivos se suministran mediante un mecanismo local
  ignorado por Git y los comandos no imprimen valores sensibles.

### Eventos y auditoría

- No aplica.

### Observabilidad

- Health por database, puerto y servicio sin exponer credenciales o connection strings.
- Los diagnósticos identifican el target lógico mediante nombres no secretos y redactan cualquier
  valor efectivo.

## Contratos API

- No aplica.

## Persistencia

- Tres databases SQL Server distintas y recreables. Una única instancia puede alojarlas; una única
  database dividida en schemas no satisface el aislamiento.

## Integración local real

- `npm run test:integration -- --project local-infrastructure` deja de ser
  `NOT_IMPLEMENTED_SCOPE` y ejecuta pruebas reales contra el Compose y las tres databases de FND-005.
- El proyecto verifica existencia e identidad de Platform/A/B, referencias y targets diferenciados,
  independencia de health A/B, rechazo de una sola database con schemas A/B, redacción de secretos y
  diagnóstico de colisión de puerto.
- El contrato raíz de integración debe ejecutar o despachar este proyecto real y propagar su fallo.
- Los proyectos de integración pertenecientes a WPs futuras conservan explícitamente
  `NOT_IMPLEMENTED_SCOPE`; ni la suite completa ni esos proyectos se presentan como implementados por
  el único éxito de `local-infrastructure`.

## Reset y `local:down` seguros

- El reset exige una señal local explícita y valida el Docker endpoint/context como local.
- Resuelve el archivo Compose canónico dentro del repositorio y el project name fijado por ese
  artefacto; rechaza paths, archivos o project names suministrados arbitrariamente.
- Inspecciona nombres y labels de todos los recursos objetivo y falla antes de borrar si falta una
  coincidencia o aparece un recurso no reconocido.
- No se conecta a un Docker host remoto y no acepta overrides que redirijan el target.
- No usa `docker system prune`, eliminación global de containers/volumes ni globs de alcance abierto.
- `local:down` sólo detiene o remueve recursos identificados del proyecto Compose canónico. Los datos o
  recursos externos nunca son target; la eliminación de datos locales corresponde al reset guardado.
- Fixtures negativas prueban ambiente no local, endpoint remoto, path/project name arbitrario, labels
  inesperados y recursos externos.

## Archivos o módulos esperados

- Compose local, `.env.example` sin secretos, preflight Windows, scripts `local:*`, pruebas de guardas
  y testkit de readiness/identidad de DB.

## Criterios de aceptación

- [x] `local:up` es idempotente y tiene health verificable por database.
- [x] SQL Server local crea `platform_catalog`, `trazactivo_client_a` y `trazactivo_client_b` como tres
  databases reales con identidades distintas.
- [x] Platform, A y B poseen `DatabaseReference`, target a nivel de database y usuario local propios;
  compartir host/puerto no invalida el criterio.
- [x] Una operación dirigida a A verifica A y no puede cambiar accidentalmente su target a B.
- [x] Una indisponibilidad dirigida a A no se presenta como indisponibilidad de B.
- [x] Una sola database con schemas A/B falla el control de aceptación.
- [x] No hay secretos, credenciales efectivas o connection strings reales en Git ni en logs.
- [x] Un clon limpio reproduce el entorno sin pasos ocultos, dado el secreto local documentado.
- [x] El preflight falla claramente si Docker Engine/Compose no están disponibles o no responden y no
  modifica Docker Desktop ni WSL2.
- [x] La imagen SQL Server usa tag versionado o digest reproducible, nunca `latest`, y queda registrada
  en el reporte de implementación.
- [x] `local-infrastructure` ejecuta integración real sin convertir proyectos futuros en PASS.

## Casos negativos

- [x] Colisión de puertos falla con diagnóstico claro y sin revelar credenciales.
- [x] Reset sin señal local, contra endpoint remoto o con path/project name no canónico es rechazado.
- [x] Reset o `local:down` contra labels/nombres no reconocidos falla antes de borrar recursos.
- [x] Una sola database con schemas A/B no satisface aceptación.
- [x] La indisponibilidad de A no marca B como indisponible cuando B sigue accesible.
- [x] Los logs y diagnósticos no contienen passwords, tokens ni connection strings efectivas.

## Pruebas obligatorias

```text
npm run local:preflight
npm run local:up
npm run local:status
npm run test:integration -- --project local-infrastructure
npm run test:architecture
npm run verify
npm run local:down
```

Además, las pruebas automatizadas deben cubrir las guardas negativas de reset sin apuntar a recursos
externos. El reporte registra los comandos, códigos de salida, inventario/labels, identidad de las DB,
resultado de indisponibilidad A/B y checkout desde clon limpio.

## Comandos locales

- Los comandos destructivos sólo operan contra recursos locales resueltos y validados del proyecto
  Compose canónico.
- `local:down` no equivale a reset global. El reset de datos es un comando separado, explícito y
  protegido por las guardas anteriores.

## Definition of Done

- [x] Integration real de `local-infrastructure` y architecture tests pasan sin falso PASS.
- [x] Platform DB y Client DB A/B reales e independientes quedan verificadas por identidad.
- [x] Health por database, preflight y runbook local quedan documentados y probados.
- [x] Reset y `local:down` fail-closed quedan respaldados por fixtures negativas.
- [x] Imagen SQL Server reproducible y selección exacta registradas en el reporte.
- [x] Clon limpio levanta y verifica el entorno con secretos suministrados fuera de Git.
- [x] No hay secretos ni valores sensibles en repositorio o logs.
- [x] No existe TBD P0 aplicable; los TBD Azure permanecen abiertos y fuera de alcance.

## Evidencia esperada

- Inventario de proyecto/servicio/container y labels Compose.
- Tag o digest exacto de la imagen SQL Server.
- Consultas de identidad que prueben las tres databases y sus targets/referencias separados.
- Health independiente y prueba de indisponibilidad dirigida a A sin falso fallo de B.
- Fixtures negativas de topología, puerto, reset, endpoint remoto y redacción de secretos.
- Bootstrap y verificación desde clon limpio.
- Resultado real del proyecto de integración `local-infrastructure`, con estados futuros preservados.

## Evidencia de cierre

- PR #14 implementado y mergeado en `architecture/v1.1-typescript` mediante
  `4084e3a436ef62636eb4ec523f95dd6c39967696`.
- Head implementado y commit de evidencia documental:
  `21a90e430a73d1ed9855720ea3da415ca54f1ebb`.
- Commit candidato validado en clean checkout:
  `ea0e14cee984d7cf2bc672d21a0233449c91803b`.
- Reporte de implementación y cierre: `docs/plans/reports/FND-005-report.md`.
- Clean checkout: PASS; partió limpio y sin dependencias, secretos u outputs preexistentes, ejecutó
  instalación, preflight, reset, runtime, integración, architecture, verify y down, y terminó limpio.
- Validación post-merge: `npm ci`, preflight, reset, status, integración real, architecture 50/50,
  unit 26/26, a11y 5/5, build, backend-smoke y `npm run verify`: exit 0.
- Identidades verificadas: `platform-local` → `platform_catalog`, `client-a-local` →
  `trazactivo_client_a` y `client-b-local` → `trazactivo_client_b`.
- A→B, B→A y Platform→A fueron denegados; B permaneció disponible durante la indisponibilidad
  dirigida de A y A fue recuperado.
- Los scopes futuros conservaron sus estados explícitos; `git diff --check` terminó exit 0 y el
  working tree post-merge quedó limpio.

## Riesgos

- Confundir instancia compartida con database compartida y simular aislamiento mediante schemas.
- Presentar la independencia de health por database como aislamiento físico o alta disponibilidad.
- Scripts destructivos demasiado amplios o redirigibles a un Docker host externo.
- Filtrar el password de `sa` o connection strings mediante Compose, errores o logs de diagnóstico.
- Elegir una imagen mutable o incompatible con el entorno aprobado.

## Rollback o reversibilidad

- Detener y remover exclusivamente recursos con nombres y labels verificados del proyecto Compose
  canónico. Los datos locales son recreables; ningún recurso externo forma parte del rollback.

## Condiciones de bloqueo

- No queda una condición de bloqueo aplicable al cierre de FND-005; `BLK-FND-005-001` permanece
  históricamente `RESOLVED`.

- No puede demostrarse que Platform, A y B son databases reales distintas.
- Una operación o probe puede resolver A como B, o una caída dirigida a A se confunde con B.
- Preflight, reset o `local:down` no protegen fail-closed recursos externos y endpoints no locales.
- El proyecto `local-infrastructure` no ejecuta integración real o convierte scopes futuros en falso
  PASS.
- La imagen reproducible elegida evidencia una incompatibilidad semántica relevante con Azure SQL;
  requiere Decision Request antes de continuar la parte afectada.
