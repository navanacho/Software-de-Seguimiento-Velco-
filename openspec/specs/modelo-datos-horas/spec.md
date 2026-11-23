# modelo-datos-horas Specification

## Purpose
TBD - created by archiving change horas-reales-api. Update Purpose after archive.
## Requirements
### Requirement: Migración 003 aditiva con la tabla de partes de horas

El sistema DEBE (SHALL) incorporar una migración 003 posterior e independiente que cree la tabla `registros_horas` con `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `orden_id UUID NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE`, `etapa_id UUID REFERENCES etapas_orden(id) ON DELETE SET NULL`, `operario VARCHAR(100) NOT NULL`, `fecha DATE NOT NULL DEFAULT CURRENT_DATE`, `horas NUMERIC(6,2) NOT NULL CHECK (horas > 0)`, `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` y `observacion TEXT NULL` (P-1), más los índices `(orden_id, fecha)`, `(etapa_id)` y `(operario)`. La migración 001 NO DEBE (SHALL NOT) modificarse ni renumerarse, la 002 se conserva intacta y NO DEBE (SHALL NOT) declararse `usuario_id` ni columna alguna de totales, desvíos, consumo, alerta, costos, margen ni avance (DD-07, R3, R5).

#### Scenario: Estructura de la tabla

- **WHEN** se inspecciona el resultado de aplicar la migración 003 sobre PostgreSQL 18.7 real
- **THEN** `registros_horas` contiene exactamente las columnas indicadas, `horas` es `NUMERIC(6,2)`, `operario` es `VARCHAR(100)` y `observacion` es `TEXT` nullable

#### Scenario: Observacion opcional en la tabla

- **WHEN** se inserta un parte sin `observacion` y otro con `observacion: 'Revisar tornillería'`
- **THEN** el primero almacena `NULL` y el segundo conserva el texto íntegro, sin restricciones adicionales (P-1)

#### Scenario: Índices de consulta

- **WHEN** se inspeccionan los índices de `registros_horas`
- **THEN** existen los índices compuesto `(orden_id, fecha)` y simples `(etapa_id)` y `(operario)`

#### Scenario: Sin identidad de usuario ni derivados

- **WHEN** se inspeccionan las migraciones 001, 002 y 003 y el esquema resultante
- **THEN** no existe `usuario_id`, ni tabla `usuarios`, ni columnas de totales de horas, desvío, consumo, alerta, costos, margen ni avance (R3, R5, DD-07)

#### Scenario: Orden de migraciones

- **WHEN** se aplican las migraciones desde cero
- **THEN** la 001 crea el modelo core, la 002 agrega plano y materiales y la 003 crea únicamente `registros_horas` y sus índices

### Requirement: Integridad referencial y validación en la base real

PostgreSQL DEBE (SHALL) rechazar horas no positivas mediante el `CHECK` y DEBE (SHALL) aplicar `CASCADE` al borrar la OP y `SET NULL` al borrar la etapa. Los escenarios DEBEN ejecutarse contra `postgres:18.7` en contenedor reutilizando `crearContenedorPostgres()`, sin mocks de PostgreSQL ni de `PrismaClient` (R10).

#### Scenario: Horas no positivas rechazadas por la base

- **WHEN** se intenta insertar un parte con `horas = 0` o `horas = -1`
- **THEN** PostgreSQL rechaza la escritura por `CHECK (horas > 0)` y no se persiste la fila (RN-HORAS-05)

#### Scenario: Borrado de OP en cascada

- **WHEN** se elimina una orden de trabajo con partes imputados
- **THEN** PostgreSQL elimina sus filas de `registros_horas` por `CASCADE` y los partes de otras órdenes permanecen intactos

#### Scenario: Borrado de etapa con SET NULL

- **WHEN** se elimina una etapa que tiene partes imputados
- **THEN** esos partes conservan su `id` y sus `horas` y pasan a tener `etapa_id = NULL`, sin borrarse ni reasignarse a otra etapa

#### Scenario: Parte sin etapa

- **WHEN** se inserta un parte con `etapa_id = NULL`
- **THEN** PostgreSQL lo acepta y el índice `(etapa_id)` lo deja fuera de las búsquedas por etapa (HU-10, RN-HORAS-05)

#### Scenario: Error originado en la base

- **WHEN** un test provoca una violación del `CHECK` o de una FK
- **THEN** el error proviene de PostgreSQL y no de una validación simulada en la aplicación (R10)

### Requirement: Modelo Prisma `RegistroHora` sin derivados

`backend/prisma/schema.prisma` DEBE (SHALL) declarar el modelo `RegistroHora` mapeado a `registros_horas` con `id`, `ordenId` en relación `onDelete: Cascade`, `etapaId` nullable en relación `onDelete: SetNull`, `operario String @db.VarChar(100)`, `fecha DateTime @db.Date`, `horas Decimal @db.Decimal(6,2)`, `createdAt DateTime @default(now()) @db.Timestamptz` y `observacion String? @db.Text` (P-1). NO DEBE (SHALL NOT) declarar `Float`, modelo `Usuario`, ni campos de totales, desvíos, consumo, alerta, costos, margen ni avance (R3, R5, R9).

#### Scenario: Modelo presente y mapeado

- **WHEN** se abre `backend/prisma/schema.prisma`
- **THEN** `RegistroHora` está declarado con `@@map("registros_horas")` y los campos mapeados a snake_case

#### Scenario: Decimal exacto

- **WHEN** se inspecciona el campo `horas` del modelo
- **THEN** usa `Decimal @db.Decimal(6,2)` y no aparece `Float` en el modelo (RN-MARGEN-05)

#### Scenario: Observacion nullable en el modelo

- **WHEN** se inspecciona el campo `observacion` del modelo
- **THEN** está declarado como `String? @db.Text` y corresponde a la columna `observacion TEXT NULL` de la migración 003 (P-1)

#### Scenario: Semántica de borrado explícita

- **WHEN** se inspeccionan las relaciones del modelo
- **THEN** `ordenId` declara `onDelete: Cascade` y `etapaId` declara `onDelete: SetNull`

#### Scenario: Generación del cliente

- **WHEN** se ejecuta `prisma generate` con Prisma 7.10.1
- **THEN** el cliente expone `registroHora` sin errores y sin usar Prisma 8.0.0-rc.34
