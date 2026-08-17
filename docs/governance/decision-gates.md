# Gates de decisión y avance

## Gate G0 - Baseline aprobada

Requiere cierre de `TBD-PROD-001` y registro de Sponsor/Product Owner que
aprueban alcance y baseline. Hasta entonces el estado documental es RC1.

## Gate G1 - Inicio de implementación de plataforma

Puede comenzar el diseño detallado de Tenant Resolver, `TenantContext`,
Control/Data Plane, identidad, auditoría y aislamiento. La implementación de
infraestructura productiva requiere además decisiones de hosting, IaC y CI/CD.

## Gate G2 - Modelo contable inicial

Requiere cerrar, al menos, el alcance IFRS, el perfil normativo piloto, monedas,
libros/períodos/posting/reapertura y la matriz de roles/segregación aplicable.
No habilita por sí solo posting de depreciación.

## Gate G3 - Desarrollo DEP P0

Requiere `TBD-ACC-002`, `TBD-ACC-003` y matriz normativa del perfil piloto
cerrados y aprobados. Hasta entonces se permiten contratos, gobernanza y diseño
del Policy Engine, pero no posting de depreciación.

## Gate G4 - Pipeline de release

Las pruebas MT-001 a MT-015 aplicables deben aprobar al 100 %. Cualquier acceso
cross-tenant, directo o indirecto, bloquea release.

## Gate G5 - Producción

Requiere NFR contractuales cerrados, restore por tenant validado, seguridad
multi-tenant aprobada y runbook operacional. También deben resolverse hosting,
SKU/zonalidad, región secundaria/DR, RPO/RTO y retención contractual.

Fuente: PDD secciones D.1, 39, 41, 46.2 y 48.
