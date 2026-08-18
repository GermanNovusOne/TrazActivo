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

azurite
  documentos y archivos locales

messaging adapter
  in-memory o emulador aprobado
```

Las bases A y B pueden vivir en la misma instancia SQL local, pero deben ser bases distintas y tener usuarios/referencias separadas.

## Variables

`.env.example` contiene nombres y valores no secretos de ejemplo:

```text
PLATFORM_DATABASE_URL=
CLIENT_A_DATABASE_URL=
CLIENT_B_DATABASE_URL=
BLOB_ENDPOINT=
OIDC_ISSUER=
APP_ENV=development
```

Los valores reales se guardan en `.env.local`, ignorado por Git. En Azure se reemplazan por referencias seguras.

## Flujo esperado

```powershell
npm ci
npm run local:up
npm run db:generate
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Puertos propuestos:

```text
portal-web     http://localhost:3000
control-web    http://localhost:3001
data-api       http://localhost:4000
data swagger   http://localhost:4000/docs
control-api    http://localhost:4001
control docs   http://localhost:4001/docs
```

## Seed local

El seed crea:

- Cliente A activo;
- Cliente B activo;
- una membership por cliente;
- dos LegalEntity;
- datos de activo distinguibles;
- un usuario con acceso a A;
- un usuario con acceso a B;
- un usuario multi-cliente para probar cambio seguro.

No se utilizan datos productivos.

## Verificación

```powershell
npm run verify
```

Debe ejecutar formato, lint, typecheck, unit, architecture, integration, contract, multi-client, golden, E2E, accesibilidad y build.

## Fallo seguro

La aplicación no debe iniciar en modo production si:

- falta Platform DB;
- el Client Catalog no está disponible;
- una `DatabaseReference` no resuelve;
- se intenta usar un adaptador en memoria no permitido;
- una migración requerida no está aplicada.
