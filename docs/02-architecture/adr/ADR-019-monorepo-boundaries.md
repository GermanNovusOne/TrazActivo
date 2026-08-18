# ADR-019: Monorepo y límites desplegables

## Estado

Accepted.

## Decisión

Usar un monorepo con npm workspaces. Mantener aplicaciones desplegables separadas y packages compartidos con dependencias controladas.

## Aplicaciones

- portal-web;
- control-web;
- data-api;
- control-api;
- worker.

## Razón

Permite compartir contratos, dominio, Policy Engine, design system y testkit sin mezclar permisos o ciclos de despliegue.

## Prohibiciones

- package `common` sin responsabilidad definida;
- dominio dependiente de framework;
- imports entre aplicaciones para reutilizar lógica interna;
- un solo shell que mezcle Control Plane y portal cliente.
