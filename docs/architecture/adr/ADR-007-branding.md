# ADR-007: Branding Architecture

- Estado: Accepted
- Fecha de baseline: 2026-08-17

## Decisión

Configurar branding por tenant mediante tokens y plantillas versionadas, sin
forks de frontend ni cambios de semántica funcional.

## Consecuencias

- Branding se carga sólo después de resolver tenant.
- El cambio de tenant limpia la configuración anterior.
- Contraste y accesibilidad se validan con cada combinación permitida.
- Hostname y branding no autorizan acceso a recursos.

Fuente: PDD ADR-007, secciones 10, 16 y BRD-001.
