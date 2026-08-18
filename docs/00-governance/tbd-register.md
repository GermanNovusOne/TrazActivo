# Registro de TBD v1.1

Un TBD no se cierra con una inferencia del agente. Requiere decisión, responsable y evidencia.

| ID | Decisión pendiente | Impacto | Responsable | Bloquea |
|---|---|---|---|---|
| TBD-PROD-001 | Alcance final del MVP comercial | Backlog y costo | Product Owner | Fase funcional completa |
| TBD-DEV-001 | Versión mayor de Node.js | Reproducibilidad | Eduardo/Arquitectura | Primer install y CI |
| TBD-DEV-002 | App Service o Container Apps | Hosting, pipeline y costo | DevOps/Arquitectura | Azure DEV |
| TBD-DEV-003 | Bicep o estándar IaC alternativo | Operación | DevOps | IaC productivo |
| TBD-DATA-001 | Azure SQL final y estrategia de elastic pool | Costo y capacidad | Arquitectura/Data | Producción |
| TBD-DATA-002 | Límite de conexiones Prisma por instancia/stamp | Saturación | Backend/Data | Prueba de carga |
| TBD-SEC-001 | Modo de identidad inicial: Entra, local o ambos | Onboarding | Seguridad/Producto | Login piloto |
| TBD-SEC-002 | Política MFA y step-up | Riesgo y UX | Seguridad | Operaciones críticas |
| TBD-ACC-001 | IFRS Full, IFRS PYMES o ambas | Policy Engine | Contabilidad | Backlog IFRS |
| TBD-ACC-002 | Fuente formal política 30 días | Validez | Contabilidad | Publicar política |
| TBD-ACC-003 | Golden dataset aprobado | Cálculo | Contabilidad | Posting depreciación |
| TBD-ACC-004 | Perfil CGR 2027 | Reglas futuras | Especialista | Política 2027 |
| TBD-ERP-001 | Primer ERP | Contrato de integración | Producto/Cliente | Epic integración |
| TBD-NFR-001 | SLA | Arquitectura comercial | Comercial/Ops | Producción |
| TBD-NFR-002 | RPO/RTO | Backup/DR | Comercial/Ops | Producción |
| TBD-NFR-003 | Volumen de clientes, activos y transacciones | Sizing | Producto | Load tests |
| TBD-PRIV-001 | Retención y borrado | Evidencia/storage | Legal/Producto | Producción documentos |
| TBD-INV-001 | Datos y tiempo offline | Seguridad/PWA | Producto/Seguridad | Offline |

## Formato de cierre

```text
TBD:
Decisión:
Fecha:
Responsable:
Evidencia:
ADR/Requisito actualizado:
Impacto en backlog:
```
