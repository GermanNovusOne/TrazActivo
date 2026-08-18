# Arquitectura TrazActivo v1.1

## Decisión

TrazActivo se implementará en TypeScript de extremo a extremo. La arquitectura funcional sigue siendo un monolito modular API-first, con Control Plane y Data Plane separados y una base de datos propia por cliente.

## Vista conceptual

```text
                              AZURE
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
             FRONTEND                      BACKEND
                 │                             │
              Next.js                       NestJS
              React                      TypeScript
           TypeScript                        │
                 │                         Swagger
                 │                         OpenAPI
                 │                             │
                 └────────── REST API ─────────┤
                                               │
                                       Client Resolver
                                               │
                                        Client Catalog
                                               │
                                         ClientContext
                                               │
                                      Application Layer
                                               │
                                         Domain Layer
                                               │
                                        Policy Engine
                                               │
                                 Prisma DataSource Manager
                                               │
                           ┌───────────────────┼───────────────────┐
                           │                   │                   │
                       Cliente A           Cliente B           Cliente N
                           │                   │                   │
                        DB propia           DB propia           DB propia
```

## Corrección del orden técnico

Prisma no puede seleccionar la base antes de resolver el cliente. La secuencia obligatoria es:

```text
Authenticate
→ Resolve Client candidate
→ Validate ClientMembership
→ Read Client Catalog
→ Build ClientContext
→ Authorize operation
→ Execute Application/Domain/Policy
→ Obtain Prisma client for DatabaseReference
→ Commit data, event and audit
```

## Aplicaciones desplegables

| Aplicación | Tecnología | Alcance |
|---|---|---|
| `portal-web` | Next.js | Portal del cliente |
| `control-web` | Next.js | Operación de plataforma |
| `data-api` | NestJS | Data Plane |
| `control-api` | NestJS | Control Plane |
| `worker` | NestJS standalone | Jobs y mensajería |

## Capas backend

```text
presentation/
  controllers, DTO HTTP, OpenAPI, guards
application/
  use cases, ports, transactions, orchestration
domain/
  entities, value objects, policies, events, invariants
infrastructure/
  Prisma, Azure adapters, messaging, documents
```

`Policy Engine` vive en package separado y no depende de NestJS o Prisma.

## Client Catalog

Campos mínimos:

```text
ClientId
ClientCode
Status
DeploymentStampId
DatabaseReference
StorageReference
Region
ClientSchemaVersion
ConfigurationVersion
IdentityMode
```

No contiene secretos, contraseñas ni datos patrimoniales.

## ClientContext

```text
ClientId
UserId
ClientMembershipId
LegalEntityId optional
BusinessContextId optional
AccountingBookId optional
Roles
Permissions
Features
Locale
TimeZone
CorrelationId
SessionId
```

Se reconstruye al cambiar de cliente y se invalida si el cliente queda suspendido o la membership expira.

## Prisma DataSource Manager

Responsabilidades:

- resolver por `DatabaseReference` ya autorizada;
- cache acotada de Prisma clients;
- límite máximo por proceso;
- TTL o política de cierre;
- `disconnect` controlado;
- métricas de conexiones, errores y saturación;
- prohibición de usar cadenas recibidas por request;
- soporte de migración por versión.

## Datos

- Platform DB: clientes, catálogo, stamps, usuarios globales, memberships, roles de plataforma, suscripciones y auditoría de plataforma.
- Client DB: entidades legales, activos, inventarios, libros, políticas, contabilidad, documentos metadata y auditoría del cliente.
- Blob: segregación por cliente.
- Mensajes: `ClientId`, `CorrelationId`, `OperationId` y schema version obligatorios.

## Contratos

NestJS genera dos documentos:

```text
contracts/openapi/control-v1.json
contracts/openapi/data-v1.json
```

El pipeline genera clientes TypeScript. El frontend no importa DTO internos ni modelos Prisma.

## Seguridad

- deny by default;
- ClientContext server-side;
- DB propia por cliente;
- autenticación, autorización y aprobación separadas;
- step-up para operaciones críticas;
- auditoría cliente/plataforma separada;
- secretos fuera del repositorio;
- errores sin stack ni referencias sensibles.

## Evolución

La arquitectura permite deployment stamps y migración de un cliente sin cambiar sus IDs. No se implementan varios stamps hasta que exista volumen o requisito, pero las referencias y límites se conservan desde la foundation.
