# ADR-017: OpenAPI como contrato

## Estado

Accepted.

## Decisión

NestJS publica OpenAPI para Control Plane y Data Plane. El pipeline genera un cliente TypeScript consumido por Next.js.

## Reglas

- los DTO de backend no se importan directamente al frontend;
- los modelos Prisma no cruzan la API;
- cada endpoint declara autenticación, permiso, scope, errores, idempotencia, concurrencia y auditoría;
- contract tests comparan comportamiento y documento;
- cambios incompatibles requieren versionado.

## Consecuencias

Swagger deja de ser sólo documentación. Es un artefacto de build y un gate del pipeline.
