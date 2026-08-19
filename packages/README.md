# Packages workspace

Cada package tiene responsabilidad y consumidor explícitos. No existe un package `common` y los
consumidores sólo pueden usar el export público `.` de cada workspace.

| Package          | Responsabilidad y API pública actual                                                                | Consumidor identificado                                       | Prohibiciones de FND-004                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `domain`         | Boundary TypeScript puro; API deliberadamente vacía.                                                | AST-001.                                                      | AssetItem, invariantes, value objects funcionales, frameworks, persistencia, HTTP, Azure y contabilidad. |
| `client-context` | Boundary TypeScript puro para futuro contexto inmutable; API deliberadamente vacía.                 | CLI-003.                                                      | Membership, resolver, factory, switch, identidad, DBRef, secretos y selección de DB.                     |
| `authorization`  | Boundary framework-agnostic; API deliberadamente vacía.                                             | CLI-003 y, posteriormente, APP-001.                           | Policies, roles, permisos efectivos, autorización real y decisiones de UI.                               |
| `contracts`      | Boundary de contratos públicos o generados; API deliberadamente vacía.                              | API-001.                                                      | OpenAPI funcional anticipado, endpoints, DTO NestJS compartidos y contratos de negocio.                  |
| `observability`  | Boundary vendor-neutral; API deliberadamente vacía.                                                 | OBS-001.                                                      | SDK Azure, logging y métricas productivas.                                                               |
| `testkit`        | `createRepositoryFixture` y `RepositoryFixture`, usados por las pruebas de arquitectura de FND-004. | Suite real de FND-004; OBS-001 y QA sólo cuando se autoricen. | Imports desde producto, dependencias runtime y utilidades sin uso real.                                  |
| `policy-engine`  | Boundary TypeScript puro y guard de alcance; API deliberadamente vacía.                             | Suite architecture/golden de FND-004.                         | Policies, reglas, cálculos, contabilidad y motores de decisión.                                          |
| `design-system`  | Tokens y componentes mínimos ya publicados por FND-002.                                             | Shells frontend de FND-002.                                   | FND-004 no lo crea, recrea, extiende ni toma ownership.                                                  |

Mapa de imports vigente:

```text
FND-004 architecture tests -> @trazactivo/testkit
portal-web/control-web      -> @trazactivo/design-system
empty boundaries           -> no package/runtime imports
```

AST-001, CLI-003, API-001, APP-001 y OBS-001 son consumidores documentados, no implementados por
FND-004. Sus boundaries permanecen vacíos hasta que la Work Package correspondiente sea autorizada.
