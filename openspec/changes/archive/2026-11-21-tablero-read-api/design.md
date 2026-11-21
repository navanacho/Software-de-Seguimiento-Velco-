## Context

C-03 quedó archivado con las reglas puras ya disponibles en `@velco/domain`: `construirTarjetaOrden` (`packages/domain/src/ordenes/tarjeta.ts`), `calcularAvance`, `etapaAhora`, `agruparFlujo` (`OrdenConEtapas[] → GrupoFlujo[]`), `calcularSemaforo`, `diasRestantes` y `etiquetaPlazo`. El DTO `TarjetaOrdenDTO` ya trae aplanados `avance`, `semaforo`, `diasRestantes`, `etapaAhora` y `etiquetaPlazo`, con `ContextoTarjeta = ContextoPlazo + clienteNombre?` donde `ContextoPlazo` exige `hoy`, `zonaHoraria`, `diasAlertaRiesgo` y `porcentajeAvanceRiesgo`.

Del lado backend existen los puertos `OpRepository` (`crear`, `buscarPorId`, `buscarPorNumeroOp`), `EtapaRepository` (`crearVarias`, `listarPorOrden`), `ClienteRepository` (`buscarPorId`, `buscarPorNombre`, `crear`) y `ConfiguracionRepository.obtener()`, con sus adaptadores Prisma. La app Fastify se arma hoy en `backend/src/features/salud/http/app.ts`, donde `buildApp(configuracion)` registra CORS, Swagger, `/documentation/json` y `GET /api/health` usando `z.toJSONSchema`. El esquema Prisma actual (migración 001) cubre `configuracion`, `clientes`, `ordenes_trabajo` y `etapas_orden`; **no** incluye `materiales_orden` (C-06) ni `registros_horas` (C-08).

C-04 es GATE 4 del camino crítico, governance **MEDIO**, depende de C-03 (satisfecho) y habilita C-05. La fuente de verdad es `CHANGES.md` §C-04, KB §API REST, Flujos 2 y 3, HU-05/06/07/09, §DTO de salida y §Regla de oro, RN-GLOBAL-02 y RN-GLOBAL-04. Los artefactos se redactan en español rioplatense técnico; R1/R2/R3/R5/R9/R10 rigen sin excepción.

## Goals / Non-Goals

**Goals:**

- Servir `GET /api/ops`, `GET /api/ops/:id` y `PATCH /api/ops/:id/etapas/:etapaId` con `TarjetaOrdenDTO` como contrato de derivados, sin recálculo en handlers ni en el frontend (RN-GLOBAL-02).
- Aplicar filtros de fecha, estado derivado, cliente, etapa `ahora` y búsqueda por N° de OP/pieza sobre tarjetas ya derivadas, devolviendo KPIs y conteos de flujo con `agruparFlujo`.
- Persistir únicamente `etapas_orden.completada`; recalcular avance, `ahora` y semáforo con las funciones puras de C-03 y responder 404 cuando la etapa pertenece a otra OP.
- Validar toda la frontera HTTP con esquemas Fastify derivados de `zod`, con 422 para inputs inválidos y 404 para recursos inexistentes; el handler solo valida y delega a casos de uso.
- Obtener umbrales de `configuracion` por su puerto (defaults RN-CONFIG-01 si no hay fila) e inyectar `hoy`/`zonaHoraria` desde el adaptador, nunca desde el dominio.
- Cubrir cada comportamiento con TDD RED → GREEN → TRIANGULATE (≥2 casos) → REFACTOR y trazar cada test a su RN-XX (R1, RN-GLOBAL-04); integración con PostgreSQL 18.7 real en contenedor (R10).
- Mantener `packages/domain/` intacto en sus dependencias (R2), sin `any` (R9), sin auth/PIN/RBAC (R5), sin derivados persistidos (R3), sin Excel (R6) y sin tocar `openspec/` a mano (R8).

**Non-Goals:**

- Modificar las funciones puras ni el DTO de C-03; este change los consume.
- UI de C-05; alta/edición de OP y materiales de C-06; partes de horas de C-08; desvíos y márgenes de C-11; exportación de C-14/C-15.
- Generar migraciones, columnas `GENERATED`, mocks de PostgreSQL, builds, commits ni cambios en `CHANGES.md` o changes archivados.
- Introducir autenticación, roles, PIN, tabla `usuarios` ni ocultamiento de montos: el MVP es un único usuario (R5, DD-07).
- Resolver silenciosamente las ambigüedades documentadas en Open Questions.

## Decisions

### D1 — Un único punto de registro, tres casos de uso por feature

Se conserva `buildApp` en `backend/src/features/salud/http/app.ts` como composition root para no romper los tests de C-01 que importan esa función. Dentro de `buildApp` se invocan `registrarRutasOrdenes(app, deps)` y `registrarRutasEtapas(app, deps)`, que registran las tres rutas nuevas; el handler de PATCH vive en `etapas/http/` pero delega en el caso de uso de `etapas/application/`. `main.ts` no cambia.

Los casos de uso son `listarOps` y `obtenerOp` en `ordenes/application/`, y `actualizarCompletada` en `etapas/application/`. Cada uno recibe sus puertos por inyección en un objeto `DependenciasApi` (`ops`, `etapas`, `clientes`, `configuracion`, `reloj`, `zonaHoraria`). El registro de rutas no contiene reglas de negocio: solo valida, llama al caso de uso y devuelve el DTO.

*Alternativas descartadas:* mover `buildApp` a `backend/src/app.ts` (obliga a reescribir los tests de C-01 sin beneficio funcional en este change); crear tres apps Fastify (CORS, Swagger y documentación quedarían duplicados); poner el PATCH en `ordenes/application` ( mezcla la feature de etapas con la de OP y rompe la slice). *Trade-off:* el composition root sigue ubicado de forma poco natural bajo `salud/http/`; se registra como deuda de estructura para un change futuro, no se refactoriza acá.

### D2 — Listado: derivar primero, filtrar después

`OpRepository` se amplía con `listarConEtapas(): Promise<readonly OrdenConEtapasYCliente[]>`, donde `OrdenConEtapasYCliente` es un tipo de `ordenes/application/ports` que agrega `clienteNombre: string` a la forma `{ orden, etapas }` que ya consume `agruparFlujo`. El adaptador Prisma hace un solo `findMany` con `include: { etapas: { orderBy: { ordenSecuencia: 'asc' } }, cliente: true }`, mapea `Prisma.Decimal` a `string` con `toFixed(2)` y fechas a `YYYY-MM-DD`, como ya hacen `PrismaOpRepository` y `PrismaEtapaRepository`.

`listarOps` construye una `TarjetaOrdenDTO` por fila con `construirTarjetaOrden(...)` y **después** aplica los filtros sobre el DTO: `estado` compara `semaforo`, `etapaAhora` compara el campo derivado, `clienteId` es exacto, `buscar` es substring case-insensitive sobre `numeroOp` + `descripcionPieza`, y `fechaDesde`/`fechaHasta` comparan `fechaEntrega` (decisión provisoria OQ-1). El cuerpo responde `{ ops: TarjetaOrdenDTO[], kpis: { total, porEstado }, flujo: GrupoFlujo[] }`; `flujo` sale de `agruparFlujo` sobre las tarjetas **antes** de filtrar, para que la tira *"Dónde está cada trabajo ahora"* siga reflejando el tablero completo, y `porEstado` incluye los cuatro valores de `EstadoSemaforo` con cero cuando corresponde.

*Alternativas descartadas:* traducir `estado` a SQL (exigiría persistir el semáforo, prohibido por R3) o filtrar `etapaAhora` con un JOIN a la primera pendiente (duplica RN-AHORA-01 en Prisma y rompe RN-GLOBAL-02); obtener los nombres de cliente con `buscarPorId` por OP (N+1). *Trade-off:* se deriva en memoria para todas las OPs candidatas; con el volumen del MVP es aceptable y no hay caché ni paginación (fuera de alcance).

### D3 — Detalle: contrato estable, fuentes de horas y materiales todavía inexistentes

`obtenerOp(id)` reutiliza `OpRepository.buscarPorId` + `EtapaRepository.listarPorOrden` + `ClienteRepository.buscarPorId` y compone un `DetalleOpDTO` que **extiende** `TarjetaOrdenDTO` con `fechaIngreso`, `fechaEntrega`, `montoVendido`, `observaciones`, y los campos `horas` y `materiales`. Las etapas ya incluyen `horasVendidas` en el dominio (`EtapaOrden.horasVendidas`), así que ese dato sí está disponible hoy; se expone dentro de `etapas` sin calcular derivados nuevos.

Las tablas `registros_horas` y `materiales_orden` **no existen** en la migración 001: pertenecen a C-08 y C-06, posteriores a C-04 en el roadmap. Para no bloquear C-05 ni romper el contrato que reutilizarán HU-14/15/16, `horas` y `materiales` se devuelven hoy como arreglos vacíos tipados (`readonly never[]` en el tipo concreto del DTO, documentado como "pendiente de C-08/C-06"), sin valores inventados ni columnas nuevas. La resolución provisoria quedó registrada en OQ-3 y fue **confirmada por el usuario el 2026-11-21**; el contrato se revisará cuando C-06 y C-08 creen las tablas, sin adelantar migraciones en este change.

*Alternativas descartadas:* omitir los campos del DTO (obliga a cambiar el contrato en C-05/C-12); adelantar las migraciones de C-06/C-08 (rompe atomicidad del roadmap y las dependencias); devolver datos de ejemplo (violaría R3/RN-GLOBAL-02 y daría señales falsas al frontend). *Trade-off:* el detalle expone un contrato con dos colecciones vacías transitoriamente; está explicitado en Swagger y en la spec `api-detalle-op` para que nadie lo interprete como "la OP no tiene horas".

### D4 — PATCH: una sola escritura y recálculo posterior

`actualizarCompletada({ ordenId, etapaId, completada })` verifica la OP con `buscarPorId`, obtiene la etapa con el nuevo `EtapaRepository.buscarPorId` y responde 404 si la etapa no existe o si `etapa.ordenId !== ordenId`. Luego llama a `actualizarCompletada(etapaId, completada)` en el puerto (un `UPDATE` de una sola columna) y reconstruye la tarjeta con `construirTarjetaOrden` usando etapas frescas. El cuerpo de respuesta es la tarjeta recalculada.

Con `completada: true` en la última pendiente, el dominio produce avance 100, `etapaAhora = 'Todo listo'` y semáforo `Terminado` (RN-AVANCE-02, RN-AHORA-01, RN-SEMAFORO-01). Con `completada: false` sobre una OP terminada, vuelve a estado activo y recupera su etapa `ahora` (Flujo 3, caso de error documentado). Ningún derivado se escribe: el guardián `ubicacion-reglas.test.ts` y la búsqueda de columnas derivadas lo verifican.

*Alternativas descartadas:* recalcular en el handler con aritmética propia (rompe RN-GLOBAL-02); guardar `porcentaje_avance` o `semaforo` en la fila (rompe R3); responder solo `{ ok: true }` (obliga al frontend a recalcular o a hacer un segundo viaje). *Trade-off:* la respuesta incluye etapas y derivados aunque el checkbox solo cambió un booleano; es el mismo contrato de C-05 y evita dos implementaciones.

### D5 — Frontera: zod para validar y documentar, 422 para errores de input

Siguiendo el patrón de `/api/health`, cada ruta adjunta `schema.querystring`/`schema.params`/`schema.body` construidos con `z.toJSONSchema(...)` para que `@fastify/swagger` documente el contrato. Los esquemas zod viven en `ordenes/http/esquemas.ts` y `etapas/http/esquemas.ts`, se registran como `preValidation` de la ruta y hacen `.parse()` antes del handler: fechas `YYYY-MM-DD` con verificación de calendario real (rechaza `2026-02-30`), rango `fechaDesde <= fechaHasta`, `estado` como enum exacto de `EstadoSemaforo`, `clienteId` UUID, `etapaAhora` y `buscar` con longitud 1..100, IDs UUID y body `{ completada: boolean }` con `additionalProperties: false`.

Un `setErrorHandler` en `buildApp` traduce los errores de validación a HTTP 422 con cuerpo `{ error: 'validation_error', message, details }`, y los recursos inexistentes a 404 con `{ error: 'not_found', message }`. Verificar fecha, rango, UUID y forma del body es validación de frontera, no regla de negocio; las reglas RN siguen vivas en el dominio y en los casos de uso.

*Alternativas descartadas:* confiar solo en el `pattern` de AJV (no detecta fechas imposibles ni el orden del rango); validar dentro del caso de uso (mezcla responsabilidades y hace que los tests de dominio dependan de HTTP); dejar el 400 por defecto de Fastify (HU-01 y C-06 ya establecieron 422 para datos inválidos). *Trade-off:* zod y AJV validan dos veces la forma; se acepta para mantener documentación y runtime alineados con el patrón ya instalado.

### D6 — Contexto: configuración real, reloj inyectado, TZ explícita

Un helper `contextoTarjeta(deps)` en `configuracion/application/` lee `ConfiguracionRepository.obtener()`; si devuelve `null`, aplica los defaults de RN-CONFIG-01 (`diasAlertaRiesgo = 3`, `porcentajeAvanceRiesgo = 80`, `etapasDefault` estándar) sin insertar la fila. `zonaHoraria` surge de la configuración del servidor, que se amplía para leer `TZ` con default `America/Argentina/Mendoza` (SU-05, pendiente de confirmación).

El puerto `Reloj` expone `ahora(): Date`; el adaptador de producción devuelve `new Date()` y los tests inyectan un reloj fijo. La conversión del instante a `YYYY-MM-DD` dentro de la zona se hace en el adaptador con `Intl.DateTimeFormat(...).formatToParts`, porque `ContextoPlazo.hoy` es una fecha calendaria y C-03 prohíbe pasar `process.env` o relojes implícitos al dominio. Se agrega un test de integración que cambia la zona inyectada y verifica que el semáforo cambia con el parámetro, no con el entorno.

*Alternativas descartadas:* leer `process.env.TZ` en el dominio (rompe R2 y la pureza); usar `new Date().toISOString().slice(0, 10)` en el adaptador (interpretación UTC: el error de desplazamiento de día que C-03 evitó); hardcodear los umbrales (RN-CONFIG-02). *Trade-off:* la conversión de fecha existe en el adaptador y en el helper privado de C-03; no se extrae al dominio para no modificar su API en este change, y se cubre con tests.

### D7 — TDD verificable y base de datos real

Las tareas se ordenan por comportamiento con gate explícito RED → GREEN → TRIANGULATE (mínimo 2 casos, más los de borde: OP terminada excluida del flujo, etapa ajena, desmarcar reactiva) → REFACTOR. Los tests de casos de uso usan fakes **de puertos** en memoria (permitidos: R10 prohíbe mocks de PostgreSQL, no de interfaces de aplicación). Los tests de integración viven en `backend/test/tablero-read-api/`, reutilizan `conBase` y `hayDocker` de `backend/test/core-order-models/contenedor.ts`, levantan la imagen `postgres:18.7` con `@testcontainers/postgresql`, aplican la migración 001 y el seed, y ejercitan las rutas con `app.inject` contra un `PrismaClient` real. El patrón `skipIf(!hayDocker())` se mantiene por coherencia con C-02, pero **nunca** se sustituye el contenedor por un mock.

*Alternativas descartadas:* tests HTTP con repositorios falsos como única evidencia (no verifica SQL ni restricciones); tests de integración con SQLite (el esquema usa UUID, JSONB y `TIMESTAMPTZ`, descartado en DD-01); un único test por endpoint (no triangula y rompe R1). *Trade-off:* cada suite de integración paga el arranque del contenedor; `fileParallelism: false` ya está configurado en `backend/vitest.config.ts`.

## Risks / Trade-offs

- **[C-04 pide horas y materiales que no existen en la BD actual] →** D3 define el contrato con arreglos vacíos tipados y lo registra como OQ-3; el agente NO debe adelantar migraciones de C-06/C-08 ni inventar datos. El usuario confirmó este criterio el 2026-11-21; si C-06/C-08 definen otro, la spec se actualizará en ese change.
- **[Filtro de estado implementado como columna] →** D2 filtra sobre `TarjetaOrdenDTO.semaforo`; un test de integración inserta una OP cuya fecha la pondría `Atrasado` pero con avance 100 y exige que responda al filtro `Terminado`.
- **[El flujo cuente OP terminadas] →** `agruparFlujo` ya las excluye; el test de KPIs usa el mismo conjunto de OPs antes de filtrar y verifica que la terminada no aparece.
- **[Rango de fechas ambiguo] →** OQ-1; implementación provisoria sobre `fechaEntrega` y test que lo documenta, sin silenciar la duda.
- **[Ordenamiento esperado por HU-09 pero ausente en el scope] →** OQ-2; orden determinista por `fechaEntrega` ascendente y `numeroOp` como desempate, sin parámetro `sort` hasta confirmación.
- **[El handler se llene de reglas "pequeñas"] →** D5 unhappy-path de validación en `preValidation` y caso de uso para todo lo demás; revisión de que el handler solo contenga `parse`, llamada y respuesta, más el guardián de ubicación de reglas.
- **[Cambio de TZ sin confirmar] →** SU-05 queda como Open Question; la zona viaja por configuración y el dominio no cambia si se corrige.
- **[Tests que pasan sin ejecutarse por falta de Docker] →** se reporta explícitamente el `skip` en el resultado de la corrida; la evidencia de integración válida es con contenedor activo.
- **[Regresión de C-01 al tocar `buildApp`] →** los tres tests de `health.test.ts` se ejecutan sin modificación como primer gate de la secuencia de implementación.

## Migration Plan

No hay migración de base de datos: la única escritura es `UPDATE etapas_orden SET completada = ...`, ya cubierta por la migración 001. No hay datos que convertir ni rollback de esquema.

1. Confirmar C-03 archivado, `openspec list --json` sin changes activos además de este y que `CHANGES.md` aún tiene C-04 en `[ ]` (R8).
2. RED: escribir primero los tests HTTP/casos de uso de validación y del listado; ejecutar Vitest y evidenciar el fallo por módulos ausentes.
3. GREEN: ampliar puertos y adaptadores Prisma, agregar `contextoTarjeta`, `Reloj`, casos de uso y esquemas; registrar las tres rutas dentro de `buildApp` sin tocar la health; ejecutar tests tras cada grupo.
4. TRIANGULATE: agregar los casos de borde —rango inválido, etapa de otra OP, desmarcar una OP terminada, filtro por semáforo derivado, flujo sin terminadas— ejecutando la suite en cada inserción.
5. Integración: levantar el contenedor PostgreSQL 18.7 con `conBase`, sembrar OPs/etapas/clientes y verificar filtros, detalle y PATCH sobre datos reales; sin mocks.
6. REFACTOR: extraer helpers de contexto y mapeo sin tocar aserciones; ejecutar suite completa de backend y dominio.
7. Verificar `npm run typecheck -w @velco/backend` y `-w @velco/domain`, búsqueda de imports prohibidos en `packages/domain/src`, cero `any`, cero columnas derivadas, cero auth y cero `.xlsx` nuevos; sin builds ni commits.
8. Cerrar con `openspec validate tablero-read-api --strict` y `openspec status --change tablero-read-api --json` con todos los artefactos en `done`. El checkbox de `CHANGES.md` se marca recién al archivar.

## Open Questions

- **OQ-1 (Media, bloqueante para el criterio de filtro; decidida provisoriamente en D2):** ¿`fechaDesde`/`fechaHasta` filtran por `fecha_ingreso` o por `fecha_entrega`? El tablero de HU-05 ordering por entrega sugiere `fecha_entrega`; la KB no lo explicita. No resolver sin confirmación: implementar con `fecha_entrega` y dejar constancia en el test y en Swagger.
- **OQ-2 (Media):** HU-09 se titula *Filtros, Búsqueda y Ordenamiento* pero el scope de C-04 no menciona `sort` ni `order`. ¿Se incluye ordenamiento configurable en este change o se difiere a C-05? Provisoriamente: orden fijo `fechaEntrega` ↑, `numeroOp` ↑.
- **OQ-3 (Alta, inconsistencia de roadmap):** C-04 exige horas y materiales en `GET /api/ops/:id`, pero esas tablas llegan en C-08 y C-06 y C-04 solo depende de C-03. Resuelto: contrato con arreglos vacíos y horas vendidas disponibles dentro de `etapas`, **confirmado por el usuario el 2026-11-21**; la revisión definitiva se difiere a C-06/C-08.
- **OQ-4 (Baja):** los valores de `estado` son literales con espacio y tilde (`En riesgo`, `En plazo`). ¿Se mantienen como enum exacto del dominio en la query string o se definen códigos URL-friendly? Provisoriamente se mantienen los literales, codificando el espacio en la URL.
- **SU-05 (Media, heredada de C-03):** confirmar que la zona horaria efectiva es `America/Argentina/Mendoza`. Se inyecta por configuración, así que cambiarla no afecta al dominio.
- **IN-08 (Alta, spike C-13) y DD-07 (Alta, auth de Fase 2):** siguen diferidos; no tienen impacto en este change y no se resuelven silenciosamente.
