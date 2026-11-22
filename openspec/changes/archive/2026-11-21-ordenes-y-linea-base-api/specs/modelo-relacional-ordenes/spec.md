## ADDED Requirements

### Requirement: Migración 002 aditiva para plano y materiales

El sistema DEBE (SHALL) incorporar una migración 002 posterior e independiente que agregue a `ordenes_trabajo` la columna `codigo_plano VARCHAR(80) NULL`, el `CHECK (codigo_plano <> '')` y el índice único parcial `WHERE codigo_plano IS NOT NULL`, y que cree la tabla `materiales_orden` con su FK a `ordenes_trabajo` y sus índices. La migración 001 NO DEBE (SHALL NOT) modificarse ni renumerarse; los derivados NO DEBEN persistirse como columnas (DD-11, DD-05, R3).

#### Scenario: Orden de migraciones

- **WHEN** se aplican las migraciones desde cero sobre PostgreSQL 18.7 real
- **THEN** la 001 crea únicamente `configuracion`, `clientes`, `ordenes_trabajo` y `etapas_orden`, y la 002 agrega el plano y los materiales

#### Scenario: Unicidad condicional del plano

- **WHEN** dos OPs tienen el mismo `codigo_plano` no nulo
- **THEN** PostgreSQL rechaza la segunda por el índice parcial; cuando ambas tienen `NULL`, ambas se aceptan

#### Scenario: Materiales sin agregados redundantes

- **WHEN** se inspecciona `ordenes_trabajo` después de la migración 002
- **THEN** no contiene `porcentaje_avance`, `costo_materiales_cotizado` ni `costo_materiales_real`; esos valores se derivan en dominio (DD-03, DD-05)

#### Scenario: Integridad comprobada en la base real

- **WHEN** se ejecutan los tests de integración de esta capability
- **THEN** usan `crearContenedorPostgres()` con la imagen `postgres:18.7` y no sustituyen la base por mocks (R10)
