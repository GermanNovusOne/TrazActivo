# Estrategia de pruebas

## Capas obligatorias

Unit, Component, Integration, Contract, Security, Multi-Tenant Isolation,
Performance, Accessibility, E2E, Regression, DR y Migration.

## Principios

- Policy Engine se prueba sin UI ni infraestructura.
- Golden dataset versionado es obligatorio en pipeline.
- Cada bug corregido incorpora una regresión.
- Pruebas cross-tenant P0 bloquean release.
- Integraciones usan contract tests y sandbox cuando exista.
- Migraciones comparan conteos, sumas, hashes y muestras.
- Operaciones concurrentes no pueden producir pérdidas silenciosas.

## Orden futuro de pipeline

```text
PR -> lint/compile -> unit -> golden dataset -> security scan
   -> multi-tenant -> build -> deploy non-prod
   -> integration/E2E/A11Y -> approval -> rollout by stamp
   -> smoke -> observe
```

La plataforma concreta de pipeline queda pendiente de `TBD-AZR-005`.

## Evidencia de release

Cada release conserva resultados por suite, versión de aplicación/schema/
política/configuración, artefacto, stamp y smoke tests. MT P0 debe reportar
15/15 o justificar formalmente qué caso aún no aplica al alcance implementado;
ningún caso aplicable puede fallar.

Fuente: PDD secciones 39, 41 y 44.2.
