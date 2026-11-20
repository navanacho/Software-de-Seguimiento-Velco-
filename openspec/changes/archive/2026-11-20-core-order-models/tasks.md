## 1. Preparación y tests fallidos (RED)

- [x] 1.1 Verificar el punto de partida: C-01 archivado en `openspec/changes/archive/`, `docker info` disponible, `DATABASE_URL` configurada en `.env` sin versionarla y `schema.prisma` sin modelos de negocio
- [x] 1.2 Crear el helper `backend/test/core-order-models/contenedor.ts`: reutiliza `crearContenedorPostgres()` de `backend/test/fundacion/contenedor-postgres.ts`, levanta `postgres:18.7`, aplica la migración 001 con `prisma migrate deploy`, ejecuta el seed, apunta un `PrismaClient` real a `getConnectionUri()` y libera el contenedor en `finally`, con timeout de 180 s y `skipIf(!hayDocker())`
- [x] 1.3 Escribir los tests fallidos de unicidad de `numero_op`: duplicado rechazado y dos números distintos aceptados (RN-OP-01)
- [x] 1.4 Escribir los tests fallidos de unicidad de cliente: `nombre` duplicado rechazado y dos nombres distintos aceptados (DD-06)
- [x] 1.5 Escribir los tests fallidos de integridad referencial: borrar una OP elimina sus etapas y deja intactas las de otra OP (CASCADE); borrar un cliente con OPs se rechaza y uno sin OPs se acepta (RESTRICT)
- [x] 1.6 Escribir los tests fallidos del singleton: existe una fila `id = 1` con los valores del seed y un segundo `id = 1` se rechaza (RN-CONFIG-01, RN-CONFIG-03)
- [x] 1.7 Confirmar RED con `npm test -w @velco/backend -- test/core-order-models`: los tests fallan porque las tablas todavía no existen; si Docker no está disponible la omisión es explícita, nunca un mock (R1, R10)

## 2. Migración 001 y seed (GREEN)

- [x] 2.1 Generar la migración con `npm exec -w @velco/backend -- prisma migrate dev --name core_order_models` y verificar que se creó `backend/prisma/migrations/001_core_order_models/migration.sql`
- [x] 2.2 Revisar y ajustar el SQL: `configuracion` con `CHECK (id = 1)` y `etapas_default JSONB`; `clientes` con `nombre VARCHAR(150) UNIQUE NOT NULL`; `ordenes_trabajo` con `numero_op VARCHAR(50) UNIQUE NOT NULL`, `cliente_id UUID NOT NULL` con `ON DELETE RESTRICT` y `monto_vendido NUMERIC(14,2)`; `etapas_orden` con `orden_id UUID NOT NULL` con `ON DELETE CASCADE` y `UNIQUE (orden_id, orden_secuencia)`; índices en `cliente_id` y `fecha_entrega`; `gen_random_uuid()` y `TIMESTAMPTZ DEFAULT now()`; sin `usuarios`, sin derivados (DD-03, DD-06, R3, R5)
- [x] 2.3 Crear `backend/prisma/seed.ts` con un `upsert` idempotente sobre `id = 1` (`valor_hora_estandar = 0`, `dias_alerta_riesgo = 3`, `porcentaje_avance_riesgo = 80`, etapas `Corte/Soldadura/Mecanizado/Pintura/Entrega`), sin clientes, OPs ni usuarios
- [x] 2.4 Agregar los scripts `db:seed` en `backend/package.json` y en el `package.json` raíz, y ejecutar `npm run db:seed -w @velco/backend` contra el contenedor de test
- [x] 2.5 Ejecutar `npm test -w @velco/backend -- test/core-order-models` hasta que los grupos de `numero_op` y cliente pasen (GREEN)
- [x] 2.6 Agregar el segundo caso de CASCADE/RESTRICT y del singleton y refactorizar los fixtures del contenedor sin debilitar las aserciones de restricción (TRIANGULATE/REFACTOR)

## 3. Modelos Prisma

- [x] 3.1 Agregar en `backend/prisma/schema.prisma` los modelos `Configuracion`, `Cliente`, `OrdenTrabajo` y `EtapaOrden` con `@@map`/`@map` a snake_case, conservando `datasource` PostgreSQL y `generator client` de Prisma 7.10.1
- [x] 3.2 Mapear `monto_vendido`, `valor_hora_estandar` y `horas_vendidas` con `Decimal` y `@db.Decimal(p,s)`, y `etapas_default` como `Json` con default equivalente al SQL (usar `dbgenerated(...)` si el generador no acepta el literal)
- [x] 3.3 Declarar `onDelete: Restrict` en la relación con `Cliente` y `onDelete: Cascade` en la relación con `EtapaOrden`
- [x] 3.4 Ejecutar `npm exec -w @velco/backend -- prisma generate` y verificar que no aparece `Float`, `porcentaje_avance`, agregados de materiales ni `Usuario` en `schema.prisma` (R3, R5, R9)

## 4. Tipos de dominio y puertos

- [x] 4.1 Crear los tipos TS puros en `packages/domain/src/{configuracion,clientes,ordenes,etapas}/`: importes y horas como `string` decimal exacto, `readonly string[]` para `etapasDefault`, sin `any` y sin dependencias de framework (R2, R9)
- [x] 4.2 Declarar `ConfiguracionRepository`, `ClienteRepository`, `OpRepository` y `EtapaRepository` en `backend/src/features/{configuracion,clientes,ordenes,etapas}/application/ports/`, con la superficie mínima definida en el diseño
- [x] 4.3 Verificar los tipos con `npm run typecheck -w @velco/domain` y `npm run typecheck -w @velco/backend`
- [x] 4.4 Validar con `zod` 4.6.7 la conversión de `JsonValue` a `readonly string[]` en la frontera del adaptador, con un caso válido y otro con la lista incompleta (triangulación del contrato)

## 5. Adaptadores Prisma y aislamiento

- [x] 5.1 Implementar los cuatro adaptadores en `backend/src/features/<feature>/prisma/`: inyectan `PrismaClient`, satisfacen los puertos y convierten `Prisma.Decimal` ↔ `string` sin `number`, `parseFloat` ni `toNumber()`
- [x] 5.2 Refactorizar los tests de integración para exercitar los puertos a través de los adaptadores, manteniendo PostgreSQL real y sin mocks (R10)
- [x] 5.3 Verificar R2 con `rg -n "from ['\"](fastify|@prisma/client|react|exceljs)" packages/domain/src` (cero resultados) y con la eliminación temporal de `backend/src/features/*/{prisma,http,excel}` seguida de `npm run typecheck -w @velco/domain`; restaurar los directorios después
- [x] 5.4 Verificar que no hay `any` en los archivos nuevos y que `backend/src/infrastructure/` no existe

## 6. Verificación final

- [x] 6.1 Ejecutar `npm run typecheck` en la raíz del workspace y `npm test -w @velco/backend` con todos los tests (fundación + C-02)
- [x] 6.2 Confirmar el alcance: cero endpoints nuevos, cero archivos `.xlsx`, sin tabla `usuarios`, sin columnas derivadas y sin código de auth/PIN/RBAC (R3, R5, R6)
- [x] 6.3 Ejecutar `openspec validate core-order-models --strict` y `openspec status --change core-order-models --json`; este último DEBE mostrar `tasks` en `done` y `isComplete: true` antes del archivado (R8)
- [x] 6.4 Confirmar que `CHANGES.md` sigue con `[ ]` en C-02: el checkbox se marca recién al archivar el change
