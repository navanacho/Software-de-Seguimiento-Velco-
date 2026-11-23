## Context

C-06 y C-07 están archivados. El código real confirma el punto de partida: `backend/src/features/ordenes/application/DetalleOpDTO.ts:15` declara `horas: readonly never[]`; `obtenerOp.ts:41` devuelve `horas: []`; `backend/src/features/ordenes/http/esquemas.ts:117` publica `z.array(z.never())` con una descripción que anuncia C-08. `TarjetaOrdenDTO` (`packages/domain/src/ordenes/tarjeta.ts`) **no** tiene campo de horas. Las migraciones existentes son `001_core_order_models` y `002_ordenes_y_linea_base`; no hay feature `horas` en `backend/src/features/`. Sí existen `calcularHorasVendidasTotales` (`packages/domain/src/etapas/horas-vendidas.ts`) y `calcularAgregadosMateriales` (`packages/domain/src/materiales/agregados.ts`, con aritmética en centésimas/`bigint`) que fijan el estilo a seguir.

R1–R10 rigen sin excepción. Gobernanza **MEDIO**: se trabaja por checkpoints y cualquier decisión de contrato no derivable de los documentos se eleva al usuario antes de escribir producción. Idioma: español técnico rioplatense.

## Goals / Non-Goals

**Goals:**

- Persistir partes de horas por OP con etapa opcional, validando `horas > 0` en dominio, en Zod y en PostgreSQL (HU-10, HU-13, RN-HORAS-05).
- Entregar los cuatro endpoints de API y el caso de uso `imputarHoras`, con 422/404 explícitos y sin auth (R5).
- Calcular totales, desvío, consumo y alerta con una sola implementación pura en `packages/domain/src/horas/`, recalculada en cada mutación (RN-HORAS-01..04, RN-HORAS-06, RN-GLOBAL-02, R3).
- Reemplazar el placeholder de `DetalleOpDTO.horas` por los partes reales y actualizar Swagger en consecuencia.
- Cubrir con tests puros y de integración sobre PostgreSQL 18.7 real los casos: con/sin etapa, edición, eliminación, recálculo y rechazo de horas no positivas (R1, R10).

**Non-Goals:**

- No tocar UI: el modal, el listado editable y la barra de la tarjeta pertenecen a C-09.
- No modificar `GET /api/ops`, los endpoints de OP/etapas/materiales, la migración 001 ni la 002.
- No agregar `usuario_id`, tabla `usuarios`, auth, PIN ni RBAC (DD-07, R5).
- No persistir totales, desvíos, consumo, alerta ni avance; no generar columnas `GENERATED` nuevas (R3).
- No introducir Excel, dependencias nuevas, `any`, mocks de PostgreSQL ni builds/commits (R6, R4, R9, R10).

## Decisions

### D1 — Migración 003 aditiva, sin derivados ni identidad de usuario

Se crea `backend/prisma/migrations/003_registros_horas/migration.sql` con `CREATE TABLE registros_horas (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), orden_id UUID NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE, etapa_id UUID REFERENCES etapas_orden(id) ON DELETE SET NULL, operario VARCHAR(100) NOT NULL, fecha DATE NOT NULL DEFAULT CURRENT_DATE, horas NUMERIC(6,2) NOT NULL CHECK (horas > 0), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), observacion TEXT NULL)` y los índices `(orden_id, fecha)`, `(etapa_id)`, `(operario)`. `observacion` se incluye porque el modelo canónico la declara (P-1 = A, confirmado el 2026-11-22). No se declara `usuario_id` (DD-07, R5) ni ninguna columna calculable.

*Alternativas descartadas:* reescribir la 002 (rompe el historial de migraciones aplicadas); guardar `horas_reales_totales` en `ordenes_trabajo` para "acelerar" el detalle (R3); una columna `GENERATED ALWAYS AS ... STORED` (no puede agregar filas de otra tabla y además duplicaría la regla); omitir `observacion` y diferirla a una 004 (P-1 = B, descartada). *Trade-off:* cada lectura del detalle suma las filas; con el volumen del MVP es aceptable y es el precio de no desincronizar derivados.

### D2 — Modelo Prisma `RegistroHora` y decimales como cadena exacta

`backend/prisma/schema.prisma` incorpora `model RegistroHora` mapeado a `registros_horas`, con `id String @id @default(uuid()) @db.Uuid`, `ordenId`/`etapaId` mapeados a snake_case y relaciones `onDelete: Cascade` / `onDelete: SetNull`, `horas Decimal @db.Decimal(6,2)`, `fecha DateTime @db.Date` y `observacion String? @db.Text` (P-1 = A). Los puertos exponen `horas` como `string` (`"2.50"`), nunca `number`; el adaptador convierte con `new Prisma.Decimal(valor)` y `toFixed(2)`/`toString()` sin `parseFloat` (RN-MARGEN-05, R9).

*Alternativas descartadas:* `Float` (pérdida de precisión); `number` en el puerto (rompe el contrato de `puertos-persistencia-ordenes`); declarar el `CHECK` en Prisma (no es expresable y ya vive en SQL); no mapear `observacion` (P-1 = B, descartada). *Trade-off:* conversiones explícitas en el adaptador, acotadas a un archivo y cubiertas por test de integración.

### D3 — Feature `horas` con puerto propio y unidad de trabajo separada

Se crea `backend/src/features/horas/{application/ports,application,http,prisma}/`. `RegistroHoraRepository` expone `crear`, `listarPorOrden`, `buscarPorId`, `actualizar` y `eliminar`. `UnidadTrabajoHoras` (puerto nuevo en la misma feature) entrega `{ horas: RegistroHoraRepository; ops: OpRepository; etapas: EtapaRepository }` enlazados a `PrismaClient.$transaction`; su adaptador usa `Prisma.TransactionClient` **solo** en `horas/prisma/`. No se extiende `UnidadTrabajoOps`: eso cambiaría el contrato de `puertos-persistencia-ordenes`, un capability ya archivado que este change no enmienda.

*Alternativas descartadas:* poner los métodos en `OpRepository` (mezcla dos agregados y obligaría a modificar specs de C-04/C-06); compartir una `infrastructure/` central (prohibido); que el caso de uso importe `PrismaClient` (R2). *Trade-off:* dos abstracciones de transacción con shape parecido; se compensa con nombres explícitos y tests que prueban atomicidad real.

### D4 — Reglas de horas puras en dominio, reutilizando lo ya existente

En `packages/domain/src/horas/` se definen el contrato `RegistroHora`, las reglas `calcularHorasRealesTotales`, `calcularDesvioHoras`, `calcularConsumoHoras`, `evaluarAlertaDesvio` y un validador de parte (`horas > 0`, `operario` no vacío, `fecha` válida, `etapaId` opcional). El total de vendidas reutiliza `calcularHorasVendidasTotales`; la aritmética nueva sigue el patrón de centésimas/`bigint` de `materiales/agregados.ts`. `RN-HORAS-06` se implementa como `null` para `% consumo` cuando vendidas = 0, sin lanzar. Todo se exporta por `packages/domain/src/index.ts`.

*Alternativas descartadas:* sumar `Number` en el handler de Fastify (duplica regla y rompe R2/RN-GLOBAL-02); calcular en React (C-09 lo prohíbe explícitamente); reimplementar la suma de vendidas (duplicaría `calcularHorasVendidasTotales`). *Trade-off:* un módulo nuevo de dominio con su propia batería de tests; es el costo de la unicidad de la regla.

### D5 — HTTP delgado: Zod en la frontera, CHECK en la base

`POST`/`PATCH` usan esquemas `.strict()` con `horas: z.string().regex(...).refine(v => Number(v) > 0)` y decimal como cadena, `fecha` en `YYYY-MM-DD` con calendario válido, `operario` de 1 a 100 caracteres, `etapaId` UUID opcional y `observacion` opcional (P-1 = A). Errores de validación ⇒ 422 `{ error: 'validation_error', details: [...] }` antes de tocar la base; el `CHECK (horas > 0)` queda como última defensa y su violación se traduce en el adaptador. OP inexistente ⇒ 404 `{ error: 'not_found' }`; etapa inexistente o de otra OP ⇒ 422 `validation_error` con `details[].path = ['etapaId']` antes de insertar (**P-3 = A**, confirmado el 2026-11-22).

*Alternativas descartadas:* confiar solo en el `CHECK` (el error llega como 500); validar con `any` (R9); dejar la comprobación de pertenencia de etapa al adaptador Prisma sin regla de dominio (R2). *Trade-off:* la validación se expresa dos veces —Zod y SQL— con propósitos distintos (contrato vs integridad), y ambos casos se testean.

### D6 — `DetalleOpDTO.horas` pasa a datos reales; Swagger deja de anunciar C-08

`horas` cambia de `readonly never[]` a `readonly ParteHoraDTO[]`, donde el parte expone `id`, `etapaId: string | null`, `operario`, `fecha`, `horas` como cadena decimal, `createdAt` y `observacion: string | null` opcional (P-1 = A). Los derivados `horasRealesTotales`, `desvioHoras`, `porcentajeConsumo` y `alertaDesvio` viajan como campos hermanos calculados en dominio (**P-2 = A**, confirmado el 2026-11-22, R3). `obtenerOp` inyecta el repositorio de horas, obtiene los partes y compone los derivados con las funciones de D4; `DetalleOpSchema` usa `z.array(ParteHoraSchema)` y `z.toJSONSchema` actualiza la documentación. Los archivos de specs archivados **no** se editan: el cambio vive en el delta `specs/api-detalle-op/spec.md`.

*Alternativas descartadas:* dejar el arreglo vacío y crear `partesHoras` aparte (rompe la promesa explícita de la spec `api-detalle-op`); `horas` como objeto `{ partes, totales }` (P-2 = B: rompe el tipo arreglo contratado y obliga a rehacer el espejo Zod del frontend); solo partes sin derivados en el detalle (P-2 = C: C-09/C-11 necesitarían otra consulta o cálculo en React). *Trade-off:* el detalle hace una consulta adicional por partes y gana cuatro campos hermanos; se compensa con el índice `(orden_id, fecha)`.

### D7 — Corrección y baja sin escritura de derivados; `SET NULL` es el comportamiento de la etapa eliminada

`PATCH` y `DELETE` operan solo sobre `registros_horas`; la respuesta se reconstruye leyendo el estado fresco y recalculando en dominio. `PATCH` es actualización parcial: solo se reemplazan los campos presentes, `fecha` es editable y un cuerpo vacío se rechaza con 422 (**P-4 = A**, confirmado el 2026-11-22). `PATCH` devuelve únicamente el `ParteHoraDTO` resultante y `DELETE` devuelve `{ ok: true }`, como ya hace C-06 con etapas (**P-5 = A**). Si se elimina una etapa de la OP, la FK `ON DELETE SET NULL` convierte sus partes en "sin etapa": conservan `horas` y siguen sumando al total, y el comparativo por etapa de HU-15 las agrupará en el bucket sin etapa (C-11). No se crea un endpoint de "reasignar etapa" en este change.

*Alternativas descartadas:* borrar los partes al borrar la etapa (perdería horas reales ya trabajadas); reasignar a la primera etapa (inventa una regla de negocio); escribir el nuevo total en la OP (R3); devolver el `DetalleOpDTO` completo en las mutaciones (P-5 = B: acopla la mutación al detalle y agranda el payload). *Trade-off:* el histórico por etapa se degrada al borrar etapas, consecuencia directa del esquema canónico; se documenta y se cubre con test.

### D8 — Checkpoints de gobernanza MEDIO y safety net

Antes de producir código se corre el baseline de `packages/domain` y `backend` sin modificarlo. Cada capability avanza RED → GREEN → TRIANGULATE (≥2 casos) → REFACTOR con el `RN-XX-NN` en el título del test (RN-GLOBAL-04). Checkpoints obligatorios: (1) confirmar P-1..P-6 con el usuario — **cumplido el 2026-11-22** (A, A, A, A, A, B), registrado en §Open Questions y reflejado en specs y tasks; (2) migración + modelo + integridad en base real; (3) reglas puras y endpoints; (4) detalle y Swagger; (5) guardianes R2/R3/R5/R9/R10 + `openspec validate --strict`. Sin builds ni commits.

*Alternativas descartadas:* implementar primero y decidir el contrato después (gobernanza BAJO, inapropiada aquí); snapshots sin aserciones semánticas; mocks de PostgreSQL (R10). *Trade-off:* más ida y vuelta con el usuario; es el mecanismo pedido para no resolver ambigüedades por cuenta propia.

## Risks / Trade-offs

- **[Contrato de `horas` mal aplicado durante el apply] →** P-2 = A cerrado el 2026-11-22: `ParteHoraDTO[]` más cuatro derivados hermanos en dominio; los tests del detalle verifican la forma exacta y que no aparezca el objeto `{ partes, totales }`.
- **[C-09 necesita la barra de horas en la tarjeta] →** P-6 = B cerrado: `TarjetaOrdenDTO` y `api-listado-ops` quedan intactos en C-08; C-09 obtendrá los totales del detalle o de `GET /api/ops/:id/horas`, sin cálculo en React.
- **[Borrado de etapa con partes imputados] →** D7 define `SET NULL`; test de integración explícito para verificar que el total no cambia.
- **[Doble validación Zod + CHECK] →** se prueban por separado; cualquier divergencia debe corregirse antes del checkpoint 4.
- **[Dos unidades de trabajo] →** D3 evita tocar specs archivadas; se vigila que no aparezca lógica de negocio en ningún adaptador (R2).
- **[Regresión del detalle actual] →** safety net de `ordenes` sin modificar; `materiales` y derivados existentes deben seguir pasando.
- **[Auth/RBAC] →** no se implementa; cualquier requerimiento de identidad de operario se escala a aprobación humana (DD-07, R5).
- **[IN-08 / C-13] →** ajeno a este change; no se abre ni se menciona Excel en la API de horas.

## Migration Plan

No hay despliegue de datos: la tabla nueva arranca vacía y no requiere backfill. Rollback: revertir el código de la feature `horas`, el ajuste de `DetalleOpDTO` y sus specs delta, y eliminar la migración 003 en un change correctivo; la 001 y la 002 quedan intactas.

1. **Checkpoint 0:** verificar C-06/C-07 archivados, `openspec list --json` con solo `horas-reales-api`, baseline verde y documentos canónicos leídos (R8).
2. **Checkpoint 1 (cumplido el 2026-11-22):** el usuario confirmó P-1 = A, P-2 = A, P-3 = A, P-4 = A, P-5 = A y P-6 = B. El registro con justificaciones vive en §Open Questions; los delta specs y las tareas ya reflejan el contrato cerrado, sin editar specs archivadas.
3. **Checkpoint 2 — RED/GREEN:** tests de integración para la migración 003, el modelo Prisma y la integridad (`CHECK`, CASCADE, SET NULL, índices), sobre `postgres:18.7` real.
4. **Checkpoint 3 — RED/GREEN/TRIANGULATE:** reglas puras en `packages/domain/src/horas/`; luego puerto, adaptador, `imputarHoras`, edición, baja y los cuatro endpoints con 422/404.
5. **Checkpoint 4:** recomposición de `DetalleOpDTO.horas`, esquemas Zod y Swagger; verificar que los derivados existentes no se recalculan en el handler.
6. **Checkpoint 5 — REFACTOR/cierre:** guardianes de imports, cero `any`, cero derivados persistidos, cero auth, cero mocks; `openspec status --change horas-reales-api --json` y `openspec validate horas-reales-api --strict`. Archivar y marcar `[x]` en `CHANGES.md` corresponde a un flujo posterior, no a este propose.

## Open Questions

**Cerradas el 2026-11-22 por confirmación explícita del usuario.** No quedan decisiones abiertas antes del apply: cada punto registra la alternativa elegida y su justificación, y conserva las descartadas como contexto. El checkpoint 1 (tarea 1.5) queda cumplido; los delta specs y las tareas ya usan las reglas concretas en lugar de referencias a estos identificadores.

### P-1 — Campo `observacion` en `registros_horas` → **A (elegida)**

La tabla canónica de `knowledge-base/04_modelo_de_datos.md` y el SQL de `Docs/definici_n_del_mvp_velco.md` incluyen `observacion TEXT`, pero el scope oficial de CHANGES.md §C-08 enumera solo `operario`, `horas`, `fecha` y `created_at`.

- **Elegida A (confirmada):** crear la columna `observacion TEXT NULL` y exponerla opcionalmente en POST/PATCH y en `ParteHoraDTO`. *Justificación:* alinea la migración 003 con el esquema canónico y evita una migración 004; el campo es opcional, por lo que no rompe a los clientes actuales. *Trade-off:* agrega un campo al payload que CHANGES.md no lista.
- **Descartada B:** omitirla por completo en C-08 y dejarla para un change posterior. *Trade-off:* respeta literalmente el scope, pero la migración 003 diferiría del esquema canónico y requeriría una 004.

### P-2 — Forma exacta de `DetalleOpDTO.horas` y de los derivados de horas → **A (elegida)**

La spec vigente dice que `horas` es un arreglo vacío "pendiente de C-08" y no define si los totales viajan dentro del mismo campo.

- **Elegida A (confirmada):** `horas` es `ParteHoraDTO[]` y los derivados son campos hermanos (`horasRealesTotales`, `desvioHoras`, `porcentajeConsumo`, `alertaDesvio`), calculados en dominio (R3). *Justificación:* conserva el tipo arreglo ya contratado, mantiene el espejo Zod del frontend y entrega a C-09 los derivados sin cálculo en React. *Trade-off:* amplía el DTO con cuatro campos nuevos.
- **Descartada B:** `horas` es un objeto `{ partes, totales }`. *Trade-off:* agrupa la información pero rompe la forma de arreglo contratada y obliga a rehacer el espejo Zod del frontend.
- **Descartada C:** solo `partes`, sin derivados en el detalle; C-11 los calcula al leer. *Trade-off:* detalle más magro, pero C-09/C-11 necesitarían otra consulta o cálculo en React.

### P-3 — Etapa inexistente o de otra OP → **A (elegida)**

La FK garantiza existencia, no pertenencia a la OP del path.

- **Elegida A (confirmada):** 422 `validation_error` con `details[].path = ['etapaId']`. *Justificación:* mantiene un único contrato de error de cuerpo para todo lo referido a `etapaId` y permite al cliente señalar el campo inválido. *Trade-off:* no distingue "no existe" de "es de otra OP".
- **Descartada B:** 404 `not_found`. *Trade-off:* semánticamente preciso para un recurso ajeno, pero mezcla errores de cuerpo con errores de ruta.

### P-4 — Semántica de `PATCH /horas/:horaId` → **A (elegida)**

- **Elegida A (confirmada):** actualización parcial; se reemplazan solo los campos presentes y se conservan los demás, `fecha` es editable y un cuerpo vacío se rechaza con 422 `validation_error`. *Justificación:* permite corregir un solo valor sin reenviar el parte completo, con reglas explícitas para campos ausentes y para el caso degenerado del cuerpo vacío. *Trade-off:* la semántica de "presente" debe respetarse en Zod, el caso de uso y el adaptador.
- **Descartada B:** reemplazo completo de `operario`, `fecha`, `horas` y `etapaId`. *Trade-off:* contrato más simple y predecible; obliga al cliente a enviar todo.

### P-5 — Cuerpo de las respuestas de mutación → **A (elegida)**

- **Elegida A (confirmada):** devolver solo la entidad `ParteHoraDTO` en POST/PATCH y `{ ok: true }` en DELETE, como ya hace C-06 con etapas. *Justificación:* respuestas pequeñas y contrato de mutación desacoplado del detalle, consistente con el patrón ya archivado para etapas. *Trade-off:* el cliente debe reconsultar para ver totales recalculados (C-09 leerá el detalle o `GET /api/ops/:id/horas`).
- **Descartada B:** devolver el `DetalleOpDTO` completo con horas y derivados ya recalculados. *Trade-off:* una sola request y la recarga de C-09 resuelve con la respuesta; acopla la mutación al contrato del detalle y agranda el payload.

### P-6 — Horas reales en `TarjetaOrdenDTO` / `GET /api/ops` → **B (elegida)**

C-09 pide la barra `Horas Reales / Horas Vendidas` en la tarjeta "alimentada por el DTO, sin cálculo en React", pero C-08 solo enumera el detalle y los endpoints de horas.

- **Descartada A:** ampliar `TarjetaOrdenDTO` con `horasRealesTotales` y enmendar `api-listado-ops` en este change. *Trade-off:* C-09 solo renderiza; amplía el alcance de C-08 y obliga al listado a consultar agregados de horas por OP.
- **Elegida B (confirmada):** dejar `TarjetaOrdenDTO` y `GET /api/ops` (`api-listado-ops`) intactos en C-08; C-09 obtiene los totales del detalle o de `GET /api/ops/:id/horas`. *Justificación:* mantiene el alcance de C-08 y no enmienda specs de tablero ya archivadas; los totales ya viajan en el detalle según P-2 = A. *Trade-off:* C-09 necesita una request por OP o un endpoint agregado que hoy no existe.
- **Descartada C:** agregar un campo agregado opcional al envelope `kpis`/tarjetas sin tocar `TarjetaOrdenDTO`. *Trade-off:* evita romper el tipo canónico, pero crea una tercera forma de transportar el mismo derivado.
