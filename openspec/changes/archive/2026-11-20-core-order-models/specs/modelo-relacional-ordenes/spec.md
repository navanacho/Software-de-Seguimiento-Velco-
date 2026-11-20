## ADDED Requirements

### Requirement: Migración 001 con el modelo relacional core

El sistema DEBE (SHALL) disponer de una migración 001 que cree exactamente las tablas `configuracion`, `clientes`, `ordenes_trabajo` y `etapas_orden`, con los tipos y columnas definidos en `knowledge-base/04_modelo_de_datos.md`: `UUID` con `gen_random_uuid()`, `TIMESTAMPTZ`, `DATE`, `TEXT`, `JSONB` y `NUMERIC`, nunca `FLOAT` ni `DOUBLE PRECISION`.

#### Scenario: Columnas de la orden de trabajo

- **WHEN** se inspecciona `ordenes_trabajo`
- **THEN** contiene `numero_op`, `cliente_id`, `descripcion_pieza`, `fecha_ingreso`, `fecha_entrega`, `monto_vendido NUMERIC(14,2)`, `observaciones`, `created_at` y `updated_at`

#### Scenario: Sin tablas ni columnas fuera de alcance

- **WHEN** se inspecciona el resultado de la migración 001
- **THEN** no existen las tablas `usuarios`, `materiales_orden` ni `registros_horas`, y `ordenes_trabajo` no tiene `porcentaje_avance` ni agregados de materiales

#### Scenario: Etapas ordenadas por secuencia

- **WHEN** se inspecciona `etapas_orden`
- **THEN** contiene `orden_id`, `nombre`, `orden_secuencia`, `completada` y `horas_vendidas NUMERIC(8,2)`, con `completada` en `FALSE` por omisión

### Requirement: Integridad de unicidad y referencias en la base de datos

La base de datos DEBE (SHALL) rechazar `numero_op` duplicado, `clientes.nombre` duplicado y pares `(orden_id, orden_secuencia)` duplicados; DEBE (SHALL) defender `cliente_id` con `ON DELETE RESTRICT` y `orden_id` con `ON DELETE CASCADE`.

#### Scenario: Número de OP único

- **WHEN** se intenta insertar una OP cuyo `numero_op` ya existe
- **THEN** PostgreSQL rechaza la escritura por la restricción de unicidad (RN-OP-01)

#### Scenario: Cliente único

- **WHEN** se intenta crear un cliente con un `nombre` ya existente
- **THEN** PostgreSQL rechaza la escritura y se conserva la fila original (DD-06)

#### Scenario: Secuencia única por orden

- **WHEN** se intentan dos etapas de una misma OP con igual `orden_secuencia`
- **THEN** PostgreSQL rechaza la segunda escritura, aunque etapas de otras OPs puedan repetir esa secuencia

#### Scenario: Borrado de cliente con órdenes

- **WHEN** se intenta borrar un cliente que tiene OPs asociadas
- **THEN** PostgreSQL rechaza la operación por `RESTRICT`, mientras que un cliente sin OPs sí puede borrarse

#### Scenario: Borrado de orden con etapas

- **WHEN** se borra una orden de trabajo
- **THEN** sus filas de `etapas_orden` se eliminan por `CASCADE` y las etapas de otras órdenes permanecen intactas

### Requirement: Configuración singleton con valores iniciales

`configuracion` DEBE (SHALL) admitir una sola fila con `id = 1` y DEBE (SHALL) cargarse con `valor_hora_estandar = 0`, `dias_alerta_riesgo = 3`, `porcentaje_avance_riesgo = 80` y `etapas_default = ["Corte","Soldadura","Mecanizado","Pintura","Entrega"]`.

#### Scenario: Fila única

- **WHEN** se intenta insertar una segunda fila de configuración con `id = 1`
- **THEN** PostgreSQL rechaza la escritura (RN-CONFIG-03)

#### Scenario: Valores del seed

- **WHEN** se ejecuta el seed de C-02 sobre una base recién migrada
- **THEN** la fila `id = 1` contiene los cuatro valores indicados y no se crean clientes, OPs ni usuarios (RN-CONFIG-01)

### Requirement: Integridad comprobada contra PostgreSQL real

Los escenarios de integridad DEBEN (SHALL) ejecutarse contra PostgreSQL 18.7 real en contenedor mediante `@testcontainers/postgresql` 12.2.2; NO DEBEN (SHALL NOT) sustituir la base por mocks ni por SQLite.

#### Scenario: Contenedor fijado

- **WHEN** se ejecuta un test de integración de este change
- **THEN** se levanta la imagen `postgres:18.7` reutilizando `crearContenedorPostgres()` de la fundación

#### Scenario: Fallo producido por la base

- **WHEN** un test provoca un `numero_op` duplicado o un borrado de cliente con OPs
- **THEN** el error proviene de la restricción de PostgreSQL y no de una validación simulada en el código de aplicación (R10)
