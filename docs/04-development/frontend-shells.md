# Shells frontend FND-002

## Alcance

FND-002 entrega dos aplicaciones Next.js independientes:

- `apps/portal-web`: superficie del portal de clientes en el Data Plane futuro.
- `apps/control-web`: superficie de administración SaaS del Control Plane futuro.

Ambas aplicaciones son shells visuales. No implementan autenticación, autorización, selección o
contexto de cliente, llamadas API, Prisma, datos de negocio ni operaciones de plataforma.

## Ejecución independiente

Con Node.js 24.13.0, npm 11.6.2 y `npm ci` completado:

```text
npm run dev --workspace apps/portal-web
npm run dev --workspace apps/control-web
```

El portal usa `http://localhost:3000` y Control usa `http://localhost:3001`. Cada aplicación expone
`/` y `/health`; la segunda ruta es un smoke visual del frontend y no representa el estado de API,
bases de datos ni infraestructura.

Los builds también son independientes:

```text
npm run build --workspace apps/portal-web
npm run build --workspace apps/control-web
```

## Typecheck reproducible

`next-env.d.ts` es un artefacto administrado por Next.js: permanece en el `include` de cada
`tsconfig.json`, pero no se versiona ni se edita manualmente. La regla
`apps/*/next-env.d.ts` de `.gitignore` evita incorporarlo accidentalmente.

El typecheck de cada shell genera primero los tipos oficiales de Next.js y luego ejecuta
TypeScript estricto:

```text
next typegen && tsc --project tsconfig.json --noEmit
```

Los `tsconfig.json` incluyen `.next/types/**/*.ts`. Por ello `npm run typecheck` funciona desde un
checkout limpio sin requerir un `.next` previo ni ejecutar antes `next dev` o `next build`.

## Separación y dependencias

- Ninguna app importa o declara como dependencia a la otra.
- Las dos apps consumen únicamente la API pública de `@trazactivo/design-system`.
- El gate de arquitectura rechaza imports app→app, frontend→backend y frontend→Prisma.
- No existe estado de negocio compartido ni cache de cliente.
- La navegación del portal no expone Control Plane y la navegación de Control no expone funciones
  del portal.

`packages/design-system` es creado inicialmente y pertenece a FND-002. Su superficie se limita a
los tokens aprobados, `AppShell`, estados loading/error, badges y estilos requeridos por los shells.

## Accesibilidad

Los shells incluyen estructura semántica, enlace para saltar al contenido, foco visible, orden de
teclado verificable, estados anunciados y soporte para reducción de movimiento. Las suites de
componentes prueban navegación por teclado y las suites `test:a11y` ejecutan axe sobre portal,
Control y design system.

## Validación

```text
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:architecture
npm run test:a11y
npm run build
npm run verify
```
