# Estructura objetivo del repositorio

```text
TrazActivo/
├── AGENTS.md
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.base.json
├── docker-compose.yml
├── .env.example
│
├── apps/
│   ├── portal-web/
│   ├── control-web/
│   ├── data-api/
│   ├── control-api/
│   └── worker/
│
├── packages/
│   ├── domain/
│   ├── policy-engine/
│   ├── client-context/
│   ├── authorization/
│   ├── contracts/
│   ├── design-system/
│   ├── observability/
│   └── testkit/
│
├── database/
│   ├── platform/
│   │   ├── prisma/schema.prisma
│   │   └── migrations/
│   └── client/
│       ├── prisma/schema.prisma
│       └── migrations/
│
├── contracts/
│   ├── openapi/
│   ├── generated/
│   └── events/
│
├── policies/
│   ├── schemas/
│   ├── fixtures/
│   └── golden-dataset/
│
├── docs/
│   ├── 00-governance/
│   ├── 01-product/
│   ├── 02-architecture/
│   ├── 03-agent/
│   ├── 04-testing/
│   ├── 05-planning/
│   ├── 06-migration/
│   └── plans/
│
├── infra/
│   ├── modules/
│   └── environments/
│
└── scripts/
```

## Dependencias permitidas

```text
portal-web ──> generated contracts + design-system
control-web ─> generated contracts + design-system

data-api ───> application modules ─> domain/policy-engine
control-api ─> platform application ─> platform domain
worker ──────> application modules + client-context

infrastructure ─> application/domain ports
Prisma adapters ─> application/domain ports
```

## Dependencias prohibidas

- `domain` hacia NestJS, Prisma, Next.js o Azure.
- `policy-engine` hacia NestJS, Prisma o UI.
- frontend hacia Prisma o código interno de backend.
- Data Plane hacia módulos de operación privilegiada de plataforma.
- Control Plane hacia repositorios de activos por defecto.
- paquetes compartidos que mezclen roles platform/client.

## Scripts raíz esperados

```json
{
  "scripts": {
    "dev": "...",
    "build": "...",
    "format:check": "...",
    "lint": "...",
    "typecheck": "...",
    "test:unit": "...",
    "test:architecture": "...",
    "test:integration": "...",
    "test:contract": "...",
    "test:multiclient": "...",
    "test:golden": "...",
    "test:e2e": "...",
    "test:a11y": "...",
    "local:up": "...",
    "local:down": "...",
    "db:generate": "...",
    "db:migrate:local": "...",
    "db:seed:local": "...",
    "verify": "..."
  }
}
```

Los comandos reales se implementan en FND-001 y quedan documentados. No se dejan scripts que aparenten pasar sin ejecutar controles.
