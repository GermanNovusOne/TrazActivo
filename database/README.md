# Prisma Platform/Client foundations

TrazActivo mantiene schemas y outputs Prisma separados para Platform DB y Client DB. Las foundations
actuales son deliberadamente `model-free`: no crean tablas, migrations, seeds ni comportamiento
funcional.

## Paths canónicos

| Boundary | Schema authored                          | Generated client ignorado            |
| -------- | ---------------------------------------- | ------------------------------------ |
| Platform | `database/platform/prisma/schema.prisma` | `database/platform/generated/client` |
| Client   | `database/client/prisma/schema.prisma`   | `database/client/generated/client`   |

Los outputs generados no se editan ni se versionan. Cada comando elimina sólo su output canónico,
rechaza symlinks y lo reconstruye desde el schema correspondiente.

## Comandos disponibles

```text
npm run db:platform:generate
npm run db:platform:validate
npm run db:client:generate
npm run db:client:validate
```

Los comandos usan paths cerrados, rechazan argumentos adicionales, `--schema`, connection strings y
overrides Prisma. Generate/validate no conectan ni mutan ninguna database.

## Client DB A/B

DB-002 reconoce únicamente las tuples administrativas locales de FND-005:

| Reference        | Database              | Usuario local               |
| ---------------- | --------------------- | --------------------------- |
| `client-a-local` | `trazactivo_client_a` | `trazactivo_client_a_local` |
| `client-b-local` | `trazactivo_client_b` | `trazactivo_client_b_local` |

La guarda pura exige loopback `127.0.0.1`, el puerto obtenido del preflight canónico y coincidencia
exacta de reference/database/user. Rechaza Platform, tuples cruzadas, propiedades arbitrarias y
selectores derivados de browser/request. No abre Prisma Client DB ni implementa ClientResolver,
ClientContext o ClientDataSourceManager.

## Ownership posterior

- DB-003 conserva artifacts y aplicación de migrations, seeds, sentinelas, migration history/state,
  rebuild y drift real Platform/A/B.
- CLI-001 conserva el Client Catalog funcional.
- CLI-004 conserva adquisición, lifecycle, cache/pooling y cierre del Prisma Client runtime después de
  `ClientContext` y del spike aprobado.

Los secretos efectivos permanecen fuera de Git. Ningún comando debe imprimir passwords, tokens,
connection strings o configuración completa.
