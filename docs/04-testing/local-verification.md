# Verificación local

## Preflight

```powershell
node --version
npm --version
docker version
git status
```

El script `scripts/preflight.ps1` debe validar versiones, puertos, acceso a registry, Docker, variables y ausencia de secretos accidentales.

## Preparación

```powershell
npm ci
npm run local:up
npm run db:generate
npm run db:migrate:local
npm run db:seed:local
```

## Smoke

```powershell
npm run dev
```

Validar:

- portal y control cargan;
- `/docs` expone OpenAPI;
- health endpoints;
- Cliente A y B resuelven DB distintas;
- un asset de A no aparece en B;
- CorrelationId recorre frontend/API/audit.

## Suite

```powershell
npm run verify
```

## Cierre

```powershell
npm run local:down
```

## Evidencia

Guardar en `artifacts/test-results/`:

- resultado por suite;
- OpenAPI diff;
- matriz MC;
- E2E report;
- logs sanitizados;
- migration status de platform/A/B.
