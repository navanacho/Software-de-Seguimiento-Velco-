## Why

C-05 entregó el tablero visual consumiendo `GET /api/ops`, pero la API todavía no permite dar de alta ni editar una OP: `ordenes_trabajo` no tiene `codigo_plano`, no existe `materiales_orden` y los únicos writes son `completada` de etapas (C-04). Sin C-06 no son verificables HU-01, HU-02, HU-04 ni HU-09 en su forma canónica adoptada, y C-07/C-08 quedan bloqueados en el camino crítico (CHANGES.md §C-06).

Este change implementa la escritura de la línea base y el ID de plano opcional como una sola unidad transaccional, respetando el contrato ya publicado del tablero: los derivados siguen calculándose en dominio, sin columnas persistentes ni segunda implementación en HTTP o React (RN-GLOBAL-02, R3).

## What Changes

- Agregar la migración 002 **aditiva, sin renumerar la 001**: tabla `materiales_orden` con `tipo ENUM('MP','INSUMOS','TERCERIZADOS')`, `cantidad > 0`, costos, remito/factura/nt/po e índices; y columna `codigo_plano VARCHAR(80) NULL` en `ordenes_trabajo` con `CHECK (codigo_plano <> '')` e índice único parcial `WHERE codigo_plano IS NOT NULL` (DD-11). La migración 001 permanece intacta.
- Incorporar `CodigoPlano` y `codigoPlano: string | null` al dominio y a `TarjetaOrdenDTO`. La normalización `trim()` + `toUpperCase()` y vacío ⇒ `null` ocurre **en la frontera HTTP**; la BD prohíbe `''` y no se declara `@unique` en Prisma porque el índice es parcial y nullable (RN-OP-05/06).
- Definir el contrato de error 409 `codigo_plano_duplicado` con `codigoPlano` y `opExistente: { id, numeroOp }`, implementado como clase de error siguiendo `backend/src/shared/errores.ts` y el handler de `app.ts`, con fallback a `PrismaClientKnownRequestError` `P2002` por carrera y resolución de la OP existente mediante el nuevo puerto `OpRepository.buscarPorCodigoPlano`.
- Extender el predicado de `listarOps.ts` (hoy solo `numeroOp` y `descripcionPieza`) para incluir `codigo_plano` y el nombre del cliente, reutilizando el query param `buscar`, más un filtro rápido **con plano / sin plano**. `fechaDesde`/`fechaHasta` siguen filtrando `fecha_entrega` (fecha comprometida): no se cambia ese contrato (RN-EXPORT-07, DD-12).
- Agregar los casos de uso `createOp`, `updateOp`, `altaCliente`, `gestionarEtapas` y el alta de materiales en una transacción: cliente + OP + `etapas_default` + materiales, con horarios vendidos por etapa y agregados de materiales calculados en dominio. Incluye la unicidad de nombres de etapa por OP adoptada en C-05 (D10 de `tablero-visual`), aplicada en el alta y sin renombrar etapas en este change.
- Exponer `POST /api/ops` (409 de OP y de plano, 422 de cliente vacío), `PUT /api/ops/:id`, `POST /api/clientes`, `POST /api/ops/:id/etapas`, `PATCH /api/ops/:id/etapas/:etapaId/orden`, `DELETE /api/ops/:id/etapas/:etapaId` y `POST /api/ops/:id/materiales`, con esquemas Zod y JSON Schema de request/response, incluido el placeholder de plano `Opcional — Ej: PL-2026-045`.
- Espejar `codigoPlano` en los esquemas Zod/JSON del backend y en `frontend/src/shared/domain-client/esquemas.ts`. El input de búsqueda del frontend es genérico y **no requiere UI nueva** en C-06; el badge `Plano:` / `Sin plano` y el editor de OP corresponden a C-07.
- Cubrir cada capability con TDD estricto RED → GREEN → TRIANGULATE (mínimo 2 casos) → REFACTOR, con safety-net baseline y tests de integración contra PostgreSQL real en contenedor: atomicidad, unicidades, normalización, vacío ⇒ null, 409 con `opExistente`, fallback P2002, reorden sin pérdida de `horas_vendidas`, derivados recalculados y búsqueda por plano/cliente.

No hay cambios rompientes en el contrato del tablero. No se escribe código de aplicación en este propose. No se implementa Excel: el mapeo `O7:R8` / `S/P` de OP-MASTER es responsabilidad de C-15 y queda **bloqueado por C-13/IN-08** (confirmar el rango en la plantilla real); jamás se usa `J7:N8`. Tampoco se introducen auth/PIN/RBAC (R5), derivados persistidos (R3), `any` (R9) ni mocks de PostgreSQL (R10).

## Capabilities

### New Capabilities

- `codigo-plano-unico`: tipo `CodigoPlano`, normalización HTTP, unicidad condicional en BD, contrato 409 con `opExistente`, fallback P2002 y puerto de búsqueda por plano.
- `escritura-op-y-linea-base`: casos de uso transaccionales y endpoints de alta/edición de OP, alta de cliente y gestión de etapas, con precarga de `etapas_default` y unicidad de nombres de etapa por OP.
- `materiales-orden-api`: tabla aditiva `materiales_orden`, alta de materiales por OP y cálculo de agregados cotizado/real en dominio, sin columnas derivadas.
- `busqueda-por-plano`: extensión del predicado de `buscar` en `listOps` y filtro rápido con plano / sin plano, conservando la semántica de fecha comprometida.

### Modified Capabilities

- `modelo-relacional-ordenes`: migración 002 aditiva con `codigo_plano`, su `CHECK`, su índice parcial y `materiales_orden`; la migración 001 no se altera.
- `modelos-prisma-ordenes`: campo `codigoPlano` nullable y modelo `MaterialOrden` con enum de tipos; sin `@unique` sobre un campo nullable.
- `puertos-persistencia-ordenes`: nuevos métodos de búsqueda por plano, escritura transaccional de OP/cliente/etapas/materiales y provisión de etapas frescas para recálculo.
- `api-listado-ops`: predicado global ampliado y parámetro de filtro por presencia de plano, sin tocar filtros de fecha ni KPIs/flujo.
- `dto-derivados-orden`: `TarjetaOrdenDTO.codigoPlano` como dato transportado, sin convertirlo en derivado ni duplicar reglas.
- `api-detalle-op`: el detalle hereda `codigoPlano` y pasa a servir `materiales` reales de C-06; `horas` sigue vacío hasta C-08.

## Impact

- Base de datos: nueva migración 002 en `backend/prisma/migrations/`; esquema Prisma 7.10.1 actualizado; PostgreSQL 18.7 real en tests (R10). Sin renumeración de migraciones.
- Backend: `packages/domain/src/ordenes/`, `packages/domain/src/materiales/` (nuevo), `backend/src/features/ordenes/{application,http,prisma}/`, `backend/src/features/clientes/`, `backend/src/features/etapas/`, `backend/src/features/materiales/` (nuevo) y `backend/src/shared/errores.ts` + `backend/src/features/salud/http/app.ts` para el nuevo error 409. Sin dependencias nuevas.
- Frontend: solo espejo de esquemas Zod en `frontend/src/shared/domain-client/`; sin componentes, rutas ni estilos nuevos en C-06 (C-07 renderiza el badge y el formulario).
- Contratos HTTP: cinco nuevos endpoints de escritura, más `codigoPlano` en las respuestas de tarjeta y detalle, y el filtro de plano en `GET /api/ops`. Swagger se genera desde `z.toJSONSchema` como en C-04.
- Dependencias aguas abajo: C-07 y C-08 desbloqueados tras este change; C-15 depende de C-13/IN-08 para el mapeo Excel de `ID Plano:` (`O7:R8`, `S/P`), que NO se implementa acá.
- Tests: RED → GREEN → TRIANGULATE → REFACTOR en cada capability; integración con `@testcontainers/postgresql` 12.2.2 sobre `postgres:18.7`; typecheck estricto y cero `any`; sin builds ni commits.
