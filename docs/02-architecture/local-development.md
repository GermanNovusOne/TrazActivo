# Desarrollo local en Windows

## Objetivo

Permitir que Germán o un desarrollador clone el repositorio, levante la plataforma, pruebe Cliente A y Cliente B con bases separadas y ejecute la verificación completa antes de Azure.

## Requisitos

- Windows 11.
- Git.
- Node.js en la versión mayor aprobada y fijada por el repositorio.
- npm en la versión fijada por lockfile/toolchain.
- Docker Desktop con WSL2.
- PowerShell 7.
- Visual Studio Code.
- Azure CLI para despliegues, no para el ciclo local básico.

## Servicios locales

```text
sqlserver
  platform_catalog
  trazactivo_client_a
  trazactivo_client_b
```

FND-005 entrega exclusivamente SQL Server local. Azurite, mensajería, schemas Prisma, migraciones y
seeds siguen fuera de alcance hasta que sus Work Packages sean autorizadas.

Las tres bases viven en una instancia SQL Server local administrada por el proyecto Compose
`trazactivo-local-fnd005`. Son databases distintas y tienen usuarios, referencias y targets de
database separados. Compartir host y puerto no permite sustituirlas por schemas dentro de una sola
database.

La imagen queda fijada en:

```text
mcr.microsoft.com/mssql/server:2022-CU26-ubuntu-22.04@sha256:ba4c8329f48fb8f02e1416be6a930ebfd71268caee78aa985f3af4315e457c89
```

## Variables

`.env.example` contiene sólo señales locales, puerto de ejemplo y placeholders vacíos:

```text
TRAZACTIVO_LOCAL_ENV=development
TRAZACTIVO_LOCAL_CONFIRMATION=FND-005
TRAZACTIVO_SQL_PORT=14333
MSSQL_SA_PASSWORD=
TRAZACTIVO_PLATFORM_DB_PASSWORD=
TRAZACTIVO_CLIENT_A_DB_PASSWORD=
TRAZACTIVO_CLIENT_B_DB_PASSWORD=
```

Los cuatro passwords efectivos se suministran mediante el entorno del proceso o una copia local
`.env.local`, ignorada por Git. Deben ser distintos, tener al menos 16 caracteres y combinar
mayúscula, minúscula, dígito y uno de `!%+-=@_`. Los comandos no imprimen passwords ni connection
strings. Nunca se agrega `.env.local` al repositorio.

## Flujo esperado

```powershell
npm ci
npm run local:preflight
npm run local:up
npm run local:status
npm run test:integration -- --project local-infrastructure
npm run local:reset
npm run test:integration -- --project local-infrastructure
npm run local:down
```

`local:up` crea únicamente las tres databases y sus usuarios técnicos locales; no crea schemas de
aplicación, tablas, migraciones ni datos de negocio. `local:down` elimina container y network
canónicos pero conserva el volumen. `local:reset` valida nombres y labels, elimina sólo el volumen
canónico y reconstruye las tres databases.

Los scripts no aceptan argumentos de project, archivo Compose o target de database. También rechazan
`DOCKER_HOST`, overrides Compose, contextos no canónicos y recursos con labels inesperadas. El único
contexto permitido es `desktop-linux` con endpoint local
`npipe:////./pipe/dockerDesktopLinuxEngine`.

Puertos propuestos:

```text
portal-web     http://localhost:3000
control-web    http://localhost:3001
data-api       http://localhost:4000
data swagger   http://localhost:4000/docs
control-api    http://localhost:4001
control docs   http://localhost:4001/docs
```

## Seed local futuro — no implementado por FND-005

El seed crea:

- Cliente A activo;
- Cliente B activo;
- una membership por cliente;
- dos LegalEntity;
- datos de activo distinguibles;
- un usuario con acceso a A;
- un usuario con acceso a B;
- un usuario multi-cliente para probar cambio seguro.

No se utilizan datos productivos. Este seed pertenece a WPs posteriores; FND-005 no crea estos datos
ni habilita sus comandos.

## Verificación

```powershell
npm run verify
```

Debe ejecutar formato, lint, typecheck, unit, architecture, integration, contract, multi-client, golden, E2E, accesibilidad y build.

Desde FND-005, el proyecto `local-infrastructure` es integración real contra SQL Server. Los proyectos
de integración futuros conservan `NOT_IMPLEMENTED_SCOPE` hasta su autorización.

## Troubleshooting FND-005

- `FND005_DOCKER_ENGINE_UNAVAILABLE`: iniciar Docker Desktop manualmente y esperar que el Engine Linux
  responda; los scripts no lo inician ni cambian WSL2.
- `FND005_PORT_COLLISION`: liberar el puerto configurado o elegir otro puerto local válido mediante
  `TRAZACTIVO_SQL_PORT`; no cambiar project, Compose file o nombres de database.
- `FND005_SECRET_*`: suministrar cuatro passwords efectivos, distintos y conformes a la política,
  fuera de Git.
- `FND005_RESOURCE_*`: inspeccionar los recursos homónimos. Los scripts se detienen si nombres, project
  o labels no coinciden y nunca adoptan el recurso encontrado.
- `FND005_SQL_FAILED`: revisar health del container con herramientas Docker sin copiar passwords o
  connection strings a tickets o logs.

## Fallo seguro futuro de aplicación

La aplicación no debe iniciar en modo production si:

- falta Platform DB;
- el Client Catalog no está disponible;
- una `DatabaseReference` no resuelve;
- se intenta usar un adaptador en memoria no permitido;
- una migración requerida no está aplicada.
