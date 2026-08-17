# TrazActivo
## Product Design Document (PDD) v1.0 RC1

**Producto:** TrazActivo  
**Descriptor:** Gestión patrimonial y auxiliar contable  
**Lema:** Cada activo tiene una historia verificable.  
**Estado:** Propuesta consolidada, pendiente de aprobación de decisiones P0 y TBD críticos  
**Fecha de emisión:** 17 de agosto de 2026  
**Región primaria objetivo:** Microsoft Azure, Chile Central  
**Modelo:** SaaS multi-tenant configurable por cliente  
**Marcos contables objetivo:** NICSP-CGR e IFRS mediante libros y políticas versionadas  
**Idioma inicial:** Español de Chile, preparado para localización LATAM  
**Tipografía base:** Inter  

> [DECISIÓN] Este documento reemplaza como línea base funcional y arquitectónica al PDD v0.1. Las definiciones marcadas `SUPERSEDED` no deben utilizarse para diseño ni desarrollo.

> [CONDICIÓN] El documento se convertirá en baseline aprobada cuando se resuelvan los TBD P0 identificados en la sección E y se registren las aprobaciones del control documental.

---

# A. Diagnóstico del PDD actual

| Área | Estado previo | Problema | Impacto | Acción aplicada en esta versión | Prioridad |
|---|---|---|---|---|---|
| Visión de producto | Parcial | Definía gestión patrimonial y contabilidad, pero no partía desde el modelo SaaS | Riesgo de decisiones single-tenant difíciles de revertir | Se define SaaS, multi-tenant, Azure y configurable por cliente como principio de origen | P0 |
| Jerarquía de contexto | Incompleta | `Tenant`, entidad, libro, ubicación y organización podían confundirse | Fugas de alcance, permisos y datos | Se fija jerarquía Platform → Tenant → LegalEntity → AccountingBook/BusinessContext → User → Permission → Resource → Action | P0 |
| Aislamiento | Incompleto | `TenantId` era tratado principalmente como atributo de dominio | Riesgo cross-tenant | Se adopta database-per-tenant inicial, storage segregado, Tenant Catalog, Tenant Resolver y pruebas de aislamiento P0 | P0 |
| Control Plane | Ausente | Administración SaaS mezclada con administración del cliente | Privilegios excesivos y auditoría confusa | Se crea `TrazActivo Control` separado del Data Plane | P0 |
| Deployment stamps | Ausente | No existía unidad de escalamiento ni reducción de blast radius | Escalamiento y migración difíciles | Se incorpora arquitectura por stamps y catálogo de asignación | P1 |
| Modelo de identidad | Parcial | Usuario y rol estaban ligados implícitamente a una organización | No soporta consultores o auditores multi-tenant | Se separan `User`, `TenantMembership`, `Role` y `Permission` | P0 |
| Autenticación | Parcial | TOTP estaba contemplado, pero sin política por tenant, recuperación ni step-up | Exposición de operaciones contables sensibles | Se define SSO, TOTP, recovery codes, sesiones y step-up por operación | P0 |
| Autorización | Parcial | Permiso de módulo podía confundirse con aprobación de negocio | Un usuario autenticado podría ejecutar una acción sin aprobación | Se separan autenticación, autorización y aprobación de negocio | P0 |
| Branding | Parcial | Existía identidad TrazActivo, pero no arquitectura de personalización | Ramas por cliente y riesgo de inconsistencias | Se crea `TenantBranding`, design tokens, niveles de marca y plantillas versionadas | P1 |
| Suscripciones y features | Ausente | Módulo, plan, rol y permiso no estaban separados | Funcionalidad visible o ejecutable por error | Se separan `Subscription`, `Feature`, `Role` y `Permission` | P0 |
| Modelo patrimonial | Correcto en concepto, incompleto en detalle | Se separaban bien físico y activo contable, pero faltaban límites agregados y cardinalidades | Interpretación distinta entre equipos | Se definen bounded contexts, agregados y diccionario de datos | P0 |
| Adquisiciones | Parcial | La compra podía derivar demasiado pronto en un activo contable | Depreciación antes de disponibilidad para uso | Se separan OC, recepción, aceptación, creación física, disponibilidad y capitalización | P0 |
| Inventario | Parcial | Modelo heredado admitía una sola campaña activa y conciliación con efectos directos | Bloqueo operacional y cambios no revisados | Se habilitan campañas concurrentes sin solapamiento y observaciones inmutables | P0 |
| Depreciación | Insuficiente | El motor previo mezclaba prorrata, meses enteros y saldo remanente | Cuotas incorrectas y término anticipado | Se especifica motor determinista, segmentado, explicable y versionado | P0 |
| Política de 30 días | Ambigua | Podía presentarse como fórmula NICSP general | Riesgo normativo | Se clasifica como convención institucional configurable y separada de otros perfiles | P0 |
| Deterioro | Insuficiente | Ajuste directo de monto y vida útil | No soporta evaluación, medición ni reversión controlada | Se define workflow completo y separación de cambio de estimación | P1 |
| Revaluación y mejoras | Contradictoria | Se utilizaba “revalorización” para erogaciones capitalizables | Tratamiento contable incorrecto | Se separan revaluación, mejora, reparación, componente y cambio de estimación | P0 |
| Períodos y asientos | Parcial | Faltaban cierre, reapertura, posting, conciliación y errores de período anterior | Resultados no reproducibles | Se incorporan libros, períodos, lotes de asiento, posting y reversión | P0 |
| Evidencia documental | Parcial | Existían archivos, pero no retención, bloqueo ni clasificación formal | Pérdida de evidencia y borrado indebido | Se incorpora checksum, versionado, retención, legal hold configurable y auditoría | P0 |
| Auditoría | Parcial | Se contemplaba actividad, pero no separación plataforma/tenant ni garantía de inmutabilidad | Operador SaaS sin trazabilidad suficiente | Se separan `TenantAuditEvent` y `PlatformAuditEvent` | P0 |
| APIs | Parcial | Existía un listado inicial de endpoints sin contrato común | Integraciones y frontend inconsistentes | Se establece formato de API, idempotencia, concurrencia, errores y auditoría | P0 |
| Jobs y mensajería | Incompleto | No se definía contexto de tenant obligatorio | Riesgo de procesamiento cross-tenant | Se fija envelope con TenantId, CorrelationId y OperationId | P0 |
| Observabilidad | Parcial | Métricas generales sin dimensión por tenant y stamp | Difícil aislar incidentes y costos | Se define telemetría por tenant, stamp, módulo y operación | P1 |
| Backup y restore | Parcial | No existía restore lógico por tenant ni portabilidad | Dependencia operativa y contractual | Se especifican restore por tenant, exportación y migración de stamp | P0 |
| NFR | Insuficiente | Lista cualitativa sin métrica, responsable ni evidencia | Criterios de aceptación ambiguos | Se crea matriz NFR; valores comerciales quedan como `TBD-CONTRACT` | P0 |
| QA | Parcial | Golden dataset contable correcto, pero faltaban seguridad multi-tenant y DR | Regresiones de aislamiento | Se amplía estrategia de pruebas y catálogo MT-001 a MT-015 | P0 |
| DevOps | Parcial | Se mencionaba CI/CD e IaC sin evolución de esquema por tenant | Riesgo de drift y fallas masivas | Se incorpora versión de esquema, rollout por stamp y rollback controlado | P1 |
| ADR y Threat Model | Ausente | Decisiones y amenazas quedaban implícitas | Pérdida de contexto y controles incompletos | Se incorporan ADR iniciales y threat model trazable | P0 |

# B. Decisiones que deben conservarse

1. TrazActivo se construye como producto nuevo. Acctual se utiliza como referencia funcional y fuente potencial de migración, no como arquitectura objetivo.
2. El producto es un auxiliar patrimonial y contable. No reemplaza contabilidad general, presupuesto, tesorería ni cuentas por pagar.
3. `AssetItem`, `AccountingAsset`, `AssetGroup`, `AssetComponent` y `AccountingBook` son conceptos distintos.
4. NICSP-CGR e IFRS se implementan mediante libros y políticas separadas. No se mezclan reglas.
5. El motor de depreciación se ejecuta en backend y no en frontend.
6. Toda corrida guarda política, versión, datos de entrada, resultado, explicación y evidencia.
7. Los hechos contabilizados se revierten. No se eliminan.
8. El inventario se diseña para móvil, QR, código de barras y operación offline.
9. La constatación física genera una observación. No modifica automáticamente el maestro.
10. La interfaz se orienta a excepciones y decisiones, no sólo a dashboards decorativos.
11. La ficha 360° y el timeline patrimonial son vistas centrales.
12. TOTP forma parte del modelo de autenticación para cuentas locales.
13. Microsoft Entra ID y OIDC forman parte de la estrategia de identidad corporativa.
14. La identidad visual utiliza Inter y la paleta entregada para TrazActivo.
15. La región primaria objetivo es Azure Chile Central.
16. La primera arquitectura de aplicación será un monolito modular API-first. No se inicia con microservicios.
17. La importación utiliza staging, validación, preview y aprobación.
18. El golden dataset es obligatorio antes de publicar el motor contable.
19. La política de prorrata de 30 días es parametrizable. No se considera una regla NICSP universal.
20. El último período de depreciación absorbe diferencias de redondeo sin dejar el valor libro bajo el residual.

# C. Decisiones que deben reemplazarse

| Anterior | Nueva | Motivo | Impacto |
|---|---|---|---|
| Aplicación inicialmente modelada como un solo registro patrimonial | SaaS multi-tenant desde el diseño | El aislamiento no se agrega al final | Cambia dominio, seguridad, infraestructura, pruebas y operación |
| `Workspace` como concepto amplio | `Tenant`, `LegalEntity`, `BusinessContext` y `AccountingBook` separados | `Workspace` ocultaba límites distintos | APIs y permisos deben indicar scope explícito |
| Una base compartida con `TenantId` como control principal | Database per tenant inicial más Tenant Resolver validado | Reduce superficie de fuga y facilita restore | Provisionamiento y migraciones requieren automatización |
| Administración SaaS dentro de la aplicación cliente | Control Plane `TrazActivo Control` separado | Privilegios y auditoría son diferentes | Se requieren APIs, roles y auditoría de plataforma independientes |
| Una campaña de inventario activa | Campañas concurrentes con detección de solapamiento | Equipos distintos deben operar en paralelo | Se agrega `InventoryScopeLock` y resolución de conflictos |
| Conciliar y trasladar en una sola acción | Registrar observación, revisar y aprobar decisión | Un hallazgo no equivale a una autorización | Se separan `InventoryObservation` y `ReconciliationDecision` |
| Guardar compra y crear inmediatamente activos reconocidos | Crear bienes físicos y capitalizar en una etapa posterior | Compra no prueba disponibilidad para uso | Se agregan recepción, aceptación y capitalización |
| Botón manual “Activar depreciación” | Elegibilidad calculada por política y estado | Evita omisiones y decisiones arbitrarias | La corrida incluye automáticamente elegibles y explica exclusiones |
| Recalcular saldo neto dividido por meses enteros | Tasa por unidad y consumo del período sobre segmentos de estimación | Corrige distorsión de cuotas | Motor nuevo y golden dataset obligatorio |
| “Revalorización” como mejora capitalizable | Revaluación, erogación posterior y cambio de estimación separados | Son hechos contables distintos | Se crean workflows y eventos diferentes |
| TOTP opcional por usuario | Política por tenant y obligatoriedad por rol/operación | Protege funciones críticas | Se agrega enrolamiento, recuperación, step-up y auditoría |
| Un usuario perteneciente a una sola organización | Usuario global con membresías por tenant | Consultores y auditores pueden operar en varios clientes | Se requiere selector de tenant y limpieza completa de contexto |
| Branding fijo | Branding configurable con tokens y plantillas | SaaS por cliente sin forks | Se crea `TenantBranding` y niveles Standard/Custom/White Label |
| Servicios Azure tratados como definitivos | Decisiones Azure con necesidad, alternativas, costo, dependencias y riesgo | Disponibilidad y costo dependen de SKU y etapa | Hosting y DR quedan con ADR/TBD controlados |
| Borrado de archivos no reversable | Retención, versionado y eliminación lógica según clase | Evidencia contable no puede desaparecer sin trazabilidad | Cambia storage, UX, API y auditoría |

# D. Gaps

## D.1 P0

- Aprobar alcance normativo exacto de NICSP-CGR 2027 y construir matriz contra perfiles históricos.
- Aprobar la convención institucional de 30 días y su fuente formal.
- Aprobar golden dataset y resultados de los tres ejercicios de depreciación.
- Definir alcance inicial IFRS: completas o PYMES.
- Cerrar modelo de libros, períodos, posting, reapertura y corrección de errores.
- Implementar Tenant Catalog, Tenant Resolver y TenantContext.
- Probar aislamiento de API, archivos, búsquedas, cache, exportaciones, jobs, backups y logs.
- Definir proceso de provisionamiento, suspensión, terminación y restore por tenant.
- Implementar separación Control Plane/Data Plane.
- Definir roles, permisos y segregación de funciones.
- Definir política TOTP, recuperación y step-up.
- Cerrar modelo de evidencia, retención y borrado.
- Cerrar estrategia de schema migration database-per-tenant.
- Seleccionar hosting de aplicación mediante ADR.
- Definir región secundaria y estrategia DR o registrar formalmente su postergación contractual.

## D.2 P1

- Integración ERP inicial y formato de conciliación.
- Integración Mercado Público en alcance comercial.
- PWA offline, sincronización y pruebas de conflicto.
- Deterioro para activos generadores y no generadores de efectivo.
- Componentes, reemplazos e inspecciones mayores.
- Reporting financiero y modo auditor.
- Portal de branding y custom domains.
- Cost allocation por tenant.
- Deployment stamps y migración entre stamps.
- Observabilidad con dashboards operacionales por tenant.

## D.3 P2

- IFRS 16 completo.
- Flota avanzada.
- Alertas sanitarias.
- Analítica predictiva.
- API pública para partners.
- Infraestructura dedicada por tenant enterprise.
- SAML y aprovisionamiento SCIM.
- White label completo.

# E. Registro de TBD

| ID | Pregunta | Impacto | Quién debe decidir | Momento requerido |
|---|---|---|---|---|
| TBD-PROD-001 | ¿Quién aprueba formalmente alcance y baseline del PDD? | Gobernanza del producto | Sponsor y Product Owner | Antes de declarar v1.0 aprobada |
| TBD-ACC-001 | ¿La primera versión soportará IFRS completas, IFRS para PYMES o ambas? | Modelo de políticas y pruebas | Contabilidad y Product Owner | Antes de cerrar backlog contable |
| TBD-ACC-002 | ¿Cuál es la fuente formal de la convención de prorrata 30 días? | Validez de resultados | Contabilidad pública/cliente | Antes de publicar la política |
| TBD-ACC-003 | ¿Se aprueban los cargos corregidos de los tres ejercicios? | Golden dataset | Contabilidad | Antes de desarrollar DEP P0 |
| TBD-ACC-004 | ¿Qué versión íntegra de la normativa CGR 2027 será fuente de reglas? | Perfil NICSP_CGR_2027 | Especialista NICSP | Antes de configurar el perfil 2027 |
| TBD-ACC-005 | ¿Qué monedas estarán habilitadas en MVP? | Redondeo y tipos de cambio | Producto y Contabilidad | Antes de modelo monetario final |
| TBD-ACC-006 | ¿Cuál será el plan de cuentas inicial y su integración? | Asientos y reportes | Cliente piloto/Contabilidad | Antes de UAT contable |
| TBD-ERP-001 | ¿Cuál será el primer ERP integrado? | Diseño del conector | Product Owner y cliente piloto | Antes de Sprint de integración |
| TBD-AZR-001 | ¿Azure App Service o Azure Container Apps será el hosting inicial? | Operación, costo y pipeline | Arquitectura/DevOps | Antes de IaC productivo |
| TBD-AZR-002 | ¿Qué SKU y configuración zonal se aprobarán en Chile Central? | Disponibilidad y costo | Arquitectura/Finanzas | Antes de ambiente productivo |
| TBD-AZR-003 | ¿Cuál será la región secundaria? | DR y residencia | Arquitectura, Legal y cliente | Antes de contrato con DR |
| TBD-AZR-004 | ¿Bicep o Terraform será el estándar IaC? | Herramientas y operación | DevOps | Antes del repositorio IaC |
| TBD-AZR-005 | ¿GitHub Actions o Azure DevOps Pipelines será la plataforma CI/CD? | Pipelines y permisos | DevOps | Antes del primer pipeline |
| TBD-TEN-001 | ¿Qué criterios habilitan infraestructura dedicada? | Plan enterprise y costos | Producto/Finanzas/Arquitectura | Antes de oferta enterprise |
| TBD-TEN-002 | ¿Qué datos se mantienen en Tenant Catalog y cuáles sólo en el stamp? | Seguridad y disponibilidad | Arquitectura/Data | Antes de implementar catálogo |
| TBD-SEC-001 | ¿MFA será obligatorio para todos los usuarios o por rol en el plan Standard? | Experiencia y riesgo | Product Owner y Seguridad | Antes de onboarding piloto |
| TBD-SEC-002 | ¿Se habilitarán passkeys en MVP? | Resistencia al phishing | Seguridad/Producto | Antes de diseño de identidad |
| TBD-SEC-003 | ¿Qué timeout se usará para step-up? | Seguridad y UX | Seguridad | Antes de implementación SEC-003 |
| TBD-PRIV-001 | ¿Qué política contractual de retención y borrado aplicará? | Storage, evidencia y término | Legal/Producto | Antes de contrato piloto |
| TBD-DOC-001 | ¿Cuáles serán límites de tamaño y tipos de archivo? | UX, malware y costo | Producto/Seguridad | Antes de DocumentUploader |
| TBD-NFR-001 | ¿Cuál será el SLA comercial? | Arquitectura y contrato | Comercial/Operaciones | Antes de producción |
| TBD-NFR-002 | ¿Cuáles serán RPO y RTO por plan? | Backup/DR | Comercial/Arquitectura | Antes de producción |
| TBD-NFR-003 | ¿Cuáles son volúmenes objetivo de tenants, activos y transacciones? | Sizing y performance | Producto/Cliente piloto | Antes de pruebas de carga |
| TBD-NFR-004 | ¿Qué navegadores y versiones se soportarán? | QA y soporte | Producto/UX | Antes de UAT |
| TBD-INV-001 | ¿Qué datos podrán quedar offline y por cuánto tiempo? | Privacidad y sincronización | Producto/Seguridad | Antes de PWA offline |
| TBD-INV-002 | ¿Se requiere impresión directa y qué modelos de impresora serán certificados? | Operación de terreno | Producto/Cliente piloto | Antes de integración de impresión |
| TBD-BRD-001 | ¿Custom domain y white label entran al MVP comercial? | Front Door, certificados y soporte | Producto/Comercial | Antes de planes comerciales |
| TBD-SUP-001 | ¿Cuáles serán horarios y canales de soporte? | SLA y UX de ayuda | Operaciones/Comercial | Antes de contrato piloto |
| TBD-MKT-001 | ¿Mercado Público entra al MVP o a una fase posterior? | Integración y pruebas | Producto | Antes del backlog de fase 1 |
| TBD-MIG-001 | ¿Qué cliente y dataset serán la migración piloto? | Validación de importación | Product Owner | Antes de UAT de migración |

# F. Registro de conflictos y decisiones

| ID | Definición A | Definición B | Impacto | Recomendación | Estado |
|---|---|---|---|---|---|
| CONFLICT-001 | Un libro principal por entidad en MVP | Una organización puede mantener varios libros | Complejidad de UI y datos | Modelo multi-libro desde origen; UI puede destacar un libro predeterminado | RECOMENDADO |
| CONFLICT-002 | Política 30 días presentada como NICSP | Normativas y entidades pueden aplicar convenciones distintas | Riesgo normativo | Nombrar política institucional y asociar fuente/versión | DECIDIDO |
| CONFLICT-003 | Fecha de compra inicia depreciación | Fecha disponible para uso gobierna elegibilidad | Cálculo prematuro | Mantener fechas separadas y exigir disponibilidad | DECIDIDO |
| CONFLICT-004 | Una sola campaña activa | Equipos pueden inventariar ámbitos distintos | Bloqueo operacional | Permitir concurrencia sin solapamiento | DECIDIDO |
| CONFLICT-005 | El hallazgo mueve el activo | Hallazgo requiere revisión | Cambios no autorizados | Observación append-only y decisión posterior | DECIDIDO |
| CONFLICT-006 | Revalorización equivale a mejora | Revaluación y erogación son hechos distintos | Asientos y revelaciones incorrectos | Separar procesos | DECIDIDO |
| CONFLICT-007 | `Workspace` representa organización y registro | Jerarquía exige Tenant, LegalEntity, BusinessContext y Book | Ambigüedad de scope | Retirar `Workspace` del núcleo | SUPERSEDED |
| CONFLICT-008 | Hosting App Service definido | Prompt exige evaluar App Service o Container Apps | Costo y operación | Mantener ADR y TBD-AZR-001 | PENDIENTE |
| CONFLICT-009 | Residual fijo $1 | IFRS y políticas pueden usar otro residual | Reglas incompatibles | Residual por libro y versión; $1 sólo en perfil que corresponda | DECIDIDO |
| CONFLICT-010 | TOTP opcional individual | Tenant y roles requieren política obligatoria | Riesgo de bypass | Política de MFA por tenant con step-up | DECIDIDO |

---

# PDD completo actualizado

# 00. Control documental

## 00.1 Propósito

Este PDD define el comportamiento esperado, arquitectura, límites, datos, seguridad, UX, pruebas, despliegue y operación de TrazActivo. Es la fuente de verdad para generar modelos SQL, entidades, APIs, frontend, backend, IaC, pipelines, pruebas, wireframes, migraciones y manuales.

## 00.2 Clasificación de afirmaciones

- `HECHO`: información observada en archivos, demo o normativa identificada.
- `EVIDENCIA`: artefacto que respalda un hecho.
- `REQUISITO`: comportamiento exigible y verificable.
- `DECISIÓN`: alternativa seleccionada para la baseline.
- `INFERENCIA`: conclusión razonable aún no aprobada.
- `SUPUESTO`: condición usada para avanzar y que debe validarse.
- `TBD`: decisión abierta con propietario y momento requerido.
- `SUPERSEDED`: definición reemplazada y no vigente.

## 00.3 Fuentes de evidencia

| ID | Fuente | Uso |
|---|---|---|
| SRC-001 | TrazActivo PDD v0.1, 17-08-2026 | Línea base previa |
| SRC-002 | Prompt maestro de refactorización SaaS/multi-tenant | Requisitos arquitectónicos y de salida |
| SRC-003 | Manual Usuario Acctual, 223 páginas | Funcionalidades observadas y brechas |
| SRC-004 | Ingeniería Inversa Acctual, reunión 16-08-2026 | Observaciones UX, dominio y contabilidad |
| SRC-005 | Ejercicio Depreciación AAN | Casos de cálculo y error del motor actual |
| SRC-006 | Activo Fijo Valorizado CNA 2025 | Convención de consumo y calidad de datos |
| SRC-007 | Identidad visual TrazActivo | Logo, descriptor, lema, paleta y tipografía |
| SRC-008 | Resolución CGR N°16/2015 | Perfil histórico Gobierno Central, sujeto a matriz jurídica |
| SRC-009 | Resolución CGR N°3/2020 | Perfil histórico municipal, sujeto a matriz jurídica |
| SRC-010 | Resolución CGR N°1/2026 | Perfil unificado desde 2027, texto íntegro pendiente de matriz |
| SRC-011 | IAS 16 | Propiedad, planta y equipo bajo IFRS |
| SRC-012 | IAS 36 | Deterioro bajo IFRS |
| SRC-013 | IAS 8 | Políticas, estimaciones y errores |
| SRC-014 | IFRS 16 | Arrendamientos, fase posterior |
| SRC-015 | RFC 6238 | TOTP |
| SRC-016 | WCAG 2.2 | Accesibilidad |
| SRC-017 | Microsoft Azure Reliability, consulta 17-08-2026 | Zonas y condición regional |

## 00.4 Control de versiones

| Versión | Estado | Cambio |
|---|---|---|
| 0.1 | SUPERSEDED | Primera definición funcional y contable |
| 1.0 RC1 | Actual | Refactor SaaS, multi-tenant, Azure, seguridad, UX, dominio y operación |

## 00.5 Aprobaciones requeridas

| Rol | Responsable | Estado |
|---|---|---|
| Sponsor | TBD-PROD-001 | Pendiente |
| Product Owner | TBD-PROD-001 | Pendiente |
| Arquitectura | TBD | Pendiente |
| Seguridad | TBD | Pendiente |
| Contabilidad NICSP | TBD | Pendiente |
| Contabilidad IFRS | TBD | Pendiente |
| Operaciones/DevOps | TBD | Pendiente |
| UX | TBD | Pendiente |

# 01. Visión del producto

## 01.1 Declaración

TrazActivo es una plataforma SaaS multi-tenant sobre Microsoft Azure para gestionar patrimonio, inventario, auxiliar contable, evidencia y auditoría. Cada cliente configura su estructura, libros, políticas, branding, módulos, usuarios e integraciones sin modificar el código del producto.

## 01.2 Usuarios objetivo

- Entidades públicas sujetas a NICSP-CGR.
- Municipalidades y corporaciones municipales.
- Empresas privadas bajo IFRS.
- Clínicas, instituciones educacionales y organizaciones con bienes distribuidos.
- Encargados patrimoniales.
- Contabilidad y finanzas.
- Equipos de inventario.
- Mantenimiento.
- Auditoría interna y externa.
- Consultores con membresía en varios tenants.

## 01.3 Resultados esperados

- Inventario físico identificable y ubicable.
- Valor contable reproducible por libro y período.
- Depreciación explicable y conciliable.
- Evidencia vinculada a cada decisión.
- Historia de movimientos y aprobaciones.
- Separación entre operación física y efecto contable.
- Aislamiento verificable entre clientes SaaS.

## 01.4 Límites de la promesa

TrazActivo proporciona capacidades para configurar y ejecutar políticas. La conformidad de una organización depende de la política aprobada, calidad de datos, operación, controles, integraciones y validación profesional. El producto no declarará cumplimiento normativo automático ni certificación contable.

# 02. Alcance, exclusiones y supuestos

## 02.1 Alcance funcional

- Bienes físicos y activos contables.
- Estructura física, organizacional y centros de costo.
- Adquisiciones, recepciones, aceptación y capitalización.
- QR, código de barras, etiquetas y ficha 360°.
- Inventarios completos y selectivos.
- Traslados, préstamos, devoluciones, comodatos y bajas.
- Libros, períodos y políticas versionadas.
- Depreciación, deterioro y cambios de estimación.
- Componentes y erogaciones posteriores.
- Mantenimiento y relación con contabilidad.
- Documentos, workflow, aprobaciones y auditoría.
- Reportes, búsqueda, importaciones e integraciones.
- Control Plane para administración del SaaS.

## 02.2 Exclusiones del núcleo

- Contabilidad general.
- Presupuesto.
- Tesorería.
- Cuentas por pagar.
- Facturación.
- Remuneraciones.
- Inventario de existencias o farmacia.
- Gestión documental corporativa general.
- Proceso completo de contratación pública.

## 02.3 Supuestos controlados

- `SUPUESTO-001`: Chile Central será región primaria.
- `SUPUESTO-002`: Database per tenant es viable para el modelo inicial; costos se validarán con el piloto.
- `SUPUESTO-003`: El primer release utilizará un monolito modular.
- `SUPUESTO-004`: El cliente piloto entregará plan de cuentas, reglas y dataset de validación.
- `SUPUESTO-005`: La aplicación web será el canal principal; móvil será PWA, no aplicación nativa en MVP.

# 03. Principios arquitectónicos

1. Multi-tenancy desde el primer modelo y primera prueba.
2. Un contexto de tenant validado por servidor gobierna toda operación.
3. El dominio no confía en identificadores de tenant entregados por el navegador.
4. Reglas contables sólo en Domain/Policy Engine.
5. Los estados de negocio se modelan como máquinas de estado, no como CRUD libre.
6. Eventos aprobados o contabilizados se revierten, no se borran.
7. Cada proceso de alto impacto produce evidencia y auditoría.
8. El frontend consume decisiones del backend y no replica fórmulas contables.
9. Integraciones son adaptadores por tenant y no contaminan el núcleo.
10. Diseño por excepción: la interfaz muestra qué requiere decisión.
11. Infraestructura y esquema se versionan.
12. La arquitectura puede mover un tenant entre stamps sin cambiar identificadores de negocio.
13. No se registra información sensible en logs sin necesidad.
14. Los costos y NFR comerciales no se inventan; se registran como TBD.

# 04. Modelo SaaS y multi-tenant

## 04.1 Jerarquía obligatoria

```text
PLATFORM
  └── TENANT
       ├── LEGAL ENTITY
       │    ├── BUSINESS CONTEXT
       │    └── ACCOUNTING BOOK
       ├── USER MEMBERSHIP
       │    └── ROLE / PERMISSION
       └── RESOURCE
            └── ACTION
```

## 04.2 Definiciones

- `Platform`: servicio TrazActivo operado por el proveedor SaaS.
- `Tenant`: cliente SaaS. No equivale a un tenant de Microsoft Entra.
- `LegalEntity`: persona jurídica o entidad pública propietaria o controladora de activos.
- `BusinessContext`: partición operacional opcional dentro de una entidad, sin sustituir un libro.
- `AccountingBook`: representación contable bajo marco y política definidos.
- `Establishment`: sitio o establecimiento físico.
- `Location`: espacio físico jerárquico dentro de un establecimiento.
- `OrganizationalUnit`: unidad del organigrama.
- `CostCenter`: dimensión de imputación financiera.

## 04.3 Estrategia inicial de aislamiento

> [DECISIÓN] Frontend compartido por stamp, backend/API compartido por stamp, Tenant Resolver, database per tenant y storage segregado por tenant.

### Alternativas evaluadas

| Alternativa | Ventaja | Riesgo | Decisión |
|---|---|---|---|
| Base compartida con `TenantId` y RLS | Menor costo inicial | Mayor superficie de fuga y restore complejo | Rechazada para baseline |
| Database per tenant | Aislamiento, restore y portabilidad | Provisionamiento y migrations más complejos | Seleccionada |
| Infraestructura completa por tenant | Máximo aislamiento | Alto costo y operación | Opción enterprise futura |

## 04.4 Tenant Catalog

El catálogo central almacena metadatos de resolución, no datos patrimoniales:

```text
TenantId
TenantCode
Status
DeploymentStampId
DatabaseReference
StorageReference
Region
SchemaVersion
ConfigurationVersion
IdentityMode
```

No almacenará contraseñas, secretos de integración ni datos contables.

## 04.5 Tenant Resolver

Fuentes permitidas para identificar candidato de tenant:

- subdominio;
- custom domain validado;
- selección posterior a autenticación;
- claim firmado emitido por el servicio de identidad.

El resolver valida membresía, estado, stamp y recursos contra Tenant Catalog. El cliente no entrega una cadena de conexión ni elige base de datos.

## 04.6 TenantContext

```text
TenantId
UserId
TenantMembershipId
LegalEntityId
BusinessContextId optional
AccountingBookId optional
Roles
Permissions
Locale
TimeZone
CorrelationId
SessionId
```

Reglas:

- se crea después de autenticar y validar membresía;
- se reconstruye al cambiar tenant;
- se propaga a application services, jobs, mensajes, auditoría e integraciones;
- no se serializan secretos ni cadenas de conexión en el contexto;
- se invalida si el tenant queda suspendido o la membresía expira.

## 04.7 Cambio de tenant

El cambio debe limpiar:

- cache del cliente;
- filtros y vistas temporales;
- store de datos;
- archivos en carga;
- permisos;
- branding;
- feature flags;
- libro y entidad seleccionados.

## 04.8 Lifecycle del tenant

```text
Requested → Provisioning → Configuring → Validation → Active
                        ↘ ProvisioningFailed
Active → Suspended → Active
Active/Suspended → Terminating → Retention → Deleted
```

Cada transición exige permiso de plataforma, motivo, evento y auditoría.

## 04.9 Deployment stamps

```text
Azure Front Door
      │
      ├── TrazActivo Control
      │
      ├── STAMP-CL01
      │     ├── Web/API
      │     ├── Workers
      │     ├── Tenant DBs
      │     └── Tenant Storage
      └── STAMP-CL02 (futuro)
```

Un tenant mantiene identificadores estables al migrar de stamp. La migración actualiza Tenant Catalog mediante workflow auditable.

# 05. Arquitectura Azure

## 05.1 Hechos regionales utilizados

- Chile Central es la región primaria solicitada.
- La documentación de confiabilidad de Azure consultada el 17-08-2026 identifica soporte de zonas de disponibilidad en Chile Central.
- Chile Central no tiene región emparejada automática. La región secundaria debe seleccionarse explícitamente.

## 05.2 Arquitectura lógica propuesta

```text
Internet / Cliente corporativo
            │
            ▼
Azure Front Door + WAF
            │
     ┌──────┴──────┐
     ▼             ▼
TrazActivo Control  Data Plane Stamp
                         │
                  Web/PWA + API
                         │
              Application/Domain Layer
                         │
       ┌────────────┬───────────┬────────────┐
       ▼            ▼           ▼            ▼
 Tenant Catalog  Tenant DB   Tenant Blob   Service Bus
       │                         │            │
       └──────── Key Vault / App Configuration ───────┘
                         │
                Monitor / App Insights / Logs
```

## 05.3 Matriz de decisiones Azure

| Necesidad | Alternativas | Decisión | Justificación | Costo/impacto | Dependencias | Riesgos |
|---|---|---|---|---|---|---|
| Entrada global, WAF y dominios | Front Door, Application Gateway, acceso directo | Front Door + WAF propuesto | Custom domains, routing por stamp y edge security | Costo fijo a validar | TBD-BRD-001 | Configuración de dominios y certificados |
| Hosting web/API | App Service, Container Apps | TBD-AZR-001 | Falta validar perfil de cargas y operación | Afecta pipeline y observabilidad | Piloto y pricing | Selección prematura |
| Persistencia tenant | Azure SQL DB, PostgreSQL | Azure SQL Database propuesta | Database per tenant, transacciones y ecosistema .NET | Elastic Pools a evaluar | Modelo de datos y volumen | Costo por muchas bases |
| Pooling | DB individual, Elastic Pool | Elastic Pool cuando perfil lo permita | Reduce costo sin perder DB por tenant | Sizing pendiente | TBD-NFR-003 | Noisy neighbor del pool |
| Documentos | Blob por prefix, container, account dedicado | Container segregado por tenant en plan Standard | Aislamiento lógico claro y lifecycle por tenant | Operación de muchos containers | Tenant provisioning | Errores de autorización SAS |
| Secretos | DB cifrada, App Configuration, Key Vault | Key Vault y referencias | Rotación y control de acceso | Operación adicional | Managed Identity | Dependencia regional |
| Jobs | Scheduler interno, Functions, Worker + Service Bus | Worker + Service Bus propuesto | Reintentos, DLQ, aislamiento por mensaje | Costo por operación | TBD-AZR-001 | Contexto de tenant incorrecto |
| API gateway | APIM desde inicio o diferido | Diferido hasta integración externa suficiente | Evita costo y complejidad temprana | Menor control de producto API inicial | Roadmap INT | Incorporación posterior |
| Búsqueda | SQL, Azure AI Search | SQL tenant-scoped en MVP; evaluar Search | Menor costo y datos por tenant | Límites de búsqueda avanzada | Volumen | Migración posterior |
| DR | Región emparejada, región elegida | TBD-AZR-003 | Chile Central no tiene par automático | Contractual | RPO/RTO | Decisión tardía |

## 05.4 Red y acceso

- TLS obligatorio.
- WAF en entrada pública.
- Managed Identity entre servicios cuando sea viable.
- Private Endpoints para datos productivos cuando el diseño y SKU lo permitan.
- Cadenas de conexión fuera del código.
- Acceso administrativo mediante identidad nominativa y privilegio temporal.
- No exponer Blob o bases directamente a usuarios finales.

## 05.5 Alta disponibilidad

El diseño utilizará redundancia zonal sólo cuando el servicio, SKU, costo y etapa lo permitan. Los objetivos numéricos de disponibilidad quedan en `TBD-NFR-001`.

## 05.6 Separación de ambientes

- Development.
- Test.
- QA/UAT.
- Production.

Producción no comparte datos, redes ni secretos con ambientes no productivos. Los datos productivos sólo se reutilizan mediante proceso de sanitización aprobado.

# 06. Control Plane y Data Plane

## 06.1 TrazActivo Control

Responsabilidades:

- alta y lifecycle de tenants;
- planes, suscripciones y features;
- asignación de stamp;
- provisionamiento de DB y storage;
- branding y dominios;
- identidad y administrador inicial;
- uso y consumo;
- health de plataforma;
- migración de stamp;
- suspensión, retención y terminación;
- auditoría de operadores.

No permite modificar directamente activos, depreciaciones o asientos de un tenant. Toda intervención excepcional debe ejecutarse mediante operación administrativa auditada y con acceso just-in-time.

## 06.2 Data Plane

Responsabilidades:

- gestión patrimonial;
- inventario;
- operaciones;
- contabilidad;
- mantenimiento;
- evidencia;
- aprobaciones;
- reportes;
- auditoría de tenant.

## 06.3 Provisionamiento

```text
Crear solicitud
→ Reservar TenantCode
→ Asignar stamp
→ Provisionar DB
→ Provisionar container de documentos
→ Aplicar schema
→ Crear configuración
→ Configurar identidad
→ Configurar branding
→ Crear administrador
→ Asignar features
→ Ejecutar validaciones
→ Activar
```

El workflow es idempotente, reintentable y auditable. Un fallo deja el tenant en `ProvisioningFailed` y no en estado parcialmente activo.

# 07. Tenant, LegalEntity y AccountingBook

## 07.1 Cardinalidades

```text
Tenant 1..N LegalEntity
LegalEntity 0..N BusinessContext
LegalEntity 1..N AccountingBook
LegalEntity 1..N Establishment
Establishment 1..N Location
LegalEntity 1..N OrganizationalUnit
LegalEntity 0..N CostCenter
```

## 07.2 AccountingBook

Campos mínimos:

- `AccountingBookId`;
- `TenantId`;
- `LegalEntityId`;
- código y nombre;
- marco contable;
- moneda funcional;
- calendario y períodos;
- policy set vigente;
- libro predeterminado;
- estado.

Un bien físico puede relacionarse con varios `AccountingAsset`, uno por libro cuando corresponda.

## 07.3 BusinessContext

Se utiliza para separar operación, proyecto o registro patrimonial sin convertirlo en entidad legal ni libro. Es opcional y no reemplaza controles de entidad o libro.

# 08. Identidad, autenticación y autorización

## 08.1 Modelo

```text
User
  └── TenantMembership
        ├── RoleAssignment
        ├── PermissionScope
        └── MembershipStatus
```

Un `User` puede tener memberships en varios tenants. El correo no es clave de negocio inmutable.

## 08.2 Modos de autenticación

Por tenant:

- cuenta local;
- TOTP y recovery codes;
- Microsoft Entra ID mediante OIDC;
- Microsoft Entra External ID cuando corresponda;
- SAML como evolución.

## 08.3 TOTP

- secreto único generado criptográficamente;
- código de seis dígitos;
- intervalo de 30 segundos;
- ventana de tolerancia acotada;
- rechazo de replay después de uso exitoso;
- rate limiting;
- secreto cifrado y no visible después del enrolamiento;
- recovery codes de un uso almacenados mediante hash;
- revocación de sesiones al cambiar factor;
- auditoría de enrolamiento, uso, recuperación y reset.

## 08.4 Autorización

La autorización evalúa:

```text
Membership activa
AND Tenant activo
AND módulo contratado
AND feature habilitada
AND rol asignado
AND permiso concedido
AND scope válido
AND estado de negocio permitido
```

## 08.5 Aprobación de negocio

Una autorización técnica no sustituye aprobación. Operaciones sensibles utilizan workflow, segregación de funciones y evidencia.

## 08.6 Step-up authentication

Triggers iniciales:

- contabilizar o revertir depreciación;
- aprobar deterioro;
- aprobar baja;
- reabrir o corregir período cerrado;
- publicar política contable;
- cambiar roles o seguridad;
- restablecer MFA de otro usuario;
- exportar información clasificada como restringida.

Timeout y métodos quedan en TBD-SEC-003. El resultado se registra como evento de seguridad vinculado a la operación.

# 09. Seguridad y Threat Model

## 09.1 Requisito P0

Ningún usuario, proceso, API, job, búsqueda, archivo, reporte, backup o integración del Tenant A podrá acceder directa o indirectamente a información del Tenant B.

## 09.2 Amenazas y controles

| Amenaza | Control principal | Prueba |
|---|---|---|
| IDOR cross-tenant | Resolver server-side, DB por tenant, autorización de recurso | MT-001, MT-002 |
| Manipulación de TenantId | Ignorar tenant del payload y derivar TenantContext | MT-002 |
| Cambio de tenant incompleto | Limpieza de store, cache, filtros y recursos | MT-003 |
| Cache poisoning | Claves con tenant y no cachear autorización sin contexto | MT-012 |
| Documento cross-tenant | Container/claims/URL temporal con tenant validado | MT-006 |
| Job con contexto incorrecto | Envelope obligatorio y validación antes de abrir DB | MT-007 |
| Exportación mezclada | Job y dataset ligados a TenantContext | MT-013 |
| Búsqueda global | Índice o consulta por tenant y permiso | MT-011 |
| Privilege escalation | Roles, scopes, four-eyes y step-up | SEC tests |
| MFA bypass | Política de factor, recovery controlada y auditoría | SEC-MFA tests |
| Credential stuffing | Rate limiting, detección y MFA | SEC-AUTH tests |
| Archivo malicioso | Validación de tipo, malware scan y cuarentena | DOC-SEC tests |
| Injection | Parámetros, validación, ORM y SAST/DAST | SEC-INJ tests |
| SSRF | Allowlist de integraciones y egress controlado | SEC-SSRF tests |
| Fuga en logs | Redacción y clasificación | OBS-PRIV tests |
| Exposición de backup | RBAC, cifrado y acceso separado | MT-010 |
| Secret leakage | Key Vault, Managed Identity y scanning | SEC-SECRET tests |
| Custom domain takeover | Verificación de dominio y lifecycle de certificado | MT-014 |

## 09.3 Clasificación inicial

- Public.
- Internal.
- Confidential.
- Restricted.

RUT, contactos, documentos, fotografías, datos financieros, credenciales y evidencia se clasifican según finalidad y tenant. La clasificación específica queda sujeta a revisión legal; no se infieren obligaciones no documentadas.

## 09.4 Operadores SaaS

- Acceso nominativo.
- Privilegio mínimo.
- Just-in-time cuando corresponda.
- Prohibición de utilizar cuentas compartidas.
- Auditoría de toda operación.
- Separación entre soporte y aprobación contable.

# 10. Branding y White Label

## 10.1 TenantBranding

Campos:

- logo principal;
- isotipo;
- favicon;
- nombre visible;
- colores permitidos;
- imagen de login;
- URL y email de soporte;
- plantillas documentales;
- plantillas de correo;
- nivel comercial de branding.

No se crean ramas de código por cliente.

## 10.2 Design tokens base

```css
--color-primary: #17324D;
--color-primary-hover: #10263A;
--color-secondary: #19766F;
--color-accent: #327DA8;
--color-background: #F5F7F9;
--color-surface: #FFFFFF;
--color-text-primary: #202A33;
--color-text-secondary: #66727D;
--color-border: #DCE3E8;
--color-success: #287A59;
--color-warning: #B7791F;
--color-error: #B42318;
--color-information: #25689B;
--font-family-base: "Inter", sans-serif;
```

Los tenants no pueden redefinir colores semánticos de forma que una advertencia parezca conforme.

## 10.3 Niveles

- Standard: logo cliente más identidad TrazActivo.
- Custom Branding: logos, colores, favicon, login, PDF y correo.
- White Label: dominio e identidad del cliente con presencia reducida de TrazActivo.

La capacidad técnica no implica disponibilidad comercial automática.

## 10.4 Dominios

- `cliente.trazactivo.cl`.
- custom domain futuro, por ejemplo `activos.cliente.cl`.

El dominio ayuda a resolver el tenant, pero nunca autoriza acceso por sí solo.

## 10.5 Documentos y correos

La presentación visual se separa del contenido funcional o regulado. Un cambio de branding no puede cambiar montos, fórmulas, IDs, evidencia ni estados.

# 11. Suscripciones, módulos y Feature Flags

## 11.1 Conceptos

- `Subscription`: plan contratado por tenant.
- `Feature`: capacidad técnica habilitable.
- `Role`: agrupación de permisos.
- `Permission`: acción autorizada.

## 11.2 Regla de visibilidad y ejecución

```text
Subscription incluye módulo
AND Feature habilitada
AND Membership activa
AND Role autorizado
AND Permission concedido
```

El backend vuelve a validar la regla aunque la opción no sea visible en frontend.

## 11.3 Features iniciales

- Assets.
- Inventory.
- Accounting.
- Depreciation.
- Impairment.
- Maintenance.
- MarketPublico.
- HealthcareAlerts.
- ERPIntegration.
- AdvancedAudit.
- CustomBranding.
- CustomDomain.

# 12. Modelo de dominio

## 12.1 Bounded contexts

| Contexto | Responsabilidad | Datos que no debe poseer |
|---|---|---|
| Platform Management | Tenants, stamps, planes, lifecycle | Activos y asientos del cliente |
| Identity & Access | Usuarios, memberships, roles, sesiones, MFA | Reglas contables |
| Tenant Configuration | Branding, features, catálogos y configuración | Saldos históricos |
| Asset Registry | Bienes físicos, identificación, condición y ficha | Posting contable |
| Organization & Location | Entidades, sitios, ubicaciones, unidades y centros de costo | Depreciación |
| Acquisition | OC, recepción, aceptación, factura y distribución de costos | Períodos contables |
| Custody & Movement | Asignaciones, traslados, préstamos, comodatos y devoluciones | Políticas contables |
| Inventory | Campañas, alcance, observaciones y conciliación | Modificación directa de saldos |
| Accounting | Libros, períodos, activos contables, asientos y conciliación | Autenticación |
| Policy Engine | Reglas versionadas, depreciación y elegibilidad | Persistencia de UI |
| Impairment & Valuation | Deterioro, estimaciones y revaluación | Inventario físico |
| Maintenance | Solicitudes, OT, planes, lecturas y resultados técnicos | Aprobación contable final |
| Documents & Evidence | Archivos, versiones, clasificación y retención | Lógica contable |
| Workflow | Solicitudes, revisiones, aprobaciones y segregación | Cálculo de montos |
| Audit | Eventos tenant y plataforma | Modificación de entidades fuente |
| Integration | Configuraciones, credenciales referenciadas y ejecuciones | Reglas internas del ERP |
| Reporting & Search | Proyecciones de lectura, reportes y búsqueda | Escritura directa del dominio |

## 12.2 Agregados principales

### TenantAggregate

- Tenant.
- TenantSubscription.
- TenantBranding.
- TenantDomain.
- TenantFeature.
- TenantLifecycleEvent.

### AssetItemAggregate

- AssetItem.
- AssetIdentifier.
- AssetPhotoReference.
- CurrentOperationalState.
- CurrentLocationProjection.
- CurrentCustodianProjection.

El agregado no contiene depreciación ni asientos.

### AccountingAssetAggregate

- AccountingAsset.
- AccountingBookId.
- RecognitionState.
- CapitalizationEvent.
- EstimateSegments.
- ComponentReferences.
- AccountingEventSequence.

### InventoryCampaignAggregate

- InventoryCampaign.
- InventoryScope.
- TeamAssignment.
- InventoryObservation.
- ScopeLock.
- ReconciliationDecision.

### DepreciationRunAggregate

- DepreciationRun.
- DepreciationLine.
- PolicySnapshot.
- ApprovalReferences.
- JournalBatchReference.
- ReversalReference.

## 12.3 Separación patrimonial obligatoria

```text
AssetItem        = unidad física controlada
AccountingAsset  = unidad contable reconocida en un libro
AssetGroup       = grupo homogéneo reconocido como unidad contable
AssetComponent   = parte significativa con costo y vida propios
AccountingBook   = contexto contable donde se valoriza
```

Un `AssetItem` puede no tener `AccountingAsset`. Un `AccountingAsset` puede representar uno o varios `AssetItem`. Un componente puede relacionarse con un bien físico o ser sólo una unidad contable identificable.

## 12.4 Identificadores

- IDs técnicos: UUID/ULID inmutables.
- Número de inventario: identificador visible configurable y único en su scope.
- Código QR: token opaco, no PII.
- Serie, patente, VIN y otros: identificadores alternativos con reglas por clase.
- No utilizar RUT, email o número de inventario como clave primaria.

# 13. Diccionario de datos

## 13.1 Plataforma y tenant

| Entidad | Scope | Campos mínimos | Reglas |
|---|---|---|---|
| `Tenant` | Platform | Id, Code, Name, Status, StampId, Region, CreatedAt | Code único; lifecycle controlado |
| `TenantCatalogEntry` | Platform | TenantId, Status, DBRef, StorageRef, SchemaVersion, ConfigVersion | No contiene secretos |
| `DeploymentStamp` | Platform | Id, Region, Status, CapacityClass, AppVersion | Tenant migrable |
| `TenantSubscription` | Tenant | PlanCode, EffectiveFrom, EffectiveTo, Status | Versionada por vigencia |
| `TenantFeature` | Tenant | FeatureCode, Enabled, Source, EffectiveAt | Evaluada server-side |
| `TenantBranding` | Tenant | Logos, tokens permitidos, support, templates | No altera semántica |
| `TenantDomain` | Tenant | Hostname, Type, VerificationStatus, CertificateStatus | Hostname no autoriza |

## 13.2 Identidad

| Entidad | Scope | Campos mínimos | Reglas |
|---|---|---|---|
| `User` | Platform | Id, PrimaryEmail, Status, IdentityLinks | Puede pertenecer a varios tenants |
| `TenantMembership` | Tenant | Id, UserId, Status, ValidFrom, ValidTo | Obligatoria para Data Plane |
| `Role` | Tenant/Platform | Code, Name, ScopeType, Status | No mezclar roles platform/tenant |
| `Permission` | Platform catalog | Resource, Action, Constraints | Código inmutable |
| `RoleAssignment` | Tenant | MembershipId, RoleId, Scope | Vigencia y auditoría |
| `MfaMethod` | User | Type, Status, EnrolledAt | Secreto fuera de logs |
| `RecoveryCodeSet` | User | Version, Hashes, CreatedAt | Un uso |
| `Session` | User/Tenant | Id, Device, IssuedAt, LastSeenAt, RevokedAt | Revocable por factor/tenant |

## 13.3 Organización

| Entidad | Scope | Campos mínimos | Reglas |
|---|---|---|---|
| `LegalEntity` | Tenant | Id, Code, LegalName, Identifier, Status | No equivale a tenant |
| `BusinessContext` | LegalEntity | Id, Code, Name, Type, Status | Partición operacional opcional |
| `Establishment` | LegalEntity | Id, Code, Name, Address, Status | Sitio físico |
| `Location` | Establishment | Id, ParentId, Code, Name, Type, Status | Jerarquía sin ciclos |
| `OrganizationalUnit` | LegalEntity | Id, ParentId, Code, Name, Status | Organigrama separado de ubicación |
| `CostCenter` | LegalEntity | Id, Code, Name, EffectiveFrom, EffectiveTo | Vigencia contable |
| `PersonReference` | Tenant | Id, ExternalEmployeeId, Name, Contact, Status | RUT opcional y restringido |
| `CustodianAssignment` | AssetItem | PersonId, From, To, AcceptanceStatus | Historia, no overwrite |

## 13.4 Activos

| Entidad | Scope | Campos mínimos | Reglas |
|---|---|---|---|
| `AssetItem` | Tenant/LegalEntity | Id, InventoryNumber, Name, ClassId, OwnershipType, Condition, Status | Bien físico |
| `AssetIdentifier` | AssetItem | Type, Value, ValidFrom, ValidTo | Unicidad por tipo/scope |
| `AssetClass` | Tenant/Platform catalog | Code, Name, FieldSchema, ValidationProfile | Versionada |
| `AssetFamily` | Tenant | Code, Name, Status | Catálogo operacional |
| `Brand` | Tenant/catalog | Code, Name, Status | Duplicados controlados |
| `Model` | Brand | Code, Name, ClassCompatibility | Validación cruzada |
| `AssetGroup` | AccountingBook | Id, GroupPolicyId, MemberItems, AllocationRule | Grupo homogéneo |
| `AssetComponent` | AccountingAsset | Id, Name, Cost, AvailableDate, UsefulLife | Depreciación propia |
| `AccountingAsset` | AccountingBook | Id, AssetItem/GroupRef, RecognitionState, Currency | Uno por libro/unidad contable |

## 13.5 Adquisición y contabilidad

| Entidad | Scope | Campos mínimos | Reglas |
|---|---|---|---|
| `PurchaseOrder` | LegalEntity | Number, Supplier, Date, Lines, Source | Payload original conservado |
| `Acquisition` | LegalEntity | Type, Date, Supplier/Donor, Source | No implica capitalización |
| `Receipt` | Acquisition | Date, Lines, Quantities, Evidence | Puede ser parcial |
| `Acceptance` | Receipt | Status, Date, Reviewer, Findings | Requerida según política |
| `InvoiceReference` | Acquisition | Number, Date, Amount, Currency | No es libro mayor |
| `CostAllocation` | Acquisition | SourceCost, Target, Method, Amount | Debe cuadrar |
| `CapitalizationEvent` | AccountingAsset | AvailableForUseDate, RecognizedCost, PolicyVersion | Inmutable después de posting |
| `AccountingBook` | LegalEntity | Framework, Currency, Calendar, Status | Políticas separadas |
| `AccountingPeriod` | Book | Start, End, Status, ClosedAt | Secuencia controlada |
| `JournalBatch` | Book/Period | Source, Status, Debit, Credit, ExternalId | Debe cuadrar |
| `JournalLine` | JournalBatch | Account, Debit/Credit, AssetRef, CostCenter | Trazable a evento |
| `ReconciliationResult` | Book/Period | SourceBalance, ExternalBalance, Difference | Evidencia y resolución |

## 13.6 Políticas y cálculos

| Entidad | Scope | Campos mínimos | Reglas |
|---|---|---|---|
| `PolicySet` | AccountingBook | Id, Framework, Version, EffectiveFrom/To, Status | Publicada no se edita |
| `PolicyRule` | PolicySet | RuleId, Type, Parameters, Source | Esquema validado |
| `UsefulLifeRule` | PolicySet | AssetClass, Method, Units, Min/Max, Overrides | Aprobación requerida |
| `EstimateSegment` | AccountingAsset | EffectiveFrom, OpeningNBV, Residual, RemainingUnits, Method | Aplicación prospectiva |
| `DepreciationRun` | Book/Period | Status, PolicySnapshot, Totals, Hash | Única por scope/versión |
| `DepreciationLine` | Run/Asset | Opening, Units, Charge, Closing, Explanation | Determinista |
| `ImpairmentAssessment` | Book/Asset | Indicator, Measurement, RecoverableAmount, Status | Workflow |
| `SubsequentExpenditure` | Book/Asset | Type, Amount, TechnicalResult, AccountingDecision | No capitaliza automáticamente |
| `RevaluationEvent` | Book/Class | MeasurementDate, Scope, Basis, Status | Separada de mejora |

## 13.7 Inventario, workflow y evidencia

| Entidad | Scope | Campos mínimos | Reglas |
|---|---|---|---|
| `InventoryCampaign` | Tenant | Type, Scope, Status, FreezeAt, Owner | Concurrencia controlada |
| `InventoryScope` | Campaign | Locations, Classes, Items, Exclusions | Snapshot del universo |
| `InventoryObservation` | Campaign | Item/Code, Location, Result, Device, User, Time | Append-only |
| `ReconciliationDecision` | Campaign | Observation, Decision, Approver, AppliedEvent | Separada del hallazgo |
| `WorkflowInstance` | Tenant | Type, Resource, State, Version | No CRUD libre |
| `ApprovalDecision` | Workflow | Actor, Decision, Reason, Time | Segregación |
| `EvidenceDocument` | Tenant | EntityType, EntityId, Type, Checksum, Classification | Aislamiento y retención |
| `TenantAuditEvent` | Tenant | Actor, Action, Before/After, CorrelationId | Inmutable |
| `PlatformAuditEvent` | Platform | Operator, TenantTarget, Action, Reason | Inmutable |

# 14. Estados y eventos

## 14.1 AssetItem, estado operativo

```text
Draft → Received → PendingAcceptance → PendingInstallation
      → AvailableForUse → InUse
      → OnLoan / InMaintenance / OutOfService
      → PendingDisposal → Disposed
```

`OutOfService` no suspende depreciación por sí solo. El efecto depende del libro, método y política.

## 14.2 AccountingAsset, estado contable

```text
PhysicalControlOnly
→ PendingRecognition
→ RecognizedNonDepreciable / RecognizedDepreciable
→ Impaired
→ FullyDepreciatedInUse
→ Derecognized
```

## 14.3 Estado de inventario

```text
Expected
→ FoundCorrectLocation
→ FoundDifferentLocation
→ NotFound
→ UnregisteredItem
→ MissingLabel
→ DuplicateLabel
→ PendingReconciliation
→ Reconciled
```

## 14.4 Período contable

```text
Future → Open → SoftClosed → Closed → Reopened → Closed
```

Reabrir exige permiso, step-up, motivo, aprobador y auditoría.

## 14.5 DepreciationRun

```text
Draft → Simulated → Submitted → Reviewed → Approved → Posted
Posted → Reversed
Draft/Simulated/Submitted → Cancelled
```

## 14.6 InventoryCampaign

```text
Draft → Planned → Active → Reconciliation → Completed
Active/Reconciliation → Suspended → Active
Completed → Reopened (excepción aprobada)
```

## 14.7 ImportBatch

```text
Uploaded → Parsed → Validated → Normalized → Preview
→ Approved → Applied
→ Reversed cuando sea permitido
```

## 14.8 Eventos de dominio iniciales

- TenantProvisioningRequested.
- TenantActivated.
- TenantSuspended.
- TenantContextChanged.
- AssetItemCreated.
- AssetItemReceived.
- AssetAvailableForUse.
- CustodianAssigned.
- AssetTransferred.
- LoanIssued.
- LoanReturned.
- DisposalRequested.
- DisposalApproved.
- AccountingAssetRecognized.
- PolicyPublished.
- PeriodClosed.
- PeriodReopened.
- DepreciationRunSimulated.
- DepreciationRunPosted.
- DepreciationRunReversed.
- ImpairmentRecognized.
- EstimateChanged.
- InventoryObservationRecorded.
- ReconciliationApproved.
- DocumentVersionAdded.
- ApprovalGranted.
- IntegrationExecutionCompleted.

Todo evento incluye TenantId salvo los eventos puramente de plataforma.

# 15. Arquitectura UX

## 15.1 Principios

- Mostrar decisión o excepción antes que volumen.
- Mantener contexto visible: tenant, entidad, libro y período.
- Separar estado físico, contable e inventario.
- Permitir drill-down desde KPI hasta evidencia.
- Diseñar flujos sensibles como wizards y workflows.
- Mostrar cálculo explicado; no ocultar fórmula detrás de un total.
- Evitar duplicar rutas que llevan a la misma información sin contexto.
- Conservar filtros y vistas por usuario y tenant.

## 15.2 Arquitectura de información

```text
Inicio
Activos
Inventarios
Movimientos
Adquisiciones
Contabilidad
Mantenimiento
Reportes
Auditoría
Configuración
```

`TrazActivo Control` utiliza una navegación distinta y no aparece a administradores internos del tenant.

## 15.3 Experiencias prioritarias

### UX-001 Centro de Control

- Excepciones por rol.
- KPI con drill-down.
- estado de inventarios, corridas e integraciones.
- acciones pendientes.

### UX-002 Listado de Activos

- búsqueda global y filtros;
- columnas configurables;
- saved views;
- selección masiva;
- acciones válidas según estado;
- scroll dentro de tabla con cabecera fija.

### UX-003 Ficha 360°

Pestañas:

- Resumen.
- Identificación física.
- Ubicación y custodia.
- Libros contables.
- Componentes y grupos.
- Inventarios.
- Movimientos.
- Mantenimiento.
- Documentos.
- Timeline.
- Auditoría.

### UX-004 Cockpit de Depreciación

- libro y período visibles;
- incluidos, excluidos, warnings y errores;
- comparación con período anterior;
- detalle y explicación por activo;
- resumen por cuenta;
- asiento propuesto;
- workflow y step-up.

### UX-005 Inventario móvil

- selección de campaña y scope asignado;
- escaneo continuo;
- modo offline;
- resultado inmediato;
- fotografía y condición;
- cola de sincronización;
- conflictos visibles;
- impresión de etiqueta cuando esté habilitada.

### UX-006 Tenant Configuration

- entidades, libros, módulos, identidad, políticas, integraciones y retención.

### UX-007 Tenant Branding

- preview seguro de logo, colores, PDF, login y correo.

### UX-008 Tenant Selector

- memberships autorizadas;
- contexto visible;
- limpieza completa al cambiar.

### UX-009 Auditor Mode

- sólo lectura salvo exportación autorizada;
- evidencia, timeline, cambios, aprobaciones, importaciones, corridas y reversiones.

### UX-010 TrazActivo Control

- tenant lifecycle, stamps, health, uso y operaciones de plataforma.

## 15.4 Experiencia por dispositivo

- Desktop: administración, contabilidad, configuración, análisis y aprobaciones.
- Tablet: inventario, mantenimiento y consulta.
- Smartphone: escaneo, evidencia, observaciones y consulta rápida.

Responsive no significa reducir ancho. Cada experiencia tiene navegación, densidad y acciones propias.

# 16. Design System

## 16.1 Componentes obligatorios

- AppShell.
- Sidebar.
- Topbar.
- TenantSelector.
- ContextSelector para entidad/libro.
- GlobalSearch.
- Breadcrumb.
- DataTable.
- FilterPanel.
- SavedView.
- StatusBadge.
- KPI.
- ExceptionCard.
- Timeline.
- AuditEvent.
- EvidenceViewer.
- ApprovalPanel.
- Wizard.
- FormSection.
- DocumentUploader.
- QRScanner.
- MobileInventoryCard.
- EmptyState.
- ErrorState.
- LoadingState.
- Toast.
- ConfirmationDialog.
- StepUpAuthDialog.
- TenantBrandingProvider.
- FeatureGuard.
- PermissionGuard.

## 16.2 Frontend composition

```text
AppShell
  → TenantContextProvider
  → BrandingProvider
  → FeatureProvider
  → PermissionProvider
  → BusinessContextProvider
  → Module
```

Los módulos no resuelven por sí mismos tenant, branding, identidad o autorización.

## 16.3 DataTable común

- búsqueda;
- filtros combinables;
- orden;
- paginación;
- columnas configurables;
- vistas guardadas;
- selección masiva;
- acciones contextuales;
- exportación;
- drill-down;
- accesibilidad por teclado;
- estado de carga y error.

# 17. Gestión patrimonial

## 17.1 Alta de bien físico

Origen posible:

- compra;
- donación;
- transferencia;
- comodato recibido;
- arriendo;
- inventario inicial;
- construcción propia;
- migración.

Campos obligatorios dependen de `AssetClass` y `FieldSchema`. Los campos contables no se implementan como campos personalizados.

## 17.2 Ficha 360°

Debe responder:

- qué es;
- dónde está;
- quién lo custodia;
- quién lo utiliza;
- a quién pertenece;
- en qué libros está reconocido;
- cuánto vale por libro;
- qué se ha depreciado o deteriorado;
- qué inventarios lo verificaron;
- qué movimientos y mantenimientos tiene;
- qué documentos y aprobaciones existen.

## 17.3 Timeline patrimonial

El timeline proviene de eventos persistidos. Cada entrada muestra:

- qué ocurrió;
- fecha de registro y fecha efectiva;
- actor y aprobador;
- estado anterior y posterior;
- regla o política;
- evidencia;
- transacción origen;
- reversión relacionada.

## 17.4 QR y etiquetas

- token opaco y rotatable;
- no contiene PII ni valor;
- acceso completo exige autenticación y permiso;
- etiqueta configurable por tenant;
- impresión individual y masiva;
- registro de emisión y reemplazo;
- detección de duplicados.

## 17.5 Calidad de datos

Reglas mínimas:

- inventario único en el scope definido;
- compatibilidad clase/marca/modelo;
- campos específicos por tipo;
- serie única cuando se exija;
- patente y VIN para vehículos cuando aplique;
- valores no negativos;
- ubicación vigente;
- no reutilizar identificador de un bien dado de baja sin proceso explícito.

# 18. Adquisiciones

## 18.1 Flujo

```text
PurchaseOrder
→ Receipt
→ Inspection
→ Acceptance
→ InvoiceReference
→ CostAllocation
→ AssetItem creation
→ Labeling
→ Installation/Preparation
→ AvailableForUse
→ RecognitionAssessment
→ Capitalization
```

## 18.2 Reglas

- Una OC puede tener recepciones parciales.
- Una recepción puede incluir bienes rechazados.
- Factura y recepción son hechos distintos.
- La creación física no implica reconocimiento contable.
- Costos adicionales deben asignarse mediante método documentado.
- La distribución de costos debe cuadrar con su fuente.
- La fecha disponible para uso puede ser posterior a recepción.

## 18.3 Mercado Público

Conector por tenant, feature y configuración. Conserva:

- número y estado de OC;
- líneas y proveedor;
- payload original;
- fecha de sincronización;
- errores y reintentos;
- relación con adquisición interna.

No se asume que la integración entrega factura, guía o aceptación conforme.

## 18.4 Compra agrupada

Una compra de veinte sillas puede crear veinte `AssetItem`. La política del libro decide si se reconocen individualmente, como grupo homogéneo o sólo para control físico.

# 19. Ubicaciones, custodios y responsables

## 19.1 Dimensiones separadas

- `Establishment`: edificio, colegio, clínica o sitio.
- `Location`: piso, sala, oficina, bodega.
- `OrganizationalUnit`: dirección, gerencia, departamento.
- `CostCenter`: imputación financiera.
- `Custodian`: responsable administrativo del bien.
- `UserOfAsset`: persona que lo utiliza.
- `LegalOwner`: propietario legal.

## 19.2 Asignaciones históricas

Toda asignación contiene vigencia, origen, aceptación y motivo. Cambiar custodio o ubicación cierra la asignación anterior; no la sobrescribe.

## 19.3 Traslado físico y contabilidad

Un traslado cambia ubicación, custodio o centro de costo desde una fecha efectiva. No modifica costo, depreciación o valor libro por sí mismo. Una reclasificación contable es un evento separado.

# 20. Inventarios

## 20.1 Campañas concurrentes

Se permiten campañas concurrentes cuando sus scopes no se superponen. El sistema bloquea o advierte sobre:

- misma ubicación;
- mismos activos;
- mismo rango de clases;
- misma fecha de congelamiento incompatible.

## 20.2 Congelamiento del universo

Al activar una campaña se genera snapshot de activos esperados. Altas y bajas posteriores se registran como variaciones y no alteran silenciosamente el universo original.

## 20.3 Flujo móvil

```text
Seleccionar campaña
→ Descargar asignación
→ Escanear QR/barcode
→ Registrar observación
→ Capturar condición/foto
→ Guardar local o sincronizar
→ Revisar conflictos
→ Conciliar
→ Aplicar decisión aprobada
```

## 20.4 InventoryObservation

Incluye:

- campaña y scope;
- código escaneado;
- activo candidato;
- ubicación observada;
- resultado;
- condición;
- foto;
- usuario;
- dispositivo;
- fecha local y servidor;
- estado de sincronización.

Es append-only. Una corrección crea otra observación o una decisión.

## 20.5 Reconciliación

Decisiones posibles:

- confirmar ubicación;
- crear traslado;
- crear bien físico pendiente de revisión;
- reponer etiqueta;
- abrir investigación por no encontrado;
- marcar duplicado;
- excluir con motivo;
- proponer baja.

## 20.6 Offline

- dataset mínimo por asignación;
- sin valores contables sensibles salvo permiso y necesidad;
- cola local;
- idempotency key por observación;
- detección de duplicados;
- sincronización con conflictos explícitos;
- cierre remoto de sesión y revocación aplicados al reconectar.

Los límites y tiempo offline quedan en TBD-INV-001.

# 21. Movimientos

## 21.1 Traslados

Estados:

```text
Draft → Submitted → Approved → InTransit → Received → Completed
                       ↘ Rejected
```

Datos:

- origen y destino;
- activos;
- custodios;
- fecha efectiva;
- condición de salida/recepción;
- motivo;
- evidencia;
- aceptación del receptor;
- impacto en centro de costo, cuando corresponda.

## 21.2 Préstamos

- interno, persona jurídica o persona natural;
- fecha de entrega y vencimiento;
- activos y condición;
- devoluciones parciales;
- alertas;
- documentos;
- aceptación y recepción.

## 21.3 Comodatos

Se distingue entre recibido y entregado. El propietario legal no cambia por el control operativo. El tratamiento contable depende del libro y política.

## 21.4 Reversión

Un movimiento completado no se elimina. Se registra movimiento reversor o correctivo, con referencia, motivo y aprobación.

# 22. Contabilidad

## 22.1 Alcance

TrazActivo mantiene auxiliar por activo, componente, grupo y libro. Genera asientos, pero no reemplaza el mayor contable.

## 22.2 Libros y períodos

- calendario por libro;
- períodos secuenciales;
- apertura, soft close, cierre y reapertura;
- bloqueo de eventos contables retroactivos;
- excepción aprobada para corrección;
- fecha efectiva y fecha de posting separadas.

## 22.3 JournalBatch

Estados:

```text
Draft → Validated → Approved → Posted/Exported → Reconciled
Posted/Exported → Reversed
```

Reglas:

- débitos igualan créditos;
- líneas trazables a evento y activo;
- no se cambia lote posted;
- respuesta del ERP conserva ID externo;
- errores de integración no alteran saldos internos sin estado explícito.

## 22.4 Conciliación

Comparación por:

- libro;
- período;
- cuenta;
- activo o agregado;
- moneda;
- lote externo.

Una diferencia genera `ReconciliationIssue` con responsable, causa, evidencia y resolución.

# 23. Políticas contables

## 23.1 Policy Engine

Toda regla identifica:

```text
PolicyId
PolicyVersion
AccountingBookId
EffectiveFrom
EffectiveTo
RuleId
RuleType
Parameters
Source
Approval
Checksum
```

## 23.2 Lifecycle

```text
Draft → Reviewed → Approved → Published → Retired
```

Una política publicada no se edita. Se crea una nueva versión con vigencia futura o corrección formal.

## 23.3 Perfiles iniciales

| Código | Uso | Estado |
|---|---|---|
| NICSP_CGR_GC_2015 | Gobierno Central histórico | Requiere matriz normativa |
| NICSP_CGR_GC_2015_30D | Convención institucional de 30 días | Pendiente TBD-ACC-002 |
| NICSP_CGR_MUN_2020 | Municipalidades históricas | Requiere matriz normativa |
| NICSP_CGR_2027 | Normativa unificada desde 2027 | Pendiente texto íntegro y matriz |
| IFRS_FULL | IFRS completas | Pendiente alcance MVP |
| IFRS_SME | IFRS para PYMES | Pendiente TBD-ACC-001 |
| MANAGEMENT | Gestión interna | Sin posting financiero obligatorio |

## 23.4 Resolución de reglas

Orden:

1. política de libro vigente;
2. regla por clase;
3. override aprobado por activo o componente;
4. evento de estimación vigente;
5. fallback explícito o error bloqueante.

No se utilizan defaults silenciosos para residual, vida útil o método.

# 24. Reconocimiento y capitalización

## 24.1 Evaluación

La evaluación considera:

- control o propiedad;
- beneficio económico o potencial de servicio según marco;
- medición fiable;
- umbral y política;
- grupo homogéneo;
- componente;
- disponibilidad para uso;
- evidencia de costo.

## 24.2 Fechas separadas

- compra;
- recepción;
- aceptación;
- instalación;
- disponible para uso;
- reconocimiento;
- inicio de depreciación calculado;
- baja.

## 24.3 Resultado

- control físico solamente;
- gasto;
- activo individual;
- grupo homogéneo;
- componente;
- activo en construcción;
- pendiente por falta de evidencia.

## 24.4 CapitalizationEvent

Debe guardar:

- libro;
- costo reconocido y composición;
- fecha disponible;
- fecha de reconocimiento;
- método, vida y residual iniciales;
- cuentas;
- policy version;
- aprobador;
- documentos;
- hash de inputs.

# 25. Depreciación

## 25.1 Objetivo del motor

Calcular cargos reproducibles por activo o componente, libro y período, aplicando la versión de política vigente, sin depender del frontend ni recalcular arbitrariamente el saldo neto en cada mes.

## 25.2 Hallazgo que corrige

El cálculo observado en Acctual reconoce una fracción inicial sobre 31 días y luego redistribuye el valor neto restante utilizando una vida útil expresada en meses enteros. Esto mezcla unidades distintas, altera la cuota y puede completar la depreciación antes de la fecha esperada.

TrazActivo calculará unidades consumidas acumuladas y del período. La tasa se deriva del segmento de estimación vigente.

## 25.3 Entradas obligatorias

```text
TenantContext
AccountingBookId
AccountingPeriodId
AccountingAssetId o AssetComponentId
PolicyId y PolicyVersion
Currency
RecognizedCost
CapitalizedAdditions
DerecognizedComponentCost
ImpairmentAccumulated
ResidualValue
DepreciationMethod
TotalServiceUnits
AvailableForUseDate
EstimateSegment
DisposalDate optional
OpeningAccumulatedDepreciation
```

## 25.4 Base depreciable

Para el segmento inicial:

```text
DepreciableBase =
    RecognizedCost
  + CapitalizedAdditionsEffectiveAtSegmentStart
  - DerecognizedCostEffectiveAtSegmentStart
  - ResidualValue
  - ImpairmentAmountAllocatedToDepreciableBase
```

Después de un cambio de estimación o evento que altere la base:

```text
NewProspectiveBase =
    CarryingAmountAtEffectiveDate
  - NewResidualValue
```

La nueva base se distribuye sobre unidades restantes. No se reescriben cargos posted anteriores, salvo workflow formal de corrección de error.

## 25.5 Método lineal por unidades de servicio

```text
RatePerUnit = SegmentDepreciableBase / SegmentTotalServiceUnits
PeriodRawCharge = RatePerUnit × ServiceUnitsConsumedInPeriod
```

`ServiceUnits` pueden ser meses, días, horas, kilómetros, ciclos u otra unidad permitida por la política.

## 25.6 Convenciones temporales

### DEP-CONV-30D-TENTH

Convención institucional observada en el Excel valorizado:

```text
FullMonths =
    (CloseYear - AvailableYear) × 12
  + (CloseMonth - AvailableMonth)

Fraction = (CloseDay - AvailableDay) / 30

CumulativeUnitsAtClose =
  CLAMP(
    ROUND(FullMonths + Fraction, 1),
    0,
    TotalServiceUnits
  )

UnitsInPeriod =
  CumulativeUnitsAtPeriodClose
  - CumulativeUnitsAtPreviousPeriodClose
```

Reglas:

- mes convencional de 30 días;
- consumo acumulado redondeado a una décima;
- no se divide el saldo neto entre meses enteros después de la primera fracción;
- la fracción final completa exactamente la vida útil;
- la convención sólo se publica con fuente y aprobación.

### DEP-CONV-MONTH-FOLLOWING

```text
FirstEligiblePeriod = month after AvailableForUseDate
UnitsInEligibleMonth = 1
```

No reconoce fracción en el mes de disponibilidad. Se utiliza sólo en perfiles cuya política aprobada lo establezca.

### DEP-CONV-ACTUAL-DAYS

```text
UnitsInPeriod = EligibleCalendarDays / PolicyDayUnit
```

La política define si el denominador es día real, año real, 365, 366 u otra convención aprobada. IFRS no se codifica como una única convención temporal.

### DEP-CONV-UNITS-OF-PRODUCTION

```text
UnitsInPeriod = ClosingMeterReading - OpeningMeterReading
```

Exige lectura válida, no decreciente y dentro de límites. La falta de uso puede producir cargo cero sin cambiar la vida técnica total.

## 25.7 Segmentos de estimación

Cada cambio crea un `EstimateSegment`:

```text
SegmentId
EffectiveFrom
OpeningCarryingAmount
ResidualValue
RemainingServiceUnits
Method
ProrationConvention
PolicyVersion
Reason
Approval
```

Tipos de evento:

- cambio de vida útil;
- cambio de residual;
- cambio de método;
- deterioro;
- reversión de deterioro;
- mejora capitalizada;
- reemplazo de componente;
- corrección de error.

Los cambios de estimación se aplican prospectivamente. Una corrección de error utiliza workflow distinto y puede requerir reapertura o asiento de período anterior según política.

## 25.8 Elegibilidad

El motor incluye automáticamente un activo cuando:

- pertenece al tenant, entidad y libro seleccionados;
- está reconocido como depreciable;
- tiene fecha disponible para uso;
- el período está abierto o habilitado para simulación;
- la política permite cargo en el período;
- mantiene base depreciable pendiente;
- no está dado de baja antes del período;
- no existe una línea posted para el mismo activo, libro y período sin reversión.

Toda exclusión contiene código y explicación.

## 25.9 Redondeo

- cálculos internos con tipo decimal y precisión definida por arquitectura de datos;
- prohibido `float` o `double` para montos contabilizados;
- redondeo por moneda al publicar el asiento;
- regla de redondeo versionada por libro;
- el último cargo del segmento absorbe diferencia de redondeo;
- el cargo nunca supera la base restante;
- el valor libro nunca queda bajo el residual;
- la suma de líneas debe reconciliar con el lote de asiento.

## 25.10 Golden dataset, ejercicios entregados

Parámetros comunes:

```text
Costo reconocido: 6.498.999 CLP
Residual: 1 CLP
Base depreciable: 6.498.998 CLP
Vida útil: 6 meses
Convención: DEP-CONV-30D-TENTH
Tasa teórica: 1.083.166,333333 CLP por mes
```

### GD-DEP-001, disponible 31-01-2025

| Período | Unidades | Cargo CLP | Acumulada CLP | Valor libro CLP |
|---|---:|---:|---:|---:|
| Enero | 0,0 | 0 | 0 | 6.498.999 |
| Febrero | 1,0 | 1.083.166 | 1.083.166 | 5.415.833 |
| Marzo | 1,0 | 1.083.166 | 2.166.332 | 4.332.667 |
| Abril | 1,0 | 1.083.166 | 3.249.498 | 3.249.501 |
| Mayo | 1,0 | 1.083.166 | 4.332.664 | 2.166.335 |
| Junio | 1,0 | 1.083.166 | 5.415.830 | 1.083.169 |
| Julio | 1,0 | 1.083.168 | 6.498.998 | 1 |

### GD-DEP-002, disponible 15-01-2025

| Período | Unidades | Cargo CLP | Acumulada CLP | Valor libro CLP |
|---|---:|---:|---:|---:|
| Enero | 0,5 | 541.583 | 541.583 | 5.957.416 |
| Febrero | 1,0 | 1.083.166 | 1.624.749 | 4.874.250 |
| Marzo | 1,0 | 1.083.166 | 2.707.915 | 3.791.084 |
| Abril | 1,0 | 1.083.166 | 3.791.081 | 2.707.918 |
| Mayo | 1,0 | 1.083.166 | 4.874.247 | 1.624.752 |
| Junio | 1,0 | 1.083.166 | 5.957.413 | 541.586 |
| Julio | 0,5 | 541.585 | 6.498.998 | 1 |

### GD-DEP-003, disponible 03-01-2025

| Período | Unidades | Cargo CLP | Acumulada CLP | Valor libro CLP |
|---|---:|---:|---:|---:|
| Enero | 0,9 | 974.850 | 974.850 | 5.524.149 |
| Febrero | 1,0 | 1.083.166 | 2.058.016 | 4.440.983 |
| Marzo | 1,0 | 1.083.166 | 3.141.182 | 3.357.817 |
| Abril | 1,0 | 1.083.166 | 4.224.348 | 2.274.651 |
| Mayo | 1,0 | 1.083.166 | 5.307.514 | 1.191.485 |
| Junio | 1,0 | 1.083.166 | 6.390.680 | 108.319 |
| Julio | 0,1 | 108.318 | 6.498.998 | 1 |

El valor de julio del tercer ejemplo corrige la celda verde que mostraba la base completa en vez de la fracción final.

## 25.11 Flujo de corrida

```text
Draft
→ Simulated
→ Submitted
→ Reviewed
→ Approved
→ Posted
→ Exported
→ Reconciled
```

Un run `Posted` sólo cambia mediante `Reversed`. Las etapas `Exported` y `Reconciled` son proyecciones posteriores al posting y no habilitan edición.

## 25.12 Simulación

Debe mostrar:

- activos incluidos;
- activos excluidos y motivo;
- errores bloqueantes;
- advertencias;
- valor de apertura;
- cargo;
- acumulada;
- valor de cierre;
- unidades y vida restante;
- política, versión, método y convención;
- diferencia respecto del período anterior;
- asiento propuesto.

## 25.13 Explicación por línea

Ejemplo de payload legible:

```text
Activo: A-000596
Libro: NICSP municipal
Período: 2025-07
Costo: 6.498.999
Residual: 1
Base del segmento: 6.498.998
Vida inicial: 6,0 meses
Convención: 30 días, décima de mes
Consumo apertura: 5,0
Consumo cierre: 6,0
Consumo período: 1,0
Tasa por unidad: 1.083.166,333333
Cargo antes de redondeo: 1.083.166,333333
Ajuste final de redondeo: 1,666667
Cargo posted: 1.083.168
Valor libro cierre: 1
PolicyVersion: PV-2025-001
```

## 25.14 Idempotencia y concurrencia

Clave lógica:

```text
TenantId + AccountingBookId + PeriodId + RunType + PolicySnapshotHash
```

- Una solicitud repetida con la misma idempotency key devuelve el mismo run.
- Posting utiliza optimistic concurrency y lock lógico del período.
- Dos runs no pueden postear líneas para el mismo activo/libro/período.
- Reversión y posting se serializan por libro/período.

## 25.15 Asiento

El mapping de cuenta se obtiene de la política y activo:

- gasto de depreciación;
- depreciación acumulada;
- dimensiones de entidad, centro de costo y clase;
- activo/componente como referencia analítica.

El motor no publica si falta una cuenta obligatoria o el lote no cuadra.

## 25.16 Reversión

- mantiene run y líneas originales;
- crea run reversor;
- genera asiento inverso;
- restaura proyección mediante eventos;
- registra motivo, aprobador y step-up;
- no obliga a revertir todos los períodos posteriores si el modelo puede generar correcciones consistentes, pero cualquier impacto dependiente debe evaluarse y mostrarse antes de ejecutar.

## 25.17 Reglas DEP

| ID | Regla |
|---|---|
| DEP-001 | No calcular sin fecha disponible para uso |
| DEP-002 | Resolver política por libro y vigencia |
| DEP-003 | No duplicar activo/libro/período |
| DEP-004 | No superar base restante |
| DEP-005 | No bajar del residual |
| DEP-006 | No modificar líneas posted |
| DEP-007 | Incluir automáticamente elegibles |
| DEP-008 | Explicar toda exclusión |
| DEP-009 | Aplicar estimaciones prospectivamente |
| DEP-010 | Respetar fecha efectiva de baja |
| DEP-011 | No suspender por `OutOfService` sin regla |
| DEP-012 | Permitir cargo cero en unidades de producción sin consumo |
| DEP-013 | Consolidado anual = suma mensual posted |
| DEP-014 | Ajuste final de redondeo |
| DEP-015 | Snapshot y hash de política |
| DEP-016 | Validar cuentas antes de posting |
| DEP-017 | Mantener cálculo decimal determinista |
| DEP-018 | Registrar versión del algoritmo |
| DEP-019 | Soportar simulación sin cambiar saldos |
| DEP-020 | Reversión mediante evento y asiento inverso |

## 25.18 Pseudocódigo backend

```text
calculatePeriod(assetId, bookId, periodId, policyVersion):
    context = requireTenantContext()
    book = loadAuthorizedBook(context, bookId)
    period = loadPeriod(book, periodId)
    assert period.allowsSimulationOrPosting

    events = loadAccountingEvents(assetId, bookId, upTo=period.end)
    opening = rebuildOpeningState(events, period.start)

    eligibility = policy.evaluateEligibility(opening, period)
    if not eligibility.allowed:
        return ExcludedLine(eligibility.code, eligibility.explanation)

    segment = opening.currentEstimateSegment
    unitsOpen = policy.cumulativeUnits(segment, dayBefore(period.start))
    unitsClose = policy.cumulativeUnits(segment, period.end)
    unitsPeriod = clamp(unitsClose - unitsOpen, 0, segment.remainingUnits)

    rate = segment.depreciableBase / segment.totalUnits
    rawCharge = rate * unitsPeriod
    rounded = currencyPolicy.round(rawCharge)
    charge = min(rounded, opening.remainingDepreciableBase)

    if policy.segmentCompletes(unitsClose, segment):
        charge = opening.remainingDepreciableBase

    closing = opening.applyDepreciation(charge, unitsPeriod)
    assert closing.carryingAmount >= closing.residualValue

    return DepreciationLine(
        opening,
        closing,
        unitsPeriod,
        charge,
        policy.explanation(),
        inputHash(events, policyVersion, period)
    )
```

# 26. Deterioro

## 26.1 Principio

La condición física, una falla o un activo fuera de servicio pueden constituir indicios. No generan automáticamente deterioro contable.

## 26.2 Workflow

```text
IndicatorRecorded
→ AssessmentDraft
→ MeasurementPrepared
→ TechnicalReview
→ AccountingReview
→ Approved
→ Recognized
→ FutureReview
→ Reversed cuando la política lo permita
```

## 26.3 Datos

- libro y período;
- activo, componente o unidad;
- indicio interno/externo;
- evidencia;
- valor libro;
- clasificación generador/no generador de efectivo cuando aplique;
- método de medición;
- valor razonable menos costos de disposición;
- valor en uso o potencial de servicio;
- supuestos y tasa cuando aplique;
- monto recuperable;
- pérdida;
- materialidad;
- cuentas;
- aprobación;
- asiento;
- nuevo segmento de depreciación.

## 26.4 Separaciones obligatorias

- deterioro;
- cambio de vida útil;
- cambio de residual;
- condición física;
- baja;
- reparación.

Pueden originarse en el mismo hecho, pero se registran como decisiones diferentes y relacionadas.

## 26.5 Reversión

La política define elegibilidad y límite. La reversión no puede elevar el valor por sobre el importe que correspondería sin el deterioro previo. Cualquier prohibición específica del perfil se configura como regla, no como condicional global.

# 27. Componentes y erogaciones posteriores

## 27.1 Componentes

Un componente tiene:

- costo asignado;
- fecha disponible;
- vida útil;
- residual;
- método;
- depreciación;
- deterioro;
- reemplazos;
- baja propia.

La suma de costos asignados debe reconciliar con el activo o fuente correspondiente.

## 27.2 Erogación posterior

Clasificaciones:

- mantenimiento rutinario;
- reparación menor;
- reparación mayor;
- mejora;
- adición;
- reemplazo de componente;
- inspección mayor;
- rehabilitación.

Workflow:

```text
TechnicalResult
→ AccountingAssessment
→ Expense / Capitalize / ReplaceComponent / ChangeEstimate / ImpairmentIndicator
→ Approval
→ Posting
```

## 27.3 Revaluación

Proceso separado:

- libro y política que la permiten;
- clase completa o scope permitido;
- fecha de medición;
- fuente y tasador;
- método;
- tratamiento de depreciación acumulada;
- cuentas y reserva;
- aprobación;
- revelaciones.

No se permite ingresar un incremento libre y llamarlo revaluación.

# 28. Bajas

## 28.1 Flujo

```text
Draft
→ Submitted
→ TechnicalReview
→ AccountingReview
→ Approved
→ Executed
→ Posted
```

## 28.2 Tipos

- venta;
- donación;
- transferencia;
- destrucción;
- pérdida;
- siniestro;
- obsolescencia;
- término de control;
- reemplazo de componente.

## 28.3 Datos y resultado

- fecha efectiva;
- motivo y tipo;
- informe técnico;
- acto administrativo o autorización;
- costo;
- depreciación y deterioro acumulados;
- valor libro;
- ingreso y costo de disposición;
- resultado;
- asiento;
- evidencia de ejecución.

Un bien dado de baja permanece consultable. Sus identificadores e historia no se borran.

# 29. Mantenimiento

## 29.1 Alcance operativo

- áreas de mantenimiento;
- solicitudes;
- órdenes de trabajo;
- preventivo, correctivo e inspección;
- protocolos y checklists;
- recursos, técnicos, proveedores e insumos;
- planes por fecha o unidad de producción;
- lecturas de horas, kilómetros o ciclos;
- programación y calendario;
- pausas, revisión y cierre;
- costos y documentos.

## 29.2 Bridge contable

El resultado técnico puede generar:

- gasto de mantenimiento;
- evaluación de capitalización;
- reemplazo de componente;
- cambio de vida útil;
- indicio de deterioro;
- propuesta de baja.

El técnico registra hechos. Contabilidad decide el tratamiento y workflow.

## 29.3 Restricciones

- Una OT finalizada no se edita libremente.
- Recursos posteriores se agregan mediante evento autorizado.
- Lecturas sólo pueden corregirse con trazabilidad.
- Un activo dado de baja no recibe nuevas OT, salvo proceso de disposición autorizado.

# 30. Evidencia documental

## 30.1 Metadata mínima

```text
TenantId
LegalEntityId optional
EntityType
EntityId
DocumentType
Version
UploadedBy
UploadedAt
Checksum
Classification
RetentionPolicyId
Status
```

## 30.2 Lifecycle

```text
Uploaded → Validating → Available
                     ↘ Quarantined / Rejected
Available → Superseded / Retained / LogicallyDeleted
```

## 30.3 Controles

- container segregado por tenant;
- nombres físicos no predecibles;
- autorización server-side antes de generar URL temporal;
- checksum;
- versionado;
- malware scan cuando corresponda;
- validación de tipo real, no sólo extensión;
- límites configurables;
- retención y hold;
- auditoría de upload, download y eliminación;
- evidencia de períodos cerrados bloqueada.

## 30.4 Eliminación

La eliminación lógica no elimina inmediatamente bytes. La purga depende de retención, contrato, clasificación, holds y aprobación. Los plazos quedan en TBD-PRIV-001.

# 31. Workflow y aprobaciones

## 31.1 Motor común

Cada workflow define:

- tipo y versión;
- recurso;
- estados;
- transiciones;
- roles;
- condiciones;
- segregación;
- step-up;
- evidencia;
- vencimiento y escalamiento;
- eventos.

## 31.2 Patrón

```text
Draft → Submitted → Reviewed → Approved → Posted/Executed → Reversed
```

No todas las operaciones alcanzan `Posted`; las operativas usan `Executed`.

## 31.3 Segregación

Regla predeterminada para operaciones P0:

- quien prepara no aprueba;
- quien aprueba no puede cambiar inputs después de aprobar;
- cualquier excepción requiere rol, motivo y auditoría;
- permisos de plataforma no conceden aprobación contable.

# 32. Auditoría

## 32.1 TenantAuditEvent

Campos:

- TenantId;
- LegalEntityId y BookId cuando aplique;
- UserId, MembershipId y roles efectivos;
- timestamp y fecha efectiva;
- acción y recurso;
- estado/valor anterior y nuevo;
- motivo;
- evidencia;
- aprobador;
- policy version;
- proceso origen;
- CorrelationId y OperationId;
- IP y dispositivo cuando corresponda.

## 32.2 PlatformAuditEvent

Agrega:

- operador;
- tenant objetivo;
- stamp;
- permiso de plataforma;
- ticket o razón de soporte;
- duración de acceso excepcional.

## 32.3 Inmutabilidad

Los eventos se escriben append-only. Una corrección genera otro evento. La consulta puede usar proyecciones, pero la fuente de auditoría no se sobrescribe.

# 33. Reportería y búsqueda

## 33.1 Centro de Control

Excepciones iniciales:

- activos sin fecha disponible;
- sin valorización;
- sin ubicación o custodio;
- series o etiquetas duplicadas;
- pendientes de reconocimiento;
- corridas pendientes;
- deterioros pendientes;
- activos no encontrados;
- diferencias auxiliar/mayor;
- evidencia faltante;
- cambios posteriores al cierre;
- integraciones fallidas.

## 33.2 Reportes físicos

- maestro de bienes;
- bienes por ubicación, custodio, clase y propiedad;
- inventario y diferencias;
- traslados, préstamos y bajas;
- activos sin etiqueta o fotografía;
- activos no encontrados.

## 33.3 Reportes contables

- costo bruto;
- depreciación acumulada;
- deterioro acumulado;
- valor libro;
- movimiento por clase;
- adiciones y bajas;
- componentes;
- corridas y asientos;
- conciliación con ERP;
- cambios de estimación;
- activos totalmente depreciados en uso.

## 33.4 Búsqueda global

Busca dentro de TenantContext y permisos por:

- inventario;
- serie;
- QR;
- nombre;
- marca y modelo;
- persona;
- ubicación;
- OC y factura;
- documento;
- traslado;
- baja;
- OT;
- transacción.

Los resultados no revelan existencia de recursos de otro tenant.

## 33.5 Exportaciones

- siempre ligadas a tenant y filtros;
- job con dataset congelado;
- clasificación y permiso;
- registro de descarga;
- expiración de archivo temporal;
- protección contra fórmulas maliciosas en CSV/Excel.

# 34. Integraciones

## 34.1 Modelo

```text
TenantIntegration
IntegrationConfiguration
IntegrationCredentialReference
IntegrationExecution
IntegrationMapping
IntegrationError
```

Cada integración pertenece a un tenant y, cuando corresponda, entidad/libro.

## 34.2 Credenciales

- secreto fuera de base cuando corresponda;
- referencia a Key Vault;
- rotación;
- acceso por Managed Identity;
- no reutilizar secretos entre tenants;
- auditoría de cambio y uso.

## 34.3 ERP

```text
JournalBatch Approved
→ Adapter transforms
→ Export/API call
→ ERP response
→ ExternalId stored
→ Reconciliation
```

Soporta reintentos idempotentes. Un timeout no se interpreta automáticamente como fallo definitivo; se consulta estado cuando el ERP lo permita.

## 34.4 Recursos Humanos

- empleados y vigencia;
- unidad y centro de costo;
- custodios;
- offboarding;
- reasignaciones pendientes.

No se copia información de RR.HH. que no sea necesaria para la gestión patrimonial.

## 34.5 Mercado Público

Feature opcional para sector público. El conector no forma parte del Policy Engine y su caída no bloquea la consulta de activos ya registrados.

# 35. APIs

## 35.1 Convenciones

- REST versionada `/api/v1` para operaciones síncronas.
- `Idempotency-Key` en comandos de creación o alto impacto.
- `ETag` o versión para optimistic concurrency.
- TenantContext derivado por servidor.
- respuesta de error basada en Problem Details extendido.
- paginación consistente.
- filtros allowlist.
- auditoría declarada por endpoint.
- endpoints cross-tenant sólo en Control Plane.

## 35.2 Error envelope

```json
{
  "type": "https://errors.trazactivo.local/period-closed",
  "title": "El período está cerrado",
  "status": 409,
  "code": "ACC-PERIOD-CLOSED",
  "correlationId": "EVT-8D2831",
  "detail": "La operación no fue aplicada.",
  "errors": []
}
```

La URL del ejemplo es un identificador lógico; el dominio definitivo queda sujeto a configuración.

## 35.3 Catálogo principal

| Método | Endpoint | Scope | Permiso | Idempotencia | Auditoría |
|---|---|---|---|---|---|
| POST | `/control/v1/tenants` | Platform | platform.tenants.create | Sí | PlatformAudit |
| POST | `/control/v1/tenants/{id}/provision` | Platform | platform.tenants.provision | Sí | PlatformAudit |
| POST | `/control/v1/tenants/{id}/suspend` | Platform | platform.tenants.suspend | Sí | PlatformAudit |
| GET | `/api/v1/context` | Tenant | authenticated | No | Security access |
| POST | `/api/v1/context/switch` | Membership | tenant.switch | Sí | Security audit |
| GET | `/api/v1/assets` | Tenant/Entity | assets.read | No | Read optional |
| POST | `/api/v1/assets` | Tenant/Entity | assets.create | Sí | TenantAudit |
| GET | `/api/v1/assets/{id}` | Tenant/Entity | assets.read | No | Read optional |
| PATCH | `/api/v1/assets/{id}` | Tenant/Entity | assets.update | Sí | TenantAudit |
| POST | `/api/v1/assets/{id}/labels` | Tenant | assets.label.generate | Sí | TenantAudit |
| POST | `/api/v1/acquisitions` | LegalEntity | acquisitions.create | Sí | TenantAudit |
| POST | `/api/v1/acquisitions/{id}/receipts` | LegalEntity | acquisitions.receive | Sí | TenantAudit |
| POST | `/api/v1/accounting-assets/{id}/capitalize` | Book | accounting.capitalize | Sí | TenantAudit + Workflow |
| POST | `/api/v1/inventory-campaigns` | Tenant | inventory.create | Sí | TenantAudit |
| POST | `/api/v1/inventory-campaigns/{id}/activate` | Tenant | inventory.activate | Sí | TenantAudit |
| POST | `/api/v1/inventory-campaigns/{id}/observations` | Campaign | inventory.observe | Sí | TenantAudit |
| POST | `/api/v1/reconciliations/{id}/decisions` | Campaign | inventory.reconcile | Sí | TenantAudit + Workflow |
| POST | `/api/v1/transfers` | Tenant | movements.transfer.create | Sí | TenantAudit |
| POST | `/api/v1/transfers/{id}/approve` | Tenant | movements.transfer.approve | Sí | TenantAudit + Step-up optional |
| POST | `/api/v1/loans` | Tenant | movements.loan.create | Sí | TenantAudit |
| POST | `/api/v1/loans/{id}/returns` | Tenant | movements.loan.return | Sí | TenantAudit |
| POST | `/api/v1/disposals` | Book/Entity | disposals.create | Sí | TenantAudit |
| POST | `/api/v1/disposals/{id}/approve` | Book | disposals.approve | Sí | TenantAudit + Step-up |
| GET | `/api/v1/accounting-books` | Tenant/Entity | accounting.books.read | No | No |
| POST | `/api/v1/policies` | Book | policies.create | Sí | TenantAudit |
| POST | `/api/v1/policies/{id}/publish` | Book | policies.publish | Sí | TenantAudit + Step-up |
| POST | `/api/v1/depreciation-runs/simulate` | Book/Period | depreciation.simulate | Sí | TenantAudit |
| POST | `/api/v1/depreciation-runs` | Book/Period | depreciation.create | Sí | TenantAudit |
| POST | `/api/v1/depreciation-runs/{id}/submit` | Book | depreciation.submit | Sí | TenantAudit |
| POST | `/api/v1/depreciation-runs/{id}/approve` | Book | depreciation.approve | Sí | TenantAudit + Step-up |
| POST | `/api/v1/depreciation-runs/{id}/post` | Book | depreciation.post | Sí | TenantAudit + Step-up |
| POST | `/api/v1/depreciation-runs/{id}/reverse` | Book | depreciation.reverse | Sí | TenantAudit + Step-up |
| GET | `/api/v1/assets/{id}/depreciation-explanation` | Book | depreciation.read | No | Read audit optional |
| POST | `/api/v1/impairment-assessments` | Book | impairment.create | Sí | TenantAudit |
| POST | `/api/v1/impairment-assessments/{id}/approve` | Book | impairment.approve | Sí | TenantAudit + Step-up |
| POST | `/api/v1/documents` | Tenant | documents.upload | Sí | TenantAudit |
| GET | `/api/v1/documents/{id}/download` | Tenant | documents.download | No | TenantAudit |
| POST | `/api/v1/import-batches` | Tenant | imports.create | Sí | TenantAudit |
| POST | `/api/v1/import-batches/{id}/apply` | Tenant | imports.apply | Sí | TenantAudit + Step-up conditional |
| GET | `/api/v1/search` | Tenant | search.use | No | Query audit sampled |
| POST | `/api/v1/exports` | Tenant | exports.create | Sí | TenantAudit |

## 35.4 Contrato detallado de operación crítica

Cada endpoint crítico documentará:

```text
Endpoint
Method
Tenant scope
LegalEntity/Book scope
Permission
Input schema
Validation
Output schema
Business errors
Audit event
Idempotency behavior
Concurrency token
Workflow transition
Step-up requirement
```

# 36. Jobs y mensajería

## 36.1 Job context

Todo job incluye:

```text
TenantId
CorrelationId
OperationId
RequestedBy
TargetResource
SchemaVersion
Attempt
```

Antes de ejecutar, el worker valida tenant activo, asignación de stamp, versión de esquema y permiso de operación cuando corresponda.

## 36.2 Mensaje

```json
{
  "messageId": "...",
  "tenantId": "...",
  "correlationId": "...",
  "operationId": "...",
  "eventType": "DepreciationRunRequested",
  "schemaVersion": 1,
  "timestamp": "...",
  "payload": {}
}
```

## 36.3 Controles

- idempotencia por MessageId/OperationId;
- retries con política por tipo;
- dead-letter queue;
- poison message handling;
- orden sólo cuando el dominio lo requiere;
- no procesar varios tenants en una transacción de negocio;
- métricas de cola y fallos;
- replay administrativo auditable.

## 36.4 Jobs iniciales

- provisionamiento de tenant;
- importaciones;
- generación de PDF;
- exportaciones;
- simulación/cálculo masivo;
- notificaciones;
- sincronizaciones;
- conciliación ERP;
- malware scan;
- retención y purga.

# 37. Observabilidad

## 37.1 Dimensiones

```text
TenantId pseudonimizado cuando corresponda
StampId
Application
Module
Operation
CorrelationId
Status
Duration
Dependency
Version
```

## 37.2 Métricas

- availability;
- latencia;
- errores;
- queue depth;
- job failures;
- saturación de DB/pool;
- storage;
- consumo API;
- integraciones;
- tenant consumption;
- tiempos de corrida;
- fallos de aislamiento en tests.

## 37.3 Logs y trazas

- no secretos;
- no OTP;
- no payload documental;
- PII mínima;
- correlation ID de extremo a extremo;
- separación de logs de auditoría y diagnósticos;
- retención según política.

## 37.4 Cost allocation

Medidas por tenant:

- usuarios activos;
- activos;
- almacenamiento y documentos;
- llamadas API;
- jobs;
- inventarios;
- procesos contables;
- integración.

Estas métricas no equivalen automáticamente a precio comercial.

# 38. Backup, DR y portabilidad

## 38.1 Backup

- backup de Control Plane separado de tenant DBs;
- point-in-time restore según capacidades y plan;
- inventario de backups por tenant;
- documentos versionados y recuperables;
- pruebas de restauración;
- acceso administrativo restringido.

## 38.2 Restore por tenant

Workflow:

```text
Request
→ Authorization
→ Select restore point
→ Provision isolated target
→ Restore DB
→ Restore/validate documents
→ Validate schema and policy versions
→ Rebind Tenant Catalog
→ Functional validation
→ Activate
```

No se restaura sobre producción sin validación y plan de corte.

## 38.3 DR

- Chile Central no se trata como si tuviera par automático.
- Región secundaria: TBD-AZR-003.
- RPO/RTO: TBD-CONTRACT.
- Diseño debe admitir reconstrucción de stamp mediante IaC.
- Los secretos y configuraciones también forman parte del plan.
- Las pruebas DR se documentan; frecuencia TBD.

## 38.4 Portabilidad

Exportación lógica:

```text
Tenant
├── Database export
├── Documents and checksums
├── Configuration
├── Branding
├── Policies
├── Audit
└── Integration metadata without secrets
```

## 38.5 Migración de stamp

- congelamiento controlado o sincronización;
- copia y validación;
- actualización atómica de Tenant Catalog;
- invalidación de cache;
- smoke tests;
- rollback plan;
- auditoría.

# 39. Requisitos no funcionales

## 39.1 Matriz

| ID | Descripción | Métrica | Objetivo | Método | Responsable | Evidencia | Estado |
|---|---|---|---|---|---|---|---|
| NFR-SEC-001 | Aislamiento cross-tenant | Casos MT exitosos/total | 100% de casos P0, sin acceso cruzado | Pipeline de seguridad | Seguridad/QA | Reporte MT | REQUISITO |
| NFR-SEC-002 | Protección de secretos | Secretos detectados en repositorio/logs | Ninguno | Secret scanning y revisión | DevOps/Seguridad | Pipeline | REQUISITO |
| NFR-SEC-003 | MFA privilegiado | Usuarios privilegiados con factor válido | Según política aprobada | Reporte de identidad | Seguridad | Evidencia de configuración | TBD-SEC-001 |
| NFR-PERF-001 | Latencia de consulta interactiva | Percentil acordado | TBD-NFR-003 | Prueba de carga | Arquitectura/QA | Reporte performance | TBD |
| NFR-PERF-002 | Duración corrida de depreciación | Activos por unidad de tiempo | TBD-NFR-003 | Golden dataset ampliado | QA/Backend | Reporte | TBD |
| NFR-AVAIL-001 | Disponibilidad mensual | Porcentaje | TBD-NFR-001 | Monitor/SLA | Operaciones | Dashboard | TBD-CONTRACT |
| NFR-SCAL-001 | Escalabilidad por stamp | Tenants/activos/transacciones | TBD-NFR-003 | Prueba de capacidad | Arquitectura | Informe | TBD |
| NFR-OBS-001 | Trazabilidad | Operaciones críticas con CorrelationId | 100% | Revisión de trazas | DevOps | Queries de logs | REQUISITO |
| NFR-DR-001 | RPO | Tiempo de pérdida máximo | TBD-NFR-002 | Prueba restore | Operaciones | Acta DR | TBD-CONTRACT |
| NFR-DR-002 | RTO | Tiempo de recuperación | TBD-NFR-002 | Simulación DR | Operaciones | Acta DR | TBD-CONTRACT |
| NFR-PRIV-001 | Minimización | Campos personales justificados | 100% revisados | Data inventory | Legal/Seguridad | Registro | REQUISITO |
| NFR-A11Y-001 | Accesibilidad | Conformidad | WCAG 2.2 AA como objetivo de diseño | Auditoría automática/manual | UX/QA | Informe | REQUISITO |
| NFR-MAINT-001 | Mantenibilidad | Cobertura y deuda | Objetivos TBD | Sonar/revisión | Ingeniería | Dashboard | TBD |
| NFR-PORT-001 | Exportación tenant | Dataset verificable | Exportación completa y checksums | Prueba de portabilidad | Operaciones | Manifest | REQUISITO |
| NFR-INT-001 | Idempotencia de integración | Duplicados financieros | Ninguno en casos aprobados | Contract/integration tests | Integraciones | Reporte | REQUISITO |
| NFR-DATA-001 | Precisión monetaria | Diferencias golden dataset | Cero frente a resultados aprobados | Unit/regression | QA/Contabilidad | Reporte | REQUISITO |
| NFR-CONC-001 | Concurrencia | Pérdidas silenciosas | Ninguna | Tests simultáneos | QA | Reporte | REQUISITO |
| NFR-LOC-001 | Localización | Formatos por tenant | Formatos correctos según configuración | E2E | QA/UX | Evidencia | REQUISITO |

## 39.2 Concurrencia

Se utilizará optimistic concurrency cuando dos usuarios puedan modificar el mismo agregado. Respuesta estándar: 409 con versión actual y opción de recargar/comparar. Posting, cierre de período y migración de tenant requieren locks de aplicación o mecanismo equivalente.

## 39.3 Precisión

- dinero con decimal;
- fechas y zonas horarias explícitas;
- fecha efectiva contable separada de timestamp UTC;
- redondeo definido por libro/moneda;
- invariantes validadas en dominio y base.

# 40. Accesibilidad

Objetivo: WCAG 2.2 AA.

Requisitos:

- navegación completa por teclado;
- foco visible;
- orden de tabulación lógico;
- labels y descripciones;
- mensajes de error vinculados al campo;
- contraste validado con branding;
- touch targets adecuados;
- tablas navegables;
- modales con focus trap y retorno de foco;
- lectores de pantalla;
- estados con texto e icono, no sólo color;
- gráficos con alternativa tabular;
- QR scanner con entrada manual equivalente;
- timeout de sesión con aviso accesible.

# 41. Estrategia de pruebas

## 41.1 Capas

- Unit.
- Component.
- Integration.
- Contract.
- Security.
- Multi-Tenant Isolation.
- Performance.
- Accessibility.
- E2E.
- Regression.
- DR.
- Migration.

## 41.2 Principios

- Policy Engine se prueba sin UI ni infraestructura.
- Golden dataset es versionado y obligatorio en pipeline.
- Toda corrección de bug incorpora caso de regresión.
- Tests cross-tenant son P0 y bloquean release.
- Integraciones usan contract tests y sandboxes cuando existan.
- Pruebas de migración comparan conteos, sumas, hashes y muestras.

## 41.3 Casos multi-tenant

| ID | Precondición | Acción | Resultado | Evidencia |
|---|---|---|---|---|
| MT-001 | Usuario A y activo B | Solicitar activo B con ID conocido | 404/403 sin revelar datos | Test API y log |
| MT-002 | Sesión Tenant A | Manipular TenantId en payload/header | Servidor ignora/rechaza | Test seguridad |
| MT-003 | Usuario con A y B | Cambiar de A a B | Contexto, cache, filtros y branding de A desaparecen | E2E |
| MT-004 | Branding distinto | Abrir ambos tenants | Cada uno carga su configuración | Visual regression |
| MT-005 | Feature sólo en A | Acceder endpoint desde B | Endpoint rechaza aunque URL sea conocida | API test |
| MT-006 | Documento A | Reutilizar URL o ID en B | Acceso denegado | Storage/API test |
| MT-007 | Job A y B en cola | Procesar concurrentemente | Cada job abre sólo recursos del tenant correcto | Integration test |
| MT-008 | Tenant suspendido | Usar sesión vigente | Acceso bloqueado e invalidado | E2E |
| MT-009 | User sin membership | Seleccionar tenant | No aparece ni resuelve contexto | Identity test |
| MT-010 | Restore de A | Ejecutar restore | B permanece intacto | DR test |
| MT-011 | Buscar término de B en A | Ejecutar búsqueda | Cero resultados y sin inferencia | Search test |
| MT-012 | Cache con misma clave lógica | Consultar A y B | Valores separados por tenant | Component test |
| MT-013 | Export concurrente | Generar export A/B | Archivos y manifests separados | Job test |
| MT-014 | Dominio custom A | Enviar host no verificado | No resuelve o bloquea | Routing test |
| MT-015 | Operador plataforma | Ejecutar soporte sobre A | Evento PlatformAudit con tenant objetivo | Audit test |

# 42. Golden Dataset

## 42.1 Gobernanza

Cada caso incluye:

- ID y versión;
- fuente;
- inputs completos;
- libro y policy version;
- eventos previos;
- resultado esperado;
- asiento;
- explicación;
- tolerancia, cuando exista;
- aprobación contable;
- checksum.

## 42.2 Casos mínimos

### Reconocimiento

- GD-REC-001 bien bajo umbral controlado físicamente.
- GD-REC-002 grupo homogéneo de veinte sillas.
- GD-REC-003 activo recibido no disponible.
- GD-REC-004 activo en construcción.
- GD-REC-005 donación con medición pendiente.

### Depreciación

- GD-DEP-001 a 003, ejercicios entregados.
- GD-DEP-004 política de mes siguiente.
- GD-DEP-005 fecha disponible distinta de compra.
- GD-DEP-006 residual $1.
- GD-DEP-007 residual distinto de $1.
- GD-DEP-008 prorrata diaria real.
- GD-DEP-009 unidades de producción sin consumo.
- GD-DEP-010 baja a mitad de período.
- GD-DEP-011 componente con vida distinta.
- GD-DEP-012 cambio de vida útil prospectivo.
- GD-DEP-013 cambio de residual.
- GD-DEP-014 deterioro y nueva base.
- GD-DEP-015 reversión de run.
- GD-DEP-016 corrida duplicada.
- GD-DEP-017 redondeo CLP.
- GD-DEP-018 moneda con decimales.

### Deterioro y componentes

- GD-IMP-001 activo no generador de efectivo.
- GD-IMP-002 unidad generadora.
- GD-IMP-003 reversión limitada.
- GD-CMP-001 reemplazo de componente.
- GD-CMP-002 inspección mayor.
- GD-CMP-003 reparación como gasto.

### Operación y migración

- GD-INV-001 activo encontrado en otra ubicación.
- GD-INV-002 QR duplicado.
- GD-INV-003 observación offline duplicada.
- GD-MIG-001 serie duplicada.
- GD-MIG-002 clase/marca/modelo incompatible.
- GD-MIG-003 saldo de apertura sin historia reconstruida.

# 43. Casos de aceptación

## 43.1 Producto

- Un tenant no puede consultar recursos de otro.
- Un usuario multi-tenant cambia de contexto sin datos residuales.
- Un administrador de plataforma no obtiene permisos contables por su rol técnico.
- Branding cambia presentación, no reglas ni evidencia.
- Un tenant suspendido no ejecuta Data Plane.

## 43.2 Patrimonio

- Un bien físico existe sin activo contable.
- Un activo contable puede representar grupo o componente.
- La ficha 360° separa estados y muestra historia.
- Un traslado conserva ubicación anterior y aceptación.
- Una baja mantiene historial y asiento.

## 43.3 Inventario

- Dos campañas no superpuestas operan en paralelo.
- Un escaneo crea observación y no cambia ubicación.
- La conciliación aprobada genera el evento correspondiente.
- El modo offline reintenta sin duplicar.
- Un QR de otro tenant no revela información.

## 43.4 Contabilidad

- La compra no inicia depreciación por sí sola.
- La fecha disponible gobierna elegibilidad.
- Cada cargo es reproducible por policy version.
- Los tres ejercicios aprobados coinciden exactamente.
- El anual es suma de mensuales posted.
- El run no puede postearse dos veces.
- La reversión mantiene original y reversor.
- El lote cuadra y concilia con ERP.

## 43.5 Seguridad y evidencia

- Roles privilegiados cumplen MFA/step-up aprobado.
- Descargas quedan auditadas.
- Evidencia de períodos cerrados no se elimina.
- Los logs no contienen OTP ni secretos.
- Operaciones de plataforma quedan en PlatformAudit.

# 44. DevOps y deployment

## 44.1 Repositorios y artefactos

Separación lógica recomendada:

- application frontend;
- application backend;
- infrastructure as code;
- database migrations;
- policy definitions y golden dataset;
- documentación.

La separación física en repositorios es TBD-DEV; el pipeline debe mantener trazabilidad entre versiones.

## 44.2 Pipeline mínimo

```text
Pull Request
→ Lint/Compile
→ Unit tests
→ Golden dataset
→ Security scan
→ Multi-tenant tests
→ Build artifact
→ Deploy non-production
→ Integration/E2E/A11Y
→ Approval
→ Production rollout by stamp
→ Smoke tests
→ Observe
```

## 44.3 Versiones

Por tenant:

```text
DatabaseSchemaVersion
ApplicationCompatibilityVersion
PolicyVersion
ConfigurationVersion
```

## 44.4 Schema migrations

- versionadas;
- auditables;
- reintentables;
- observables;
- preflight por tenant;
- rollout por lotes/stamp;
- compatibilidad backward cuando se necesite;
- backup/restore point previo según riesgo;
- estado por tenant;
- bloqueo de tenant sólo cuando sea necesario.

## 44.5 Rollback

El rollback de aplicación no implica rollback automático de esquema. Cada release define compatibilidad, forward fix y plan de reversión.

## 44.6 Feature flags

- liberación gradual;
- scope platform/stamp/tenant;
- auditoría;
- no usar flags permanentes para ocultar deuda sin owner;
- los flags no reemplazan permisos.

## 44.7 Datos productivos

No se copian a ambientes inferiores sin sanitización, aprobación, trazabilidad y eliminación posterior.

# 45. Architecture Decision Records

## ADR-001 Multi-Tenant SaaS

- Context: producto para varios clientes con configuración propia.
- Decision: multi-tenancy desde dominio, seguridad e infraestructura.
- Alternatives: single-tenant inicial.
- Consequences: más complejidad de plataforma, menor retrabajo y mejor aislamiento.
- Risks: contexto incorrecto.
- Status: Accepted.

## ADR-002 Database per Tenant

- Context: aislamiento, restore y portabilidad.
- Decision: una DB por tenant en baseline.
- Alternatives: base compartida con RLS; infraestructura dedicada.
- Consequences: provisionamiento y migraciones automatizadas.
- Risks: costo y operación de muchas bases.
- Status: Accepted, sujeto a validación de costo.

## ADR-003 Control Plane / Data Plane

- Decision: separar `TrazActivo Control` de la aplicación cliente.
- Consequences: roles, APIs y auditoría distintos.
- Status: Accepted.

## ADR-004 Deployment Stamps

- Decision: diseñar unidad de despliegue movible y escalable.
- Consequences: Tenant Catalog y routing central.
- Status: Accepted como arquitectura evolutiva.

## ADR-005 Tenant Context

- Decision: contexto creado y validado por servidor en toda operación.
- Consequences: middleware, propagación y tests obligatorios.
- Status: Accepted.

## ADR-006 Identity Model

- Decision: `User` global más `TenantMembership` y roles por scope.
- Consequences: selector de tenant y revocación independiente.
- Status: Accepted.

## ADR-007 Branding Architecture

- Decision: tokens y configuración por tenant, sin forks.
- Consequences: validación de contraste y templates versionados.
- Status: Accepted.

## ADR-008 Accounting Policy Engine

- Decision: reglas versionadas, reproducibles y fuera de frontend/controllers.
- Consequences: DSL/estructura de reglas y golden dataset.
- Status: Accepted.

## ADR-009 Event/Audit Model

- Decision: eventos append-only para hechos críticos y auditoría separada.
- Consequences: proyecciones y reversión.
- Status: Accepted.

## ADR-010 Document Storage

- Decision: storage segregado por tenant y metadata en dominio.
- Consequences: provisionamiento, retención y URLs temporales.
- Status: Accepted.

## ADR-011 Background Jobs

- Decision: mensajes con contexto de tenant y workers idempotentes.
- Alternatives: ejecución síncrona o scheduler global.
- Status: Accepted conceptualmente; servicio Azure depende de TBD-AZR-001.

## ADR-012 Frontend Design System

- Decision: componentes comunes y providers de contexto/branding/features/permisos.
- Status: Accepted.

## ADR-013 Hosting Runtime

- Context: App Service versus Container Apps.
- Decision: pendiente TBD-AZR-001.
- Status: Proposed.

## ADR-014 IaC

- Context: Bicep versus Terraform.
- Decision: pendiente TBD-AZR-004.
- Status: Proposed.

# 46. Riesgos y decisiones pendientes

## 46.1 Registro de riesgos

| ID | Riesgo | Impacto | Probabilidad | Control | Residual |
|---|---|---|---|---|---|
| RSK-001 | Política contable incompleta o mal interpretada | Alto | Media | Matriz normativa, aprobación y golden dataset | Pendiente |
| RSK-002 | Fuga cross-tenant | Crítico | Baja/Media | DB por tenant, resolver, tests P0 | Pendiente |
| RSK-003 | Costos database-per-tenant superiores al modelo comercial | Alto | Media | Elastic Pools, medición y planes | Pendiente |
| RSK-004 | Hosting elegido sin validar disponibilidad/SKU en Chile Central | Alto | Media | ADR y prueba de concepto | Pendiente |
| RSK-005 | DR sin región secundaria | Alto | Media | TBD-AZR-003 antes de contrato | Pendiente |
| RSK-006 | Migración con datos incoherentes | Alto | Alta | Staging, reglas y conciliación | Reducido |
| RSK-007 | PWA offline expone datos o duplica observaciones | Alto | Media | Dataset mínimo, idempotencia y sync tests | Pendiente |
| RSK-008 | ERP duplica asientos por timeout | Alto | Media | Idempotencia y consulta de estado | Pendiente |
| RSK-009 | Branding rompe accesibilidad | Medio | Media | Tokens y validación contraste | Reducido |
| RSK-010 | Operadores SaaS acceden sin trazabilidad | Crítico | Baja | JIT, PlatformAudit y segregación | Pendiente |
| RSK-011 | Drift de esquema entre tenant DBs | Alto | Media | Versioning y rollout observable | Pendiente |
| RSK-012 | Reglas en código difíciles de actualizar | Alto | Media | Policy Engine y versiones | Reducido |

## 46.2 Condiciones de avance

No iniciar desarrollo del posting de depreciación hasta cerrar TBD-ACC-002, TBD-ACC-003 y matriz del perfil piloto. No declarar producción hasta cerrar NFR contractuales, restore, seguridad multi-tenant y runbook operacional.

# 47. Backlog

## 47.1 P0

- EPIC-SAAS-01 Tenant Catalog y lifecycle.
- EPIC-SAAS-02 Tenant Resolver y TenantContext.
- EPIC-SEC-01 Identidad, memberships, roles, TOTP y step-up.
- EPIC-PLAT-01 TrazActivo Control básico.
- EPIC-DATA-01 Database per tenant y migraciones.
- EPIC-AST-01 AssetItem y ficha 360°.
- EPIC-ORG-01 Entidades, establecimientos, ubicaciones y custodios.
- EPIC-ACQ-01 Recepción, aceptación y capitalización.
- EPIC-INV-01 Campañas concurrentes, observaciones y conciliación.
- EPIC-ACC-01 Libros, períodos, políticas y cuentas.
- EPIC-DEP-01 Motor de depreciación y golden dataset.
- EPIC-DOC-01 Evidencia y storage segregado.
- EPIC-AUD-01 Auditoría tenant/plataforma.
- EPIC-QA-01 Multi-tenant isolation tests.
- EPIC-DEV-01 IaC, CI/CD y observabilidad base.

## 47.2 P1

- EPIC-INT-01 ERP.
- EPIC-MKT-01 Mercado Público.
- EPIC-IMP-01 Deterioro.
- EPIC-CMP-01 Componentes y erogaciones.
- EPIC-MNT-01 Mantenimiento.
- EPIC-BRD-01 Branding y custom domains.
- EPIC-REP-01 Modo auditor y reportes contables.
- EPIC-DR-01 Portabilidad y DR.
- EPIC-STAMP-01 Deployment stamps y migración.

## 47.3 P2

- EPIC-LEASE-01 IFRS 16.
- EPIC-FLEET-01 Flota.
- EPIC-HEALTH-01 Alertas sanitarias.
- EPIC-API-01 API partner/APIM.
- EPIC-WL-01 White Label completo.
- EPIC-ANL-01 Analítica avanzada.

# 48. Roadmap

## Fase 0. Baseline y validación

Entregables:

- PDD aprobado;
- ADR P0;
- matriz normativa del perfil piloto;
- golden dataset aprobado;
- prototipos UX-001 a UX-005;
- threat model;
- decisión hosting/IaC;
- modelo de dominio y contratos API base.

Criterio de salida: no quedan TBD P0 que alteren modelo de datos o cálculo inicial.

## Fase 1. Plataforma SaaS

- Control Plane mínimo;
- tenant lifecycle;
- database per tenant;
- TenantContext;
- identidad, TOTP, roles y auditoría;
- branding base;
- IaC, CI/CD y observabilidad.

Criterio de salida: MT-001 a MT-015 aprobados en alcance implementado.

## Fase 2. Gestión patrimonial e inventario

- AssetItem;
- ficha 360°;
- estructura y custodia;
- QR y etiquetas;
- movimientos;
- campañas, PWA y conciliación;
- importación con staging.

Criterio de salida: inventario piloto reconciliado sin modificar maestro desde observaciones no aprobadas.

## Fase 3. Auxiliar contable

- libros y períodos;
- reconocimiento;
- Policy Engine;
- depreciación;
- asientos y reversión;
- reportes y explicación.

Criterio de salida: golden dataset completo y conciliación del cliente piloto.

## Fase 4. Contabilidad avanzada e integraciones

- deterioro;
- componentes y erogaciones;
- ERP;
- Mercado Público;
- mantenimiento y bridge contable;
- modo auditor.

## Fase 5. Expansión

- arrendamientos;
- flota;
- alertas sanitarias;
- white label;
- API partners;
- analítica.

---

# Apéndice A. Requisitos canónicos

Los requisitos siguientes son baseline. Los requerimientos de detalle adicionales deberán adoptar el mismo formato.


## SAAS-001 — Aislamiento de tenant

- **ID:** SAAS-001
- **Nombre:** Aislamiento de tenant
- **Descripción:** Toda operación de Data Plane debe ejecutarse exclusivamente sobre recursos del tenant resuelto y autorizado por el servidor.
- **Objetivo:** Evitar acceso directo o indirecto entre clientes SaaS.
- **Scope:** Platform y todos los tenants
- **Actor:** Usuario, API, job, integración y operador
- **Precondiciones:** Tenant autenticado o operación de plataforma autorizada.
- **Inputs:** Host/claim de candidato, UserId, Membership, ResourceId.
- **Reglas:** El navegador no selecciona DB; Tenant Catalog resuelve stamp/DB/storage; autorización valida recurso y membership.
- **Permisos:** No aplica como permiso; es control obligatorio.
- **Estados:** Tenant debe estar Active; Suspended bloquea Data Plane.
- **Resultado:** Consulta/comando sólo sobre recursos del tenant correcto.
- **Eventos:** TenantResolutionSucceeded/Failed, SecurityAccessDenied.
- **Evidencia:** Trazas con CorrelationId; resultados MT-001 a MT-015.
- **Errores:** 404/403 sin revelar datos de otro tenant.
- **Auditoría:** Intentos anómalos y operaciones de plataforma.
- **Dependencias:** Tenant Catalog, Tenant Resolver, Identity, DB per tenant.
- **NFR relacionados:** NFR-SEC-001, NFR-OBS-001.
- **Criterios de aceptación:** Ningún caso MT permite acceso cruzado.
- **Casos de prueba:** MT-001, MT-002, MT-006, MT-007, MT-011, MT-013.
- **Fuente:** SRC-002.

## SAAS-002 — Tenant Catalog

- **ID:** SAAS-002
- **Nombre:** Tenant Catalog
- **Descripción:** Mantener catálogo central de resolución con estado, stamp, referencias de datos y versiones.
- **Objetivo:** Resolver recursos sin confiar en valores del cliente.
- **Scope:** Control Plane
- **Actor:** TrazActivo Control y Tenant Resolver
- **Precondiciones:** TenantCode reservado.
- **Inputs:** TenantId, status, stamp, DBRef, StorageRef, versions.
- **Reglas:** No guardar secretos ni datos patrimoniales; cambios auditados; lectura altamente disponible.
- **Permisos:** platform.tenants.read/update.
- **Estados:** Requested, Provisioning, Active, Suspended, Terminating, Retention, Deleted.
- **Resultado:** Entrada consistente y versionada.
- **Eventos:** TenantCatalogEntryCreated/Updated.
- **Evidencia:** PlatformAudit y health checks.
- **Errores:** Catálogo no disponible; entrada inconsistente; stamp desconocido.
- **Auditoría:** Antes/después y operador.
- **Dependencias:** Control Plane, Key Vault references.
- **NFR relacionados:** NFR-AVAIL-001, NFR-OBS-001.
- **Criterios de aceptación:** Resolver obtiene DB/storage correctos y no acepta referencias manipuladas.
- **Casos de prueba:** Component, failover, MT-002.
- **Fuente:** SRC-002.

## SAAS-003 — Provisionamiento idempotente

- **ID:** SAAS-003
- **Nombre:** Provisionamiento idempotente
- **Descripción:** Provisionar DB, storage, configuración, identidad, branding, features y administrador inicial mediante workflow reintentable.
- **Objetivo:** Evitar tenants parcialmente activos.
- **Scope:** Control Plane
- **Actor:** Platform operator o automatización
- **Precondiciones:** Solicitud aprobada y TenantCode reservado.
- **Inputs:** Tenant request, plan, region, identity mode.
- **Reglas:** Cada paso registra estado; reintento no duplica recursos; activación sólo tras validaciones.
- **Permisos:** platform.tenants.provision.
- **Estados:** Requested→Provisioning→Configuring→Validation→Active o ProvisioningFailed.
- **Resultado:** Tenant activo o fallo recuperable.
- **Eventos:** TenantProvisioningRequested/StepCompleted/Failed/Activated.
- **Evidencia:** OperationId, recursos creados, validaciones.
- **Errores:** Conflicto de código; recurso no creado; schema fallido.
- **Auditoría:** Operador, inputs, pasos y resultado.
- **Dependencias:** IaC, Tenant Catalog, DB migrations.
- **NFR relacionados:** NFR-OBS-001, NFR-PORT-001.
- **Criterios de aceptación:** Ejecutar dos veces la misma solicitud no duplica tenant ni recursos.
- **Casos de prueba:** Integration, retry, rollback.
- **Fuente:** SRC-002.

## TEN-001 — Construcción de TenantContext

- **ID:** TEN-001
- **Nombre:** Construcción de TenantContext
- **Descripción:** Crear contexto validado con tenant, usuario, membership, entidad, libro, roles, permisos, locale, timezone y correlation.
- **Objetivo:** Propagar scope correcto a todas las capas.
- **Scope:** Data Plane
- **Actor:** Middleware de identidad
- **Precondiciones:** Autenticación válida y membership activa.
- **Inputs:** Token, host, tenant selection, resource context.
- **Reglas:** Derivar TenantId server-side; validar tenant Active; no incluir secretos.
- **Permisos:** authenticated.
- **Estados:** ContextValid/Invalid/Expired.
- **Resultado:** TenantContext inmutable por request.
- **Eventos:** TenantContextCreated/Rejected.
- **Evidencia:** Trace context.
- **Errores:** Membership inválida; tenant suspendido; libro no autorizado.
- **Auditoría:** Cambios de contexto y fallos.
- **Dependencias:** Identity, Tenant Resolver.
- **NFR relacionados:** NFR-SEC-001.
- **Criterios de aceptación:** Toda operación crítica puede responder tenant, entidad, libro, usuario y permiso.
- **Casos de prueba:** MT-003, MT-009.
- **Fuente:** SRC-002.

## TEN-002 — Cambio seguro de tenant

- **ID:** TEN-002
- **Nombre:** Cambio seguro de tenant
- **Descripción:** Cambiar membership activa y regenerar contexto eliminando datos del tenant anterior.
- **Objetivo:** Evitar persistencia visual o técnica de datos entre tenants.
- **Scope:** Frontend y Data Plane
- **Actor:** Usuario multi-tenant
- **Precondiciones:** Usuario tiene memberships activas.
- **Inputs:** TargetMembershipId.
- **Reglas:** Limpiar stores, cache, filtros, borradores temporales, branding, features y selección de libro.
- **Permisos:** tenant.switch.
- **Estados:** CurrentContext→Switching→TargetContext.
- **Resultado:** Aplicación recargada bajo target tenant.
- **Eventos:** TenantContextChanged.
- **Evidencia:** Audit y pruebas E2E.
- **Errores:** Membership revocada; tenant suspendido.
- **Auditoría:** Origen, destino y sesión.
- **Dependencias:** TenantSelector, providers frontend.
- **NFR relacionados:** NFR-SEC-001.
- **Criterios de aceptación:** No se observan datos, filtros ni URLs firmadas del tenant anterior.
- **Casos de prueba:** MT-003, MT-004, MT-005.
- **Fuente:** SRC-002.

## SEC-001 — Modos de autenticación por tenant

- **ID:** SEC-001
- **Nombre:** Modos de autenticación por tenant
- **Descripción:** Permitir cuenta local con MFA u OIDC corporativo según configuración del tenant.
- **Objetivo:** Adaptar identidad sin mezclar autorización de negocio.
- **Scope:** Identity
- **Actor:** Usuario
- **Precondiciones:** Tenant activo y método habilitado.
- **Inputs:** Credenciales/federación y contexto candidato.
- **Reglas:** Autenticación no concede por sí sola permisos; validar membership.
- **Permisos:** N/A.
- **Estados:** Authenticated, Challenged, Denied.
- **Resultado:** Sesión y claims mínimos.
- **Eventos:** LoginSucceeded/Failed, FederationLinked.
- **Evidencia:** Security logs sin secretos.
- **Errores:** Credencial inválida; cuenta deshabilitada; tenant suspendido.
- **Auditoría:** Inicio/cierre de sesión, IP/dispositivo.
- **Dependencias:** Identity provider, TenantMembership.
- **NFR relacionados:** NFR-SEC-003.
- **Criterios de aceptación:** Un usuario autenticado sin membership no ingresa al tenant.
- **Casos de prueba:** Auth, federation, membership.
- **Fuente:** SRC-002, SRC-003.

## SEC-002 — TOTP y recuperación

- **ID:** SEC-002
- **Nombre:** TOTP y recuperación
- **Descripción:** Implementar TOTP para cuentas locales con secreto único, replay protection, rate limiting y recovery codes.
- **Objetivo:** Agregar segundo factor verificable.
- **Scope:** User security
- **Actor:** Usuario y administrador autorizado
- **Precondiciones:** Contraseña o sesión reautenticada.
- **Inputs:** Secret, OTP, recovery code.
- **Reglas:** Intervalo 30 s; código usado no se acepta otra vez; secretos cifrados; OTP no se loguea.
- **Permisos:** self.mfa.manage o security.mfa.reset.
- **Estados:** NotEnrolled→PendingVerification→Active→Reset/Revoked.
- **Resultado:** Método activo o recuperación controlada.
- **Eventos:** MfaEnrolled/Verified/Reset/RecoveryUsed.
- **Evidencia:** Audit sin secreto/OTP.
- **Errores:** OTP inválido/expirado/reutilizado; demasiados intentos.
- **Auditoría:** Enrolamiento, reset, recovery y actor.
- **Dependencias:** Key Vault/crypto, session management.
- **NFR relacionados:** NFR-SEC-003.
- **Criterios de aceptación:** Replay y brute force se bloquean; reset revoca sesiones según política.
- **Casos de prueba:** RFC6238 vectors, replay, rate limit.
- **Fuente:** SRC-002, SRC-015.

## SEC-003 — Step-up authentication

- **ID:** SEC-003
- **Nombre:** Step-up authentication
- **Descripción:** Exigir autenticación reforzada antes de operaciones de alto impacto.
- **Objetivo:** Reducir riesgo de sesión comprometida.
- **Scope:** Accounting, security y platform operations
- **Actor:** Aprobador o administrador
- **Precondiciones:** Sesión válida, operación sensible.
- **Inputs:** OperationType, session age, factor result.
- **Reglas:** Trigger por operación; timeout TBD-SEC-003; fallo no cambia estado.
- **Permisos:** Permiso de negocio más factor.
- **Estados:** Required→Challenged→Satisfied/Failed/Expired.
- **Resultado:** Token/claim de step-up ligado a operación y tiempo.
- **Eventos:** StepUpRequested/Succeeded/Failed.
- **Evidencia:** Security event vinculado a OperationId.
- **Errores:** Factor fallido; timeout; método no disponible.
- **Auditoría:** Usuario, operación y resultado.
- **Dependencias:** SEC-002/SSO MFA.
- **NFR relacionados:** NFR-SEC-003.
- **Criterios de aceptación:** Posting/reversal/policy publish no se ejecutan sin step-up cuando aplica.
- **Casos de prueba:** E2E operaciones críticas.
- **Fuente:** SRC-002.

## SEC-004 — Separación de autenticación, autorización y aprobación

- **ID:** SEC-004
- **Nombre:** Separación de autenticación, autorización y aprobación
- **Descripción:** Evaluar tres controles distintos para cada operación sensible.
- **Objetivo:** Evitar que una sesión o rol técnico sustituya el workflow.
- **Scope:** Toda la plataforma
- **Actor:** Usuario/operador
- **Precondiciones:** Contexto válido.
- **Inputs:** Identity, permission, workflow state.
- **Reglas:** Authentication AND Authorization AND BusinessApproval cuando corresponda.
- **Permisos:** Según recurso/acción.
- **Estados:** Varían por workflow.
- **Resultado:** Transición sólo si los tres controles se cumplen.
- **Eventos:** AuthorizationDenied/ApprovalGranted.
- **Evidencia:** Audit y workflow history.
- **Errores:** 401, 403 o 409 según falla.
- **Auditoría:** Decisión y regla.
- **Dependencias:** Identity, Workflow.
- **NFR relacionados:** NFR-SEC-001.
- **Criterios de aceptación:** Platform admin no puede aprobar depreciación por rol técnico.
- **Casos de prueba:** Privilege escalation.
- **Fuente:** SRC-002.

## BRD-001 — Branding configurable

- **ID:** BRD-001
- **Nombre:** Branding configurable
- **Descripción:** Aplicar logos, colores permitidos, favicon, soporte y plantillas por tenant sin forks.
- **Objetivo:** Personalización controlada y accesible.
- **Scope:** Tenant
- **Actor:** Tenant admin con feature habilitada
- **Precondiciones:** CustomBranding activo.
- **Inputs:** Assets y design tokens permitidos.
- **Reglas:** No modificar colores semánticos críticos ni contenido regulado; validar contraste.
- **Permisos:** tenant.branding.manage.
- **Estados:** Draft→Preview→Published.
- **Resultado:** Branding versionado aplicado a UI/documentos/correos.
- **Eventos:** TenantBrandingPublished.
- **Evidencia:** Preview y audit.
- **Errores:** Formato inválido; contraste insuficiente; feature no contratada.
- **Auditoría:** Antes/después.
- **Dependencias:** Design System, Blob.
- **NFR relacionados:** NFR-A11Y-001.
- **Criterios de aceptación:** Branding A no aparece en B y no cambia cálculos.
- **Casos de prueba:** MT-004, visual/A11Y.
- **Fuente:** SRC-002, SRC-007.

## SUB-001 — Control de módulos y features

- **ID:** SUB-001
- **Nombre:** Control de módulos y features
- **Descripción:** Mostrar y ejecutar una capacidad sólo cuando plan, feature, rol y permiso la habilitan.
- **Objetivo:** Evitar exposición accidental o acceso por URL.
- **Scope:** Tenant
- **Actor:** Usuario
- **Precondiciones:** Subscription activa.
- **Inputs:** Plan, FeatureCode, Role, Permission.
- **Reglas:** Frontend oculta; backend rechaza; flags no sustituyen permisos.
- **Permisos:** Según capacidad.
- **Estados:** Enabled/Disabled por vigencia.
- **Resultado:** Capacidad disponible o denegada.
- **Eventos:** TenantFeatureChanged.
- **Evidencia:** Config version y audit.
- **Errores:** 404/403.
- **Auditoría:** Cambios de feature.
- **Dependencias:** Subscription, FeatureGuard, PermissionGuard.
- **NFR relacionados:** NFR-SEC-001.
- **Criterios de aceptación:** Endpoint conocido sigue bloqueado si feature no está habilitada.
- **Casos de prueba:** MT-005.
- **Fuente:** SRC-002.

## AST-001 — Separación de bien y activo contable

- **ID:** AST-001
- **Nombre:** Separación de bien y activo contable
- **Descripción:** Mantener AssetItem, AccountingAsset, AssetGroup y AssetComponent como entidades distintas.
- **Objetivo:** Controlar bienes físicos sin forzar un tratamiento contable único.
- **Scope:** Tenant/LegalEntity/Book
- **Actor:** Patrimonio y Contabilidad
- **Precondiciones:** Clases y libro configurados.
- **Inputs:** Datos físicos, evaluación contable.
- **Reglas:** Un AssetItem puede no estar reconocido; un AccountingAsset puede agrupar items; valores pertenecen al libro.
- **Permisos:** assets.manage, accounting.recognize.
- **Estados:** Operativo y contable separados.
- **Resultado:** Relaciones explícitas y trazables.
- **Eventos:** AssetItemCreated, AccountingAssetRecognized, GroupFormed.
- **Evidencia:** Ficha 360 y evento de reconocimiento.
- **Errores:** Cardinalidad inválida; libro incorrecto.
- **Auditoría:** Creación y relación.
- **Dependencias:** Asset Registry, Accounting.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** Veinte sillas pueden ser 20 items y 1 grupo contable.
- **Casos de prueba:** GD-REC-001/002.
- **Fuente:** SRC-001, SRC-002, SRC-007.

## AST-002 — Ficha 360 y timeline

- **ID:** AST-002
- **Nombre:** Ficha 360 y timeline
- **Descripción:** Consolidar identificación, estados, ubicación, custodia, libros, eventos, documentos, inventarios y mantenimiento.
- **Objetivo:** Entregar historia verificable del activo.
- **Scope:** Tenant
- **Actor:** Usuario autorizado/auditor
- **Precondiciones:** AssetItem existente.
- **Inputs:** AssetId y contexto.
- **Reglas:** Estados separados; timeline desde eventos, no comparación del registro actual.
- **Permisos:** assets.read y permisos de secciones.
- **Estados:** N/A.
- **Resultado:** Vista consistente con drill-down.
- **Eventos:** Lectura opcionalmente auditada.
- **Evidencia:** Datos fuente y eventos.
- **Errores:** Recurso no encontrado/no autorizado.
- **Auditoría:** Acceso a información restringida según política.
- **Dependencias:** Proyecciones de dominio.
- **NFR relacionados:** NFR-A11Y-001.
- **Criterios de aceptación:** Puede responder qué cambió, quién, cuándo, regla y evidencia.
- **Casos de prueba:** E2E UX-003.
- **Fuente:** SRC-002, SRC-003.

## ACQ-001 — Separación del ciclo de adquisición

- **ID:** ACQ-001
- **Nombre:** Separación del ciclo de adquisición
- **Descripción:** Separar OC, recepción, aceptación, factura, distribución, creación física, disponibilidad y capitalización.
- **Objetivo:** Evitar reconocimiento o depreciación prematuros.
- **Scope:** LegalEntity y Book
- **Actor:** Adquisiciones, Patrimonio y Contabilidad
- **Precondiciones:** Proveedor/fuente configurados.
- **Inputs:** OC, receipts, evidence, cost allocations.
- **Reglas:** Recepción parcial; aceptación distinta; creación física no capitaliza; costos deben cuadrar.
- **Permisos:** acquisitions.*, accounting.capitalize.
- **Estados:** Draft→Received→Accepted→Available→Capitalized.
- **Resultado:** Bien físico y eventual activo contable relacionados.
- **Eventos:** ReceiptRecorded, AssetAvailableForUse, AccountingAssetRecognized.
- **Evidencia:** OC, guía/factura, aceptación.
- **Errores:** Diferencia de cantidades; asignación no cuadra; fecha inválida.
- **Auditoría:** Cada etapa.
- **Dependencias:** Assets, Documents, Accounting.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** Guardar una compra no inicia depreciación.
- **Casos de prueba:** GD-REC-003.
- **Fuente:** SRC-002, SRC-003, SRC-007.

## LOC-001 — Historia de ubicación y custodia

- **ID:** LOC-001
- **Nombre:** Historia de ubicación y custodia
- **Descripción:** Registrar asignaciones con fecha efectiva, origen, destino, custodio y aceptación.
- **Objetivo:** Evitar sobrescribir historia y confundir ubicación con unidad organizacional.
- **Scope:** LegalEntity
- **Actor:** Patrimonio, custodio
- **Precondiciones:** AssetItem y ubicaciones vigentes.
- **Inputs:** Origin, destination, custodian, effective date.
- **Reglas:** Location, OrganizationalUnit y CostCenter separados; cierre de asignación anterior.
- **Permisos:** assets.assign, movements.transfer.
- **Estados:** AssignmentActive/Closed.
- **Resultado:** Proyección actual más historia completa.
- **Eventos:** LocationAssigned, CustodianAssigned.
- **Evidencia:** Comprobante y aceptación.
- **Errores:** Ubicación inactiva; fechas solapadas.
- **Auditoría:** Antes/después.
- **Dependencias:** Organization, Movement.
- **NFR relacionados:** NFR-CONC-001.
- **Criterios de aceptación:** La ficha muestra ubicación anterior y actual sin alterar valores.
- **Casos de prueba:** Movement E2E.
- **Fuente:** SRC-002, SRC-003.

## INV-001 — Campañas concurrentes sin solapamiento

- **ID:** INV-001
- **Nombre:** Campañas concurrentes sin solapamiento
- **Descripción:** Permitir campañas paralelas cuando sus scopes no incluyen los mismos recursos incompatibles.
- **Objetivo:** Habilitar varios equipos de inventario.
- **Scope:** Tenant
- **Actor:** Inventory manager
- **Precondiciones:** Scopes definidos.
- **Inputs:** Locations, classes, items, dates, teams.
- **Reglas:** Crear snapshot y ScopeLocks; bloquear/advertir solapamiento.
- **Permisos:** inventory.create/activate.
- **Estados:** Draft→Planned→Active→Reconciliation→Completed.
- **Resultado:** Campañas activas independientes.
- **Eventos:** InventoryCampaignActivated.
- **Evidencia:** Snapshot y locks.
- **Errores:** Scope overlap; campaña sin equipo.
- **Auditoría:** Creación, cambios y activación.
- **Dependencias:** Inventory, Organization.
- **NFR relacionados:** NFR-CONC-001.
- **Criterios de aceptación:** Dos ubicaciones distintas pueden inventariarse simultáneamente.
- **Casos de prueba:** Concurrency/E2E.
- **Fuente:** SRC-002, SRC-003.

## INV-002 — Observación sin efecto directo

- **ID:** INV-002
- **Nombre:** Observación sin efecto directo
- **Descripción:** Un escaneo crea InventoryObservation y no modifica ubicación, custodio o maestro.
- **Objetivo:** Separar hallazgo de decisión.
- **Scope:** InventoryCampaign
- **Actor:** Inventariador
- **Precondiciones:** Campaña activa y scope asignado.
- **Inputs:** Code, observed location, condition, photo, device/time.
- **Reglas:** Append-only; idempotency; resultado clasificado; reconciliación posterior.
- **Permisos:** inventory.observe.
- **Estados:** Recorded→PendingReconciliation→Reconciled.
- **Resultado:** Observación trazable.
- **Eventos:** InventoryObservationRecorded.
- **Evidencia:** Foto, dispositivo, timestamp.
- **Errores:** Código inválido; fuera de scope; duplicate idempotency.
- **Auditoría:** Usuario y dispositivo.
- **Dependencias:** PWA, Reconciliation.
- **NFR relacionados:** NFR-SEC-001, NFR-CONC-001.
- **Criterios de aceptación:** Escanear un activo en otra oficina no lo traslada automáticamente.
- **Casos de prueba:** GD-INV-001.
- **Fuente:** SRC-002, SRC-003.

## INV-003 — Sincronización offline idempotente

- **ID:** INV-003
- **Nombre:** Sincronización offline idempotente
- **Descripción:** Registrar observaciones offline y sincronizarlas sin duplicar ni sobrescribir conflictos.
- **Objetivo:** Operar en terreno sin conectividad.
- **Scope:** Campaign assignment
- **Actor:** Inventariador
- **Precondiciones:** Dataset autorizado descargado.
- **Inputs:** Offline observation queue con keys únicas.
- **Reglas:** Dataset mínimo; cifrado/protección; server authoritative; conflictos explícitos.
- **Permisos:** inventory.offline.
- **Estados:** LocalPending→Syncing→Synced/Conflict/Rejected.
- **Resultado:** Observaciones persistidas una vez.
- **Eventos:** OfflineObservationSynced/ConflictDetected.
- **Evidencia:** OperationId y dispositivo.
- **Errores:** Sesión revocada; scope cerrado; versión incompatible.
- **Auditoría:** Sync result.
- **Dependencias:** PWA, TenantContext, jobs.
- **NFR relacionados:** NFR-PRIV-001.
- **Criterios de aceptación:** Reintento de la misma cola no duplica observaciones.
- **Casos de prueba:** GD-INV-003.
- **Fuente:** SRC-002.

## MOV-001 — Traslado con recepción

- **ID:** MOV-001
- **Nombre:** Traslado con recepción
- **Descripción:** Gestionar traslado con origen, destino, condición, aprobación y recepción.
- **Objetivo:** Mantener custodia verificable.
- **Scope:** Tenant/LegalEntity
- **Actor:** Solicitante, aprobador, receptor
- **Precondiciones:** Activo operativo y no bloqueado.
- **Inputs:** Items, origin, destination, dates, reason, evidence.
- **Reglas:** No cambia valor contable; recepción cierra movimiento; estados explícitos.
- **Permisos:** movements.transfer.create/approve/receive.
- **Estados:** Draft→Submitted→Approved→InTransit→Received→Completed.
- **Resultado:** Asignaciones actualizadas por evento.
- **Eventos:** TransferSubmitted/Approved/Received/Completed.
- **Evidencia:** Comprobante y aceptación.
- **Errores:** Activo en otro movimiento; destino inválido; conflicto de versión.
- **Auditoría:** Cada transición.
- **Dependencias:** LOC-001, Workflow.
- **NFR relacionados:** NFR-CONC-001.
- **Criterios de aceptación:** Origen y destino aparecen en timeline y comprobante.
- **Casos de prueba:** E2E transfer.
- **Fuente:** SRC-002, SRC-003.

## ACC-001 — Libros contables separados

- **ID:** ACC-001
- **Nombre:** Libros contables separados
- **Descripción:** Mantener valores, métodos, períodos y políticas por AccountingBook.
- **Objetivo:** Soportar NICSP-CGR e IFRS sin mezclar reglas.
- **Scope:** LegalEntity
- **Actor:** Contabilidad
- **Precondiciones:** LegalEntity existente.
- **Inputs:** Framework, currency, calendar, policy set.
- **Reglas:** Cada AccountingAsset pertenece a un libro; libro predeterminado no elimina otros.
- **Permisos:** accounting.books.manage.
- **Estados:** Draft→Active→Closed/Retired.
- **Resultado:** Contexto contable independiente.
- **Eventos:** AccountingBookActivated.
- **Evidencia:** Configuración y aprobación.
- **Errores:** Framework/policy incompatible.
- **Auditoría:** Cambios de libro.
- **Dependencias:** Policy Engine.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** El mismo AssetItem puede tener valores distintos en dos libros.
- **Casos de prueba:** Multi-book integration.
- **Fuente:** SRC-002, SRC-011-014.

## ACC-002 — Períodos, posting y reversión

- **ID:** ACC-002
- **Nombre:** Períodos, posting y reversión
- **Descripción:** Controlar apertura, cierre, posting, exportación, conciliación y reversión por libro.
- **Objetivo:** Preservar integridad temporal.
- **Scope:** AccountingBook
- **Actor:** Contabilidad/aprobador
- **Precondiciones:** Calendario configurado.
- **Inputs:** Period, batch, approval, effective date.
- **Reglas:** Posted no se edita; reapertura con step-up; lote debe cuadrar.
- **Permisos:** accounting.period.*, journal.post/reverse.
- **Estados:** Open→SoftClosed→Closed→Reopened; Batch Draft→Posted→Reversed.
- **Resultado:** Saldos y asientos trazables.
- **Eventos:** PeriodClosed/Reopened, JournalPosted/Reversed.
- **Evidencia:** Approval, batch, external ID.
- **Errores:** Período cerrado; lote descuadrado; duplicado.
- **Auditoría:** Todos los cambios.
- **Dependencias:** Workflow, ERP adapter.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** Una línea posted sólo cambia mediante reversión/corrección.
- **Casos de prueba:** Golden period/reversal.
- **Fuente:** SRC-002.

## POL-001 — Políticas versionadas y reproducibles

- **ID:** POL-001
- **Nombre:** Políticas versionadas y reproducibles
- **Descripción:** Publicar PolicySet/Rules con vigencia, fuente, aprobación y checksum.
- **Objetivo:** Reproducir cálculos históricos.
- **Scope:** AccountingBook
- **Actor:** Contabilidad y aprobador
- **Precondiciones:** Libro activo.
- **Inputs:** Rules, parameters, effective dates, source.
- **Reglas:** Published no se edita; vigencias no ambiguas; run guarda snapshot/hash.
- **Permisos:** policies.create/review/publish.
- **Estados:** Draft→Reviewed→Approved→Published→Retired.
- **Resultado:** PolicyVersion disponible.
- **Eventos:** PolicyPublished/Retired.
- **Evidencia:** Fuente, approval y checksum.
- **Errores:** Solapamiento; regla incompleta; fuente faltante.
- **Auditoría:** Antes/después y aprobadores.
- **Dependencias:** Policy Engine, Step-up.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** Un run histórico produce mismo resultado con su snapshot.
- **Casos de prueba:** Regression policy.
- **Fuente:** SRC-002.

## REC-001 — Capitalización basada en disponibilidad

- **ID:** REC-001
- **Nombre:** Capitalización basada en disponibilidad
- **Descripción:** Reconocer activo y establecer segmento inicial sólo después de evaluación y fecha disponible para uso.
- **Objetivo:** No depreciar desde compra o recepción por defecto.
- **Scope:** AccountingBook
- **Actor:** Contabilidad
- **Precondiciones:** AssetItem y evidencia de costo/disponibilidad.
- **Inputs:** Recognized cost, available date, method, life, residual, accounts, policy.
- **Reglas:** Fechas separadas; reconocimiento puede ser item, group o component.
- **Permisos:** accounting.capitalize.
- **Estados:** PendingRecognition→RecognizedDepreciable/NonDepreciable.
- **Resultado:** CapitalizationEvent y AccountingAsset.
- **Eventos:** AccountingAssetRecognized.
- **Evidencia:** Acceptance, cost allocation, approval.
- **Errores:** Fecha faltante; costo no cuadra; cuenta/policy ausente.
- **Auditoría:** Inputs, policy, actor, approval.
- **Dependencias:** ACQ-001, POL-001.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** Activo No Activado no presenta fin de vida contable definitivo.
- **Casos de prueba:** GD-REC-003.
- **Fuente:** SRC-001, SRC-003.

## DEP-001 — Elegibilidad automática de depreciación

- **ID:** DEP-001
- **Nombre:** Elegibilidad automática de depreciación
- **Descripción:** El motor determina incluidos y excluidos según estado, política, fecha, base y período.
- **Objetivo:** Evitar omisiones por selección manual.
- **Scope:** AccountingBook/Period
- **Actor:** Contabilidad
- **Precondiciones:** Run en Draft/Simulation.
- **Inputs:** Assets, events, policy, period.
- **Reglas:** No botón arbitrario de activación; override sólo mediante evento aprobado.
- **Permisos:** depreciation.simulate.
- **Estados:** Included/Excluded por run.
- **Resultado:** Lista con reason codes.
- **Eventos:** DepreciationEligibilityEvaluated.
- **Evidencia:** Explanation payload.
- **Errores:** Datos obligatorios faltantes como bloqueantes.
- **Auditoría:** Run inputs/hash.
- **Dependencias:** REC-001, POL-001.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** Todos los elegibles aparecen y cada exclusión se explica.
- **Casos de prueba:** Golden eligibility.
- **Fuente:** SRC-001, SRC-002, SRC-003.

## DEP-002 — Cálculo determinista por unidades

- **ID:** DEP-002
- **Nombre:** Cálculo determinista por unidades
- **Descripción:** Calcular tasa por unidad y consumo del período sobre el segmento vigente.
- **Objetivo:** Corregir redistribución errónea del saldo.
- **Scope:** Policy Engine
- **Actor:** Backend service
- **Precondiciones:** Asset elegible y segmento válido.
- **Inputs:** Base, total units, cumulative units open/close, currency.
- **Reglas:** Decimal; clamp; no superar base; no bajar residual; final adjustment.
- **Permisos:** Interno.
- **Estados:** N/A.
- **Resultado:** DepreciationLine explicable.
- **Eventos:** DepreciationLineCalculated.
- **Evidencia:** InputHash, AlgorithmVersion, explanation.
- **Errores:** Invariante inválida; policy no soportada.
- **Auditoría:** Incluido en run.
- **Dependencias:** POL-001.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** GD-DEP-001 a 018 sin diferencias aprobadas.
- **Casos de prueba:** Unit/golden/regression.
- **Fuente:** SRC-005, SRC-006.

## DEP-003 — Convención 30 días décima

- **ID:** DEP-003
- **Nombre:** Convención 30 días décima
- **Descripción:** Implementar DEP-CONV-30D-TENTH como política institucional separada.
- **Objetivo:** Reproducir dataset aprobado sin declararlo regla NICSP universal.
- **Scope:** Policy Engine
- **Actor:** Contabilidad al configurar policy
- **Precondiciones:** TBD-ACC-002 aprobado.
- **Inputs:** AvailableDate, period close, useful life.
- **Reglas:** (meses + diferencia días/30), round 0,1, consumo por diferencia acumulada.
- **Permisos:** policies.publish.
- **Estados:** Policy Draft/Published.
- **Resultado:** Service units por período.
- **Eventos:** N/A dentro de cálculo.
- **Evidencia:** Fuente de política y golden dataset.
- **Errores:** Policy sin fuente/aprobación.
- **Auditoría:** Policy publication.
- **Dependencias:** POL-001.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** Tres ejemplos corregidos coinciden.
- **Casos de prueba:** GD-DEP-001/002/003.
- **Fuente:** SRC-005, SRC-006.

## DEP-004 — Convención mes siguiente

- **ID:** DEP-004
- **Nombre:** Convención mes siguiente
- **Descripción:** Permitir perfil donde primer cargo mensual se registra desde el mes siguiente a disponibilidad.
- **Objetivo:** Soportar políticas municipales u otras aprobadas.
- **Scope:** Policy Engine
- **Actor:** Contabilidad
- **Precondiciones:** Policy publicada.
- **Inputs:** AvailableDate, period.
- **Reglas:** Mes de disponibilidad = 0; meses siguientes = 1 hasta completar unidades.
- **Permisos:** policies.publish.
- **Estados:** N/A.
- **Resultado:** Unidades elegibles mensuales.
- **Eventos:** N/A.
- **Evidencia:** Fuente normativa/política.
- **Errores:** Vigencia no definida.
- **Auditoría:** Policy publication.
- **Dependencias:** POL-001.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** Tres activos disponibles en enero inician en febrero bajo esta policy.
- **Casos de prueba:** GD-DEP-004.
- **Fuente:** SRC-009 sujeto a matriz.

## DEP-005 — Redondeo y residual

- **ID:** DEP-005
- **Nombre:** Redondeo y residual
- **Descripción:** Aplicar precisión decimal, redondeo por moneda y ajuste final sin bajar del residual.
- **Objetivo:** Cerrar exactamente base depreciable.
- **Scope:** Policy Engine/Journal
- **Actor:** Backend
- **Precondiciones:** CurrencyPolicy activa.
- **Inputs:** Raw charge, base remaining, residual.
- **Reglas:** No float; final charge = base remaining cuando completa segmento.
- **Permisos:** Interno.
- **Estados:** N/A.
- **Resultado:** Cargo monetario posted.
- **Eventos:** N/A.
- **Evidencia:** Explanation y golden dataset.
- **Errores:** Residual mayor que carrying amount; currency rule faltante.
- **Auditoría:** Policy snapshot.
- **Dependencias:** CurrencyPolicy.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** Valor final = residual y suma cargos = base.
- **Casos de prueba:** GD-DEP-017/018.
- **Fuente:** SRC-005.

## DEP-006 — Workflow de corrida

- **ID:** DEP-006
- **Nombre:** Workflow de corrida
- **Descripción:** Gestionar Draft, Simulated, Submitted, Reviewed, Approved, Posted y Reversed.
- **Objetivo:** Separar cálculo, revisión y contabilización.
- **Scope:** Book/Period
- **Actor:** Contabilidad y aprobador
- **Precondiciones:** Período habilitado.
- **Inputs:** Run request, policy snapshot, approvals.
- **Reglas:** Simulation no cambia saldos; posting step-up; posted inmutable.
- **Permisos:** depreciation.* por transición.
- **Estados:** Definidos en sección 25.
- **Resultado:** Run y eventual JournalBatch.
- **Eventos:** RunSimulated/Approved/Posted/Reversed.
- **Evidencia:** Approvals, snapshot, batch.
- **Errores:** Período cerrado; conflicto; cuentas faltantes.
- **Auditoría:** Cada transición.
- **Dependencias:** Workflow, ACC-002, SEC-003.
- **NFR relacionados:** NFR-CONC-001.
- **Criterios de aceptación:** Misma idempotency key no duplica run/posting.
- **Casos de prueba:** Run E2E/concurrency.
- **Fuente:** SRC-002.

## DEP-007 — Cambio de estimación prospectivo

- **ID:** DEP-007
- **Nombre:** Cambio de estimación prospectivo
- **Descripción:** Crear nuevo EstimateSegment desde fecha efectiva sin reescribir períodos posted.
- **Objetivo:** Preservar historia y recalcular futuro.
- **Scope:** AccountingAsset/Book
- **Actor:** Contabilidad/aprobador
- **Precondiciones:** Evaluación y evidencia.
- **Inputs:** New life/residual/method/base, effective date.
- **Reglas:** Prospectivo; correction of error usa workflow distinto.
- **Permisos:** accounting.estimates.change/approve.
- **Estados:** Draft→Approved→Effective.
- **Resultado:** Segmento nuevo y schedule futuro.
- **Eventos:** EstimateChanged.
- **Evidencia:** Reason, calculation, approval.
- **Errores:** Fecha en período cerrado sin corrección; valor inválido.
- **Auditoría:** Antes/después.
- **Dependencias:** POL-001, ACC-002.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** Cargos anteriores permanecen y futuros usan nueva base/vida.
- **Casos de prueba:** GD-DEP-012/013.
- **Fuente:** SRC-013.

## IMP-001 — Evaluación y reconocimiento de deterioro

- **ID:** IMP-001
- **Nombre:** Evaluación y reconocimiento de deterioro
- **Descripción:** Registrar indicio, medir importe recuperable/potencial de servicio, aprobar y reconocer.
- **Objetivo:** Evitar ajustes libres de valor.
- **Scope:** AccountingBook
- **Actor:** Técnico, Contabilidad y aprobador
- **Precondiciones:** AccountingAsset reconocido.
- **Inputs:** Indicator, evidence, carrying amount, measurement and assumptions.
- **Reglas:** Condición física sólo es indicio; vida útil y deterioro separados; política define reversión.
- **Permisos:** impairment.create/review/approve/post.
- **Estados:** Indicator→Assessment→Measurement→Approved→Recognized→Review.
- **Resultado:** Impairment event, journal y nuevo estimate segment.
- **Eventos:** ImpairmentRecognized/Reversed.
- **Evidencia:** Assessment y approvals.
- **Errores:** Medición incompleta; período cerrado; policy incompatible.
- **Auditoría:** Todos los supuestos y actores.
- **Dependencias:** Policy, Workflow, Accounting.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** No se puede ingresar sólo un monto sin evaluación requerida.
- **Casos de prueba:** GD-IMP-001/002/003.
- **Fuente:** SRC-002, SRC-012.

## CMP-001 — Componentes y erogaciones posteriores

- **ID:** CMP-001
- **Nombre:** Componentes y erogaciones posteriores
- **Descripción:** Separar gasto, mejora, reemplazo, inspección, cambio de estimación y revaluación.
- **Objetivo:** Aplicar efecto contable correcto a resultados técnicos.
- **Scope:** AccountingBook/Asset
- **Actor:** Mantenimiento, Patrimonio, Contabilidad
- **Precondiciones:** Activo/componente reconocido y resultado técnico.
- **Inputs:** Expenditure, technical result, replaced part, dates, evidence.
- **Reglas:** Técnico no capitaliza; reemplazo da de baja componente anterior; revaluation es workflow separado.
- **Permisos:** maintenance.complete, accounting.expenditure.assess/approve.
- **Estados:** TechnicalResult→Assessment→Decision→Posted.
- **Resultado:** Expense, capitalization, component or estimate event.
- **Eventos:** SubsequentExpenditureDecided, ComponentReplaced.
- **Evidencia:** OT, factura, informe, approval.
- **Errores:** Costo no asignable; componente inexistente.
- **Auditoría:** Decisión y efecto.
- **Dependencias:** Maintenance, Accounting.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** Reparación menor no aparece como revaluación.
- **Casos de prueba:** GD-CMP-001/002/003.
- **Fuente:** SRC-002, SRC-011.

## DSP-001 — Baja y derecognition

- **ID:** DSP-001
- **Nombre:** Baja y derecognition
- **Descripción:** Gestionar solicitud, revisión, aprobación, ejecución y posting de baja.
- **Objetivo:** Cerrar ciclo físico y contable sin eliminar historia.
- **Scope:** Tenant/Book
- **Actor:** Patrimonio, técnico, Contabilidad, aprobador
- **Precondiciones:** Activo vigente.
- **Inputs:** Type, reason, effective date, evidence, proceeds/costs.
- **Reglas:** Valor libro y resultado calculados; item permanece consultable; step-up al aprobar.
- **Permisos:** disposals.create/review/approve/post.
- **Estados:** Draft→Submitted→Reviewed→Approved→Executed→Posted.
- **Resultado:** Estados cerrados, event y journal.
- **Eventos:** DisposalApproved/Executed/Posted.
- **Evidencia:** Acto, informe, comprobante.
- **Errores:** Activo en préstamo/movimiento; evidencia obligatoria faltante.
- **Auditoría:** Cada transición.
- **Dependencias:** Workflow, Accounting, Documents.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** Baja posted no puede borrarse ni reactivar activo sin proceso reversor.
- **Casos de prueba:** Golden disposal.
- **Fuente:** SRC-002, SRC-003.

## MNT-001 — Bridge mantenimiento-contabilidad

- **ID:** MNT-001
- **Nombre:** Bridge mantenimiento-contabilidad
- **Descripción:** Transformar resultado técnico en evaluación contable sin otorgar decisión financiera al técnico.
- **Objetivo:** Relacionar mantenimiento con componentes, vida, deterioro y baja.
- **Scope:** Maintenance/Accounting
- **Actor:** Técnico y Contabilidad
- **Precondiciones:** OT finalizada o resultado técnico.
- **Inputs:** Work performed, resources, cost, condition, recommendation.
- **Reglas:** Mapear a gasto/capitalización/cambio/impairment/disposal candidate; approval separada.
- **Permisos:** maintenance.complete; accounting.expenditure.assess.
- **Estados:** OT Completed→AccountingAssessment optional.
- **Resultado:** No effect o accounting workflow.
- **Eventos:** MaintenanceResultRecorded, AccountingAssessmentRequested.
- **Evidencia:** OT/protocolo/fotos/facturas.
- **Errores:** OT incompleta; costo inconsistente.
- **Auditoría:** Técnico y decisión contable.
- **Dependencias:** Maintenance, CMP-001.
- **NFR relacionados:** NFR-DATA-001.
- **Criterios de aceptación:** Finalizar OT no cambia automáticamente costo o vida.
- **Casos de prueba:** Maintenance integration.
- **Fuente:** SRC-002, SRC-003.

## DOC-001 — Evidencia segregada, versionada y retenida

- **ID:** DOC-001
- **Nombre:** Evidencia segregada, versionada y retenida
- **Descripción:** Administrar documentos por tenant con checksum, clasificación, versiones, autorización y lifecycle.
- **Objetivo:** Proteger evidencia y evitar borrado silencioso.
- **Scope:** Tenant
- **Actor:** Usuarios autorizados y jobs
- **Precondiciones:** TenantContext y entidad fuente.
- **Inputs:** File, metadata, classification.
- **Reglas:** Container segregado; scan; URL temporal; logical delete; hold/retention.
- **Permisos:** documents.upload/read/delete según clase.
- **Estados:** Uploaded→Validating→Available/Quarantined→Superseded/Retained.
- **Resultado:** EvidenceDocument vinculado.
- **Eventos:** DocumentUploaded/Validated/Downloaded/DeletedLogically.
- **Evidencia:** Checksum y audit.
- **Errores:** Tipo inválido; malware; size; scope.
- **Auditoría:** Upload/download/delete.
- **Dependencias:** Blob, malware scanning, Key Vault.
- **NFR relacionados:** NFR-PRIV-001, NFR-PORT-001.
- **Criterios de aceptación:** Documento de otro tenant o período bloqueado no se elimina/descarga.
- **Casos de prueba:** MT-006, document security.
- **Fuente:** SRC-002, SRC-003.

## AUD-001 — Auditoría inmutable tenant/plataforma

- **ID:** AUD-001
- **Nombre:** Auditoría inmutable tenant/plataforma
- **Descripción:** Registrar eventos separados para acciones del cliente y operadores SaaS.
- **Objetivo:** Responder quién, qué, cuándo, regla, evidencia y aprobación.
- **Scope:** Platform y Tenant
- **Actor:** Sistema
- **Precondiciones:** Operación auditable.
- **Inputs:** Actor, context, action, before/after, correlation, policy.
- **Reglas:** Append-only; corrección por evento; no secretos.
- **Permisos:** audit.read/export por scope.
- **Estados:** N/A.
- **Resultado:** TenantAuditEvent o PlatformAuditEvent.
- **Eventos:** Es el propio registro.
- **Evidencia:** Event store/log protegido.
- **Errores:** Fallo de auditoría bloquea operación crítica según clasificación.
- **Auditoría:** Auto-referencial con health.
- **Dependencias:** TenantContext, observability.
- **NFR relacionados:** NFR-OBS-001.
- **Criterios de aceptación:** Operación crítica sin evento no puede completar.
- **Casos de prueba:** Audit completeness, MT-015.
- **Fuente:** SRC-002, SRC-003.

## INT-001 — Integraciones aisladas por tenant

- **ID:** INT-001
- **Nombre:** Integraciones aisladas por tenant
- **Descripción:** Configurar credenciales, mappings y ejecuciones por tenant y scope.
- **Objetivo:** Evitar compartir secretos o datos entre clientes.
- **Scope:** TenantIntegration
- **Actor:** Integration admin y workers
- **Precondiciones:** Feature y configuración activas.
- **Inputs:** Credential reference, mapping, payload.
- **Reglas:** Secreto fuera de DB cuando corresponda; idempotencia; audit; retries.
- **Permisos:** integrations.manage/execute.
- **Estados:** Disabled→Configured→Validated→Active→Error/Suspended.
- **Resultado:** Execution trazable y respuesta asociada.
- **Eventos:** IntegrationExecutionStarted/Completed/Failed.
- **Evidencia:** Request metadata, response hash, external ID.
- **Errores:** Credential, timeout, mapping, duplicate.
- **Auditoría:** Config changes y ejecución.
- **Dependencias:** Key Vault, Jobs.
- **NFR relacionados:** NFR-INT-001.
- **Criterios de aceptación:** Credencial de A nunca puede usarse en ejecución B.
- **Casos de prueba:** Contract y MT isolation.
- **Fuente:** SRC-002.

## API-001 — Contrato común de APIs

- **ID:** API-001
- **Nombre:** Contrato común de APIs
- **Descripción:** Aplicar versionado, scopes, permisos, validación, idempotencia, concurrencia, errores y auditoría.
- **Objetivo:** Interfaces implementables y consistentes.
- **Scope:** Control y Data Plane APIs
- **Actor:** Frontend, integrations, operators
- **Precondiciones:** Contexto según endpoint.
- **Inputs:** Según schema publicado.
- **Reglas:** No endpoint cross-tenant en Data Plane; Problem Details; ETag/idempotency.
- **Permisos:** Declarado por endpoint.
- **Estados:** Según recurso.
- **Resultado:** Respuesta versionada.
- **Eventos:** Según comando.
- **Evidencia:** OpenAPI y contract tests.
- **Errores:** Códigos estables sin stack.
- **Auditoría:** Declarada en contrato.
- **Dependencias:** Application layer.
- **NFR relacionados:** NFR-INT-001.
- **Criterios de aceptación:** Cada endpoint crítico contiene todos los campos de contrato requeridos.
- **Casos de prueba:** Contract/API.
- **Fuente:** SRC-002.

## JOB-001 — Jobs con contexto explícito

- **ID:** JOB-001
- **Nombre:** Jobs con contexto explícito
- **Descripción:** Todo job y mensaje incluye TenantId, CorrelationId y OperationId y valida recursos antes de ejecutar.
- **Objetivo:** Evitar mezcla de tenants en procesos asíncronos.
- **Scope:** Workers/messaging
- **Actor:** System
- **Precondiciones:** Mensaje válido.
- **Inputs:** Envelope versionado.
- **Reglas:** Idempotencia; DLQ; retries; no consultas globales de negocio multi-tenant.
- **Permisos:** Service identity y operación autorizada.
- **Estados:** Queued→Processing→Completed/Failed/DeadLetter.
- **Resultado:** Operación aislada y observable.
- **Eventos:** JobStarted/Completed/Failed.
- **Evidencia:** Telemetry y message metadata.
- **Errores:** Tenant mismatch; schema unknown; poison.
- **Auditoría:** Operaciones críticas.
- **Dependencias:** Tenant Catalog, Service Bus.
- **NFR relacionados:** NFR-OBS-001.
- **Criterios de aceptación:** Jobs A/B concurrentes no abren DB incorrecta.
- **Casos de prueba:** MT-007.
- **Fuente:** SRC-002.

## OBS-001 — Observabilidad por tenant y stamp

- **ID:** OBS-001
- **Nombre:** Observabilidad por tenant y stamp
- **Descripción:** Registrar métricas, trazas y logs con dimensiones operativas sin exponer datos sensibles.
- **Objetivo:** Diagnosticar disponibilidad, rendimiento, consumo y fallos.
- **Scope:** Platform
- **Actor:** System/Operations
- **Precondiciones:** Aplicación desplegada.
- **Inputs:** Telemetry context.
- **Reglas:** Correlation end-to-end; redaction; separación audit/diagnostic.
- **Permisos:** platform.observability.read.
- **Estados:** N/A.
- **Resultado:** Dashboards y alertas.
- **Eventos:** Operational alerts.
- **Evidencia:** Application Insights/Monitor queries.
- **Errores:** Telemetry drop detectado.
- **Auditoría:** Acceso a logs restringido.
- **Dependencias:** Azure Monitor stack.
- **NFR relacionados:** NFR-OBS-001.
- **Criterios de aceptación:** Una operación se sigue desde frontend a job/integración por CorrelationId.
- **Casos de prueba:** Observability smoke.
- **Fuente:** SRC-002.

## NFR-A11Y-001 — WCAG 2.2 AA

- **ID:** NFR-A11Y-001
- **Nombre:** WCAG 2.2 AA
- **Descripción:** Diseñar y verificar la experiencia conforme al objetivo WCAG 2.2 AA.
- **Objetivo:** Uso accesible en desktop y terreno.
- **Scope:** Frontend y documentos interactivos
- **Actor:** Todos los usuarios
- **Precondiciones:** Componentes implementados.
- **Inputs:** UI y contenido.
- **Reglas:** Keyboard, focus, labels, contraste, errores, touch, no color-only.
- **Permisos:** N/A.
- **Estados:** N/A.
- **Resultado:** Experiencia accesible.
- **Eventos:** N/A.
- **Evidencia:** Automated/manual audit.
- **Errores:** Defectos bloquean release según severidad.
- **Auditoría:** Reporte QA.
- **Dependencias:** Design System/Branding.
- **NFR relacionados:** NFR-A11Y-001.
- **Criterios de aceptación:** Flujos UX-001 a 005 superan auditoría acordada.
- **Casos de prueba:** Axe/manual/screen reader.
- **Fuente:** SRC-002, SRC-016.

## NFR-PORT-001 — Portabilidad y restore por tenant

- **ID:** NFR-PORT-001
- **Nombre:** Portabilidad y restore por tenant
- **Descripción:** Exportar y restaurar DB, documentos, configuración, políticas, auditoría y metadata de integración de un tenant.
- **Objetivo:** Soportar recuperación, migración y término contractual.
- **Scope:** Control Plane/Operations
- **Actor:** Operador autorizado
- **Precondiciones:** Solicitud aprobada.
- **Inputs:** TenantId, restore point/export scope.
- **Reglas:** No incluir secretos en export; checksum; target aislado; rebind controlado.
- **Permisos:** platform.tenants.export/restore.
- **Estados:** Requested→Prepared→Validated→Delivered/Activated.
- **Resultado:** Paquete o tenant restaurado verificable.
- **Eventos:** TenantExported/Restored/Migrated.
- **Evidencia:** Manifest y checksums.
- **Errores:** Backup faltante; versión incompatible; validación fallida.
- **Auditoría:** Operador, razón y resultado.
- **Dependencias:** DB/Blob backup, IaC.
- **NFR relacionados:** NFR-DR-001/002, NFR-PORT-001.
- **Criterios de aceptación:** Restore de A no modifica B y export concilia conteos/hashes.
- **Casos de prueba:** MT-010, DR/Migration.
- **Fuente:** SRC-002.

## DEV-001 — Evolución de esquema por tenant

- **ID:** DEV-001
- **Nombre:** Evolución de esquema por tenant
- **Descripción:** Gestionar versiones y rollout de schema en bases por tenant de forma observable y reintentable.
- **Objetivo:** Evitar drift y fallas masivas.
- **Scope:** DevOps/Data
- **Actor:** Pipeline/DB migrator
- **Precondiciones:** Release aprobado.
- **Inputs:** Migration version, target stamp/tenants.
- **Reglas:** Preflight; batches; status por tenant; compatible rollback/forward fix.
- **Permisos:** Service identity.
- **Estados:** Pending→Applying→Succeeded/Failed/RolledForward.
- **Resultado:** SchemaVersion actualizado.
- **Eventos:** TenantSchemaUpgradeStarted/Completed/Failed.
- **Evidencia:** Migration logs y catalog version.
- **Errores:** Lock, incompatibilidad, timeout.
- **Auditoría:** Release, actor y tenants.
- **Dependencias:** Tenant Catalog, CI/CD.
- **NFR relacionados:** NFR-MAINT-001.
- **Criterios de aceptación:** Se conoce versión de cada tenant y fallo no deja estado desconocido.
- **Casos de prueba:** Migration/retry/rollback.
- **Fuente:** SRC-002.

---

# Apéndice B. Matriz inicial de roles y permisos

| Acción | Inventariador | Patrimonio | Adquisiciones | Contabilidad | Aprobador | Custodio | Mantenimiento | Auditor | Tenant Admin | Platform Admin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Leer activos | S | S | S | S | S | Limitado | S | S | S | No por defecto |
| Crear/editar bien físico | No | S | Desde adquisición | No | No | No | Limitado | No | Config | No |
| Registrar observación inventario | S | S | No | No | No | No | No | Lectura | Config | No |
| Conciliar inventario | No | S | No | No | Aprobar excepción | No | No | Lectura | Config | No |
| Crear traslado | No | S | No | No | Aprobar según workflow | Solicitar/recibir | No | Lectura | Config | No |
| Registrar recepción | No | Lectura | S | No | No | No | No | Lectura | Config | No |
| Capitalizar | No | No | No | Preparar | Aprobar | No | No | Lectura | Config sin ejecutar | No |
| Simular depreciación | No | No | No | S | Lectura | No | No | Lectura | Config | No |
| Aprobar/postear depreciación | No | No | No | Preparar | S | No | No | Lectura | No | No |
| Reabrir período | No | No | No | Solicitar | S + step-up | No | No | Lectura | No | No |
| Aprobar deterioro/baja | No | Preparar | No | Revisar | S + step-up | No | Técnico | Lectura | No | No |
| Gestionar usuarios/roles | No | No | No | No | No | No | No | Lectura | S + step-up | Platform roles only |
| Provisionar tenant | No | No | No | No | No | No | No | No | No | S |
| Exportar auditoría | No | No | No | Limitado | Limitado | No | No | S autorizado | S | Platform audit only |

La matriz es baseline conceptual. Cada permiso se implementará con scope y vigencia; `S` no elimina condiciones de workflow, feature o step-up.

# Apéndice C. Catálogo inicial de códigos de error

| Código | HTTP | Mensaje de usuario |
|---|---:|---|
| `TEN-CONTEXT-INVALID` | 401/403 | No se pudo establecer un contexto de tenant válido. |
| `TEN-SUSPENDED` | 403 | El tenant se encuentra suspendido. |
| `SEC-STEPUP-REQUIRED` | 401 | La operación requiere autenticación reforzada. |
| `SEC-PERMISSION-DENIED` | 403 | El usuario no tiene permiso para la acción. |
| `AST-CONCURRENCY-CONFLICT` | 409 | El activo cambió desde que fue cargado. |
| `INV-SCOPE-OVERLAP` | 409 | El alcance se superpone con otra campaña activa. |
| `INV-OBSERVATION-CONFLICT` | 409 | La observación requiere revisión antes de sincronizar. |
| `ACC-PERIOD-CLOSED` | 409 | El período está cerrado. |
| `ACC-JOURNAL-UNBALANCED` | 422 | El asiento no cuadra. |
| `POL-NO-EFFECTIVE-RULE` | 422 | No existe una regla vigente para el cálculo. |
| `DEP-MISSING-AVAILABLE-DATE` | 422 | Falta la fecha disponible para uso. |
| `DEP-DUPLICATE-PERIOD` | 409 | Ya existe una línea posted para el período. |
| `DEP-BASE-INVARIANT` | 422 | La base o residual no cumple invariantes. |
| `DEP-POLICY-SNAPSHOT-MISMATCH` | 409 | La política cambió desde la simulación. |
| `DOC-MALWARE-DETECTED` | 422 | El archivo fue puesto en cuarentena. |
| `DOC-CROSS-TENANT` | 404 | El documento no está disponible. |
| `INT-TIMEOUT-UNKNOWN-STATUS` | 202/409 | La integración no confirmó el resultado; requiere consulta. |
| `IMP-MEASUREMENT-INCOMPLETE` | 422 | La medición de deterioro está incompleta. |

# Apéndice D. Matriz de trazabilidad de alto nivel

| Fuente | Decisiones/Requisitos derivados | Pantallas/Procesos | Pruebas |
|---|---|---|---|
| SRC-002 | SAAS-001..003, TEN-001..002, SEC-001..004, BRD-001, SUB-001 | TrazActivo Control, Tenant Selector, Configuration | MT-001..015 |
| SRC-003 | AST-002, ACQ-001, INV-001..003, MOV-001, MNT-001 | Ficha 360, inventario, adquisiciones, mantenimiento | E2E operacionales |
| SRC-005/SRC-006 | DEP-002..005 | Cockpit de depreciación | GD-DEP-001..018 |
| SRC-007 | BRD-001, NFR-A11Y-001 | Design System, Branding | Visual/A11Y |
| SRC-008..010 | ACC-001, POL-001, REC-001, DEP policies | Contabilidad y políticas | Golden dataset NICSP |
| SRC-011..014 | ACC-001, IMP-001, CMP-001, DEP-007 | Libros IFRS y contabilidad avanzada | Golden dataset IFRS |
| SRC-015 | SEC-002 | Seguridad de cuenta | TOTP/replay |
| SRC-016 | NFR-A11Y-001 | Todos los flujos | A11Y audit |
| SRC-017 | Arquitectura sección 05 y DR | N/A | Infra/DR validation |

# Apéndice E. Definition of Done por módulo

Un módulo se considera terminado sólo cuando:

- modelo de dominio y estados aprobados;
- requisitos con ID y trazabilidad;
- APIs documentadas y contract tests;
- permisos, scopes y eventos de auditoría;
- errores de usuario y técnicos;
- migraciones versionadas;
- unit, integration, security y E2E según riesgo;
- casos multi-tenant aplicables;
- accesibilidad verificada;
- observabilidad y runbook;
- documentación de operación;
- sin TBD P0 del módulo.

# Cierre de la baseline

Este PDD define la arquitectura y comportamiento objetivo de TrazActivo. La siguiente actividad es resolver los TBD P0, aprobar el golden dataset y convertir cada bounded context en un Markdown implementable con entidades, contratos, eventos, pruebas y Definition of Done. Ningún agente de desarrollo debe completar decisiones contables, de aislamiento o de seguridad mediante supuestos silenciosos.
