# Baseline de seguridad

## Identidad

Modos declarados por tenant: cuenta local, TOTP/recovery codes, Microsoft Entra
ID OIDC y External ID; SAML es evolución. La combinación habilitada y política
MFA no se asumen durante Sprint 0.

## Autorización

```text
membership activa
AND tenant activo
AND módulo contratado
AND feature habilitada
AND rol asignado
AND permiso concedido
AND scope válido
AND estado de negocio permitido
```

La aprobación y el step-up se evalúan además de esta expresión.

## Datos y secretos

- TLS obligatorio y WAF en entrada pública.
- Managed Identity cuando sea viable.
- Secretos en Key Vault/referencias, nunca en repositorio, contexto o logs.
- DB y Blob no se exponen directamente al usuario final.
- Producción no comparte datos, redes ni secretos con no-producción.
- Reutilización de datos productivos exige sanitización aprobada.

## Operaciones privilegiadas

Posting/reversión, deterioro/baja, reapertura, publicación de política, cambios
de seguridad/MFA y export restringido requieren step-up según la política que
cierre `TBD-SEC-003`. Acceso SaaS excepcional es nominativo, temporal y auditado.

Fuente: PDD secciones 05.4/05.6, 08 y 09.
