# language: es
@p0 @security @multi_tenant
Característica: Aislamiento multi-tenant
  Ningún actor o proceso de un tenant puede acceder o inferir datos de otro.

  Escenario: MT-001 IDOR con identificador conocido
    Dado un usuario autenticado del Tenant A
    Y un recurso perteneciente al Tenant B
    Cuando solicita el recurso usando su identificador conocido
    Entonces recibe 404 o 403 sin datos ni evidencia de existencia del recurso

  Escenario: MT-002 manipulación de TenantId
    Dado una sesión válida del Tenant A
    Cuando envía el Tenant B en header, query o payload
    Entonces el servidor ignora o rechaza el valor no confiable
    Y no abre recursos del Tenant B

  Escenario: MT-003 cambio seguro de tenant
    Dado un usuario con membership activa en Tenant A y Tenant B
    Cuando cambia desde Tenant A a Tenant B
    Entonces el servidor reconstruye el TenantContext
    Y no permanece cache, filtro, store, upload, permiso, branding, feature, entidad ni libro del Tenant A

  Escenario: MT-004 branding aislado
    Dado branding diferente para Tenant A y Tenant B
    Cuando el usuario abre cada tenant
    Entonces cada contexto presenta exclusivamente su branding validado

  Escenario: MT-005 feature aislada
    Dado una feature habilitada sólo en Tenant A
    Cuando un usuario del Tenant B invoca directamente su endpoint
    Entonces el backend rechaza la operación

  Escenario: MT-006 documento aislado
    Dado un documento disponible del Tenant A
    Cuando se reutiliza su ID o URL temporal bajo Tenant B
    Entonces el acceso es denegado sin revelar metadata

  Escenario: MT-007 jobs concurrentes aislados
    Dado jobs válidos de Tenant A y Tenant B en la cola
    Cuando workers los procesan concurrentemente
    Entonces cada job revalida contexto y abre sólo recursos de su tenant

  Escenario: MT-008 tenant suspendido
    Dado una sesión vigente de un tenant suspendido
    Cuando intenta ejecutar una operación Data Plane
    Entonces el contexto se invalida y el acceso queda bloqueado

  Escenario: MT-009 usuario sin membership
    Dado un usuario sin membership en Tenant A
    Cuando intenta seleccionar o resolver Tenant A
    Entonces el tenant no aparece ni se construye TenantContext

  Escenario: MT-010 restore aislado
    Dado backups independientes de Tenant A y Tenant B
    Cuando se restaura Tenant A en target aislado y se activa mediante cutover
    Entonces los datos y recursos de Tenant B permanecen intactos

  Escenario: MT-011 búsqueda sin inferencia
    Dado un término que sólo existe en Tenant B
    Cuando se busca bajo Tenant A
    Entonces no hay resultados, conteos ni sugerencias que permitan inferirlo

  Escenario: MT-012 cache tenant-scoped
    Dado la misma clave lógica consultada en Tenant A y Tenant B
    Cuando ambas respuestas se almacenan en cache
    Entonces cada tenant obtiene exclusivamente su valor

  Escenario: MT-013 exports aislados
    Dado exports concurrentes para Tenant A y Tenant B
    Cuando terminan los jobs
    Entonces archivos, manifests y URLs quedan separados por tenant

  Escenario: MT-014 dominio no verificado
    Dado un host no verificado que pretende identificar Tenant A
    Cuando llega una solicitud
    Entonces Tenant Resolver no resuelve el tenant o bloquea la solicitud

  Escenario: MT-015 soporte de plataforma auditable
    Dado un operador autorizado con privilegio temporal
    Cuando ejecuta una operación de soporte sobre Tenant A
    Entonces se registra PlatformAudit con operador, motivo, resultado y Tenant A como objetivo
