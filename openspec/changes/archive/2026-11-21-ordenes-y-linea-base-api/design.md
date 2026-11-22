## Context

C-05 quedó archivado con el tablero funcionando sobre tres endpoints de solo lectura/escritura parcial: `GET /api/ops`, `GET /api/ops/:id` y `PATCH /api/ops/:id/etapas/:etapaId`. El estado real del código es:

- `OrdenTrabajo` (`packages/domain/src/ordenes/contrato.ts`) no tiene `codigo_plano`; `TarjetaOrdenDTO` (`.../tarjeta.ts`) no lo transporta.
- `listarOps.ts:50-53` construye el texto de búsqueda solo con `numeroOp` y `descripcionPieza`; `fechaDesde`/`fechaHasta` ya filtran `fecha_entrega` (`listarOps.ts:41-42`).
- `OpRepository` (`backend/src/features/ordenes/application/ports/OpRepository.ts`) solo expone `crear`, `buscarPorId`, `buscarPorNumeroOp` y `listarConEtapas`.
- `backend/src/shared/errores.ts` solo define `RecursoNoEncontradoError`; `app.ts:20-35` mapea 422 de Zod y 404, sin rama de conflicto.
- La migración 001 no tiene `materiales_orden` ni `codigo_plano`; los CHECK de C-02 viven en SQL y no en `schema.prisma`, convención que se conserva (por ejemplo `clientes_nombre_not_empty_check`).
- La spec `tira-flujo-y-ahora` y el design de C-05 (D10) dejaron registrada la regla "nombres de etapa únicos por OP", cuya validación se habilita recién acá con los endpoints de gestión de etapas.
- La spec `api-detalle-op` reserva `horas`/`materiales` como arreglos vacíos "pendientes de C-08/C-06"; este change cierra la parte de materiales.

La gobernanza de C-06 es **MEDIO**: se implementa por pasos verificables y toda decisión no obvia queda explícita abajo o en la sección Decisiones del usuario. R1–R10 rigen sin excepción; se escribe en español rioplatense técnico.

## Goals / Non-Goals

**Goals:**

- Persistir `codigo_plano` opcional y único con normalización en la frontera HTTP, contrato 409 con `opExistente` y fallback por carrera (DD-11, RN-OP-05/06).
- Crear y editar OPs, clientes y etapas, y dar de alta materiales, en una transacción con `etapas_default` precargadas y derivados calculados en dominio (HU-01, HU-02, HU-04; R3).
- Extender la búsqueda global y el filtro rápido de plano en `listOps`, sin tocar la semántica de `fecha_entrega` (HU-09, RN-EXPORT-07, DD-12).
- Transportar `codigoPlano` en `TarjetaOrdenDTO` y espejarlo en Zod backend/frontend para que C-07 pueda renderizar el badge sin recalcular nada (R2, RN-GLOBAL-02).
- Mantener el dominio compilable sin adaptadores, con PostgreSQL real en tests de integración y TDD RED → GREEN → TRIANGULATE → REFACTOR con safety-net baseline (R1, R2, R10).

**Non-Goals:**

- No implementar Excel ni el mapeo `ID Plano:` / `S/P` en `O7:R8` de OP-MASTER: es C-15 y está bloqueado por C-13/IN-08. Nunca usar `J7:N8` (`PC N°:`).
- No implementar UI de formulario, badge ni editor de etapas (C-07), ni imputación de horas (C-08).
- No cambiar `fechaDesde`/`fechaHasta`: significan entrega prometida (`fecha_entrega`), no ejecución.
- No agregar auth, PIN, RBAC ni `usuario_id` (R5, DD-07); no persistir avance, totales, costos, margen ni semáforo (R3); no introducir `any` (R9).
- No renumerar migraciones, no tocar C-01..C-05 archivados, no editar `CHANGES.md`, `Docs/` ni `openspec/config.yaml` desde este propose.

## Decisions

### D1 — Migración 002 aditiva, con CHECK e índice parcial en SQL

Se agrega `backend/prisma/migrations/002_ordenes_y_linea_base/migration.sql` con: `ALTER TABLE ordenes_trabajo ADD COLUMN codigo_plano VARCHAR(80) NULL`; `CHECK (codigo_plano <> '')`; `CREATE UNIQUE INDEX ... ON ordenes_trabajo (codigo_plano) WHERE codigo_plano IS NOT NULL`; y `CREATE TABLE materiales_orden (...)` con su ENUM de tipos, `cantidad > 0`, `costo_unitario_cotizado >= 0`, `costo_unitario_real >= 0 WHEN NOT NULL`, FK `orden_id ... ON DELETE CASCADE` e índices `(orden_id, tipo)`, `(nro_factura)`, `(nt)`, `(po)`. La migración 001 queda byte-a-byte intacta: el escenario "sin materiales_orden" de `modelo-relacional-ordenes` se interpreta **dentro de 001**.

*Alternativas descartadas:* renumerar 001 (rompe el historial aplicado); `prisma db push` (sin DDL auditable); `GENERATED ALWAYS AS ... STORED` para agregados (R3 permite la excepción, pero acá no hace falta: los costos se derivan en dominio); columna `costo_materiales_*` en `ordenes_trabajo` (DD-05). *Trade-off:* Prisma no expresa CHECK ni índices parciales en `schema.prisma`; se mantiene la convención ya instalada de restricciones solo en SQL y se revisa el DDL generado por `migrate dev` antes de aplicarlo.

### D2 — `CodigoPlano` como tipo de dominio, normalización solo en HTTP

`CodigoPlano` es un tipo nominal simple de TypeScript puro con `normalizarCodigoPlano(valor: string | null | undefined): string | null` que aplica `trim()` + `toUpperCase()` y devuelve `null` para vacío. Se usa en `OrdenTrabajo.codigoPlano` y en `NuevaOrdenTrabajo`/actualización. La capa HTTP normaliza **antes** de construir el comando de aplicación: ni el dominio ni Prisma reciben cadenas sin normalizar. No se declara `@unique` en Prisma: PostgreSQL ya garantiza unicidad solo para no-NULL y la BD rechaza `''` (RN-OP-06).

*Alternativas descartadas:* normalizar en el adaptador Prisma (la regla quedaría detrás de un framework y no sería testeable en puro); índice único total (NULL duplicados no son comparables, pero `''` sí y debe rechazarse); `VARCHAR` obligatorio con centinela (rompe HU-01). *Trade-off:* el dominio expone `string | null` con la semántica ya resuelta; la longitud máxima 80 se valida en el esquema Zod y en el DDL.

### D3 — Conflicto de plano: error dedicado, puerto de resolución y fallback P2002

Se agrega `CodigoPlanoDuplicadoError` en `backend/src/shared/errores.ts` con `codigoPlano`, `idOpExistente` y `numeroOpExistente`. El error handler de `app.ts` responde **409** con el contrato exacto adoptado: `{ error: 'codigo_plano_duplicado', message: 'El ID de plano PL-2026-045 ya está asignado a la OP 1871.', codigoPlano: 'PL-2026-045', opExistente: { id: '<uuid>', numeroOp: '1871' } }`. El caso de uso consulta primero `OpRepository.buscarPorCodigoPlano(codigo, opIdExcluida?)` (el segundo argumento evita falso conflicto al editar la misma OP). Si la verificación previa no detecta el conflicto pero PostgreSQL lanza `PrismaClientKnownRequestError` con code `P2002`, el adaptador traduce la carrera al mismo error de dominio resolviendo la OP con `buscarPorCodigoPlano`. El 409 de `numero_op` duplicado sigue la misma familia con el cuerpo `{ error: 'numero_op_duplicado', message, numeroOp }`, sin `opExistente`, confirmado como DU-4.

*Alternativas descartadas:* dejar pasar `P2002` como 500 (contrato opaco e inútil para C-07); buscar la OP existente con Prisma dentro del caso de uso (rompe R2); hacer `SELECT ... FOR UPDATE` global (innecesario para el volumen del MVP y aumenta contención). *Trade-off:* dos lecturas en el camino de conflicto, aceptables; la ventana de carrera queda cubierta por el índice y el fallback.

### D4 — Búsqueda y filtro de plano en `listOps`, fecha comprometida intacta

Se amplía `FilaDerivada` con `codigoPlano` y `clienteNombre`, y `cumpleFiltros` usa un único texto en minúsculas `${numeroOp} ${codigoPlano ?? ''} ${clienteNombre ?? ''} ${descripcionPieza}` para el query param existente `buscar`. El filtro rápido se modela como `conPlano?: boolean` (**contrato confirmado**, DU-1), derivado del query param `conPlano=true|false` validado por Zod; `true` exige `codigoPlano !== null`, `false` exige `codigoPlano === null`, `undefined` no filtra. No se agrega estado local ni input nuevo en el frontend: el campo de búsqueda ya existente en C-05 envía `buscar` y el selector de filtro de plano se incorporará cuando C-07 defina su UI. `fechaDesde`/`fechaHasta` y el orden estable no se tocan (DD-12, RN-EXPORT-07).

*Alternativas descartadas:* `estadoPlano=con|sin` y dos flags separados (rechazados por DU-1); implementar el filtro con un prefijo mágico dentro de `buscar` (opaco y no tipable); filtrar en React (duplica regla y rompe KPIs/flujo); cambiar el rango a fecha de ejecución (rompe C-04/C-05 y el dashboard futuro). *Trade-off:* el parámetro booleano es más simple que un enum con tres valores y no requiere UI nueva en C-06 (DU-1).

### D5 — `codigoPlano` viaja en el DTO canónico y se espeja en Zod

`TarjetaOrdenDTO` incorpora `readonly codigoPlano: string | null`; `construirTarjetaOrden` lo copia desde `OrdenTrabajo` sin derivarlo. Se refleja en `TarjetaOrdenSchema` (`z.string().max(80).nullable()`) de `backend/src/features/ordenes/http/esquemas.ts`, en `DetalleOpSchema` (que lo hereda) y en `EsquemaTarjetaOrden` de `frontend/src/shared/domain-client/esquemas.ts` con `z.ZodType<TarjetaOrdenDTO>` para que el compilador exija el campo. `opExistente` y el placeholder `Opcional — Ej: PL-2026-045` se documentan en los esquemas de request/response y en Swagger.

*Alternativas descartadas:* derivar un `planoVisible` en el DTO (sería un derivado de presentación duplicado); agregar el campo solo al frontend (la respuesta no lo traería); `any` en `json()` para esquivar el espejo (R9). *Trade-off:* cualquier cambio del DTO exige tocar tres esquemas; es el precio de una frontera validada y es verificable por typecheck.

### D6 — Transacción única con puertos por feature y derivados en dominio

Los casos de uso `createOp`, `updateOp`, `altaCliente` y `gestionarEtapas`, más el alta de materiales, se organizan en `backend/src/features/ordenes/application/` y sus slices relacionadas. Se introduce el puerto `UnidadTrabajoOps` en `ordenes/application/ports/` con una firma tipada que entrega repositorios ya enlazados a la transacción; la implementación en `ordenes/prisma/` usa `PrismaClient.$transaction` con `Prisma.TransactionClient`, sin filtrar tipos por `any`. La transacción de alta cubre: resolver/crear cliente por nombre (reutilizar el existente, nunca borrarlo por DD-06), insertar OP con `codigo_plano` normalizado, insertar etapas desde `configuracion.etapas_default` con `horas_vendidas` y secuencia, e insertar materiales del payload. Errores de validación (422) se detectan antes de abrir la transacción.

Los derivados `horas_vendidas_totales` (Σ etapas), `costo_materiales_cotizado` (Σ cantidad × cotizado) y `costo_materiales_real` (Σ cantidad × COALESCE(real, cotizado)) se calculan con funciones puras en `packages/domain/src/` (RN-HORAS-01, RN-MARGEN-02/03) sobre los datos leídos; nunca se escriben columnas. `avance`, `semaforo` y `etapaAhora` siguen siendo responsabilidad de las funciones ya existentes (RN-AVANCE-01, RN-SEMAFORO-01..05, RN-AHORA-01).

*Alternativas descartadas:* transacción en el handler HTTP (mezcla capas); `Promise.all` de inserts sin transacción (deja OP sin etapas ante fallo); agregados como columnas o triggers que replican reglas fuera del dominio (R3/RN-GLOBAL-02). *Trade-off:* la firma del puerto de unidad de trabajo es más verbosa que un `$transaction` directo; se acepta para mantener R2 y testeabilidad.

### D7 — Etapas: superficie de escritura y unicidad de nombres

Se habilitan `POST /api/ops/:id/etapas` (alta), `PATCH /api/ops/:id/etapas/:etapaId/orden` (reorden) y `DELETE /api/ops/:id/etapas/:etapaId` (baja), conservando `PATCH .../etapas/:etapaId` de C-04 para `completada`. El nombre es texto libre por OP (RN-ETAPA-03) y se valida **único dentro de la OP, sin distinción de mayúsculas**, en `gestionarEtapas` y en el alta transaccional, incluida la precarga desde `etapas_default`: es la validación que C-05 (D10) dejó explícitamente pendiente y sostiene el badge `ahora` por nombre. El reorden recalcula `orden_secuencia` de forma contigua y devuelve etapas frescas para que el dominio recalcule `avance`/`etapaAhora` sin perder `horas_vendidas`. No se agrega renombrar etapa: DU-3 descarta ese endpoint en C-06 y C-07 solo prevé agregar/quitar/reordenar.

*Alternativas descartadas:* agregar `etapaAhoraId` al DTO (cambia C-04/C-05 fuera de scope); taxonomía cerrada (RN-ETAPA-03); borrar y recrear todas las etapas en cada reorden (pierde ids y rompe referencias futuras de horas). *Trade-off:* la unicidad por nombre limita tener dos etapas con el mismo texto en una OP; es la regla ya adoptada y no se renegocia acá.

### D8 — Materiales: alta y agregados derivados, sin edición en C-06

`materiales_orden` se llena con `POST /api/ops/:id/materiales` y con la colección incluida en el alta transaccional de OP. Cada ítem valida `tipo ∈ {MP, INSUMOS, TERCERIZADOS}`, `descripcion` no vacía, `cantidad > 0`, `costo_unitario_cotizado >= 0`, `costo_unitario_real` opcional `>= 0`, y longitudes de remito/factura/nt/po. `GET /api/ops/:id` pasa a devolver esos ítems en `materiales` (antes `never[]`) con los agregados calculados; `horas` sigue `never[]` hasta C-08. No se definen `PUT`/`PATCH`/`DELETE` de materiales: DU-2 limita C-06 a alta, visualización y agregados derivados, y difiere la corrección o baja de ítems a un change posterior.

*Alternativas descartadas:* JSONB (DD-05); agregados guardados en la OP (R3); exponer edición "por si acaso" (scope extra sin respaldo documental). *Trade-off:* corregir un material cargado requiere intervención directa hasta que se habilite EDICIÓN; se explicita para que C-07 no prometa edición.

### D9 — Errores HTTP y documentación Swagger

Los esquemas Zod de request generan `z.toJSONSchema(..., { target: 'draft-07' })` como en C-04. Errores: 422 para validación de forma (Zod, ya cubierto), 409 para `numero_op_duplicado` y `codigo_plano_duplicado`, 404 para OP/etapa inexistente (`RecursoNoEncontradoError`) y 422 para cliente con nombre vacío. `app.ts` agrega una rama tipada para los nuevos errores antes del `reply.send(error)` genérico; el contrato 409 se documenta en el `response` del `POST`/`PUT` de OP. No se agrega autenticación ni cabeceras de usuario (R5).

*Alternativas descartadas:* códigos 400 genéricos (C-04 ya fijó 422); `try/catch` por handler (duplica mapeo); mensajes de error de plano sin `opExistente` (C-07 no podría ofrecer el acceso a la OP existente; en el 409 de `numero_op` DU-4 sí excluye ese campo). *Trade-off:* el handler conoce errores de dominio compartidos; es un punto centralizado y testeable, no una capa de infraestructura nueva.

### D10 — Safety net, TDD y guardianes arquitectónicos

Antes de escribir código se ejecuta sin modificarlos el suite actual de `packages/domain`, `backend` y `frontend` (C-01..C-05) como safety-net baseline. Cada capability sigue RED → GREEN → TRIANGULATE (≥2 casos) → REFACTOR con trazabilidad `RN-XX-NN` en el nombre del test (RN-GLOBAL-04). Los tests puros de normalización, costos y etapas no necesitan BD; los de atomicidad, unicidades, vacío ⇒ NULL, 409, P2002, reorden y búsqueda usan `crearContenedorPostgres()` con `postgres:18.7` (R10). Guardianes: cero imports de Fastify/Prisma/React/exceljs en `packages/domain` y `$transaction`/`Prisma.` fuera de adaptadores; cero `any` mediante typecheck estricto; cero auth. No se corren builds ni commits (regla global y de proyecto).

*Alternativas descartadas:* mocks de Prisma (R10); snapshots sin aserciones semánticas; escribir implementación antes del test rojo (R1). *Trade-off:* levantar el contenedor hace el ciclo más lento; se compensa con tests puros para reglas y una sola infraestructura reutilizada.

### D11 — Excel queda fuera: dependencia aguas abajo, no código

El mapeo del ID de plano en `A - OP-MASTER.xlsx` (`O7:R8`, etiqueta `ID Plano:`, valor o `S/P`, nunca `J7:N8`) pertenece a C-15 y está bloqueado por el spike C-13/IN-08 (enlace externo de ~577 KB, ruta UNC y confirmación del rango real). En este change solo se persiste y transporta el dato; no se crean adaptadores `excel`, no se instala `exceljs` en ningún módulo nuevo y no se escribe código de plantillas (R6).

*Alternativas descartadas:* "adelantar" el mapeo para ahorrar un change (rompe dependencias y R6); usar `J7:N8` (es `PC N°:`). *Trade-off:* C-15 no podrá cerrarse hasta C-13; es un bloqueo documentado, no una omisión.

### D12 — Gobernanza MEDIO: decisiones explícitas y cerradas

Se implementa por capabilities independientes, cada una con su gate RED/GREEN/TRIANGULATE/REFACTOR y su verificación de reglas duras. Las decisiones de usuario ya tomadas (las nueve del pedido original más las cinco registradas abajo) son entradas cerradas: no se reabren en apply. No queda ninguna pregunta abierta sobre filtro de plano, alcance de materiales, renombrar etapas ni cuerpo del 409 de `numero_op`.

*Alternativas descartadas:* elegir y callar los bordes de materiales/etapas (riesgo de implementar scope de más con gobernanza MEDIO); mantener provisiones de trabajo (el usuario ya resolvió esos bordes y el apply debe arrancar sin ambigüedad). *Trade-off:* la edición de materiales y el renombrado de etapas quedan para changes posteriores; C-06 entrega solo el alcance confirmado.

## Risks / Trade-offs

- **[Prisma no modela CHECK ni índices parciales] →** D1 mantiene las restricciones en SQL 002, como ya hace la migración 001; se revisa el DDL antes de aplicar y los tests de integración fallan si la restricción no existe (R10).
- **[Carrera entre verificación e INSERT] →** D3 combina `buscarPorCodigoPlano` con captura de `P2002`; se testea con dos escrituras concurrentes sobre la BD real.
- **[Editar una OP con el mismo plano] →** `buscarPorCodigoPlano(codigo, opIdExcluida)` evita el falso 409; escenario obligatorio en el test de `updateOp`.
- **[Reorden sin perder `horas_vendidas`] →** D7 actualiza solo `orden_secuencia`, nunca reconstruye filas; se verifica con etapas con horas vendidas distintas de cero.
- **[Regresión del contrato del tablero] →** D5 espeja el DTO en tres esquemas y la safety-net corre `App.tablero.test.tsx`, `esquemas.test.ts` y `tipos.test.ts` sin modificarlos.
- **[Falso conflicto por normalización] →** D2 normaliza antes de comparar; se prueban `" pl-2026-045 "`, `"PL-2026-045"` y `""` ⇒ `null`.
- **[Reapertura de decisiones ya cerradas] →** DU-1..DU-5 fijan el filtro, el alcance de materiales, las etapas y el contrato 409; el apply no vuelve a preguntar ni inventa reglas nuevas.
- **[IN-08 / C-13 / C-15] →** bloqueo aguas abajo; no se implementa Excel acá ni se relaja el rango `O7:R8`.
- **[DD-07 / R5] →** sin auth; cualquier requerimiento de roles se escala, nunca se codifica.

## Migration Plan

No hay despliegue de datos: la base del MVP está vacía y la migración es aditiva. Rollback: revertir el código del change y aplicar una migración de reversión que elimine el índice parcial, el CHECK, la columna y la tabla (no se renombra ni se renumera 001).

1. Verificar punto de partida: C-05 archivado, `openspec list --json` sin changes activos además de este, HEAD y working tree según el informe de propose, y `CHANGES.md` con C-06 en `[ ]` (el checkbox se marca al archivar, no antes).
2. Safety net: ejecutar los suites existentes de dominio, backend y frontend **sin modificarlos**; capturar resultado como baseline (D10).
3. RED: tests puros de `CodigoPlano`, costos de materiales y unicidad de nombres de etapa; evidenciar fallo por módulos ausentes (R1).
4. GREEN: migración 002 + modelo Prisma + tipos de dominio + normalización; generar cliente con Prisma 7.10.1 y correr tests de esquema contra `postgres:18.7`.
5. GREEN: puertos y adaptadores (incluido `UnidadTrabajoOps`) y casos de uso; integración transaccional con PostgreSQL real, sin mocks (R10).
6. TRIANGULATE: normalización con case/espacios, vacío ⇒ NULL, doble plano, P2002, edición con la misma OP, cliente reutilizado, reorden con horas, costos con `costo_unitario_real` presente/ausente, búsqueda por plano/cliente y filtro con/sin plano.
7. GREEN: endpoints, errores 409/422/404 y Swagger; espejo Zod backend/frontend; verificar que ningún adapter nuevo rompe R2.
8. REFACTOR: extraer mapeos y validaciones repetidas sin tocar aserciones; typecheck de los tres workspaces, cero `any`, guardianes de imports y cero auth. Sin builds ni commits.
9. Cerrar con `openspec validate ordenes-y-linea-base-api --strict` y `openspec status --change ordenes-y-linea-base-api --json` con todos los artefactos en `done`; recién entonces `/opsx:apply`.

## Decisiones del usuario (2026-11-21)

- **DU-1 — Filtro de plano, resuelta:** se confirma el query param `conPlano=true|false`, booleano validado en Zod. Se rechazan `estadoPlano=con|sin` y dos flags separados. Consecuencia: D4 y las specs `busqueda-por-plano`/`api-listado-ops` quedan con ese único parámetro; `true` exige plano, `false` exige `codigoPlano === null`, y C-06 no agrega UI nueva. La búsqueda textual sigue reutilizando `buscar`.
- **DU-2 — Alcance de materiales, resuelta:** C-06 incluye solo alta de materiales, visualización en el detalle y agregados derivados. Consecuencia: no se exponen `PUT`/`PATCH`/`DELETE` de ítems de material; la corrección o baja se difiere a un change posterior y C-07 no debe prometer edición.
- **DU-3 — Etapas, resuelta:** no se renombran etapas en C-06. Consecuencia: no hay endpoint de renombrado y se mantiene solo alta, baja, reorden y el `PATCH` de `completada` de C-04. En cambio, sí se valida la unicidad de nombres por OP sin distinguir mayúsculas en el alta, incluida la precarga desde `etapas_default`: es la validación que C-05 dejó pendiente.
- **DU-4 — Cuerpo del 409 por `numero_op` duplicado, resuelta:** `{ error: 'numero_op_duplicado', message, numeroOp }`, análogo al 409 de plano pero sin `opExistente`. Consecuencia: el handler y las specs de escritura y de conflictos usan ese cuerpo exacto; `numeroOp` identifica la OP y no se devuelve un objeto anidado.
- **DU-5 — Terminología del margen, resuelta:** el contrato code-facing usa `margenNeto` y la prosa usa "Margen Neto"; se retira la denominación obsoleta del dato de rentabilidad de documentos canónicos y artefactos. Consecuencia: HU-21 y CHANGES.md quedan alineados y C-17/C-18 no reciben dos nombres para el mismo dato.
- **Bloqueo aguas abajo (no es OQ de C-13):** C-15 no puede mapear `ID Plano:` / `S/P` en `O7:R8` hasta C-13/IN-08 confirme la plantilla real. Se registra para trazabilidad; C-06 no implementa ni especifica código Excel.
- **Heredadas sin impacto:** SU-05 (zona horaria), IN-02 (tasa por etapa) y DD-07 (auth de Fase 2) quedan como están; no se resuelven silenciosamente en este change.
