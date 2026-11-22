## ADDED Requirements

### Requirement: Tabla `materiales_orden` creada de forma aditiva

La migración 002 DEBE (SHALL) crear `materiales_orden` con `id UUID`, `orden_id UUID NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE`, `tipo ENUM('MP','INSUMOS','TERCERIZADOS')`, `descripcion TEXT`, `cantidad NUMERIC(12,4) > 0`, `unidad VARCHAR(20)`, `costo_unitario_cotizado NUMERIC(14,2) >= 0`, `costo_unitario_real NUMERIC(14,2) NULL`, `nro_remito`, `nro_factura`, `nt` y `po` VARCHAR(50), e índices en `(orden_id, tipo)`, `(nro_factura)`, `(nt)` y `(po)`. NO DEBE (SHALL NOT) guardarse el detalle en JSONB ni duplicar agregados en `ordenes_trabajo` (DD-05, RN-MARGEN-02/03, R3).

#### Scenario: Estructura de la tabla

- **WHEN** se inspecciona la migración 002 aplicada sobre PostgreSQL 18.7 real
- **THEN** `materiales_orden` existe con el ENUM de tres valores, la FK con `ON DELETE CASCADE` y los cuatro índices indicados

#### Scenario: Cantidad no positiva rechazada

- **WHEN** se intenta insertar un material con `cantidad = 0` o negativa
- **THEN** PostgreSQL rechaza la escritura por el CHECK

#### Scenario: Costo real negativo rechazado

- **WHEN** se intenta insertar un material con `costo_unitario_real = -1`
- **THEN** PostgreSQL rechaza la escritura, mientras que `NULL` se acepta

#### Scenario: Borrado en cascada

- **WHEN** se borra una OP con materiales
- **THEN** sus materiales se eliminan por CASCADE y los materiales de otras OPs permanecen

### Requirement: Alta de materiales por OP

El backend DEBE (SHALL) exponer `POST /api/ops/:id/materiales` con validación Zod de frontera: `tipo` restringido a los tres literales, `descripcion` no vacía, `cantidad > 0`, costos no negativos y longitudes máximas de los campos de trazabilidad. La ruta DEBE (SHALL) responder 404 si la OP no existe y 422 si el cuerpo es inválido, sin ejecutar reglas de negocio sobre datos inválidos (HU-02, RN-MARGEN-05, R9).

#### Scenario: Alta válida de material

- **WHEN** se envía un material `MP` con cantidad `2.5`, costo cotizado `100.00`, remito y factura
- **THEN** se persiste asociado a la OP y la respuesta devuelve el material con su `id`

#### Scenario: Tipo inválido

- **WHEN** se envía `tipo: 'OTROS'`
- **THEN** la respuesta es 422 con `error: 'validation_error'` y no se inserta nada

#### Scenario: OP inexistente

- **WHEN** se envía el material a una OP que no existe
- **THEN** la respuesta es 404 y la tabla de materiales queda sin cambios

#### Scenario: Campos opcionales ausentes

- **WHEN** se envía un material sin `nro_remito`, `nro_factura`, `nt`, `po` ni `costo_unitario_real`
- **THEN** se acepta y esos campos quedan en `NULL`

### Requirement: Alcance de escritura de materiales en C-06

El alcance de materiales de C-06 DEBE (SHALL) limitarse al alta, a la visualización en el detalle y a los agregados derivados. El backend NO DEBE (SHALL NOT) exponer `PUT`, `PATCH` ni `DELETE` de ítems de material: la corrección y la baja se difieren a un change posterior y C-07 no debe prometer edición (DU-2, R3).

#### Scenario: Sin edición ni baja de materiales

- **WHEN** se inspeccionan las rutas registradas después de C-06
- **THEN** solo existe `POST /api/ops/:id/materiales` junto al alta transaccional de OP; no hay `PUT`, `PATCH` ni `DELETE` sobre materiales

#### Scenario: Derivados disponibles sin edición

- **WHEN** se consulta el detalle de una OP con materiales cargados
- **THEN** los ítems y sus agregados se visualizan calculados en dominio, sin que exista una operación para modificarlos o borrarlos en este change

### Requirement: Materiales y agregados en el detalle de la OP

`GET /api/ops/:id` DEBE (SHALL) devolver los materiales reales de la OP en el campo `materiales`, sustituyendo el arreglo vacío provisional de C-04, con los agregados `costo_materiales_cotizado` y `costo_materiales_real` calculados por dominio. El campo `horas` DEBE (SHALL) permanecer como arreglo vacío tipado hasta C-08, documentado como pendiente de ese change (RN-MARGEN-02/03, R3).

#### Scenario: Detalle con materiales

- **WHEN** una OP tiene dos materiales cargados y se consulta su detalle
- **THEN** `materiales` contiene dos elementos y los agregados son la suma calculada, sin columnas leídas de la OP

#### Scenario: Detalle sin materiales

- **WHEN** una OP no tiene materiales y se consulta su detalle
- **THEN** `materiales` es un arreglo vacío y los agregados son cero, sin valores inventados

#### Scenario: Horas siguen pendientes de C-08

- **WHEN** se inspecciona el campo `horas` del detalle después de C-06
- **THEN** sigue siendo un arreglo vacío tipado y Swagger indica que se completará en C-08

#### Scenario: Derivados no se persisten

- **WHEN** se cargan o consultan materiales
- **THEN** no se escribe `costo_materiales_cotizado` ni `costo_materiales_real` en `ordenes_trabajo` (R3)
