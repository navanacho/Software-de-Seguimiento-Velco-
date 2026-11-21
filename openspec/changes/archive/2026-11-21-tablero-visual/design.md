## Context

C-04 quedó archivado (`b51be29`) con tres endpoints listos y el dominio canónico en `@velco/domain`: `construirTarjetaOrden`, `etapaAhora`, `agruparFlujo`, `calcularSemaforo`, `diasRestantes` y `etiquetaPlazo`. El DTO `TarjetaOrdenDTO` ya trae aplanados `avance`, `semaforo`, `diasRestantes`, `etapaAhora` (string) y `etiquetaPlazo`, además de `etapas: readonly EtapaTarjeta[]` con `{ id, nombre, ordenSecuencia, completada }`. `GET /api/ops` responde `{ ops, kpis: { total, porEstado }, flujo: GrupoFlujo[] }` y `PATCH /api/ops/:id/etapas/:etapaId` responde la tarjeta recalculada.

Hoy `frontend/src/app/App.tsx` solo monta `Salud` (C-01) en `/` y `/salud`; el frontend no tiene feature `tablero` ni cliente HTTP de OPs. C-05 es el primer cambio de UI del roadmap, governance **BAJO**, dependencia C-04 satisfecha. Fuentes: `CHANGES.md` §C-05, KB §Principios de producto, §Container/Presentational, §Estructura de directorios, HU-05/06/07/09, Flujo 2, RN-GLOBAL-01, RN-GLOBAL-02, RN-AVANCE-01/02, RN-AHORA-01, RN-FLujo-01, RN-SEMAFORO-01..06. R1/R2/R3/R5/R8/R9/R10 rigen sin excepción; todo se redacta en español rioplatense técnico.

Hallazgo relevante previo al diseño: los tipos del envelope (`RespuestaListadoOps`, `KpisListadoOps`) y `DetalleOpDTO` viven en `backend/src/features/ordenes/application/`, **no** en `@velco/domain`; en cambio `TarjetaOrdenDTO`, `EtapaTarjeta`, `GrupoFlujo`, `EstadoSemaforo` y `ContextoTarjeta` sí se exportan desde el paquete de dominio. El diseño respeta esa frontera sin inventar campos nuevos.

## Goals / Non-Goals

**Goals:**

- Montar el tablero en `/` con grilla única de tarjetas, KPIs superiores, tira de flujo, filtros, búsqueda y estado vacío, con la estética industrial del prototipo (HU-05/06/07/09).
- Renderizar los derivados del `TarjetaOrdenDTO` sin calcularlos ni comparar fechas en React (RN-GLOBAL-02).
- Marcar la etapa `ahora` y alternar `completada` con mutación optimista y rollback, tomando los valores autoritativos del `PATCH` (Flujo 3).
- Mantener `shared/domain-client` como adaptador HTTP delgado: tipos canónicos importados de `@velco/domain`, validación zod de frontera y cero reglas de negocio (R2, R9).
- Cubrir cada comportamiento con tests de componente (Testing Library + jsdom) en TDD estricto RED → GREEN → TRIANGULATE (≥2 casos) → REFACTOR, con trazabilidad RN-XX en cada test (R1, RN-GLOBAL-04).
- No tocar dominio, backend, base de datos, `.xlsx`, `CHANGES.md` ni changes archivados; sin auth/PIN/RBAC (R5), sin `any` (R9), sin builds ni commits.

**Non-Goals:**

- Modificar `packages/domain/` ni las firmas de C-03/C-04; el DTO se consume, no se reformula.
- Agregar campos al DTO (por ejemplo un `etapaAhoraId`), endpoints nuevos (`GET /api/clientes`) ni parámetros de ordenamiento no previstos en C-04.
- Implementar alta/edición de OP, imputación de horas, rentabilidad, exportación, modo TV/kiosco (HU-08) ni auth (HU-19).
- Columnas Kanban, slider de avance, cálculo local del semáforo ni persistencia de derivados (RN-GLOBAL-01, R3).
- Tests de integración con PostgreSQL: C-05 no escribe en BD y los mocks de PostgreSQL están prohibidos (R10).

## Decisions

### D1 — Routing: montar el tablero en `/` conservando el composition root actual

`App.tsx` ya crea un `QueryClient` y un `MemoryRouter` con rutas `/` y `/salud`. Se agrega el componente contenedor `TableroPage` en `/` (y se conserva `/salud` intacto) sin reemplazar el proveedor de TanStack Query ni cambiar el `QueryClient` por sesión. El primer gate de implementación es ejecutar `App.test.tsx` y `convenciones.test.ts` sin modificación: cualquier regresión de C-01 se detecta antes de escribir la feature.

*Alternativas descartadas:* crear un router nuevo (obliga a reescribir los tests de C-01); usar `BrowserRouter` (cambia el entorno de test y no aporta al MVP). *Trade-off:* el tablero convive con la ruta de salud hasta que un change futuro limpie el scaffold; no se hace esa limpieza acá.

### D2 — Contenedor/Presentational con una sola query de listado

`TableroPage` es el contenedor: obtiene el envelope con `useTablero(filtros)` (`useQuery` con `queryKey: ['tablero', filtros]`) y pasa `ops`, `kpis` y `flujo` por props a `KpisTablero`, `TiraFlujo`, `GrillaTarjetas` y `TarjetaOrden`. `TarjetaOrden` es puramente presentacional: recibe un `TarjetaOrdenDTO` y un handler `onAlternarEtapa` por prop; no llama a `fetch`, `useQuery` ni `useMutation`. El hook `useActualizarEtapa` concentra la mutación bajo `features/tablero/hooks/`.

*Alternativas descartadas:* fetch dentro de cada tarjeta (N peticiones y acoplamiento); pasar la respuesta cruda a la tarjeta sin validar (mezcla transporte con presentación); almacenar filtros en una store global (no hay estado global en el stack y el query key ya los representa). *Trade-off:* el query key serializa los filtros, por lo que cada combinación cachea su propia respuesta; con el volumen del MVP es aceptable, no hay paginación.

### D3 — `shared/domain-client`: tipos canónicos + envelope de transporte compuesto

`frontend/src/shared/domain-client/` importa `TarjetaOrdenDTO`, `EtapaTarjeta`, `GrupoFlujo` y `EstadoSemaforo` desde `@velco/domain` y declara **únicamente** los tipos de transporte que el dominio no exporta: `RespuestaListadoTablero = { ops: readonly TarjetaOrdenDTO[]; kpis: { total: number; porEstado: Record<EstadoSemaforo, number> }; flujo: readonly GrupoFlujo[] }`. Un esquema zod valida ese envelope y la respuesta del `PATCH` antes de entregarla a la UI; las rutas se construyen con `URLSearchParams` a partir del objeto de filtros. Se sigue el patrón de `consultarSalud(consulta = fetch)` para inyectar `fetch` en tests.

Los tipos `RespuestaListadoOps`/`KpisListadoOps` de C-04 están en la capa de aplicación del backend; importarlos desde el frontend acoplaría las capas y violaría la separación por feature. `DetalleOpDTO` **permanece en backend** (`backend/src/features/ordenes/application/`) porque incluye placeholders provisionales `readonly never[]` para horas/materiales de C-06/C-08; C-05 no lo consume. El envelope del frontend es un **tipo de transporte compuesto** desde tipos canónicos del dominio: no redefine campos derivados ni reglas de `TarjetaOrdenDTO`/`GrupoFlujo`/`EstadoSemaforo`.

La enmienda de la spec `dto-derivados-orden` vía delta C-05 (OQ-2) clarifica que la prohibición aplica a reglas derivadas y DTOs canónicos, no a envelopes de transporte compuestos desde esos tipos.

*Alternativas descartadas:* redefinir `TarjetaOrdenDTO` en el frontend (prohibido por RN-GLOBAL-02); importar tipos desde `backend/src/features/...` (acoplamiento frontend—backend y rompe la slice); `any` para el `json()` (R9); promover el envelope a `@velco/domain` ahora (modificaría C-04/dominio fuera de scope). *Trade-off:* el envelope existe como composición en frontend y como tipo de aplicación en backend; la spec enmendada y la tarea 2.2/9.x impiden que la composición redefina campos canónicos.

### D4 — Semáforo y plazo: mapeo presentacional, nunca cálculo

La tarjeta mapea `semaforo` a una clase CSS de `TarjetaOrden.module.css`: `Terminado`→gris, `Atrasado`→rojo, `En riesgo`→amarillo, `En plazo`→verde (RN-SEMAFORO-01..05). `avance`, `diasRestantes` y `etiquetaPlazo` se interpolan tal cual llegan; por ejemplo `etiquetaPlazo = "Faltan 2 días"` se muestra textualmente (RN-SEMAFORO-06). El código de colores y el orden de precedencia ya vienen resueltos del dominio. Un test de guardián verifica que no aparezcan imports de `calcularSemaforo`, `diasRestantes`, `etapaAhora` ni `construirTarjetaOrden` en `frontend/src/features/tablero/` ni en `shared/domain-client/`, y que no se comparen fechas con `new Date()`.

*Alternativas descartadas:* recalcular el semáforo en el cliente "para ahorrar un viaje" (segunda implementación, rompe RN-GLOBAL-02); guardar el color en la caché como dato derivado (R3). *Trade-off:* la UI depende de que el backend mantenga el enum exacto; zod valida el enum para fallar temprano si cambia.

### D5 — Badge `ahora`: igualdad contra el campo derivado del DTO

`etapaAhora` es un **string con el nombre** de la primera etapa pendiente (o `'Todo listo'`), no un id. El badge se asigna cuando `etapa.nombre === tarjeta.etapaAhora && !etapa.completada`; con `'Todo listo'` no se muestra ningún badge. Esto es un mapeo presentacional de un campo ya derivado, no una reimplementación de RN-AHORA-01: la UI no itera para elegir la primera pendiente ni define su propia regla de ordenamiento; respeta el `ordenSecuencia` ya transportado por el DTO (puede usarlo para render estable, sin reordenar por negocio).

**Regla de negocio adoptada (OQ-1 resuelta, opción a):** los nombres de etapa son únicos dentro de una OP. Esa unicidad es una restricción de negocio upstream que **se implementará y validará en C-06 `ordenes-y-linea-base-api`**, caso de uso `gestionarEtapas`, que habilita los endpoints de creación/edición de etapas. C-05 **no** implementa esa validación ni agrega `etapaAhoraId` al DTO; consume el contrato actual.

*Alternativas descartadas:* invocar `etapaAhora(etapas)` en el componente (rompe RN-GLOBAL-02 y duplica la regla); agregar `etapaAhoraId` al DTO en este change (modificaría C-04, fuera de scope); agregar test de nombres duplicados en C-05 (el contrato adoptado los prohíbe upstream). *Trade-off:* la identidad visual depende de la unicidad garantizada por C-06; hasta C-06, el riesgo es bajo porque C-02/C-04 no exponen edición de nombres de etapa por el usuario final.

### D6 — Checkbox: actualización optimista, datos autoritativos del PATCH y rollback total

`useActualizarEtapa` usa `useMutation`: en `onMutate` cancela las queries `['tablero']`, guarda un snapshot con `getQueriesData` y aplica con `setQueriesData` **solo** el cambio de `completada` en la etapa correspondiente; en `onSuccess` reemplaza la tarjeta completa por el `TarjetaOrdenDTO` devuelto; en `onError` restaura el snapshot; en `onSettled` invalida `['tablero']` para reconciliar KPIs y flujo. Durante la fase optimista NO se recalculan `avance`, `semaforo`, `etapaAhora` ni `etiquetaPlazo`: esos valores siguen siendo los del DTO hasta que responde el servidor (RN-GLOBAL-02, R3).

*Alternativas descartadas:* recalcular avance en el cliente para que el porcentaje "salte" al instante (rompe la regla de oro y produce valores divergentes del servidor); actualizar solo la query activa (otras combinaciones de filtros en caché quedarían desincronizadas); no hacer rollback (violaría Flujo 3 y el criterio optimista del scope). *Trade-off:* el porcentaje se actualiza un tick después del checkbox; se acepta a cambio de una sola fuente de verdad para los derivados.

### D7 — Filtros y estado vacío: el servidor filtra, la UI solo envía la query

Los controles de cliente, estado, etapa y texto viven en el contenedor y alimentan el query key; `consultarTablero` serializa los valores con `URLSearchParams` usando exactamente `clienteId`, `estado`, `etapaAhora` y `buscar`, los mismos query params validados por C-04. La UI NO filtra el arreglo `ops` en memoria: la grilla pinta la respuesta del servidor, de modo que el filtro `estado` sigue comparando el `semaforo` derivado en backend (HU-09, RN-GLOBAL-02). 

El selector de etapas se construye con `flujo[].etapa` (estable pre-filtro, porque C-04 calcula `flujo` antes de filtrar). El selector de clientes se construye desde un **conjunto base estable** de pares `{clienteId, clienteNombre}` capturado en la primera carga sin filtros (o, equivalente, conservando visible la opción seleccionada y la base conocida); esto evita la trampa de auto-ocultamiento donde filtrar por Cliente A hace desaparecer B y C de las opciones. Es un guardrail de UI pura en C-05: **sin endpoints nuevos, sin cambios backend, sin paginación**.

Con `ops = []` se muestra `EstadoVacioTablero` con *Limpiar filtros* y *Recargar tablero*, equivalente al `.empty` del prototipo (Flujo 2).

*Alternativas descartadas:* filtrar localmente para respuesta instantánea (duplica la lógica de C-04 y sería inconsistente con KPIs/flujo); inventar un endpoint de clientes (fuera del contrato); derivar opciones de clientes solo de `ops` filtrados (auto-ocultamiento); estado vacío con un solo botón (el Flujo 2 pide acciones sugeridas). *Trade-off:* el conjunto base de clientes se aprende de la respuesta sin filtro; si el primer load ya viene filtrado por URL/estado externo, la UI debe pedir/retener la base sin filtro antes de fijar opciones.

### D8 — Estética industrial sin dependencias nuevas

`global.css` aporta las variables de color y la pila de fuentes condensadas del sistema (`'Arial Narrow', 'Roboto Condensed', sans-serif`), sin descargar assets ni agregar librerías. La franja amarilla/negra se resuelve con `repeating-linear-gradient` en un CSS Module del encabezado; la grilla usa `display: grid` con tarjetas autocontenidas y `clsx` para las clases condicionales del semáforo. Los KPIs superiores leen `kpis.total` y `kpis.porEstado` con los cuatro literals de `EstadoSemaforo`.

*Alternativas descartadas:* importar `Docs/tablero-taller-v2.html` (prototipo estático, no reutilizable en React); Fuente web nueva (dependencia y asset fuera del scope); Tailwind (descartado en C-01). *Trade-off:* la pila de fuentes depende de lo instalado en el equipo; es suficiente para el MVP intranet y se revisaría con un diseño formal.

### D9 — TDD de componente y guardianes estáticos

Cada capability se implementa con el ciclo RED → GREEN → TRIANGULATE (mínimo 2 casos, más bordes: cuatro estados del semáforo, `Todo listo`, rollback, sin resultados) → REFACTOR. Los tests usan `@testing-library/react` + jsdom y un `fetch` inyectado para simular las respuestas HTTP; no hay mocks de PostgreSQL porque no se accede a BD (R10 no aplica). Se agrega un test de guardián de imports/expresiones prohibidas y se verifican cero `any` mediante el typecheck estricto. Cada test referencia su `RN-XX` en el nombre o comentario de trazabilidad (RN-GLOBAL-04).

*Alternativas descartadas:* snapshots sin aserciones semánticas (no verifican semáforo ni rollback); testear sólo el contenedor con `fetch` mock (no cubre presentación); forzar Docker (innecesario y lento sin BD). *Trade-off:* los tests de mutación simulan latencia y error con promesas controladas; no ejercitan Fastify, que ya está cubierto por C-04.

### D10 — Unicidad de nombre de etapa como regla upstream (OQ-1)

Se adopta formalmente la regla de negocio: **los nombres de etapa son únicos dentro de una OP**. Esto sostiene la identidad del badge `ahora` por `etapa.nombre === tarjeta.etapaAhora` (D5) sin agregar `etapaAhoraId` al DTO. La validación se implementará en **C-06 `ordenes-y-linea-base-api`**, caso de uso `gestionarEtapas`, que es el change que habilita endpoints de creación/edición de etapas. C-05 no la implementa; solo deja la regla explícita y trazable para que no se pierda.

*Alternativas descartadas:* agregar `etapaAhoraId` al DTO ahora (modifica contrato C-04/dominio fuera de scope); validar en frontend (la UI no es fuente de verdad). *Trade-off:* hasta C-06 la garantía es contractual/procedimental; el riesgo es acotado porque no hay edición de etapas en el MVP actual.

## Risks / Trade-offs

- **[`etapaAhora` es nombre y no id — RESUELTO OQ-1] →** se acepta el contrato actual del DTO; D5 usa igualdad de nombre con guard `!completada`; D10 adopta la unicidad de nombres por OP como regla upstream a implementar en C-06 `gestionarEtapas`. No se agrega `etapaAhoraId` ni se recalcula "ahora" en React.
- **[Envelope/KPIs no exportados por `@velco/domain` — RESUELTO OQ-2] →** D3 compone un tipo de transporte en frontend a partir de tipos canónicos; `DetalleOpDTO` permanece en backend. La delta C-05 enmienda `dto-derivados-orden` para permitir envelopes compuestos sin redefinir reglas/DTOs canónicos.
- **[Sin endpoint de clientes ni catálogo de etapas en C-04 — RESUELTO OQ-3] →** D7 mantiene `flujo[].etapa` como fuente estable de etapas y captura un conjunto base estable de clientes en la primera carga sin filtro (o equivalente visible). Guardrail solo UI, sin endpoints/cambios backend/paginación.
- **[Sin control de ordenamiento en la UI — DIFERIDA OQ-4] →** decisión de usuario 2026-11-21: se difiere. HU-09 menciona "Ordenamiento" en el título pero no en criterios de aceptación; C-05 hereda el orden fijo de C-04 (`fechaEntrega ↑`, `numeroOp ↑`). Sin control de sort, sin cambio backend, sin cambio de scope.
- **[Actualización optimista puede desincronizar derivados] →** D6 sólo invierte el booleano y espera el DTO del `PATCH`; rollback con snapshot de todas las queries `['tablero']`.
- **[Regresión de C-01 al tocar `App.tsx`] →** D1 corre `App.test.tsx` y `convenciones.test.ts` como primer gate sin modificarlos.
- **[Zod rechaza un cambio de contrato del backend] →** fallo visible en la query en vez de tarjetas con datos parciales; se reporta en el apply, no se relaja el esquema silenciosamente.
- **[HU-08/HU-19 tentación de agregar modo TV o roles] →** fuera de scope y R5; cualquier auth requiere aprobación humana explícita.
- **[IN-08 y DD-07] →** siguen diferidos; sin impacto en este change y no se resuelven silenciosamente.

## Migration Plan

No hay migración de datos ni de esquema: C-05 no escribe en PostgreSQL y consume los endpoints ya desplegados en C-04. Rollback del cambio es revertir los archivos del frontend (no hay datos que convertir).

1. Confirmar C-04 archivado, `openspec list --json` sin changes activos además de este y que `CHANGES.md` aún tiene C-05 en `[ ]` (R8); el checkbox se marca recién al archivar.
2. RED: escribir primero los tests de componente del semáforo, badge `ahora` y ausencia de slider; ejecutar Vitest y evidenciar el fallo por módulos ausentes.
3. GREEN: crear `shared/domain-client`, el hook de query y los componentes presentacionales; montar `TableroPage` en `/` sin tocar `/salud`; ejecutar tests tras cada grupo.
4. TRIANGULATE: agregar los cuatro estados del semáforo, `Todo listo`, flujo vacío, filtros combinados, estado vacío, guardrail de opciones de cliente y rollback; ejecutar la suite en cada inserción.
5. Integración de la mutación: simular `PATCH` exitoso y fallido con `fetch` inyectado, verificando que los derivados se toman de la respuesta y que el snapshot se restaura.
6. REFACTOR: extraer helpers de mapeo de clases y de serialización de filtros sin tocar aserciones; ejecutar la suite completa de frontend.
7. Verificar `npm run typecheck -w @velco/frontend` (o el command equivalente del workspace), cero `any`, guardián de imports prohibidos y cero auth; sin builds ni commits.
8. Cerrar con `openspec validate tablero-visual --strict` y `openspec status --change tablero-visual --json` con todos los artefactos en `done`.

## Open Questions

- **OQ-1 (RESUELTA, 2026-11-21, opción a):** se acepta el contrato actual del DTO. El badge `ahora` se resuelve por `etapa.nombre === tarjeta.etapaAhora && !etapa.completada`; no se agrega `etapaAhoraId` ni se recalcula en React. Se adopta la regla de negocio "los nombres de etapa son únicos dentro de una OP"; su validación se implementará en **C-06 `ordenes-y-linea-base-api`**, caso de uso `gestionarEtapas`, que habilita los endpoints de creación/edición de etapas. C-05 no implementa esa validación.
- **OQ-2 (RESUELTA, 2026-11-21):** se mantiene D3. El frontend compone un tipo de transporte desde tipos canónicos de `@velco/domain`; no importa tipos de aplicación backend. `DetalleOpDTO` permanece en backend (placeholders `readonly never[]` para C-06/C-08). La delta C-05 enmienda `dto-derivados-orden` para aclarar que la prohibición de duplicación aplica a reglas derivadas/DTOs canónicos, no a envelopes de transporte compuestos.
- **OQ-3 (RESUELTA, 2026-11-21):** se mantiene `flujo[].etapa` como fuente estable pre-filtro. Para clientes, C-05 captura un conjunto base estable de `{clienteId, clienteNombre}` desde la primera carga sin filtro (o mantiene visible la opción seleccionada) para evitar auto-ocultamiento al filtrar. Guardrail solo UI; sin endpoints nuevos, sin cambios backend, sin paginación.
- **OQ-4 (DIFERIDA, decisión de usuario 2026-11-21):** sin control de ordenamiento en C-05. HU-09 menciona "Ordenamiento" en título pero no en criterios de aceptación; se hereda el orden fijo de C-04 (`fechaEntrega ↑`, `numeroOp ↑`). Sin cambio backend ni de scope.
- **SU-05 / IN-08 / DD-07:** heredadas sin impacto en este change; no se resuelven silenciosamente.
