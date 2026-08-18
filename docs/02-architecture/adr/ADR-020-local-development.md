# ADR-020: Desarrollo local reproducible

## Estado

Accepted.

## Decisión

Docker Compose levanta Platform DB, Client DB A, Client DB B y servicios locales necesarios. Un script único prepara migraciones, seed y verificación.

## Criterios

- clon limpio;
- `npm ci`;
- `npm run local:up`;
- migraciones y seed;
- `npm run dev`;
- `npm run verify`.

## Razón

El aislamiento no puede validarse con una sola DB o mocks. Dos clientes reales son parte de la foundation.
