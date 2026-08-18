# Transición desde la foundation actual a v1.1

## Decisión

La foundation existente se conserva en Git history y tag, pero deja de ser línea de desarrollo. La nueva baseline se construye con Next.js, NestJS, TypeScript, OpenAPI y Prisma.

## Qué se conserva

- PDD y requisitos funcionales;
- ADR conceptuales compatibles;
- modelo Control Plane/Data Plane;
- Client Catalog/Resolver como concepto;
- estados, errores y eventos;
- matrices multi-client;
- golden dataset;
- criterios de aceptación;
- documentación UX;
- comportamiento probado en tests existentes.

## Qué no se porta automáticamente

- estructura de proyectos;
- controllers;
- dependency injection;
- persistence adapters;
- scripts de build;
- pipelines del stack anterior;
- tipos de framework.

## Método

```text
1. Tag de main actual.
2. Inventario de ramas y archivos locales no publicados.
3. Crear branch architecture/v1.1-typescript.
4. Incorporar baseline documental.
5. Crear monorepo vacío y verificable.
6. Portar contratos y tests por comportamiento.
7. Implementar walking skeleton.
8. Comparar requisitos y trazabilidad.
9. Retirar documentación contradictoria.
10. Merge sólo después de revisión Germán/Eduardo.
```

## Regla

No se realiza traducción línea por línea. Cada capacidad se vuelve a implementar desde requisito, contrato y prueba. La history anterior sirve como evidencia, no como arquitectura objetivo.
