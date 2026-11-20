## Context

C-01 quedó archivado el 2026-11-20 con el workspace feature-based (`@velco/domain`, `@velco/backend`, frontend), Fastify con `GET /api/health`, Vitest 5.1.1 y un `backend/prisma/schema.prisma` que solo declara `datasource` y `generator`. Existe además `backend/test/fundacion/contenedor-postgres.ts`, que expone `crearContenedorPostgres()` e `IMAGEN_POSTGRES = 'postgres:18.7'`, y la fase de fundación ya demostró que el contenedor levanta en Windows con timeout de 180 s.

C-02 es GATE 1, governance **CRITICO** y depende de C-01 (completado). Entrega la primera superficie de persistencia del sistema: la entidad raíz `ordenes_trabajo`, su cliente, sus etapas y la configuración global. La fuente de verdad es `knowledge-base/04_modelo_de_datos.md` (§configuracion, §clientes, §ordenes_trabajo, §etapas_orden, §Seed data inicial), complementada por DD-03 (avance derivado), DD-06 (cliente normalizado), RN-OP-01, RN-ETAPA-02 y RN-CONFIG-01..03, y por el scope literal de `CHANGES.md`.

El MVP lo usa una sola persona, sin autenticación, PIN, RBAC ni tabla `usuarios` (R5, DD-07). Los artefactos se redactan en español rioplatense técnico.

## Goals / Non-Goals

**Goals:**

- Crear la migración 001 con `configuracion`, `clientes`, `ordenes_trabajo` y `etapas_orden`, con `numero_op` único, `nombre` de cliente único, `cliente_id` FK RESTRICT, `orden_id` FK CASCADE y `(orden_id, orden_secuencia)` único.
- Dejar los modelos Prisma 7.10.1 alineados con el DDL, usando `NUMERIC` y sin columnas derivadas.
- Declarar los cuatro puertos de repositorio en `application/ports` y sus adaptadores Prisma por feature, sin framework en `packages/domain/`.
- Cargar el seed mínimo de `configuracion` (id 1) sin datos de ejemplo ni usuarios.
- Probar la integridad contra PostgreSQL 18.7 real en contenedor, con TDD RED → GREEN → TRIANGULATE → REFACTOR y sin mocks (R1, R10).

**Non-Goals:**

- Endpoints HTTP, handlers Fastify, casos de uso de alta o edición de OP y formularios.
- Tablas `materiales_orden`, `registros_horas`, `usuarios` ni columnas de derivados: `porcentaje_avance`, totales de horas, agregados de materiales, costos, margen o semáforo.
- Funciones de dominio para avance, etapa `ahora` o semáforo: se implementan en C-03.
- Plantillas `.xlsx`, `exceljs`, UI, TanStack Query ni React Router en este change.
- Modificar `CHANGES.md`, ejecutar builds, commits ni tests de aplicación fuera del alcance de los artefactos de planeación.

## Decisions

### D1 — Migración 001 como SQL revisado, con Prisma Migrate

La migración vive en `backend/prisma/migrations/001_core_order_models/migration.sql` y se genera con `prisma migrate dev --name core_order_models` desde el workspace `@velco/backend`, leyendo `DATABASE_URL` de `backend/prisma.config.ts`. El SQL resultante se revisa a mano antes de aplicarse; en entornos compartidos se aplica con `prisma migrate deploy`.

DDL canónico: `UUID` con `gen_random_uuid()` (función nativa desde PostgreSQL 13, sin extensión adicional), `TIMESTAMPTZ DEFAULT now()`, `DATE`, `TEXT`, `JSONB`, `BOOLEAN` y `NUMERIC(14,2)` / `NUMERIC(12,2)` / `NUMERIC(8,2)`; `CHECK (id = 1)` en `configuracion`; `UNIQUE (nombre)` en `clientes`; `UNIQUE (numero_op)` en `ordenes_trabajo`; `UNIQUE (orden_id, orden_secuencia)` en `etapas_orden`; `FOREIGN KEY ... ON DELETE RESTRICT` para `cliente_id` y `ON DELETE CASCADE` para `orden_id`; índices en `cliente_id`, `fecha_entrega` y el compuesto `(orden_id, orden_secuencia)` ya cubierto por la unicidad.

*Alternativas descartadas:* `prisma db push` (sin historial ni revisión del DDL, imposible de auditar en un dominio CRITICO); SQL escrito a mano sin `migrate dev` (Prisma no registra la migración y el cliente queda desincronizado); agregar las tablas de horas y materiales «para adelantar» C-06/C-08 (scope extra). *Trade-off:* un paso manual de revisión del SQL, a cambio de integridad verificable.

### D2 — Layout feature-based y puertos por entidad

Cada puerto se ubica en la feature de la entidad que persiste:

| Puerto | Archivo | Adaptador |
|---|---|---|
| `ConfiguracionRepository` | `backend/src/features/configuracion/application/ports/ConfiguracionRepository.ts` | `backend/src/features/configuracion/prisma/` |
| `ClienteRepository` | `backend/src/features/clientes/application/ports/ClienteRepository.ts` | `backend/src/features/clientes/prisma/` |
| `OpRepository` | `backend/src/features/ordenes/application/ports/OpRepository.ts` | `backend/src/features/ordenes/prisma/` |
| `EtapaRepository` | `backend/src/features/etapas/application/ports/EtapaRepository.ts` | `backend/src/features/etapas/prisma/` |

La lista de features de `knowledge-base/08_arquitectura_propuesta.md` es ilustrativa: DD-06 convierte al cliente en entidad propia, por lo que `clientes` merece su propio slice en lugar de colgar de `ordenes`. Es una decisión de ubicación, no nuevo scope funcional. No se crea `backend/src/infrastructure/` ni adaptadores `http` o `excel` vacíos: esas carpetas se abren cuando la feature lo necesite.

Superficie mínima de los contratos: lectura del singleton de configuración; alta y búsqueda de cliente por nombre e id; alta y búsqueda de OP por id y `numero_op`; alta en lote y lectura de etapas por OP. C-04, C-06 y C-10 ampliarán los puertos según sus casos de uso, sin modificar el dominio.

*Alternativas descartadas:* un repositorio genérico compartido (acopla features y oculta las reglas de integridad de cada tabla); poner los puertos en `packages/domain` (el dominio pasaría a definir contratos de infraestructura y R2 quedaría difuso); un `infrastructure/` central (C-01 lo prohibió explícitamente). *Trade-off:* cuatro interfaces pequeñas y sus implementaciones, a cambio de slices independientes.

### D3 — Aislamiento del dominio y tipos estrictos (R2, R9)

Los tipos de datos que exponen los puertos viven en `packages/domain/src/{configuracion,clientes,ordenes,etapas}/` como TypeScript puro: `readonly` donde aplique, uniones literales para estados y **sin importar** Fastify, Prisma, React ni `exceljs`. Los adaptadores Prisma importan esos tipos y construyen las interfaces de `application/ports`; ningún archivo de `packages/domain/src/` conoce `PrismaClient`.

La verificación es mecánica: `npm run typecheck -w @velco/domain` debe pasar, una búsqueda de importaciones prohibidas debe dar cero resultados y, al eliminar todos los directorios `backend/src/features/*/{prisma,http,excel}`, `packages/domain/` debe seguir compilando. `tsconfig.base.json` ya impone `strict`, `noImplicitAny`, `noUncheckedIndexedAccess` y `verbatimModuleSyntax`; no se usa `any` ni aserciones para callar errores de tipo.

*Alternativas descartadas:* importar tipos generados por Prisma en el dominio (atajo que rompe R2 y hace imposible el TDD puro); `any` en los DTO para «avanzar rápido» (errores diferidos a runtime). *Trade-off:* conversión explícita en cada adaptador, a cambio de un dominio testeable.

### D4 — Modelos Prisma y manejo decimal

En `backend/prisma/schema.prisma` se mantienen el `datasource` PostgreSQL y el `generator client` con `provider = "prisma-client-js"` tal como los dejó C-01; se agregan los cuatro modelos con `@@map` a los nombres snake_case y `@map` en las columnas. `monto_vendido`, `valor_hora_estandar` y `horas_vendidas` se declaran con `@db.Decimal(p,s)`; `etapas_default` se declara como `Json` con un default que replica el de la DDL (si el generador 7.10.1 no acepta el literal JSON, se usa `dbgenerated(...)` y la DDL sigue siendo la fuente de verdad). Las relaciones declaran `onDelete: Restrict` y `onDelete: Cascade` con nombres de constraint coherentes con el SQL.

Prisma devuelve `Prisma.Decimal` para `NUMERIC`. El adaptador convierte ese valor a `string` decimal exacto (por ejemplo `"1250.50"`) en la frontera del puerto; el dominio y los futuros DTOs nunca usan `number`, `parseFloat` ni `toNumber()` para dinero u horas. En sentido inverso, el adaptador convierte el `string` validado a `Prisma.Decimal` al escribir. El default de `etapas_default` se valida con `zod` 4.6.7 al convertir `JsonValue` a `readonly string[]`, porque el tipo de Prisma es más laxo que el contrato del dominio.

*Alternativas descartadas:* `Float`/`DOUBLE PRECISION` (pérdida de precisión en importes contables, RN-MARGEN-05); exponer `Prisma.Decimal` en los puertos (rompe R2 y filtra un tipo de framework hacia el dominio); convertir a `number` en el adaptador (redondeo binario antes de C-11). *Trade-off:* conversión explícita en dos puntos por campo, a cambio de exactitud decimal y aislamiento.

### D5 — Seed idempotente

`backend/prisma/seed.ts` usa `PrismaClient` y un `upsert` sobre `id = 1` con `valor_hora_estandar = 0`, `dias_alerta_riesgo = 3`, `porcentaje_avance_riesgo = 80` y `etapas_default = ["Corte","Soldadura","Mecanizado","Pintura","Entrega"]`. Se expone como `npm run db:seed` en `@velco/backend` y como script raíz, y se ejecuta después de `prisma migrate deploy`. El `upsert` con `update: {}` permite repetirlo sin duplicar la fila ni sobrescribir cambios del usuario.

El seed no inserta clientes, OPs, etapas ni datos demo: los ejemplos `OT-1041`, `OT-1038`, `OT-1036`, `OT-1033` y `OT-1030` pertenecen solo al prototipo HTML y están fuera de producción. Tampoco crea tabla ni fila de usuarios (R5).

*Alternativas descartadas:* `INSERT` directo sin `ON CONFLICT` (falla al repetir el seed); seed con clientes y OPs de ejemplo (contamina el tablero real y rompe la CA de RN-CONFIG-01); guardar las etapas por defecto en cada OP desde el seed (debe derivarse de configuración al crear la OP en C-06). *Trade-off:* hay que acordarse de correr el seed tras cada `migrate reset`, mitigado con el script raíz.

### D6 — Tests de integración con PostgreSQL real (R1, R10)

Los tests viven en `backend/test/core-order-models/` y reutilizan `crearContenedorPostgres()` de `backend/test/fundacion/contenedor-postgres.ts`. Cada archivo levanta un contenedor `postgres:18.7`, apunta un `PrismaClient` a `getConnectionUri()`, aplica la migración 001 con `prisma migrate deploy`, ejecuta el seed y libera el contenedor en `finally`. `backend/vitest.config.ts` ya fija `fileParallelism: false`, `testTimeout`/`hookTimeout` y entorno `node`; el arranque en Windows usa el mismo timeout ampliado de 180 s que C-01.

Casos exigidos, con al menos dos situaciones por regla para TRIANGULATE:

- `numero_op` duplicado se rechaza; dos OPs de clientes distintos con números distintos se aceptan (RN-OP-01).
- `clientes.nombre` duplicado se rechaza; dos nombres distintos se aceptan (DD-06).
- Borrar una OP elimina sus `etapas_orden` (CASCADE) y no toca etapas de otra OP.
- Borrar un cliente con OPs asociadas se rechaza (RESTRICT); borrar un cliente sin OPs funciona.
- `configuracion` tiene exactamente una fila con `id = 1` y un segundo `id = 1` se rechaza (RN-CONFIG-03).

Si Docker no está disponible se usa el mismo patrón `skipIf(!hayDocker())` de la fundación: el test se omite explícitamente, nunca se reemplaza por un mock de Prisma ni de PostgreSQL. Los datos se aíslan por contenedor, no por transacción compartida, para que los constraints sean los que fallan.

*Alternativas descartadas:* mockear `PrismaClient` (rompe R10 y no prueba constraints reales); tests sobre la BD de desarrollo compartida (no repetibles); usar SQLite en memoria (no soporta `UUID`, `JSONB` ni `TIMESTAMPTZ`, DD-01). *Trade-off:* arranque de contenedor por suite, mitigado con `fileParallelism: false`.

### D7 — Derivados deliberadamente diferidos a C-03 (R3, DD-03)

El esquema no incluye `porcentaje_avance` ni agregados de materiales, y tampoco columnas `GENERATED ALWAYS AS (...) STORED` en este change. `etapas_orden.completada` y `orden_secuencia` son la única base futura del avance, de la etapa `ahora` y del semáforo; C-03 implementará `calcularAvance`, `etapaAhora`, `calcularSemaforo`, `diasRestantes` y `agruparFlujo` como funciones puras sobre los datos que entregan estos puertos. La unicidad `(orden_id, orden_secuencia)` hace determinístico el orden de la checklist.

*Alternativas descartadas:* columna `porcentaje_avance` sincronizada a mano (dos fuentes de verdad, DD-03); agregados materiales guardados en la OP (DD-05 los prohíbe); calcular derivados en un trigger SQL (rompe RN-GLOBAL-02: una sola implementación en dominio). *Trade-off:* C-04 deberá composar los derivados al construir su DTO, lo cual ya está previsto en el roadmap.

## Risks / Trade-offs

- **[Prisma 7.10.1 y el default de `Json`] →** replicar el default de la DDL en el modelo y validarlo con el test de seed; si el generador no lo acepta, usar `dbgenerated(...)` sin cambiar la DDL. No actualizar a 8.0.0-rc.34.
- **[`Prisma.Decimal` filtrado al dominio] →** convertir a `string` en el adaptador y prohibir `number`/`toNumber()` para dinero y horas; verificar con búsqueda de importaciones y con `typecheck`.
- **[RESTRICT puede frustrar altas] →** es una decisión consciente de DD-06/C-04; C-06 deberá reutilizar el cliente existente en lugar de borrarlo. Nunca cambiar a CASCADE «para que pase el test».
- **[Contenedor lento en Docker Desktop/Windows] →** timeout de 180 s, `fileParallelism: false` y omisión explícita con `skipIf`; bajo ningún concepto mockear PostgreSQL.
- **[Puertos incompletos para changes futuros] →** contrato mínimo documentado; ampliar en C-04/C-06/C-10 con tests nuevos, sin tocar `packages/domain/`.
- **[Migración aplicada sobre una BD con datos] →** C-01 no cargó datos de negocio; si apareciera una BD externa, revisar antes de `deploy`. Rollback: en desarrollo `prisma migrate reset`; en compartido, restaurar snapshot y marcar la migración con `prisma migrate resolve --rolled-back` solo tras confirmación humana.
- **[IN-08 y DD-07] →** no resolverlos aquí: el spike `C-13` cierra el tema Excel antes de C-14 y cualquier auth sigue requiriendo aprobación humana explícita (R5).

## Migration Plan

1. Confirmar C-01 archivado, Docker Desktop con `postgres:18.7` y `.env` con `DATABASE_URL` válida (sin versionar secretos).
2. RED: escribir primero los tests de integración de `backend/test/core-order-models/`; deben fallar porque las tablas no existen.
3. GREEN: generar y revisar `001_core_order_models/migration.sql`, agregar los cuatro modelos a `schema.prisma`, ejecutar `prisma generate` y `prisma migrate deploy`, y cargar el seed con `npm run db:seed`.
4. TRIANGULATE: agregar el segundo caso de cada regla (duplicado/único, CASCADE/RESTRICT, singleton) y refactorizar los fixtures del contenedor sin tocar la aserción de integridad.
5. Declarar los cuatro puertos y sus adaptadores Prisma; verificar R2 con `npm run typecheck -w @velco/domain` y con la eliminación temporal de todos los adaptadores por feature.
6. Verificar con `npm run typecheck` (workspace) y `npm test -w @velco/backend`, sin builds ni commits. El cierre del change con `openspec validate core-order-models --strict` y el checkbox de `CHANGES.md` queda para el archivado (R8).

## Open Questions

- **SU-05 (Media):** zona horaria real de Velco para comparar fechas a medianoche; afecta a C-03, no al esquema de C-02.
- **IN-08 (Alta, spike C-13):** enlace externo de ~577 KB y ruta UNC en la plantilla de costeo; sin impacto en este change.
- **DD-07 (Alta):** auth/PIN/RBAC de Fase 2 requiere aprobación humana explícita antes de cualquier código (R5).
- **[Técnica, se resuelve en implementación]:** si Prisma 7.10.1 requiere `dbgenerated(...)` para el default de `etapas_default`; el test del seed lo confirma y no bloquea el diseño.
