# Applications workspace

Este directorio contiene las aplicaciones desplegables definidas por ADR-019. FND-002 entrega los
shells frontend independientes `portal-web` y `control-web`. FND-003 entrega los shells NestJS
independientes `data-api`, `control-api` y `worker`, sin Prisma, identidad, endpoints de negocio ni
mensajería funcional.

Las aplicaciones no pueden importarse entre sí. Sólo pueden compartir contratos y capacidades
mediante packages con responsabilidad explícita.

Los shells se ejecutan por separado:

```text
npm run dev --workspace apps/portal-web
npm run dev --workspace apps/control-web
npm run dev --workspace apps/data-api
npm run dev --workspace apps/control-api
npm run dev --workspace apps/worker
```

Los puertos locales por defecto son 3000 para portal, 3001 para Control web, 3100 para Data API y
3101 para Control API. El worker no abre un puerto ni procesa jobs: permanece como application
context standalone hasta recibir una señal de shutdown.
