# Applications workspace

Este directorio contiene las aplicaciones desplegables definidas por ADR-019. FND-002 entrega
exclusivamente los shells frontend independientes `portal-web` y `control-web`; `data-api`,
`control-api` y `worker` continúan fuera de su alcance y pertenecen a Work Packages posteriores.

Las aplicaciones no pueden importarse entre sí. Sólo pueden compartir contratos y capacidades
mediante packages con responsabilidad explícita.

Los shells se ejecutan por separado:

```text
npm run dev --workspace apps/portal-web
npm run dev --workspace apps/control-web
```
