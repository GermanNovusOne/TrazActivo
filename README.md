# TrazActivo v1.1 Agent Baseline

Este paquete es la baseline para planificar y desarrollar TrazActivo con un agente de software. Reemplaza el stack técnico anterior y conserva el dominio, los requisitos, los controles multi-cliente, el Policy Engine, la trazabilidad, la identidad visual y el alcance funcional del PDD.

## Arquitectura bloqueada

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

`Client Resolver` y `Client Catalog` aparecen antes de Prisma en el flujo ejecutable. La aplicación debe resolver y autorizar el cliente antes de abrir una conexión.

## Decisiones no negociables

- TypeScript de extremo a extremo.
- Frontend Next.js, React y TypeScript.
- Backend NestJS y TypeScript.
- REST versionada con Swagger/OpenAPI.
- Domain Layer y Policy Engine sin dependencias de framework o persistencia.
- Prisma sólo después de construir `ClientContext`.
- Una base propia por cliente.
- TrazActivo Control separado del portal del cliente.
- No desarrollar la nueva baseline en .NET.
- No hacer merge ni despliegue productivo automático desde el agente.

## Orden de lectura para el agente

1. `AGENTS.md`.
2. `docs/00-governance/source-of-truth.md`.
3. `docs/01-product/TrazActivo_PDD_v1.1_RC1.md`.
4. `docs/02-architecture/architecture-v1.1.md`.
5. ADR aceptados.
6. `docs/05-planning/roadmap-gates.md`.
7. `docs/03-agent/planning-agent-prompt.md`.
8. La Work Package autorizada.

## Uso

### Bootstrap local

La foundation fija Node.js `24.13.0` y npm `11.6.2`. Con esas versiones activas:

```text
npm ci
npm run verify
```

Los comandos, estados explícitos de suites futuras y criterios de actualización del toolchain se
documentan en `docs/04-development/workspace-toolchain.md`.

### Planificación

Entregar al agente el repositorio y el archivo:

```text
docs/03-agent/planning-agent-prompt.md
```

El agente debe generar planes y Work Packages. No debe programar durante esa ejecución.

### Implementación

Entregar al agente una Work Package aprobada y:

```text
docs/03-agent/implementation-agent-prompt.md
```

Cada Work Package usa una branch y un Draft PR independientes.

## Primer objetivo

El primer resultado ejecutable es el walking skeleton de `AssetItem` con dos clientes locales y bases separadas. Debe probar frontend, backend, Client Resolver, Client Catalog, ClientContext, Domain Layer, Prisma, auditoría y aislamiento.
