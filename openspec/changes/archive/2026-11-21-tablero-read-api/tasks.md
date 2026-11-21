## 1. Preparación y andamiaje (RED)

- [x] 1.1 Verificar punto de partida: C-03 archivado, `@velco/domain` exponiendo `construirTarjetaOrden`, `agruparFlujo` y `calcularSemaforo`, `openspec list --json` sin changes activos además de este y `CHANGES.md` con C-04 en `[ ]` (D1, R8)
- [x] 1.2 Crear `backend/test/tablero-read-api/` con un helper de arranque que reutilice `conBase` y `hayDocker` de `backend/test/core-order-models/contenedor.ts` y construya la app con un `PrismaClient` real, sin mocks de PostgreSQL (D7, R10)
- [x] 1.3 Definir el tipo `DependenciasApi` con `ops`, `etapas`, `clientes`, `configuracion`, `reloj` y `zonaHoraria`, y ampliar `buildApp(configuracion, dependencias?)` sin romper los tres tests actuales de `backend/src/features/salud/http/app.ts` (D1)
- [x] 1.4 RED: escribir el test de smoke que intenta registrar `GET /api/ops`, `GET /api/ops/:id` y `PATCH /api/ops/:id/etapas/:etapaId` y falla por módulos inexistentes; ejecutar `npm test -w @velco/backend -- src/features/salud/http` y capturar la evidencia (R1)
- [x] 1.5 Crear los fixtures tipados de `OrdenTrabajo`, `EtapaOrden`, `Cliente` y `Configuracion` con `hoy`, `zonaHoraria` y umbrales fijos, sin `any` ni aserciones que callen errores (R9)
- [x] 1.6 Confirmar que los tests de health siguen pasando con la firma ampliada de `buildApp` antes de agregar cualquier ruta nueva (D1)

## 2. Puertos y adaptadores Prisma — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 2.1 RED: escribir el test de `listarConEtapas` que exige `{ orden, etapas, clienteNombre }` y falla porque el método no existe en `OpRepository`; ejecutar Vitest (D2)
- [x] 2.2 GREEN: ampliar `OpRepository` con `listarConEtapas(): Promise<readonly OrdenConEtapasYCliente[]>` en `ordenes/application/ports/`, definiendo `OrdenConEtapasYCliente` en esa misma carpeta sin tocar `@velco/domain` (D2)
- [x] 2.3 GREEN: implementar `listarConEtapas` en `PrismaOpRepository` con un único `findMany` que incluya `etapas` ordenadas por `ordenSecuencia` y `cliente`, reutilizando `aOrdenTrabajo` y `toFixed(2)` para importes y fechas `YYYY-MM-DD`
- [x] 2.4 TRIANGULATE: agregar el caso de OP sin etapas y el de dos OPs del mismo cliente, ejecutando el test en cada inserción
- [x] 2.5 RED: escribir los tests de `EtapaRepository.buscarPorId` (existente y ausente) y `actualizarCompletada` (true y false) antes de implementarlos
- [x] 2.6 GREEN: ampliar `EtapaRepository` con `buscarPorId` y `actualizarCompletada` e implementarlos en `PrismaEtapaRepository` con un `UPDATE` de una sola columna
- [x] 2.7 TRIANGULATE: verificar que `actualizarCompletada` no altera `horasVendidas`, `nombre` ni `ordenSecuencia`, y que `buscarPorId` devuelve `null` para un UUID ajeno
- [x] 2.8 REFACTOR: extraer el mapper de filas compartido entre `listarPorOrden` y `listarConEtapas` sin tocar aserciones, ejecutar la suite y `npm run typecheck -w @velco/backend` (R3, R9)

## 3. Contexto de dominio, configuración y reloj — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 3.1 RED: escribir el test de `contextoTarjeta` que exige umbrales inyectados y falla por módulo inexistente (D6)
- [x] 3.2 GREEN: crear `configuracion/application/contextoTarjeta.ts` que lee `ConfiguracionRepository.obtener()` y devuelve `{ diasAlertaRiesgo, porcentajeAvanceRiesgo, zonaHoraria, hoy, clienteNombre? }`
- [x] 3.3 TRIANGULATE: agregar el caso sin fila singleton ⇒ defaults RN-CONFIG-01 (3 días / 80% / etapas estándar) sin insertar la fila, y el caso con umbrales personalizados
- [x] 3.4 RED: escribir el test que falla porque `leerConfiguracion` no expone `zonaHoraria` desde `TZ`
- [x] 3.5 GREEN: ampliar `backend/src/shared/configuracion.ts` para leer `TZ` con default `America/Argentina/Mendoza` (SU-05) y actualizar el test de configuración existente sin hardcodear la zona en el dominio (D6)
- [x] 3.6 RED: escribir el test del puerto `Reloj` con instante fijo y del adaptador que convierte a `YYYY-MM-DD` dentro de la zona con `Intl.DateTimeFormat(...).formatToParts`
- [x] 3.7 GREEN: crear `backend/src/shared/reloj.ts` con `RelojSistema` y el helper de fecha calendaria, e inyectarlo en `DependenciasApi` (D6)
- [x] 3.8 TRIANGULATE: verificar que el mismo instante en dos zonas distintas produce semáforos distintos y que el dominio no leyó `process.env` ni `new Date()` (SU-05, R2)

## 4. Validación de frontera y errores HTTP — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 4.1 RED: escribir el test que envía `fechaDesde=2027-02-30` a `GET /api/ops` y exige 422 antes de cualquier consulta (D5)
- [x] 4.2 GREEN: crear `ordenes/http/esquemas.ts` con los esquemas zod de la query (`fechaDesde`, `fechaHasta`, `estado`, `clienteId`, `etapaAhora`, `buscar`) y sus `z.toJSONSchema` para Fastify/Swagger
- [x] 4.3 TRIANGULATE: agregar los casos de rango invertido, estado inválido, `clienteId` no UUID y longitud de búsqueda fuera de rango, ejecutando en cada inserción
- [x] 4.4 RED: escribir el test que envía un body inválido al PATCH y exige 422 sin escritura
- [x] 4.5 GREEN: crear `etapas/http/esquemas.ts` con `params` UUID y `body` `{ completada: boolean, additionalProperties: false }`, cableados como `preValidation` de la ruta
- [x] 4.6 GREEN: agregar en `buildApp` un `setErrorHandler` que traduzca errores de validación a 422 con `{ error: "validation_error", message, details }` y recursos inexistentes a 404 con `{ error: "not_found", message }`
- [x] 4.7 TRIANGULATE: verificar que los tres tests de health siguen pasando y que `/documentation/json` expone los esquemas de las nuevas rutas con `@fastify/swagger`
- [x] 4.8 REFACTOR: extraer el helper de validación compartido sin mover reglas de negocio al handler y ejecutar la suite de frontera (regla de oro)

## 5. `GET /api/ops` — listado y filtros — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 5.1 RED: escribir el test del caso de uso `listarOps` sin filtros que exige una tarjeta por OP con derivados del dominio y falla por módulo inexistente (D2)
- [x] 5.2 GREEN: crear `ordenes/application/listarOps.ts` que obtiene `listarConEtapas`, construye `contextoTarjeta` por fila y llama a `construirTarjetaOrden` sin calcular nada propio
- [x] 5.3 TRIANGULATE: agregar casos de OP sin etapas y de cliente sin nombre, verificando que el DTO conserva `clienteNombre: null` cuando corresponde
- [x] 5.4 RED: escribir el test de filtro `estado=Terminado` sobre una OP vencida con avance 100; ejecutar y confirmar que falla (RN-SEMAFORO-01, HU-09)
- [x] 5.5 GREEN: filtrar por `tarjeta.semaforo === estado` en el caso de uso, nunca por una columna SQL
- [x] 5.6 TRIANGULATE: agregar los filtros `En riesgo`, `Atrasado` y `En plazo` con OPs sembradas, ejecutando en cada caso
- [x] 5.7 RED: escribir el test de filtro `etapaAhora` sobre etapas desordenadas y confirmar que falla (RN-AHORA-01)
- [x] 5.8 GREEN: filtrar por `tarjeta.etapaAhora` ya derivada y por `clienteId` exacto
- [x] 5.9 TRIANGULATE: agregar `buscar` por N° de OP y por pieza con mayúsculas distintas, y la combinación de todos los filtros a la vez
- [x] 5.10 RED: escribir el test de rango de fechas sobre `fechaEntrega` (decisión provisoria OQ-1) y de resultado vacío con KPIs en cero
- [x] 5.11 GREEN: aplicar el rango sobre `tarjeta` y devolver `{ ops, kpis, flujo }` ordenado por `fechaEntrega` ascendente y `numeroOp` como desempate (OQ-2)
- [x] 5.12 REFACTOR: registrar la ruta en `registrarRutasOrdenes` con `preValidation`, extraer el comparador de filtros sin tocar aserciones y ejecutar la suite completa del grupo (D1, D5)

## 6. KPIs y conteos de flujo — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 6.1 RED: escribir el test que exige `kpis.total` y `kpis.porEstado` con los cuatro literales de `EstadoSemaforo` presentes, aunque algunos estén en cero
- [x] 6.2 GREEN: calcular los KPIs en `listarOps` a partir de las tarjetas derivadas, sin nuevas funciones de dominio
- [x] 6.3 RED: escribir el test que verifica que una OP terminada NO aparece en `flujo` (HU-06, RN-FLujo-01)
- [x] 6.4 GREEN: invocar `agruparFlujo` sobre el conjunto completo de OPs antes de aplicar filtros y asignar el resultado a `flujo` (D2)
- [x] 6.5 TRIANGULATE: agregar los casos de dos OPs en la misma etapa, OP sin etapas y orden estable con entradas permutadas
- [x] 6.6 REFACTOR: verificar que el handler no contiene comparaciones de semáforo ni llamadas a `agruparFlujo`, ejecutar suite y typecheck (RN-GLOBAL-02)

## 7. `GET /api/ops/:id` — detalle — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 7.1 RED: escribir el test HTTP de detalle con ID inexistente que exige 404 con `error: "not_found"` y falla por ruta no registrada
- [x] 7.2 GREEN: crear `ordenes/application/obtenerOp.ts` con `buscarPorId`, `listarPorOrden`, `buscarPorId` de cliente y `construirTarjetaOrden`, devolviendo `null` cuando la OP no existe
- [x] 7.3 GREEN: registrar `GET /api/ops/:id` y mapear `null` a 404 en el handler sin lógica de negocio
- [x] 7.4 TRIANGULATE: agregar el caso de UUID inválido (422) y el de OP con etapas desordenadas (deben venir por `ordenSecuencia`)
- [x] 7.5 RED: escribir el test que exige `DetalleOpDTO` con `fechaIngreso`, `fechaEntrega`, `montoVendido`, `observaciones`, `horas` y `materiales`
- [x] 7.6 GREEN: definir `DetalleOpDTO` en `ordenes/application/` extendiendo `TarjetaOrdenDTO` de `@velco/domain` y devolver `horas: []` y `materiales: []` tipados con la nota OQ-3 documentada en Swagger (D3)
- [x] 7.7 TRIANGULATE: verificar que `horasVendidas` de cada etapa viaja como cadena decimal exacta y que no aparecen totales, desvíos, costos ni márgenes
- [x] 7.8 REFACTOR: reutilizar el mapper de etapas del listado sin duplicar conversión de `Prisma.Decimal`, ejecutar suite y typecheck (R9)

## 8. `PATCH /api/ops/:id/etapas/:etapaId` — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 8.1 RED: escribir el test del caso de uso `actualizarCompletada` con etapa intermedia que exige avance 67 y nueva etapa `ahora`, y falla por módulo inexistente (D4)
- [x] 8.2 GREEN: crear `etapas/application/actualizarCompletada.ts` que valida pertenencia, escribe `completada` y reconstruye la tarjeta con etapas frescas
- [x] 8.3 TRIANGULATE: agregar el caso de marcar la última pendiente ⇒ avance 100, `Todo listo` y `Terminado` (RN-AVANCE-02, RN-SEMAFORO-01)
- [x] 8.4 RED: escribir el test de desmarcar una etapa de OP terminada y exigir que vuelva a estado activo con su etapa `ahora` (Flujo 3)
- [x] 8.5 GREEN: garantizar que el recálculo use las etapas leídas después del `UPDATE` y no un arreglo en caché
- [x] 8.6 RED: escribir el test de etapa perteneciente a otra OP y exigir 404 sin modificar esa etapa
- [x] 8.7 GREEN: responder 404 desde el caso de uso cuando `etapa.ordenId !== ordenId` y cuando la OP o la etapa no existen
- [x] 8.8 TRIANGULATE: agregar el caso de OP inexistente con etapa válida y el de etapa inexistente con OP válida
- [x] 8.9 GREEN: registrar la ruta en `registrarRutasEtapas`, cablear `preValidation` y devolver la tarjeta recalculada desde el handler
- [x] 8.10 REFACTOR: verificar que solo `completada` cambió en la BD y que no hay columnas ni escrituras derivadas, ejecutar suite y typecheck (R3)

## 9. Integración con PostgreSQL real — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 9.1 RED: escribir la suite `backend/test/tablero-read-api/integracion.test.ts` con `app.inject` contra `conBase`, antes de dar por válidos los tests con fakes (D7, R10)
- [x] 9.2 GREEN: sembrar cliente, OPs con distintas fechas de entrega y etapas en distintos estados usando la migración 001 y el seed existentes
- [x] 9.3 TRIANGULATE: verificar el filtro por semáforo derivado sobre datos reales, incluida la OP terminada con fecha vencida
- [x] 9.4 TRIANGULATE: verificar que la OP terminada no cuenta en `flujo` y que el listado respeta el orden determinista
- [x] 9.5 TRIANGULATE: verificar `PATCH` sobre datos reales: marcar, desmarcar y etapa de otra OP ⇒ 404
- [x] 9.6 TRIANGULATE: verificar `GET /api/ops/:id` contra la BD real con etapas, derivados y colecciones vacías documentadas
- [x] 9.7 REFACTOR: reutilizar el helper de siembra entre casos sin introducir mocks de Prisma ni transacciones que oculten el estado real
- [x] 9.8 Ejecutar la suite con Docker activo y reportar explícitamente si `skipIf(!hayDocker())` impidió correrla; una corrida válida DEBE usar el contenedor `postgres:18.7` (R10)

## 10. Aislamiento, verificación y cierre

- [x] 10.1 Ejecutar `npm run typecheck -w @velco/backend` y `npm run typecheck -w @velco/domain`, con cero errores y cero `any` en archivos nuevos (R9)
- [x] 10.2 Buscar imports de `fastify|@prisma/client|react|exceljs` dentro de `packages/domain/src` y confirmar cero resultados (R2)
- [x] 10.3 Eliminar temporalmente `backend/src/features/*/{prisma,http,excel}`, ejecutar el typecheck del dominio y restaurar los directorios (R2)
- [x] 10.4 Verificar cero columnas derivadas nuevas, cero `GENERATED ALWAYS`, cero auth/PIN/RBAC, cero tabla `usuarios` y cero `.xlsx` nuevos (R3, R5, R6)
- [x] 10.5 Verificar que los tests nuevos referencian sus códigos RN-XX-NN en nombres o aserciones y que cada comportamiento tiene al menos dos casos (RN-GLOBAL-04, R1)
- [x] 10.6 Ejecutar `npm test` en la raíz: dominio puro, health, fundación, core-order-models y la nueva suite de integración; sin builds ni commits
- [x] 10.7 Ejecutar `openspec validate tablero-read-api --strict` y `openspec status --change tablero-read-api --json` con los cuatro artefactos en `done`
- [x] 10.8 Confirmar que `CHANGES.md` sigue con `[ ]` en C-04 y que no se modificó ningún change archivado; el checkbox se marca recién al archivar (R8)
