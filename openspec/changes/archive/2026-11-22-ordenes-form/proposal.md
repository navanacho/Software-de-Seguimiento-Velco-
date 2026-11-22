## Why

C-06 dejó listos los endpoints de escritura de OP, cliente, etapas y materiales, y el DTO ya transporta `codigoPlano`, pero el frontend todavía solo tiene el tablero de lectura: no hay formulario de alta/edición, ni entrada a `/ops/nueva` o `/ops/:id/editar`, ni badge de plano. Sin C-07 no se verifican HU-01, HU-02 ni HU-04 desde la UI y el retorno al tablero con la tarjeta creada sigue sin cubrirse (CHANGES.md §C-07, Flujo 1).

El change usa los contratos ya publicados por C-06 sin inventar backend nuevo: la UI es un adaptador delgado que valida en la frontera, muestra errores por campo y deja todos los derivados y reglas de negocio en el dominio (RN-GLOBAL-02, R2, R3).

## What Changes

- Agregar las rutas `/ops/nueva` y `/ops/:id/editar` en la SPA (`App.tsx`), accesibles sin autenticación (R5), con un formulario para N° OP, ID/Código de plano (placeholder literal `Opcional — Ej: PL-2026-045`), cliente existente o alta inline, descripción de pieza, fechas de ingreso/entrega, monto vendido, horas vendidas por etapa y materiales por tipo (`MP`/`INSUMOS`/`TERCERIZADOS`).
- Renderizar el badge `Plano: [codigo]` cuando `codigoPlano !== null` y `Sin plano` cuando es `null`, tanto en la tarjeta del tablero como en el detalle de la OP, leyendo el valor del DTO sin normalizarlo ni recalcularlo (RN-OP-05/06, DD-11).
- Incorporar un editor de etapas de texto libre que precargue `configuracion.etapas_default` en alta, permita agregar, quitar y reordenar, y conserve `horas_vendidas` al reordenar. Sin taxonomía cerrada, sin renombrar etapas y sin slider de avance (RN-ETAPA-01..03, DU-3 de C-06).
- Mapear respuestas 422 y 409 a errores por campo: para `codigo_plano_duplicado` mostrar `El ID de plano PL-2026-045 ya está asignado a la OP 1871.` con acceso a la OP existente mediante `opExistente.id`; para `numero_op_duplicado` resaltar `numero_op` sin `opExistente` (DU-4). Vacío ⇒ `null` y normalización `trim()` + `toUpperCase()` siguen siendo responsabilidad del backend; la UI solo envía y muestra.
- Tras guardar, invalidar la consulta del tablero y navegar a `/` con la tarjeta creada o actualizada visible; en edición conservar la OP y sus etapas al recargar.
- Agregar la acción *Nueva OP* al tablero (barra de acciones y estado vacío) y un detalle mínimo de solo lectura en `/ops/:id` con el badge de plano y el enlace *Editar*, consumiendo `GET /api/ops/:id`.
- Escribir tests de componente con Vitest siguiendo RED → GREEN → TRIANGULATE (mínimo 2 casos) → REFACTOR: precarga de etapas, validación de `numero_op` y de plano, badge `Sin plano`, error 409 de plano y reorden persistido (R1).

No hay cambios rompientes. No se modifica ningún endpoint, migración, esquema de Base de Datos ni regla de dominio: C-06 ya los entrega. No se implementan Excel (R6), auth/PIN/RBAC (R5), derivados persistidos (R3), `any` (R9) ni mocks de PostgreSQL (R10). La corrección y baja de materiales sigue diferida (DU-2 de C-06): el formulario permite cargarlos, no editarlos.

## Capabilities

### New Capabilities

- `formulario-ordenes`: vistas de alta y edición, campos de cabecera y línea base, cliente existente o alta inline, envío a `POST`/`PUT /api/ops`, validación de forma, manejo de 409/422 con resaltado por campo y retorno al tablero.
- `editor-etapas-orden`: precarga de `etapas_default`, agregar/quitar/reordenar etapas de texto libre, horas vendidas por etapa y persistencia del orden sin renombrar ni recalcular derivados en React.
- `badge-plano-op`: renderizado de `Plano: [codigo]` / `Sin plano` en tarjeta y detalle a partir de `TarjetaOrdenDTO.codigoPlano` y `DetalleOpDTO.codigoPlano`.
- `detalle-op-ui`: ruta mínima `/ops/:id` de solo lectura sobre `GET /api/ops/:id`, con badge de plano y acceso a la edición; no incluye analítica, horas reales ni exportación.

### Modified Capabilities

- `cliente-y-contenedores-tablero`: el cliente HTTP delgado incorpora funciones tipadas para los endpoints de escritura de C-06 y el parseo Zod de los cuerpos de error 409/409 de plano, sin reglas de negocio ni duplicación de DTOs.
- `filtros-y-estado-vacio-tablero`: el tablero ofrece la acción *Nueva OP* tanto en la barra de acciones como en el estado vacío, sin alterar filtros ni queries existentes.

## Impact

- Frontend: `frontend/src/app/App.tsx` (rutas); nuevo slice `frontend/src/features/ordenes/{components,hooks,queries}/`; ajustes en `frontend/src/features/tablero/` (badge y acción); ampliación de `frontend/src/shared/domain-client/` (cliente de escritura y esquemas de error); estilos con CSS Modules y tokens de `global.css` según `Docs/design_system_velco.md`.
- Contratos HTTP consumidos (sin cambios): `POST /api/ops`, `PUT /api/ops/:id`, `POST /api/clientes`, `POST /api/ops/:id/etapas`, `PATCH /api/ops/:id/etapas/:etapaId/orden`, `DELETE /api/ops/:id/etapas/:etapaId`, `POST /api/ops/:id/materiales`, `GET /api/ops/:id`, `GET /api/ops`.
- Datos: sin migraciones ni cambios de Prisma. `codigoPlano` se transporta como dato persistido; el editor de etapas no escribe `avance`, totales ni costos (R3).
- Backend/dominio: sin cambios. Cualquier ajuste de contrato queda fuera de este change y debe proponerse por separado.
- Dependencias: ninguna nueva; React 19.3.1, react-router-dom 7.18.6, TanStack Query 5.108.1, zod 4.6.7, Vitest 5.1.1, clsx 2.1.1 ya están instaladas (C-01).
- Tests: componentes con `@testing-library/react` 16.3.3 + jsdom 31.0.1; safety-net de tablero sin modificar; typecheck estricto y cero `any`. Sin builds ni commits.
- Supuesto registrado: la SPA actual no tiene ruta `/ops/:id` implementada (solo `/` y `/salud`), por lo que C-07 entrega el detalle mínimo descriptivo; no se adelantan C-09, C-17 ni C-18.
