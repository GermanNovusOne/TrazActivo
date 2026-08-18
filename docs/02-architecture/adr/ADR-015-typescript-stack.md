# ADR-015: Stack TypeScript end-to-end

## Estado

Accepted.

## Contexto

La foundation anterior utiliza un stack distinto al utilizado por el equipo que continuará el producto. Mantener dos caminos aumentaría revisión, mantenimiento y deuda.

## Decisión

- Next.js, React y TypeScript para frontend.
- NestJS y TypeScript para backend y worker.
- Node.js con versión mayor fijada por repositorio.
- No desarrollar la nueva baseline en .NET.

## Consecuencias

- un lenguaje principal;
- contratos y tooling compartidos;
- reconstrucción de la foundation técnica;
- las reglas y pruebas se portan por comportamiento, no por traducción de código línea a línea.

## Controles

- architecture tests;
- búsqueda CI de archivos/proyectos de stack prohibido;
- revisión de dependencias;
- AGENTS.md obligatorio.
