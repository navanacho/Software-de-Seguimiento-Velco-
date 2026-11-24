## Why

C-08 ya expone la API y los derivados de horas reales en `DetalleOpDTO`, pero el frontend todavía no permite imputar ni corregir partes: la vista de detalle ignora `data.horas` y la tarjeta no muestra consumo. Sin C-09 no se pueden completar HU-10/HU-13 desde la UI, y el camino crítico queda detenido antes de C-11 (`desvios-y-margen-domain`).

## What Changes

- Agregar en la UI de detalle de OP un modal/formulario de "Cargar horas" con fecha, etapa opcional, operario en texto libre y horas, validando `horas > 0` antes de enviar a `POST /api/ops/:id/horas`.
- Agregar en el detalle un listado editable de partes con acciones de editar y eliminar, consumiendo `PATCH /api/ops/:id/horas/:horaId` y `DELETE /api/ops/:id/horas/:horaId`, y refrescando los derivados visibles tras cada mutación.
- Mostrar en la tarjeta del tablero la barra/indicador `Horas Reales / Horas Vendidas` usando datos provistos por contrato de lectura, sin recalcular reglas de negocio en React (RN-GLOBAL-02, R3).
- Actualizar esquemas/tipos del cliente frontend para reflejar `ParteHoraDTO` y los derivados de horas ya presentes en `DetalleOpDTO` tras C-08.
- Cubrir con tests de componente/comportamiento: validación de horas, actualización de lista tras alta/edición/eliminación, y ausencia de lógica de negocio en componentes.

No se modifica backend, migraciones ni reglas de dominio. No se agregan auth/PIN/RBAC (R5), derivados persistidos (R3), Excel (R6), `any` (R9) ni mocks de PostgreSQL (R10). El cálculo de totales/desvío/alerta sigue siendo responsabilidad del dominio/API.

## Capabilities

### New Capabilities

- `carga-horas-ui`: modal/formulario de carga rápida de partes desde detalle/tarjeta con validación de frontera `horas > 0` y envío a la API de C-08.
- `edicion-horas-ui`: listado editable de partes en detalle con editar/eliminar, manejo de errores y refresco de datos tras mutaciones.

### Modified Capabilities

- `detalle-op-ui`: la vista de detalle pasa de ocultar horas reales a mostrar partes y acciones de carga/edición, manteniendo derivados como datos del DTO.
- `tablero-grilla-tarjetas`: las tarjetas incorporan indicador `Horas Reales / Horas Vendidas` alimentado por contrato de lectura, sin cálculo en React.

## Impact

- Frontend: `frontend/src/features/ordenes/` (detalle, hooks/queries/mutations de horas, componentes de modal/listado), `frontend/src/features/tablero/components/TarjetaOrden.tsx` y hooks/queries relacionados, `frontend/src/shared/domain-client/{esquemas.ts,tipos.ts,consultarOp.ts}` y cliente HTTP para endpoints de horas.
- Contratos consumidos: `GET/POST/PATCH/DELETE /api/ops/:id/horas` y `GET /api/ops/:id` (spec `registros-horas-api`, `api-detalle-op`, `dto-derivados-orden`).
- Dependencias: sin nuevas; se reutilizan React 19.3.1, TanStack Query 5.108.1, React Router 7.18.6, Zod 4.6.7, Vitest 5.1.1 y Testing Library 16.3.3.
- Riesgo/tensión de diseño a resolver en `design.md`: C-08 fijó P-6=B (`TarjetaOrdenDTO`/`GET /api/ops` no incluyen totales de horas). CHANGES.md C-09 pide barra en tarjeta alimentada por DTO sin cálculo en React; el diseño debe definir el contrato de lectura compatible sin violar R2/R3/RN-GLOBAL-02.
