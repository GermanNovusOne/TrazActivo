# Sprint 1: Platform Foundation

## Alcance

Foundation ejecutable .NET 10 del monolito modular API-first. Sprint 1
implementa sólo Control Plane mínimo, contratos de tenancy y capacidades
transversales necesarias para continuar. El PDD RC1 permanece como fuente de
verdad y ningún TBD se cierra mediante esta implementación.

## Proyectos y dependencias

```text
TrazActivo.ControlPlane.Domain
  <- TrazActivo.ControlPlane.Application
       <- TrazActivo.ControlPlane.Infrastructure
       <- TrazActivo.Api
TrazActivo.ControlPlane.Infrastructure <- TrazActivo.Api

TrazActivo.Tenancy.Abstractions (independiente)
```

Las dependencias se validan mediante `TrazActivo.ArchitectureTests`. No existe
un proyecto Data Plane ni un proyecto Contracts separado.

## Modelo implementado

- `Tenant`: identidad, código, nombre, región y lifecycle de la organización SaaS.
- `TenantCatalogEntry`: metadata operacional para resolución: estado requerido
  por PDD, referencia de stamp, referencias opacas de DB/storage, versiones de
  schema/configuración e IdentityMode.
- `DeploymentStampReference`: referencia mínima; no modela capacidad ni
  infraestructura productiva.
- `PlatformAuditRecord`: operador, tenant objetivo, stamp, permiso, acción,
  motivo, ticket/expiración JIT opcionales, correlación, operación y before/after.

El catálogo de Sprint 1 no contiene secretos. Sus referencias de DB/storage y
versiones permanecen vacías porque no existe provisioning de infraestructura.

## Lifecycle y provisioning

El dominio conserva el flujo completo definido por PDD y valida transiciones y
motivo. La API de Sprint 1 sólo expone creación, lectura, intención de
provisionamiento y suspensión. `POST /provision`:

- exige permiso, motivo, Idempotency-Key e If-Match;
- selecciona stamp exclusivamente mediante un puerto server-side;
- transiciona de Requested o ProvisioningFailed a Provisioning;
- actualiza la metadata operacional y registra PlatformAudit;
- no crea SQL, storage ni connection strings;
- no avanza a Configuring, Validation o Active.

El selector de stamp por defecto devuelve no configurado. Los tests sustituyen
ese puerto con un selector sintético localizado sólo en los proyectos de test.

## Seguridad y tenancy

- Autorización deny-by-default con políticas por permiso de plataforma.
- El esquema de autenticación productivo no autentica identidades.
- Los principales sintéticos existen exclusivamente en IntegrationTests y
  MultiTenancyTests.
- Los DTO de creación/provisioning no aceptan TenantId ni referencias de
  recursos como autoridad.
- `ITenantResolver`, `TenantContext`, factory y accessor son contratos; no hay
  resolver, membership ni sesión reales.
- `TenantResolutionResult` sólo produce un resultado válido mediante evaluación
  obligatoria y rechaza tenants suspendidos o referencias operacionales incompletas.
- `TenantContext` copia roles y permisos a colecciones frozen.

## Persistencia y consistencia

Los adaptadores en memoria son singletons protegidos contra concurrencia. Cada
comando prepara copias de Tenant/Catalog, PlatformAudit, eventos e idempotencia
y las publica mediante un único intercambio bajo lock; fallo o cancelación
previos no dejan estado parcial. La aplicación compara la versión leída y el
store repite la comparación al persistir. El replay idempotente conserva la
respuesta para igual fingerprint y rechaza una clave reutilizada con otro
payload, incluso bajo solicitudes concurrentes.

El registro de estos adaptadores lanza una excepción fuera de `Development` o
`Testing`. No constituyen una base compartida multi-tenant ni una decisión de
persistencia productiva; son almacenamiento efímero para esta foundation.

## Evidencia multi-tenant

- MT-002 `PARTIAL / Sprint1 scope`: valores TenantId/stamp/DB/storage manipulados
  no controlan la creación del catálogo de Control Plane. El caso canónico no
  está aprobado sin Tenant Resolver y Data Plane.
- MT-008 parcial: un tenant suspendido es inelegible para TenantContext.
- MT-015: operaciones de plataforma auditan tenant objetivo, permiso y correlación.

MT-001, MT-003..007 y MT-009..014 son `NotApplicableToSprint1`, permanecen P0
y no están aprobados. La matriz autoritativa está en
`docs/testing/multi-tenant-matrix.md`.

## TBD abiertos que limitan la foundation

- `TBD-TEN-002`: bloquea el límite final entre Tenant Catalog y stamp.
- `TBD-AZR-001`, `TBD-AZR-002`: bloquean runtime/SKU productivo.
- `TBD-AZR-004`: bloquea selección de IaC.
- `TBD-AZR-005`: bloquea selección de CI/CD productivo.
- `TBD-SEC-001`, `TBD-SEC-002`, `TBD-SEC-003`: bloquean MFA, passkeys y step-up.
- `TBD-BRD-001`: bloquea decisión de custom domains/white label para MVP.

Todos los demás TBD del registro continúan `OPEN`. Los bloqueos contables y la
prohibición de posting de depreciación permanecen sin cambios.

## Riesgos y deuda aceptada

- Estado, auditoría, eventos e idempotencia se pierden al reiniciar el proceso.
- No hay outbox, migraciones ni persistencia duradera del Control Plane.
- No hay selector de stamp operativo ni orquestador de provisioning.
- El endpoint suspend no es alcanzable desde un tenant Active creado sólo por
  esta API, porque activación y pasos intermedios no forman parte del sprint.
- Resolver, TenantContextFactory, identity, memberships y sesiones son contratos.
- Health ready sólo demuestra que la foundation en memoria fue registrada.
- No se ha definido un objetivo de cobertura para completar el TBD de mantenibilidad.

## Política AGENTS.md

`AGENTS.md` existe en la raíz del repositorio y fue creado como parte del cierre
de Sprint 1. Su política obligatoria deriva del PDD, de la documentación
versionada y de las decisiones aprobadas de Sprint 1; no introduce TBD ni
requisitos no autorizados.

Fuente: PDD 04.4, 04.8, 06, 14, 26, 29, 32, 35, 41 y Apéndices A, C, D y E.
