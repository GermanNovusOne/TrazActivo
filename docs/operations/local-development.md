# Desarrollo local

## Prerrequisitos

- .NET SDK 10.0.400 o un patch compatible permitido por `global.json`.
- Node 24 y npm 11 compatibles con `src/TrazActivo.Web/package.json`.
- Entorno `Development` o `Testing`.

No se requieren connection strings, secretos, Azure CLI ni infraestructura
externa para Sprint 1.5.

## Comandos

```powershell
npm ci --prefix src/TrazActivo.Web
npm run lint --prefix src/TrazActivo.Web
npm run test --prefix src/TrazActivo.Web
npm run build --prefix src/TrazActivo.Web
dotnet restore TrazActivo.sln
dotnet build TrazActivo.sln
dotnet test TrazActivo.sln
dotnet run --project src/TrazActivo.Api/TrazActivo.Api.csproj
```

El perfil local publica HTTP en `http://localhost:5108`. El ambiente DEV actual
es `https://dev.trazactivo.cl/`. Superficies anónimas:

- `GET /`
- `GET /login`
- `GET /preview`
- `GET /health/live`
- `GET /health/ready`
- `GET /openapi/v1.json`

Los endpoints `/control/v1` devuelven 401 sin una identidad productiva. Esto es
intencional: Sprint 1 no implementa autenticación real. Los handlers sintéticos
sólo se registran desde los proyectos de test.

Aunque una identidad autorizada invoque provisioning, la aplicación local no
tiene un selector de stamp configurado y responde 503. Los tests sustituyen el
puerto para verificar exclusivamente la transición hasta Provisioning.

El proceso no debe iniciarse con `ASPNETCORE_ENVIRONMENT=Production`: la
foundation rechaza los adaptadores en memoria para evitar su uso accidental.
