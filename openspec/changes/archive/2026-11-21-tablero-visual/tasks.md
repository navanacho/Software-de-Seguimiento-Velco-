## 1. Preparación, safety net y andamiaje (RED)

- [x] 1.1 Verificar punto de partida: C-04 archivado en `b51be29`, `@velco/domain` exponiendo `TarjetaOrdenDTO`, `EtapaTarjeta`, `GrupoFlujo` y `EstadoSemaforo`, `openspec list --json` sin changes activos además de este y `CHANGES.md` con C-05 en `[ ]` (D1, R8)
- [x] 1.2 Ejecutar sin modificar los tests actuales de frontend: `App.test.tsx` y `app/convenciones.test.ts`, capturando la evidencia como primer gate de regresión de C-01 (D1)
- [x] 1.3 Confirmar la forma exacta del contrato en `backend/src/features/ordenes/http/esquemas.ts` y `application/listarOps.ts`: envelope `{ ops, kpis, flujo }`, query params `clienteId|estado|etapaAhora|buscar` y `PATCH` con `{ completada: boolean }`, sin inventar campos (D3, OQ-2)
- [x] 1.4 Crear la estructura `frontend/src/features/tablero/{components,hooks,queries}/` y `frontend/src/shared/domain-client/` con sus `.gitkeep`, sin código de producción todavía (D2, D3)
- [x] 1.5 RED: escribir el test de smoke que intenta importar `TableroPage` y falla por módulo inexistente; ejecutar Vitest y capturar la evidencia (R1)
- [x] 1.6 Crear fixtures tipados de `TarjetaOrdenDTO`, `EtapaTarjeta`, `GrupoFlujo` y del envelope con los cuatro estados del semáforo, sin `any` ni aserciones que callen errores (R9)
- [x] 1.7 Configurar el entorno jsdom de los tests de componente con `@testing-library/react` sin agregar dependencias nuevas (stack fijado en C-01)

## 2. `shared/domain-client` — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 2.1 RED: escribir el test que exige importar `TarjetaOrdenDTO`, `EtapaTarjeta`, `GrupoFlujo` y `EstadoSemaforo` desde `@velco/domain` y falla por módulo inexistente en el cliente (D3, RN-GLOBAL-02)
- [x] 2.2 GREEN: crear el módulo de tipos de transporte que compone `RespuestaListadoTablero` y `KpisTablero` a partir de los tipos canónicos, sin redefinir el DTO ni agregar campos nuevos (D3, OQ-2)
- [x] 2.3 GREEN: crear el esquema zod del envelope `{ ops, kpis: { total, porEstado }, flujo }` con los cuatro literales de `EstadoSemaforo` y el esquema de la tarjeta del `PATCH`
- [x] 2.4 TRIANGULATE: agregar los casos de cuerpo inválido, `estado` desconocido y `porEstado` incompleto, ejecutando Vitest en cada inserción
- [x] 2.5 RED: escribir el test de `consultarTablero(filtros, consulta = fetch)` que exige `GET /api/ops?...` con `URLSearchParams` y falla por función ausente (D7)
- [x] 2.6 GREEN: implementar `consultarTablero` con `fetch` inyectable, `URLSearchParams` y validación zod de la respuesta reutilizando el patrón de `consultarSalud`
- [x] 2.7 TRIANGULATE: verificar que un cuerpo inválido rechaza la promesa, que filtros combinados serializan los cuatro parámetros y que no se envían parámetros vacíos
- [x] 2.8 RED: escribir el test de `actualizarEtapaRemota({ ordenId, etapaId, completada })` que exige `PATCH /api/ops/:id/etapas/:etapaId` con body `{ completada }`
- [x] 2.9 GREEN: implementar la función de mutación del cliente validando la tarjeta devuelta con el esquema zod y sin incluir campos adicionales en el body
- [x] 2.10 REFACTOR: extraer la construcción de rutas y el parseo zod sin tocar aserciones; ejecutar la suite del grupo y el typecheck del frontend (R9)
- [x] 2.11 Verificar que el tipo de transporte compuesto del frontend no redefine campos derivados canónicos de `TarjetaOrdenDTO`/`EtapaTarjeta`/`GrupoFlujo`/`EstadoSemaforo` y que la delta `dto-derivados-orden` de C-05 es consistente con D3/OQ-2 (R2, RN-GLOBAL-02)

## 3. Contenedor, consulta y routing — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 3.1 RED: escribir el test del hook `useTablero(filtros)` que exige `useQuery` con `queryKey: ['tablero', filtros]` y falla por módulo inexistente (D2)
- [x] 3.2 GREEN: crear `queries/clavesTablero.ts` con la fábrica de query keys y `hooks/useTablero.ts` delegando en `consultarTablero`
- [x] 3.3 TRIANGULATE: verificar que dos combinaciones de filtros distinto generan keys distintas y que la misma combinación es estable
- [x] 3.4 RED: escribir el test de `TableroPage` que exige pasar `ops`, `kpis` y `flujo` por props a los componentes hijos y falla por componente ausente (D2)
- [x] 3.5 GREEN: crear el contenedor `TableroPage` con el `QueryClientProvider` ya existente en `App`, sin fetch ni lógica de negocio propia
- [x] 3.6 GREEN: registrar `TableroPage` en la ruta `/` de `App.tsx`, conservando `/salud` y el `MemoryRouter` intactos (D1)
- [x] 3.7 TRIANGULATE: verificar que los tests de `App.test.tsx` siguen pasando sin modificación y que el tablero se monta en `/` con el envelope de ejemplo
- [x] 3.8 REFACTOR: extraer el tipo de props del contenedor y ejecutar suite y typecheck (R9)

## 4. Tarjeta presentacional: derivados, semáforo y ausencia de slider — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 4.1 RED: escribir el test de `TarjetaOrden` que exige `numeroOp`, `clienteNombre`, `descripcionPieza` y la lista de etapas y falla por componente ausente (spec `tablero-grilla-tarjetas`)
- [x] 4.2 GREEN: crear el componente presentacional con props tipadas desde `@velco/domain`, sin `fetch`, `useQuery` ni `useMutation` (D2)
- [x] 4.3 TRIANGULATE: agregar los casos de `clienteNombre: null` y de tarjeta sin etapas, verificando que no se lanza excepción (RN-GLOBAL-03)
- [x] 4.4 RED: escribir el test que exige la clase de semáforo gris para `Terminado` y falla antes del mapeo (D4, RN-SEMAFORO-01)
- [x] 4.5 GREEN: crear el mapa `EstadoSemaforo → clase CSS` con `clsx` sobre `TarjetaOrden.module.css`
- [x] 4.6 TRIANGULATE: agregar `Atrasado`→rojo, `En riesgo`→amarillo y `En plazo`→verde, ejecutando el test en cada inserción (RN-SEMAFORO-02..04)
- [x] 4.7 TRIANGULATE: verificar que la precedencia ya resuelta por el dominio se respeta (OP `Terminado` con fecha vencida sigue gris) sin comparar fechas en React (RN-SEMAFORO-05)
- [x] 4.8 RED: escribir el test que exige mostrar `avance`, `diasRestantes` y `etiquetaPlazo` literalmente y falla si se reformatean (D4)
- [x] 4.9 GREEN: interpolar los campos del DTO en la tarjeta con `data-testid` o roles semánticos estables para el test
- [x] 4.10 TRIANGULATE: agregar `etiquetaPlazo` `"Vence hoy"`, `"Pasó hace N días"` y `"Terminado"` sin lógica de fecha (RN-SEMAFORO-06)
- [x] 4.11 RED: escribir el test que exige ausencia de `input[type="range"]` y de controles editables de porcentaje en la tarjeta (HU-07, R3)
- [x] 4.12 GREEN: verificar la aserción con el avance como texto de solo lectura, sin agregar ningún control de edición
- [x] 4.13 TRIANGULATE: verificar que la grilla no produce contenedores de columna por etapa y que una tarjeta por OP se renderiza en un único grid (RN-GLOBAL-01)
- [x] 4.14 RED: escribir el test de guardian que falla si `frontend/src/features/tablero/` importa `calcularSemaforo`, `diasRestantes`, `etapaAhora` o `construirTarjetaOrden`, o usa `new Date()` para comparar fechas (RN-GLOBAL-02)

## 5. Tira de flujo y badge "ahora" — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 5.1 RED: escribir el test de `TiraFlujo` que exige un grupo por `GrupoFlujo` con su cantidad y falla por componente ausente (spec `tira-flujo-y-ahora`)
- [x] 5.2 GREEN: crear el componente que mapea `flujo` a grupos en el orden recibido, sin ordenar ni reagrupar (D5, RN-FLujo-01)
- [x] 5.3 TRIANGULATE: agregar el caso de dos OPs en la misma etapa (cantidad 2) y el de `flujo` vacío con mensaje "no hay trabajos en curso"
- [x] 5.4 TRIANGULATE: verificar que una OP terminada no aporta grupos porque el backend ya la excluyó, sin filtrado propio en la UI
- [x] 5.5 RED: escribir el test del badge `ahora` sobre una tarjeta con etapas `Corte` completada y `Soldadura` pendiente y `etapaAhora: "Soldadura"`, exigiendo el badge sólo en `Soldadura` (RN-AHORA-01)
- [x] 5.6 GREEN: implementar el mapeo `etapa.nombre === tarjeta.etapaAhora && !etapa.completada` en el componente de etapa, sin invocar la función `etapaAhora(...)` (D5)
- [x] 5.7 TRIANGULATE: agregar el caso `etapaAhora: "Todo listo"` sin badges y el caso de etapas desordenadas en el DTO (deben respetar `ordenSecuencia` recibido)
- [x] 5.8 REFACTOR: extraer el componente `EtapaTarjeta` presentacional reutilizable sin tocar aserciones; ejecutar suite y typecheck
- [x] 5.9 Verificar que la tira y la tarjeta consumen los derivados del DTO sin importar `agruparFlujo` ni `etapaAhora` desde `@velco/domain` (RN-GLOBAL-02, OQ-1)

## 6. Filtros, búsqueda y estado vacío — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 6.1 RED: escribir el test que exige un selector de estado con los cuatro literales de `EstadoSemaforo` y falla por componente ausente (spec `filtros-y-estado-vacio-tablero`)
- [x] 6.2 GREEN: crear `FiltrosTablero` con estado local en el contenedor y opciones derivadas del enum, sin filtrar localmente
- [x] 6.3 TRIANGULATE: verificar que elegir `Atrasado` dispara una nueva query con `estado=Atrasado` y que la grilla pinta la respuesta del servidor (HU-09)
- [x] 6.4 RED: escribir el test del campo de búsqueda que exige enviar `buscar` en la query string
- [x] 6.5 GREEN: cablear el input de texto al objeto de filtros del query key con `URLSearchParams` del cliente (D7)
- [x] 6.6 TRIANGULATE: agregar búsqueda por número de OP y por descripción de pieza con mayúsculas distintas, sin comparar en el cliente
- [x] 6.7 RED: escribir el test del selector de clientes que exige opciones derivadas del conjunto base de la carga sin filtro y falla si se consulta otra ruta (OQ-3 resuelta, D7)
- [x] 6.8 GREEN: capturar el conjunto base estable de pares `{clienteId, clienteNombre}` desde la primera carga sin filtro (o conservar visible la opción seleccionada y la base conocida), sin duplicados ni endpoints nuevos
- [x] 6.9 RED: escribir el test de guardrail que, con filtro por Cliente A activo y respuesta solo con OPs de Cliente A, exige que el selector siga ofreciendo Cliente B/C del conjunto base y que al elegir Cliente B se envíe `clienteId` de Cliente B al servidor
- [x] 6.10 GREEN: implementar el guardrail de opciones estables de cliente en UI (sin cambios backend, sin paginación), manteniendo la query del servidor como fuente de `ops`
- [x] 6.11 TRIANGULATE: verificar que cambiar de cliente con filtro activo no auto-oculta opciones y que limpiar filtros restaura la consulta base
- [x] 6.12 GREEN: construir el selector de etapa `ahora` desde `flujo[].etapa` (fuente estable pre-filtro de C-04)
- [x] 6.13 TRIANGULATE: agregar filtros combinados (cliente + etapa + búsqueda) y verificar que la query incluye todos los parámetros
- [x] 6.14 RED: escribir el test que exige `EstadoVacioTablero` cuando `ops` está vacío con acciones *Limpiar filtros* y *Recargar tablero* (Flujo 2)
- [x] 6.15 GREEN: crear el componente de estado vacío y cablear la limpieza de filtros y la invalidación de la query
- [x] 6.16 TRIANGULATE: verificar que con resultados no se muestra el estado vacío y que sin filtros la acción de recarga invalida `['tablero']`
- [x] 6.17 REFACTOR: extraer el reducer/estado de filtros sin mover lógica al componente presentacional; ejecutar suite y typecheck

## 7. Checkbox optimista, rollback y reconciliación — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 7.1 RED: escribir el test de `useActualizarEtapa` que exige `useMutation` con `onMutate`, `onError` y `onSettled` y falla por hook ausente (spec `avance-etapas-ui`)
- [x] 7.2 GREEN: crear el hook con `mutationFn: actualizarEtapaRemota` del `shared/domain-client` (D6)
- [x] 7.3 RED: escribir el test que exige el `PATCH` con `{ completada: true }` y el `id` correcto al tildar una etapa (HU-07, Flujo 3)
- [x] 7.4 GREEN: cablear el handler desde `TableroPage` hasta `TarjetaOrden` por prop, sin fetch en el componente
- [x] 7.5 GREEN: en `onMutate`, cancelar queries `['tablero']`, guardar snapshot con `getQueriesData` e invertir `completada` con `setQueriesData` (D6)
- [x] 7.6 TRIANGULATE: verificar que el cambio optimista es inmediato y que `avance`, `semaforo`, `etapaAhora` y `etiquetaPlazo` NO se recalculan localmente (RN-GLOBAL-02)
- [x] 7.7 RED: escribir el test que exige reemplazar la tarjeta completa por el DTO devuelto en `onSuccess`
- [x] 7.8 GREEN: actualizar la caché con la tarjeta del `PATCH`, respetando el orden y las cantidades del envelope
- [x] 7.9 TRIANGULATE: agregar el caso de desmarcar una etapa de una OP terminada y exigir que los derivados vuelven a los del DTO (RN-AVANCE-02, RN-SEMAFORO-01)
- [x] 7.10 RED: escribir el test de rollback con `fetch` inyectado que responde error y exige restaurar `completada` y el resto de la tarjeta (Flujo 3)
- [x] 7.11 GREEN: implementar `onError` con el snapshot de todas las queries `['tablero']` y mostrar un mensaje de error accesible
- [x] 7.12 TRIANGULATE: agregar el caso de error de red y el de dos consultas en caché con filtros distintos que contienen la misma OP
- [x] 7.13 GREEN: invalidar `['tablero']` en `onSettled` para reconciliar KPIs y flujo con el servidor
- [x] 7.14 REFACTOR: extraer el helper de actualización de caché sin tocar aserciones; ejecutar suite y typecheck (R9)

## 8. Estética industrial y KPIs superiores — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 8.1 RED: escribir el test de `KpisTablero` que exige `kpis.total` y los cuatro conteos de `porEstado` y falla por componente ausente (spec `tablero-grilla-tarjetas`)
- [x] 8.2 GREEN: crear el componente leyendo `kpis.total` y `kpis.porEstado` con los literales de `EstadoSemaforo`, sin derivarlos de `ops`
- [x] 8.3 TRIANGULATE: agregar el caso con un estado en cero y el caso `total: 0` con `ops` vacío
- [x] 8.4 RED: escribir el test que exige franja amarilla/negra, tipografía condensada y grilla de tarjetas en el encabezado (HU-05)
- [x] 8.5 GREEN: definir las variables en `global.css` y los estilos en `KpisTablero.module.css` / `GrillaTarjetas.module.css` con `repeating-linear-gradient` y pila de fuentes del sistema
- [x] 8.6 TRIANGULATE: verificar que no se agregaron librerías de estilos, fuentes externas ni archivos `.xlsx` nuevos (DD-01, R6)
- [x] 8.7 REFACTOR: revisar clases condicionales con `clsx` y ejecutar suite y typecheck

## 9. Aislamiento, verificación y cierre

- [x] 9.1 Ejecutar `npm run typecheck -w @velco/frontend` con cero errores y cero `any` en los archivos nuevos (R9)
- [x] 9.2 Verificar que `packages/domain/` no fue modificado y que no aparecen imports de `fastify`, `@prisma/client`, `react` ni `exceljs` dentro de él (R2)
- [x] 9.3 Verificar cero auth, PIN, RBAC, tabla `usuarios` ni modo kiosco en el código nuevo (R5, HU-08)
- [x] 9.4 Verificar cero columnas derivadas, cero escrituras en PostgreSQL y cero migraciones nuevas; el único write sigue siendo el `PATCH` de C-04 (R3)
- [x] 9.5 Verificar que los tests nuevos referencian sus códigos RN-XX en nombres o aserciones y que cada comportamiento tiene al menos dos casos (RN-GLOBAL-04, R1)
- [x] 9.6 Ejecutar el guardian de imports prohibidos y confirmar que no hay mocks de PostgreSQL en la suite de frontend (R10, RN-GLOBAL-02)
- [x] 9.7 Ejecutar `npm test` en la raíz: dominio, fundación, backend y la nueva suite de componentes; sin builds ni commits
- [x] 9.8 Ejecutar `openspec validate tablero-visual --strict` y `openspec status --change tablero-visual --json` con los cuatro artefactos en `done`
- [x] 9.9 Confirmar que `CHANGES.md` sigue con `[ ]` en C-05 y que no se modificó ningún change archivado; el checkbox se marca recién al archivar (R8)
- [x] 9.10 Dejar constancia en el reporte de apply de las cuatro decisiones de OQ-1 a OQ-4: OQ-1 resuelta (contrato DTO actual, unicidad de nombre de etapa validada en C-06 `gestionarEtapas`); OQ-2 resuelta (envelope de transporte compuesto desde tipos canónicos, `DetalleOpDTO` en backend, delta `dto-derivados-orden` enmendada); OQ-3 resuelta (guardrail UI de opciones estables de cliente, sin backend/endpoints/paginación); OQ-4 diferida por decisión de usuario 2026-11-21 (sin control de sort, orden fijo C-04)
