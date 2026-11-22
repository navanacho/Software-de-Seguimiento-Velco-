## 1. PreparaciÃ³n, safety net y gate de decisiones registradas

- [x] 1.1 Verificar punto de partida: C-05 archivado, `openspec list --json` sin changes activos ademÃ¡s de este, `CHANGES.md` con C-06 en `[ ]` y working tree con la sincronizaciÃ³n de governance sin tocar (R8)
- [x] 1.2 Ejecutar sin modificar los suites actuales de `packages/domain`, `backend` y `frontend` y capturar el resultado como safety-net baseline de C-01..C-05 (D10)
- [x] 1.3 Confirmar la forma exacta de `listarOps.ts:41-53`, `OpRepository`, `errores.ts`, `app.ts:20-35` y los esquemas Zod existentes, sin inventar contratos (D1, D3, D4)
- [x] 1.4 Verificar que `design.md` registre las decisiones de usuario ya confirmadas: DU-1 (`conPlano` booleano), DU-2 (materiales: solo alta + visualizaciÃ³n/agregados, sin PUT/DELETE), DU-3 (sin renombrar etapas, pero validar nombres Ãºnicos por OP en el alta) y DU-4 (409 `numero_op_duplicado` con `{error, message, numeroOp}`, sin `opExistente`), y que no quede lenguaje de â€œprovisiÃ³n/OQ abiertaâ€. El usuario ya confirmÃ³ estas decisiones el 2026-11-21; no volver a preguntar. (governance MEDIO, D12)
- [x] 1.5 Registrar que el mapeo Excel `O7:R8` / `S/P` NO se implementa: pertenece a C-15 y depende de C-13/IN-08; nunca usar `J7:N8` (D11, R6)
- [x] 1.6 Crear la estructura de mÃ³dulos y directorios de dominio, aplicaciÃ³n, HTTP y Prisma necesaria, sin cÃ³digo de producciÃ³n todavÃ­a y sin tocar nada bajo `openspec/` a mano (R2, R8)

## 2. `CodigoPlano` y `TarjetaOrdenDTO` â€” RED â†’ GREEN â†’ TRIANGULATE â†’ REFACTOR

- [x] 2.1 RED: escribir el test puro de `normalizarCodigoPlano` que falla por mÃ³dulo ausente, exigiendo `trim()` + `toUpperCase()` y vacÃ­o â‡’ `null` (D2, RN-OP-06, R1)
- [x] 2.2 GREEN: crear `CodigoPlano` y la funciÃ³n pura en `packages/domain/src/ordenes/`, sin importar Fastify, Prisma, React ni `exceljs` (R2)
- [x] 2.3 TRIANGULATE: agregar los casos `"  pl-2026-045  "`, `"PL-2026-045"`, `""`, `"   "` y `undefined/null`, ejecutando Vitest en cada inserciÃ³n (mÃ­nimo 2 casos, R1)
- [x] 2.4 RED: escribir el test que exige `codigoPlano: string | null` en `OrdenTrabajo` y en `TarjetaOrdenDTO` y falla por el campo ausente (D5, spec `dto-derivados-orden`)
- [x] 2.5 GREEN: agregar el campo a `OrdenTrabajo`, `NuevaOrdenTrabajo` y `TarjetaOrdenDTO`, copiÃ¡ndolo en `construirTarjetaOrden` sin derivarlo ni formatearlo (RN-OP-05, R2)
- [x] 2.6 TRIANGULATE: verificar tarjeta con plano, tarjeta sin plano (`null`, nunca `'Sin plano'`) y que las tres respuestas que construyen tarjetas (listado, detalle y PATCH de C-04) transportan el mismo valor (RN-GLOBAL-02)
- [x] 2.7 REFACTOR: extraer helpers de normalizaciÃ³n sin tocar aserciones; ejecutar typecheck de `@velco/domain` y cero `any` (R9)
- [x] 2.8 Verificar guardianes de imports prohibidos en `packages/domain/src/` y que la eliminaciÃ³n hipotÃ©tica de adaptadores no rompe el paquete (R2)

## 3. MigraciÃ³n 002 y esquema Prisma â€” RED â†’ GREEN â†’ TRIANGULATE â†’ REFACTOR

- [x] 3.1 RED: escribir el test de integraciÃ³n contra `crearContenedorPostgres()` (`postgres:18.7`) que exige la columna, el CHECK y el Ã­ndice parcial y falla antes de la migraciÃ³n (R1, R10)
- [x] 3.2 GREEN: crear la migraciÃ³n 002 **aditiva, sin renumerar la 001**, con `codigo_plano VARCHAR(80) NULL`, `CHECK (codigo_plano <> '')` e Ã­ndice Ãºnico parcial `WHERE codigo_plano IS NOT NULL` (D1, DD-11)
- [x] 3.3 TRIANGULATE: verificar dos planos iguales rechazados, tres `NULL` aceptados y `''` rechazado directamente en SQL, sin mocks de PostgreSQL (R10)
- [x] 3.4 GREEN: agregar `codigoPlano String? @db.VarChar(80)` a `OrdenTrabajo` y el modelo `MaterialOrden` con enum `MP`/`INSUMOS`/`TERCERIZADOS` y decimales exactos; NO declarar `@unique` sobre el plano (D1, D8, R9)
- [x] 3.5 TRIANGULATE: ejecutar `prisma generate` con Prisma 7.10.1, verificar que no se usa 8.0.0-rc.34 y revisar el DDL generado sin aplicar `db push` (DD-01)
- [x] 3.6 RED: test que exige `materiales_orden` con FK CASCADE, `cantidad > 0`, costos no negativos, Ã­ndices y ausencia de agregados en `ordenes_trabajo` (DD-05, R3)
- [x] 3.7 GREEN: crear la tabla en la misma migraciÃ³n 002 con CHECKs, FK e Ã­ndices `(orden_id, tipo)`, `(nro_factura)`, `(nt)`, `(po)` (D1)
- [x] 3.8 TRIANGULATE: verificar cantidad cero/negativa rechazada, costo real negativo rechazado y borrado en cascada de materiales al borrar la OP (R10)
- [x] 3.9 REFACTOR: revisar nombres de restricciones e Ã­ndices para que sean coherentes con 001; ejecutar la suite del grupo (D1)

## 4. Puertos, errores y unidad de trabajo â€” RED â†’ GREEN â†’ TRIANGULATE â†’ REFACTOR

- [x] 4.1 RED: escribir el test que exige `OpRepository.buscarPorCodigoPlano(codigo, opIdExcluida?)` y falla por mÃ©todo ausente (D3, spec `puertos-persistencia-ordenes`)
- [x] 4.2 GREEN: ampliar el puerto y el adaptador Prisma con bÃºsqueda exacta sobre el valor normalizado y exclusiÃ³n de la OP editada (RN-OP-06)
- [x] 4.3 TRIANGULATE: verificar bÃºsqueda existente, bÃºsqueda sin resultado y exclusiÃ³n de la propia OP en `updateOp` (mÃ­nimo 2 casos)
- [x] 4.4 RED: escribir el test que exige `CodigoPlanoDuplicadoError` en `errores.ts` y una rama 409 en `app.ts` con el cuerpo exacto `{error, message, codigoPlano, opExistente:{id, numeroOp}}` (D3, D9)
- [x] 4.5 GREEN: crear la clase de error y el handler tipado, mesclando `codigoPlano` y `numeroOp` reales desde la OP existente (RN-OP-06, R9)
- [x] 4.6 TRIANGULATE: verificar el mensaje `El ID de plano PL-2026-045 ya estÃ¡ asignado a la OP 1871.`, el `id` UUID y el `numeroOp` obtenidos de la base real (R10)
- [x] 4.7 RED: escribir el test de carrera que exige traducir `PrismaClientKnownRequestError` code `P2002` al error de dominio, resolviendo la OP con `buscarPorCodigoPlano` (D3, R1)
- [x] 4.8 GREEN: capturar `P2002` en el adaptador Prisma y mapear tanto conflicto de plano como de `numero_op`, sin Traer Prisma a la aplicaciÃ³n (R2)
- [x] 4.9 TRIANGULATE: verificar P2002 de plano, P2002 de nÃºmero de OP y conflicto detectado antes del INSERT, todos contra PostgreSQL real sin mocks (R10)
- [x] 4.10 RED: escribir el test que exige `UnidadTrabajoOps` con repositorios enlazados y falla si el caso de uso importa `Prisma` (D6, R2)
- [x] 4.11 GREEN: declarar el puerto en `ordenes/application/ports/` e implementarlo en `ordenes/prisma/` con `$transaction` y `Prisma.TransactionClient` solo en el adaptador (R2)
- [x] 4.12 TRIANGULATE: verificar rollback completo ante fallo y que los repositorios entregados operan dentro de la misma transacciÃ³n (R10)
- [x] 4.13 REFACTOR: consolidar el mapeo de errores de Prisma sin `any` y ejecutar typecheck de backend (R9)

## 5. Escritura de OP y cliente â€” RED â†’ GREEN â†’ TRIANGULATE â†’ REFACTOR

- [x] 5.1 RED: escribir el test de `createOp` que exige cliente + OP + etapas en una transacciÃ³n y falla por caso de uso ausente (D6, spec `escritura-op-y-linea-base`, R1)
- [x] 5.2 GREEN: implementar `createOp` con normalizaciÃ³n previa del plano, resoluciÃ³n de cliente existente por nombre y lectura de `configuracion.etapas_default` (HU-01, HU-04, DD-06)
- [x] 5.3 TRIANGULATE: verificar alta con cliente nuevo, con cliente reutilizado y con plano `null`, sin duplicar clientes (mÃ­nimo 2 casos)
- [x] 5.4 RED: escribir el test de fallo parcial: material invÃ¡lido despuÃ©s de OP y etapas debe revertirlo todo (D6, R1)
- [x] 5.5 GREEN: incluir los materiales del payload dentro de la misma unidad de trabajo y validar la forma antes de abrir la transacciÃ³n (R1, R9)
- [x] 5.6 TRIANGULATE: verificar que no quedan OP ni etapas huÃ©rfanas y que los errores 422 no llegan a PostgreSQL (R10)
- [x] 5.7 RED: escribir el test de `updateOp` que exige ediciÃ³n de cabecera/plano y 409 de `numero_op_duplicado` (spec `escritura-op-y-linea-base`)
- [x] 5.8 GREEN: implementar `updateOp` excluyendo la propia OP de las bÃºsquedas de plano y nÃºmero, sin aceptar campos derivados (R3)
- [x] 5.9 TRIANGULATE: verificar ediciÃ³n conservando el mismo plano (sin 409), cambio a plano ajeno (409 con `opExistente`) y OP inexistente (404)
- [x] 5.10 GREEN: implementar `altaCliente` con validaciÃ³n de nombre no vacÃ­o y Ãºnico, reutilizando el existente sin borrarlo (DD-06, RN-OP-04)
- [x] 5.11 TRIANGULATE: 422 para cliente vacÃ­o, 409/select para duplicado y alta vÃ¡lida sin OP asociada
- [x] 5.12 REFACTOR: extraer la construcciÃ³n de comandos de aplicaciÃ³n sin tocar aserciones; ejecutar suite y typecheck (R9)

## 6. Etapas y derivados de lÃ­nea base â€” RED â†’ GREEN â†’ TRIANGULATE â†’ REFACTOR

- [x] 6.1 RED: escribir el test puro de unicidad de nombre de etapa por OP que falla por funciÃ³n ausente (D7, C-05 D10, RN-ETAPA-01, R1)
- [x] 6.2 GREEN: implementar la validaciÃ³n en dominio, sin distinciÃ³n de mayÃºsculas, sobre la colecciÃ³n de etapas de una sola OP (RN-AHORA-01)
- [x] 6.3 TRIANGULATE: verificar `Soldadura` vs `soldadura` rechazados en la misma OP y aceptados en OPs distintas (mÃ­nimo 2 casos)
- [x] 6.4 GREEN: implementar `gestionarEtapas` con alta, baja y reorden contiguo, conservando `id`, `nombre`, `completada` y `horas_vendidas` (HU-04, RN-ETAPA-01/03, R3)
- [x] 6.5 TRIANGULATE: verificar reorden de secuencia 2 â†’ 4 con `horas_vendidas = 7.50` intactas, baja con renumeraciÃ³n y etapa ajena a la OP â‡’ 404
- [x] 6.6 RED: escribir el test puro de `horas_vendidas_totales` que falla por funciÃ³n ausente (RN-HORAS-01, R1)
- [x] 6.7 GREEN: implementar la suma en dominio y usarla en las respuestas, sin columnas ni `UPDATE` de agregados (R3)
- [x] 6.8 TRIANGULATE: verificar total tras borrar una etapa con horas, OP sin etapas â‡’ 0 y etapas con `horas_vendidas = 0`
- [x] 6.9 REFACTOR: unificar la validaciÃ³n de etapas en una sola implementaciÃ³n de dominio; ejecutar suite y guardianes de imports (RN-GLOBAL-02, R2)

## 7. Materiales, agregados y detalle â€” RED â†’ GREEN â†’ TRIANGULATE â†’ REFACTOR

- [x] 7.1 RED: escribir el test de esquema Zod de `POST /api/ops/:id/materiales` que exige los tres tipos, `cantidad > 0` y costos no negativos y falla por esquema ausente (D8, R1)
- [x] 7.2 GREEN: crear el esquema de request y el adaptador HTTP con 422 antes de cualquier escritura (R9)
- [x] 7.3 TRIANGULATE: verificar alta vÃ¡lida con y sin campos opcionales, tipo invÃ¡lido â‡’ 422 y OP inexistente â‡’ 404 (mÃ­nimo 2 casos)
- [x] 7.4 RED: escribir el test puro de agregados `costo_materiales_cotizado` y `costo_materiales_real` con `COALESCE` por Ã­tem (RN-MARGEN-02/03, R1)
- [x] 7.5 GREEN: implementar las sumas en dominio sobre los materiales recuperados, sin persister agregados (R3)
- [x] 7.6 TRIANGULATE: verificar todos los reales presentes, algunos `NULL` (usa cotizado) y todos `NULL`, con aritmÃ©tica decimal `NUMERIC`, nunca `Float` (RN-MARGEN-05)
- [x] 7.7 GREEN: actualizar `DetalleOpDTO`/`DetalleOpSchema` para servir `materiales` reales y `codigoPlano`, manteniendo `horas` como arreglo vacÃ­o tipado hasta C-08 (spec `api-detalle-op`)
- [x] 7.8 TRIANGULATE: verificar detalle con materiales, sin materiales y que Swagger documenta `horas` pendiente de C-08 sin valores inventados (R3)
- [x] 7.9 REFACTOR: extraer el mapeo de filas Prisma â†’ dominio sin `any`; ejecutar suite del grupo y typecheck (R9)

## 8. BÃºsqueda global y filtro de plano â€” RED â†’ GREEN â†’ TRIANGULATE â†’ REFACTOR

- [x] 8.1 RED: escribir el test de `cumpleFiltros` en `listarOps.ts` que exige bÃºsqueda por `codigo_plano` y `clienteNombre` y falla con el predicado actual (D4, HU-09, R1)
- [x] 8.2 GREEN: ampliar `FilaDerivada` y el texto de `buscar` con `${numeroOp} ${codigoPlano ?? ''} ${clienteNombre ?? ''} ${descripcionPieza}` en minÃºsculas, reutilizando el query param existente (DD-11)
- [x] 8.3 TRIANGULATE: verificar bÃºsqueda por plano con case distinto, por nombre de cliente y por nÃºmero de OP; verificar que `null` no genera falsos positivos (mÃ­nimo 2 casos)
- [x] 8.4 RED: escribir el test del filtro `conPlano` que falla por parÃ¡metro ausente, segÃºn DU-1 confirmada (`conPlano` booleano) (D4, D12)
- [x] 8.5 GREEN: agregar `conPlano?: boolean` a `FiltrosListadoOps`, validarlo en Zod y filtrar por `codigoPlano === null` / `!== null` en `listOps` (HU-09)
- [x] 8.6 TRIANGULATE: verificar `true`, `false`, ausencia del parÃ¡metro, valor invÃ¡lido â‡’ 422 y combinaciÃ³n con `buscar` (AND)
- [x] 8.7 TRIANGULATE: verificar que `flujo` sigue pre-filtro, que `fechaDesde`/`fechaHasta` filtran `fecha_entrega` y que el orden por `fecha_entrega` + `numeroOp` no cambia (DD-12, RN-DASH-02)
- [x] 8.8 REFACTOR: extraer el predicado de bÃºsqueda a una funciÃ³n pura testeable sin mover reglas al handler ni a React (RN-GLOBAL-02)

## 9. HTTP, Swagger y espejo de esquemas â€” RED â†’ GREEN â†’ TRIANGULATE â†’ REFACTOR

- [x] 9.1 RED: escribir los tests de ruta para los siete endpoints (`POST /api/ops`, `PUT /api/ops/:id`, `POST /api/clientes`, `POST /api/ops/:id/etapas`, `PATCH .../orden`, `DELETE ...`, `POST /api/ops/:id/materiales`) que fallan por rutas ausentes (D9, R1)
- [x] 9.2 GREEN: registrar las rutas en las features correspondientes y cablearlas en `app.ts` junto a las existentes, sin crear un router paralelo (D9)
- [x] 9.3 TRIANGULATE: verificar 200/201 de Ã©xito, 422 de validaciÃ³n, 404 de recurso inexistente y 409 de plano y OP duplicados con los cuerpos exactos (mÃ­nimo 2 casos por ruta)
- [x] 9.4 GREEN: generar los JSON Schema con `z.toJSONSchema(..., { target: 'draft-07' })` y documentar el placeholder `Opcional â€” Ej: PL-2026-045` y el contrato 409 en Swagger (D9)
- [x] 9.5 RED: escribir el test del espejo frontend que exige `codigoPlano` en `EsquemaTarjetaOrden` y falla por campo ausente (D5, R1)
- [x] 9.6 GREEN: agregar `codigoPlano: z.string().max(80).nullable()` en `frontend/src/shared/domain-client/esquemas.ts` manteniendo `z.ZodType<TarjetaOrdenDTO>` (R2, R9)
- [x] 9.7 TRIANGULATE: verificar tarjeta con plano, sin plano y respuesta sin el campo rechazada, sin agregar UI nueva en `features/tablero/` (HU-09)
- [x] 9.8 REFACTOR: unificar la construcciÃ³n de esquemas repetidos sin `any`; ejecutar typecheck de backend y frontend (R9)

## 10. VerificaciÃ³n final, guardianes y cierre

- [x] 10.1 Ejecutar la suite completa de dominio, backend y frontend y compararla con el safety-net de 1.2: cero regresiones en C-01..C-05 (D10)
- [x] 10.2 Verificar guardianes: cero imports de Fastify/Prisma/React/exceljs en `packages/domain`, cero `Prisma.`/`$transaction` fuera de adaptadores y cero `any` en los tres workspaces (R2, R9)
- [x] 10.3 Verificar R3: ninguna columna ni `UPDATE` de avance, horas totales, costos agregados, margen o semÃ¡foro en los archivos del change
- [x] 10.4 Verificar R5: cero cÃ³digo de auth, PIN, RBAC, tabla `usuarios` o `usuario_id`; cualquier requerimiento de roles se escala, nunca se codifica
- [x] 10.5 Verificar R6/R11: cero cÃ³digo de `exceljs`, cero mapeo `O7:R8`/`S/P` y cero uso de `J7:N8` en este change (D11)
- [x] 10.6 Verificar R8: todo lo bajo `openspec/` fue creado por CLI/skill; `CHANGES.md`, `Docs/`, `AGENTS.md`, `CLAUDE.md` y `openspec/config.yaml` quedan sin modificar por el apply
- [x] 10.7 Ejecutar `openspec validate ordenes-y-linea-base-api --strict` y `openspec status --change ordenes-y-linea-base-api --json` con todos los artefactos en `done`
- [x] 10.8 Reportar en el cierre que DU-1..DU-4 quedaron aplicadas segÃºn lo decidido por el usuario (2026-11-21), y confirmar que C-15 sigue bloqueado por C-13/IN-08 para el mapeo de plano (D12)
- [x] 10.9 No ejecutar builds ni commits; el change se cierra con `/opsx:archive` y el checkbox de C-06 en `CHANGES.md` se marca reciÃ©n en ese momento (reglas globales)
