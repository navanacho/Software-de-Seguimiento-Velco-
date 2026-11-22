## ADDED Requirements

### Requirement: Campo `codigoPlano` nullable en el modelo de Prisma

`backend/prisma/schema.prisma` DEBE (SHALL) declarar en `OrdenTrabajo` el campo `codigoPlano String? @db.VarChar(80)` mapeado a `codigo_plano`, y un modelo `MaterialOrden` con `id`, `ordenId`, `tipo` como enum Prisma de `MP`/`INSUMOS`/`TERCERIZADOS`, `descripcion`, `cantidad Decimal @db.Decimal(12,4)`, `unidad`, `costoUnitarioCotizado Decimal @db.Decimal(14,2)`, `costoUnitarioReal Decimal? @db.Decimal(14,2)`, `nroRemito`, `nroFactura`, `nt`, `po` y `@@map("materiales_orden")`. El campo `codigoPlano` NO DEBE (SHALL NOT) declararse `@unique`: la unicidad es parcial y vive en SQL. NO DEBEN (SHALL NOT) aparecer columnas de derivados ni un modelo `Usuario` (DD-11, R3, R5, R9).

#### Scenario: Campo nullable sin `@unique`

- **WHEN** se inspecciona el modelo `OrdenTrabajo`
- **THEN** `codigoPlano` es opcional, está mapeado a `codigo_plano` y no tiene `@unique`

#### Scenario: Modelo de materiales

- **WHEN** se inspecciona el modelo `MaterialOrden`
- **THEN** declara el enum de tres valores, el FK `ordenId` con `onDelete: Cascade` y los campos de remito, factura, NT y PO

#### Scenario: Decimales exactos

- **WHEN** se inspeccionan los campos numéricos de materiales y etapas
- **THEN** usan `Decimal` con `@db.Decimal(...)` y no aparece `Float` en el esquema (RN-MARGEN-05)

#### Scenario: Restricciones solo en SQL

- **WHEN** se buscan el CHECK de plano y el índice parcial en `schema.prisma`
- **THEN** no están declarados allí porque Prisma no los expresa; sí están en la migración 002 y se validan contra la base real (R10)

#### Scenario: Generación del cliente

- **WHEN** se ejecuta `prisma generate` con Prisma 7.10.1
- **THEN** el cliente expone `codigoPlano` y `materialOrden` sin errores y sin Prisma 8.0.0-rc.34
