## 1. Preparación, safety net y contratos C-06

- [x] 1.1 Verificar punto de partida: C-06 archivado, `openspec list --json` sin otros changes activos y `CHANGES.md` con C-07 en `[ ]` (R8)
- [x] 1.2 Ejecutar sin modificarlos los suites de `packages/domain`, `backend` y `frontend` y capturar el resultado como safety-net baseline (D10): 38/38, 60/60 y 155/155 en verde
- [x] 1.3 Confirmar en el código los bodies exactos de `POST`/`PUT /api/ops`, `POST /api/clientes`, etapas y materiales, y los tres cuerpos de error 409/422, sin inventar contratos (D2, D3, D6, D9)
- [x] 1.4 Registrar los supuestos cerrados del propose: detalle mínimo (D7), precarga canónica sin `GET /api/configuracion` (D5) y `fechaIngreso` informativa (D9)
- [x] 1.5 Crear la estructura `frontend/src/features/ordenes/{components,hooks,queries}/` y la ruta de detalle, sin código de producción todavía (D1, D7)

## 2. Cliente HTTP de escritura y esquemas de error — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 2.1 RED: tests que exigen esquemas Zod de request para OP, cliente, etapas y materiales, y fallan por módulos ausentes (spec `cliente-y-contenedores-tablero`, R1)
- [x] 2.2 GREEN: espejar en `shared/domain-client/` los esquemas de C-06 con `z.infer`, sin imports de Fastify, Prisma ni React (R2, R9)
- [x] 2.3 TRIANGULATE: verificar alta con materiales, edición sin `etapas`, alta de etapa con `horasVendidas` y reorden con `ordenSecuencia` (≥2 casos)
- [x] 2.4 RED: tests de los errores discriminados `codigo_plano_duplicado`, `numero_op_duplicado` y `validation_error` con `details[].path` (D2)
- [x] 2.5 GREEN: implementar el parseo tipado de errores y las funciones de escritura sin normalizar planos ni calcular derivados (RN-OP-06, RN-GLOBAL-02)
- [x] 2.6 TRIANGULATE: verificar el cuerpo exacto del 409 de plano con `opExistente`, el 409 de OP sin `opExistente` (DU-4) y el 422 con rutas de campo
- [x] 2.7 REFACTOR: unificar el mapeo de errores; typecheck de frontend sin `any` y guardianes de imports (R9)

## 3. Rutas, detalle mínimo y badge de plano — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 3.1 RED: tests de `App.tsx` que exigen `/ops/nueva`, `/ops/:id/editar` y `/ops/:id`, fallan por rutas ausentes (spec `detalle-op-ui`, R1)
- [x] 3.2 GREEN: registrar las tres rutas con `react-router-dom` 7.18.6, sin auth (R5)
- [x] 3.3 RED: tests de componente del badge que fallan por texto ausente: `Plano: PL-2026-045`, `Sin plano` y muchas tarjetas sin plano (spec `badge-plano-op`, RN-OP-05/06)
- [x] 3.4 GREEN: renderizar el badge en `TarjetaOrden` y en el detalle leyendo solo `codigoPlano` del DTO, sin normalizar ni agregar campos derivados (DD-11, R3)
- [x] 3.5 TRIANGULATE: verificar badge en tarjeta, badge en detalle, `null` nunca convertido en texto y derivados intactos (≥2 casos)
- [x] 3.6 GREEN: `DetalleOpPage` con `GET /api/ops/:id`, estado 404 claro, acceso a *Editar* y sin horas reales ni exportación (D7)
- [x] 3.7 REFACTOR: extraer el componente presentacional `BadgePlano` y sus estilos con CSS Modules/tokens; sin builds (D10)

## 4. Formulario de alta y edición — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 4.1 RED: tests que exigen `FormularioOrdenPage` con N° OP, plano con placeholder `Opcional — Ej: PL-2026-045`, cliente, pieza, entrega, monto y observaciones (spec `formulario-ordenes`, R1)
- [x] 4.2 GREEN: contenedor + componente presentacional con estado local tipado y validación de forma con Zod (D1, D2, R9)
- [x] 4.3 TRIANGULATE: validar `numero_op` vacío, `numero_op` válido, plano vacío ⇒ `null` y `fechaEntrega` en `YYYY-MM-DD` (≥2 casos)
- [x] 4.4 RED: tests del selector de cliente existente y del alta inline idempotente vía `POST /api/clientes` (D4, RN-OP-04)
- [x] 4.5 GREEN: implementar ambos modos enviando `clienteNombre` en la OP, reutilizando el cliente existente sin duplicarlo (DD-06)
- [x] 4.6 TRIANGULATE: cliente elegido, cliente nuevo 201 y cliente inline 200 reutilizado (≥2 casos)
- [x] 4.7 RED: tests de materiales por tipo con decimales como string y de la ausencia de controles de edición/borrado (D6, DU-2)
- [x] 4.8 GREEN: formulario de materiales en alta (`materiales` dentro del POST) y lista de solo lectura + alta en edición (`POST /api/ops/:id/materiales`)
- [x] 4.9 TRIANGULATE: alta con material `MP`, tipo inválido rechazado y edición sin botones de borrar (≥2 casos)

## 5. Editor de etapas — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 5.1 RED: test que exige precarga `Corte`, `Soldadura`, `Mecanizado`, `Pintura`, `Entrega` al abrir `/ops/nueva` y falla por editor ausente (spec `editor-etapas-orden`, RN-ETAPA-02, R1)
- [x] 5.2 GREEN: editor con filas ordenadas y `horasVendidas` como string decimal, sin taxonomía cerrada (RN-ETAPA-03)
- [x] 5.3 TRIANGULATE: precarga sin cambios omite `etapas` del payload, precarga modificada envía la colección y alta desde cero (≥2 casos)
- [x] 5.4 RED: tests de agregar y quitar etapas en OP existente con sus endpoints, incluido nombre vacío y longitud > 100 (D5)
- [x] 5.5 GREEN: botones *Agregar*/*Quitar* conectados a los hooks de mutación; sin renombrar (DU-3)
- [x] 5.6 TRIANGULATE: agregar `Pulido`, quitar `Entrega`, nombre inválido rechazado y OPs distintas con el mismo nombre (≥2 casos)
- [x] 5.7 RED: test de reorden persistido que falla si el orden solo cambia en memoria (RN-ETAPA-01, R1)
- [x] 5.8 GREEN: `PATCH .../orden`, invalidación y reconsulta de `GET /api/ops/:id`, repintado con el DTO servido (D5)
- [x] 5.9 TRIANGULATE: mover `Mecanizado` a la posición 1 con `horasVendidas: '7.50'` intactas, reorden fallido y avance/ahora sin recalcular (≥2 casos)
- [x] 5.10 REFACTOR: extraer la precarga y el mapeo de mutaciones sin tocar aserciones; verificar ausencia de slider y de `range` (R3)

## 6. Errores 409/422, navegación y entry point del tablero — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 6.1 RED: tests de componente que fallan al no resaltar `codigo_plano_duplicado` con el mensaje literal y el enlace a la OP existente (RN-OP-06, R1)
- [x] 6.2 GREEN: mostrar `El ID de plano PL-2026-045 ya está asignado a la OP 1871.`, resaltar el campo y enlazar `/ops/<uuid>` con `opExistente.id`
- [x] 6.3 TRIANGULATE: 409 de plano con enlace, 409 de `numero_op` sin enlace y 422 con errores por `path` (≥2 casos)
- [x] 6.4 GREEN: conservar el formulario y los datos ante cualquier error; no navegar ni invalidar el tablero
- [x] 6.5 RED: tests que fallan si no se invalida `['tablero']` y no se navega a `/` tras guardar (spec `formulario-ordenes`, Flujo 1)
- [x] 6.6 GREEN: hook de mutación que invalida la query y usa `useNavigate` al `/` tras éxito de `POST`/`PUT`
- [x] 6.7 TRIANGULATE: alta exitosa con tarjeta creada, edición exitosa con tarjeta actualizada y fallo sin navegación (≥2 casos)
- [x] 6.8 RED: tests que exigen *Nueva OP* en la barra y en el estado vacío (spec `filtros-y-estado-vacio-tablero`)
- [x] 6.9 GREEN: agregar la acción sin tocar filtros, queries ni KPIs del tablero (RN-GLOBAL-02)
- [x] 6.10 TRIANGULATE: navegación desde barra, desde estado vacío y tablero con resultados sin estado vacío (≥2 casos)

## 7. Verificación final y cierre

- [x] 7.1 Ejecutar los suites de dominio, backend y frontend y compararlos con el safety-net de 1.2 (D10)
- [x] 7.2 Ejecutar typecheck estricto de los tres workspaces; cero `any`, componentes en PascalCase y sin imports de frameworks en `packages/domain` (R2, R9)
- [x] 7.3 Verificar guardianes de alcance: cero auth/PIN/RBAC, cero derivados persistidos, cero Excel, cero mocks de PostgreSQL y ningún cambio de backend (R3, R5, R6, R10)
- [x] 7.4 Confirmar que los seis artefactos delta de `openspec/changes/ordenes-form/specs/` cubren todos los escenarios obligatorios: precarga, validación de OP y plano, `Sin plano`, 409 de plano y reorden persistido
- [x] 7.5 Correr `openspec status --change ordenes-form --json` con `applyRequires` en `done` y `openspec validate ordenes-form --strict`, sin builds ni commits (R8)
