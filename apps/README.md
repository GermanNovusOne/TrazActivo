# Applications workspace

Este directorio queda reservado para las aplicaciones desplegables definidas por ADR-019.
FND-001 no crea shells ni funcionalidad; `portal-web`, `control-web`, `data-api`,
`control-api` y `worker` pertenecen a Work Packages posteriores.

Las aplicaciones no pueden importarse entre sí. Sólo pueden compartir contratos y capacidades
mediante packages con responsabilidad explícita.
