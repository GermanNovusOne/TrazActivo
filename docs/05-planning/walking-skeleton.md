# Walking Skeleton de TrazActivo

## Objetivo

Probar el recorrido completo antes de expandir módulos.

```text
Usuario
→ portal-web Next.js
→ cliente OpenAPI
→ data-api NestJS
→ ClientResolver
→ ClientCatalog
→ ClientContext
→ Asset application service
→ Asset domain
→ Prisma DataSource Manager
→ Client DB
→ ClientAuditEvent
→ respuesta
```

## Casos

### Cliente A

1. autenticarse o usar identidad DEV controlada;
2. resolver Cliente A;
3. crear AssetItem A-001;
4. listar y consultar;
5. verificar DB A y audit.

### Cliente B

Repetir con B-001 y DB B.

### Ataque/control

- solicitar A-001 desde B;
- enviar ClientId A desde sesión B;
- reutilizar idempotency key con fingerprint distinto;
- modificar versión antigua;
- suspender Cliente A y repetir sesión.

## Endpoint mínimo

```text
GET  /api/v1/context
GET  /api/v1/assets
POST /api/v1/assets
GET  /api/v1/assets/{id}
```

## Datos AssetItem mínimos

```text
id
inventoryNumber
name
classCode
operationalStatus
legalEntityId
createdAt
version
```

No incluye depreciación ni campos contables.

## Aceptación

- DB A y B distintas;
- OpenAPI real;
- cliente TypeScript generado;
- idempotencia;
- optimistic concurrency;
- auditoría;
- MC-001/002/008/009/012;
- UI accesible básica;
- `npm run verify` aprobado.
