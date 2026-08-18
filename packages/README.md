# Packages workspace

Este directorio contiene packages con responsabilidad explícita. FND-002 es el único owner de la
creación inicial de `design-system` y entrega sólo tokens, estilos y componentes mínimos para los
shells frontend.

Las aplicaciones consumen `@trazactivo/design-system` mediante sus exports públicos. ADR-019
prohíbe un package `common`, imports internos entre workspaces y dependencias de dominio hacia
frameworks, UI o persistencia. Los packages compartidos restantes pertenecen a Work Packages
posteriores.
