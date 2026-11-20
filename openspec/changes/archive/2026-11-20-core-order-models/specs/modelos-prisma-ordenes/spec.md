## ADDED Requirements

### Requirement: Modelos Prisma para las cuatro entidades

`backend/prisma/schema.prisma` DEBE (SHALL) definir los modelos `Configuracion`, `Cliente`, `OrdenTrabajo` y `EtapaOrden`, mapeados a `configuracion`, `clientes`, `ordenes_trabajo` y `etapas_orden`, manteniendo `datasource` PostgreSQL y `generator` de Prisma 7.10.1.

#### Scenario: Modelos presentes

- **WHEN** se abre `backend/prisma/schema.prisma`
- **THEN** los cuatro modelos están declarados con `@@map` a sus tablas snake_case y no se usa Prisma 8.0.0-rc.34

#### Scenario: Generación del cliente

- **WHEN** se ejecuta `prisma generate` con el esquema de este change
- **THEN** el cliente de Prisma 7.10.1 expone los cuatro modelos sin errores de generación

### Requirement: Mapeo decimal y de JSON sin valores derivados

Los importes y horas DEBEN (SHALL) mapearse con `@db.Decimal(p,s)` y `etapas_default` DEBE (SHALL) mapearse como `Json` con un default equivalente al de la migración 001. El esquema NO DEBE (SHALL NOT) declarar columnas para avance, totales de horas, costos, margen, semáforo ni usuario.

#### Scenario: Tipos numéricos

- **WHEN** se inspeccionan los campos `monto_vendido`, `valor_hora_estandar` y `horas_vendidas`
- **THEN** usan `Decimal` con escala 2 y no aparece `Float` en el esquema (RN-MARGEN-05)

#### Scenario: Etapas por defecto

- **WHEN** se inspecciona el campo `etapas_default` del modelo `Configuracion`
- **THEN** está declarado como `Json` y su default coincide con la lista canónica de etapas de la migración

#### Scenario: Ausencia de derivados en el modelo

- **WHEN** se busca `porcentaje_avance`, `costo_materiales`, `margen` o `Usuario` en el esquema
- **THEN** no se encuentra ninguna declaración (R3, R5, DD-03)

### Requirement: Relaciones con semántica de borrado explícita

Las relaciones del esquema DEBEN (SHALL) declarar `onDelete: Restrict` entre `OrdenTrabajo` y `Cliente`, y `onDelete: Cascade` entre `EtapaOrden` y `OrdenTrabajo`, con nombres de restricción coherentes con la migración 001.

#### Scenario: Relación con cliente

- **WHEN** se inspecciona la relación `OrdenTrabajo.cliente`
- **THEN** declara `onDelete: Restrict` y el campo `cliente_id` es obligatorio

#### Scenario: Relación con etapas

- **WHEN** se inspecciona la relación `EtapaOrden.orden`
- **THEN** declara `onDelete: Cascade` y el campo `orden_id` es obligatorio
