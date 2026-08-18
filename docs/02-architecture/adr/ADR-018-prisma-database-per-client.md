# ADR-018: Prisma y database-per-client

## Estado

Accepted conceptually. Spike de conexiones obligatorio.

## Decisión

Prisma implementa persistencia para una Platform DB y una DB propia por cliente. La DB se selecciona únicamente desde una `DatabaseReference` obtenida por Client Catalog después de validar ClientContext.

## Modelo

```text
ClientResolver
→ ClientCatalog
→ ClientContext
→ ClientDataSourceManager
→ PrismaClient autorizado
→ Client DB
```

## Reglas

- no crear un PrismaClient ilimitado por request;
- cache acotada y observable;
- desconexión controlada;
- migraciones por lotes;
- versión por cliente en catálogo;
- secretos fuera del catálogo;
- no usar DB compartida con ClientId como única barrera.

## Spike

Debe medir:

- clientes simultáneos;
- conexiones por réplica;
- apertura fría;
- cache/TTL;
- recovery ante DB no disponible;
- migración de schema;
- límites de pool.
