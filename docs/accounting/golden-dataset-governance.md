# Gobernanza del Golden Dataset

- Estado: BLOCKED pendiente de aprobación contable
- Gate afectado: G3

## Metadata obligatoria por caso

ID/versión, fuente, inputs completos, libro, policy version, eventos previos,
resultado esperado, asiento, explicación, tolerancia si existe, aprobación
contable y checksum.

## Inventario requerido

- Reconocimiento: GD-REC-001..005.
- Depreciación: GD-DEP-001..018.
- Deterioro: GD-IMP-001..003.
- Componentes: GD-CMP-001..003.
- Inventario: GD-INV-001..003.
- Migración: GD-MIG-001..003.

## Estado especial GD-DEP-001..003

Los tres ejercicios y sus cargos corregidos están descritos en el PDD, pero no
se consideran aprobados mientras `TBD-ACC-003` permanezca abierto. No se copian
a archivos ejecutables ni se usan como oracle de posting antes de la aprobación.

## Política de cambios

Un caso aprobado es inmutable. Una corrección crea nueva versión, conserva la
anterior y registra motivo/aprobador. El pipeline ejecuta el dataset completo y
exige diferencia monetaria cero frente a los resultados aprobados.

Fuente: PDD secciones 25.10, 41, 42 y NFR-DATA-001.
