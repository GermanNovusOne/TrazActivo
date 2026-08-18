# Backlog inicial v1.1

## Wave 0: preservación

| WP | Resultado | Dependencias | Riesgo |
|---|---|---|---|
| BAS-001 | Tag y respaldo de foundation actual | Ninguna | Medio |
| BAS-002 | Instalar PDD/ADR/AGENTS v1.1 | BAS-001 | Bajo |
| BAS-003 | Eliminar ambigüedades de stack en README/docs vigentes | BAS-002 | Medio |

## Wave 1: foundation TypeScript

| WP | Resultado | Dependencias | Riesgo |
|---|---|---|---|
| FND-001 | npm workspaces, tsconfig y scripts raíz | BAS-002 | Medio |
| FND-002 | portal-web y control-web Next.js | FND-001 | Bajo |
| FND-003 | data-api, control-api y worker NestJS | FND-001 | Medio |
| FND-004 | packages domain, policy, contracts, design-system, testkit | FND-001 | Medio |
| FND-005 | Docker Compose y preflight Windows | FND-001 | Medio |

## Wave 2: contratos y datos

| WP | Resultado | Dependencias | Riesgo |
|---|---|---|---|
| API-001 | OpenAPI base Control/Data y Problem Details | FND-003 | Medio |
| API-002 | generación de cliente TypeScript | API-001,FND-002 | Medio |
| DB-001 | Prisma schema Platform DB | FND-003,FND-005 | Alto |
| DB-002 | Prisma schema Client DB inicial | FND-003,FND-005 | Alto |
| DB-003 | migraciones/seed platform, A y B | DB-001,DB-002 | Alto |

## Wave 3: frontera cliente

| WP | Resultado | Dependencias | Riesgo |
|---|---|---|---|
| CLI-001 | Client Catalog repository/service | DB-001 | Alto |
| CLI-002 | Client Resolver | CLI-001,API-001 | Crítico |
| CLI-003 | ClientContext middleware/guard | CLI-002 | Crítico |
| CLI-004 | ClientDataSourceManager con cache acotada | DB-002,CLI-003 | Crítico |
| CLI-005 | suite MC foundation | CLI-003,CLI-004,DB-003 | Crítico |

## Wave 4: walking skeleton AssetItem

| WP | Resultado | Dependencias | Riesgo |
|---|---|---|---|
| AST-001 | AssetItem domain y reglas mínimas | FND-004 | Medio |
| AST-002 | Prisma adapter y migración AssetItem | AST-001,DB-002 | Alto |
| AST-003 | POST/GET assets con OpenAPI | AST-002,CLI-004 | Alto |
| AUD-001 | ClientAuditEvent para AssetItem | AST-003 | Alto |
| UX-001 | listado/alta/ficha inicial Next.js | API-002,AST-003 | Medio |

## Wave 5: verificación y Azure DEV

| WP | Resultado | Dependencias | Riesgo |
|---|---|---|---|
| QA-001 | integration/contract/E2E/A11Y skeleton | UX-001,CLI-005 | Alto |
| OBS-001 | logging, traces, CorrelationId y health | AST-003 | Medio |
| CICD-001 | GitHub Actions verify/build | QA-001 | Medio |
| AZR-001 | ADR hosting + IaC DEV | CICD-001,OBS-001 | Alto |
| AZR-002 | despliegue DEV y smoke | AZR-001 | Alto |

## Regla de ejecución

El Planning Agent debe convertir cada fila en una Work Package completa antes de autorizar desarrollo. No debe implementar una wave completa en un único PR.
