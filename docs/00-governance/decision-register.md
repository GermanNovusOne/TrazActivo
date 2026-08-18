# Registro de decisiones v1.1

| ID | Decisión | Estado | Responsable de aprobación | Condición |
|---|---|---|---|---|
| DEC-ARCH-001 | Next.js + React + TypeScript para frontend | Aceptada | Germán/Eduardo | No desarrollar frontend alternativo |
| DEC-ARCH-002 | NestJS + TypeScript para backend | Aceptada | Germán/Eduardo | No desarrollar nueva baseline en .NET |
| DEC-ARCH-003 | REST + Swagger/OpenAPI como contrato | Aceptada | Arquitectura | Cliente TS generado y contract tests |
| DEC-ARCH-004 | Domain Layer y Policy Engine en TypeScript puro | Aceptada | Arquitectura/Producto | Sin dependencias de Nest/Prisma/UI |
| DEC-DATA-001 | Prisma para persistencia | Aceptada | Arquitectura | Spike de conexiones y migraciones |
| DEC-CLI-001 | `Client` es frontera canónica | Aceptada | Producto/Arquitectura | Cliente en UI, Client en código |
| DEC-CLI-002 | Una DB propia por cliente | Aceptada | Arquitectura/Seguridad | Pruebas multi-client P0 |
| DEC-CLI-003 | Client Resolver y Client Catalog server-side | Aceptada | Arquitectura/Seguridad | Antes de abrir Prisma |
| DEC-PLAT-001 | Control Plane separado de Data Plane | Aceptada | Arquitectura | Web/API/permisos/auditoría separados |
| DEC-REPO-001 | Monorepo TypeScript | Aceptada | Desarrollo | Apps desplegables y packages compartidos |
| DEC-TEST-001 | Dos DB locales reales para aislamiento | Aceptada | QA/Seguridad | Cliente A y B obligatorios |
| DEC-DEV-001 | Node.js 24 LTS como versión mayor de runtime y desarrollo para TrazActivo v1.1 (cierre de `TBD-DEV-001`) | Aceptada | Germán/Eduardo - Arquitectura | Habilita `FND-001` y el primer `npm install`/`npm ci` |
| DEC-AZR-001 | Azure Chile Central como región primaria objetivo | Propuesta heredada | Arquitectura | Validar servicios y SKU antes de prod |
| DEC-AZR-002 | App Service versus Container Apps | Pendiente | Arquitectura/DevOps | Resolver antes de Azure DEV |
| DEC-IAC-001 | Bicep como IaC | Propuesta | DevOps | Aprobar antes de infra definitiva |
| DEC-CICD-001 | GitHub Actions | Propuesta | DevOps | Aprobar permisos y environments |
