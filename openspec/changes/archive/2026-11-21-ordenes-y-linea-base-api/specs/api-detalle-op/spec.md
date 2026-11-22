## ADDED Requirements

### Requirement: Detalle con plano y materiales reales a partir de C-06

A partir de C-06, `GET /api/ops/:id` DEBE (SHALL) devolver `codigoPlano: string | null` heredado de `TarjetaOrdenDTO` y `materiales` con los ítems reales de `materiales_orden`, reemplazando el arreglo vacío provisional que C-04 documentó como pendiente de este change. El campo `horas` DEBE (SHALL) permanecer como arreglo vacío tipado hasta C-08, sin datos inventados ni migración adelantada (DD-11, DD-05, R3).

#### Scenario: Detalle con plano y materiales

- **WHEN** se consulta el detalle de una OP con `codigo_plano = 'PL-2026-045'` y dos materiales
- **THEN** la respuesta incluye `codigoPlano: 'PL-2026-045'` y `materiales` con esos dos ítems, con descripción, tipo, cantidades y costos

#### Scenario: Detalle sin plano ni materiales

- **WHEN** se consulta el detalle de una OP sin plano y sin materiales
- **THEN** `codigoPlano` es `null`, `materiales` es un arreglo vacío y los agregados son cero, sin valores de ejemplo

#### Scenario: Horas siguen pendientes

- **WHEN** se consulta el detalle después de C-06
- **THEN** `horas` sigue siendo un arreglo vacío y la documentación Swagger indica que se completará en C-08

#### Scenario: Agregados derivados en el detalle

- **WHEN** se inspeccionan los costos del detalle
- **THEN** `costo_materiales_cotizado` y `costo_materiales_real` son calculados en dominio desde los materiales, no leídos de columnas de `ordenes_trabajo` (R3)

### Requirement: Contrato Zod del detalle actualizado

`DetalleOpSchema` DEBE (SHALL) derivar de `TarjetaOrdenSchema` con el nuevo campo `codigoPlano` y DEBE (SHALL) tipar `materiales` con el esquema del ítem de material en lugar de `z.array(z.never())`. El esquema de `horas` NO DEBE (SHALL NOT) cambiar en C-06 (R6, R9).

#### Scenario: Validación del cuerpo del detalle

- **WHEN** se valida una respuesta real de `GET /api/ops/:id` con materiales
- **THEN** el esquema Zod acepta los ítems y expone el JSON Schema correspondiente en Swagger

#### Scenario: Sin Excel en este change

- **WHEN** se inspeccionan los artefactos y adaptadores creados en C-06
- **THEN** no hay código de `exceljs`, ni mapeo `O7:R8`, ni etiquetas `ID Plano:` / `S/P`: ese trabajo pertenece a C-15 y depende de C-13/IN-08
