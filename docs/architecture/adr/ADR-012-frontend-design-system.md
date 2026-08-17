# ADR-012: Frontend Design System

- Estado: Accepted
- Fecha de baseline: 2026-08-17

## Decisión

Usar componentes comunes y providers de contexto, branding, features y
permisos. El framework frontend permanece sin seleccionar en el PDD.

## Consecuencias

- Visibilidad de UI no reemplaza autorización server-side.
- Branding usa tokens permitidos y pasa validación WCAG 2.2 AA.
- Cambio de tenant reinicia providers y estado local tenant-scoped.
- DataTable, estados, errores y workflows mantienen comportamiento consistente.

Fuente: PDD ADR-012, secciones 15, 16 y 40.
