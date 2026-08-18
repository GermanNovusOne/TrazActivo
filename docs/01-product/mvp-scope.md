# Alcance del MVP técnico y funcional

## Objetivo

Demostrar que TrazActivo puede operar como SaaS multi-cliente con una historia verificable del activo, aislamiento por base, contratos API y despliegue reproducible.

## MVP técnico obligatorio

- monorepo TypeScript;
- portal Next.js;
- TrazActivo Control Next.js;
- Data API NestJS;
- Control API NestJS;
- worker NestJS;
- Swagger/OpenAPI;
- cliente TypeScript generado;
- Platform DB;
- Client Catalog;
- Client Resolver;
- ClientContext;
- Client DB A y Client DB B;
- Prisma DataSource Manager;
- auditoría cliente/plataforma;
- CI local y pipeline;
- despliegue Azure DEV.

## Primera capacidad funcional

`AssetItem`:

- crear un bien físico;
- listar bienes;
- consultar ficha inicial;
- registrar evento y auditoría;
- validar unicidad de inventario por cliente;
- impedir acceso entre clientes;
- soportar idempotencia y concurrencia.

## Incluido después del walking skeleton

- LegalEntity, establecimientos y ubicaciones;
- custodios;
- QR;
- movimientos;
- inventario;
- documentos;
- identidad y roles;
- libros, políticas y depreciación una vez aprobado el golden dataset.

## Exclusiones del primer gate

- posting contable;
- integración ERP;
- PWA offline;
- Mercado Público;
- deterioro;
- componentes;
- mantenimiento;
- white label completo;
- SLA productivo y DR regional.

## Criterio de salida

Un desarrollador nuevo puede levantar el sistema local, ingresar bajo Cliente A y B, crear activos en sus DB separadas, intentar un acceso cruzado y obtener una denegación verificable con auditoría y CorrelationId.
