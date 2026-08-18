# Estrategia de pruebas v1.1

## Objetivo

Verificar comportamiento, contrato, aislamiento, precisión, seguridad y despliegue. Una cantidad alta de tests no sustituye evidencia sobre controles reales.

## Capas

| Capa | Herramienta objetivo | Qué protege |
|---|---|---|
| Unit | Vitest | value objects, invariantes, Policy Engine |
| Component | Vitest/Testing Library | componentes Next.js y design system |
| Architecture | reglas automatizadas | límites entre apps/packages/capas |
| Integration | NestJS + Prisma + SQL real | adapters, transacciones, migraciones |
| Contract | OpenAPI + cliente generado | compatibilidad frontend/API |
| Multi-client | DB A/B reales | aislamiento P0 |
| E2E | Playwright | recorridos completos |
| Accessibility | axe + manual | WCAG objetivo |
| Golden | fixtures versionados | cálculos contables |
| Security | SAST/deps/negative tests | auth, IDOR, secrets, injection |
| Migration | bases de prueba | schema y datos |
| Azure smoke | ambiente DEV | routing, secrets, health, telemetry |

## Principios

- Policy Engine se prueba sin NestJS ni Prisma.
- Un bug incorpora regresión.
- Los tests multi-client bloquean release.
- No se simula el aislamiento con una sola DB.
- Contract tests validan documento y comportamiento.
- E2E usa el cliente OpenAPI real o la UI real.
- Tests de concurrencia coordinan solicitudes simultáneas.
- Idempotencia repite el mismo comando y compara el resultado persistido.

## Gates mínimos por tipo de cambio

| Cambio | Gates |
|---|---|
| UI visual | unit/component/a11y/E2E |
| Endpoint | unit/integration/contract/multi-client |
| Domain | unit/architecture/integration |
| Policy Engine | unit/golden/regression |
| Prisma/migration | integration/migration/multi-client |
| Client Resolver | unit/integration/all isolation cases aplicables |
| Azure/IaC | validate/deploy/smoke/observability |

## Evidencia

El pipeline conserva:

- JUnit o reporte equivalente;
- cobertura;
- OpenAPI diff;
- matriz multi-client;
- golden dataset;
- Playwright report;
- accesibilidad;
- security scan;
- migration report.
