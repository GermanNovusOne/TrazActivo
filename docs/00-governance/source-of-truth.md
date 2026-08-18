# Fuente de verdad y control documental

## Baseline vigente

La fuente de verdad es `docs/01-product/TrazActivo_PDD_v1.1_RC1.md`.

La versión 1.1 conserva el dominio y los requisitos consolidados en la versión 1.0 RC1, pero reemplaza la implementación técnica por TypeScript, Next.js, NestJS, OpenAPI, Prisma, Client Resolver, Client Catalog y database-per-client.

## Fuentes de evidencia

- `TrazActivo_PDD_v1.0_RC1(2).md`: baseline funcional y arquitectónica anterior.
- `TrazActivo_PDD_v0.1(1).md`: primera especificación funcional y contable.
- `Se ha pegado el markdown(20260818-032851).md`: análisis de depreciación y política de 30 días.
- `Se ha pegado el markdown (2).md`: PDD ejecutivo.
- `Branding TrazActivo.png`: logo, isotipo, paleta y tipografía.
- Demo HTML de TrazActivo: referencia UX, no fuente de reglas.
- Repositorio `GermanNovusOne/TrazActivo`: foundation anterior y evidencia de implementación.

## Precedencia

```text
PDD v1.1
  ↓
ADR Accepted
  ↓
Especificación de módulo
  ↓
Plan aprobado
  ↓
Work Package aprobada
  ↓
Código y pruebas
```

## Artefactos no autoritativos

- maquetas visuales;
- prototipos;
- código de la foundation anterior;
- ADR Proposed;
- documentos marcados SUPERSEDED;
- resultados contables sin aprobación.

## Regla de cambio

Un cambio de arquitectura, seguridad, aislamiento o política contable requiere ADR o decisión registrada. Una Work Package no puede modificar la fuente de verdad por conveniencia.
