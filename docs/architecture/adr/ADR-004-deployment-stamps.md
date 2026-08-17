# ADR-004: Deployment Stamps

- Estado: Accepted como arquitectura evolutiva
- Fecha de baseline: 2026-08-17

## Decisión

Diseñar el stamp como unidad de despliegue y capacidad. Un tenant mantiene sus
identificadores al migrar y el Tenant Catalog actualiza su asignación mediante
workflow auditable.

## Consecuencias

- Recursos y telemetría incluyen `DeploymentStampId`/`StampId`.
- El routing no se deriva de datos enviados por frontend.
- La migración exige validación, invalidación de cache, smoke tests y rollback.
- Sprint 0 define el contrato; no provisiona stamps productivos.

Fuente: PDD ADR-004, secciones 04.9 y 38.5.
