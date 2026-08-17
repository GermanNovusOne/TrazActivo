# Arquitectura

## Estilo conservado

TrazActivo se implementará como monolito modular API-first. Control Plane y
Data Plane tienen fronteras, APIs, roles y auditorías separadas, aunque puedan
compartir inicialmente una unidad de despliegue si el ADR de runtime lo permite.

La topología base es frontend y backend compartidos por deployment stamp,
Tenant Resolver, database-per-tenant y storage segregado por tenant. El Tenant
Catalog central contiene metadatos de resolución, nunca datos patrimoniales,
contables, contraseñas ni secretos de integración.

## Documentos

- `system-context.md`: contexto y dependencias lógicas.
- `module-map.md`: módulos y reglas de dependencia.
- `tenant-isolation.md`: invariantes de resolución y acceso.
- `control-data-plane.md`: responsabilidades y prohibiciones.
- `adr/`: decisiones aceptadas y propuestas.

Fuente: PDD secciones 03 a 06, 12, 35, 36 y 45.
