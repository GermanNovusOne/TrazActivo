# Matriz de aislamiento multi-cliente

Estos casos son P0 en las superficies implementadas.

| ID | Precondición | Acción | Resultado esperado |
|---|---|---|---|
| MC-001 | Usuario A conoce AssetId de B | GET asset B | 404/403 sin datos ni inferencia |
| MC-002 | Sesión A | manipular ClientId en header/payload | servidor ignora o rechaza |
| MC-003 | Usuario con A y B | cambiar A→B | cache, filtros, branding, libros y datos de A desaparecen |
| MC-004 | Branding A/B | abrir ambos | configuración correcta y separada |
| MC-005 | Feature sólo en A | llamar endpoint desde B | rechazo backend aunque URL exista |
| MC-006 | Documento A | reutilizar ID/URL desde B | acceso denegado |
| MC-007 | Jobs A/B | procesar concurrentemente | cada job abre sólo su DB/storage |
| MC-008 | Cliente suspendido | usar sesión vigente | Data Plane bloqueado |
| MC-009 | User sin membership | seleccionar cliente | no resuelve contexto |
| MC-010 | Restore A | ejecutar restore | B permanece intacto |
| MC-011 | Buscar término de B en A | search | cero resultados |
| MC-012 | misma clave de cache | consultar A y B | valores separados |
| MC-013 | export A/B | generar concurrente | archivos y manifests separados |
| MC-014 | host no verificado | resolver cliente | bloqueado |
| MC-015 | operador plataforma | soporte sobre A | PlatformAudit con cliente objetivo |
| MC-016 | DataSource cache | reutilizar referencia tras suspensión | conexión invalidada o bloqueada |
| MC-017 | error/log | provocar fallo con ID B desde A | log no revela payload/datos B |
| MC-018 | migración A falla | rollout por lote | estado de B conocido y no alterado |

## Dataset local

- Cliente A: activos prefijados `A-`.
- Cliente B: activos prefijados `B-`.
- IDs UUID no predecibles.
- un usuario exclusivo A;
- un usuario exclusivo B;
- un usuario A+B;
- un operador platform sin permisos de Data Plane.

## Gate

Cualquier acceso directo o indirecto bloquea el release. Un caso no implementado se marca `NotApplicable` con evidencia del motivo, no `Passed`.
