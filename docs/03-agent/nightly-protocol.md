# Protocolo nocturno del agente

## Objetivo

Producir cambios pequeños y revisables mientras Germán no está disponible, sin permitir que el agente decida la dirección del producto.

## Cola

El agente sólo toma Work Packages con:

```text
status: READY
agent:ready
sin dependencias bloqueadas
sin TBD P0 aplicable
```

## Límites

- máximo tres Work Packages por ejecución;
- una branch y un Draft PR por WP;
- no mezclar WPs;
- no merge;
- no producción;
- no modificar PDD o ADR Accepted;
- no resolver TBD;
- no degradar tests.

## Ciclo

```text
Seleccionar WP
→ leer contexto
→ crear branch
→ implementar
→ ejecutar pruebas
→ corregir dentro del scope
→ generar reporte
→ push
→ Draft PR
→ siguiente WP sólo si el anterior quedó consistente
```

## Detención

Si una WP falla por decisión humana, marcar `BLOCKED`, registrar pregunta y continuar sólo con otra WP independiente.

## Reporte de mañana

```text
Fecha
WP ejecutadas
PR creadas
Resultados de pruebas
Bloqueos
Riesgos
Cambios de dependencias
Migraciones
Siguiente acción humana
```
