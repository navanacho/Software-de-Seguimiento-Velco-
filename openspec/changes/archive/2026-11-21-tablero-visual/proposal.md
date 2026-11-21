## Why

C-04 dejó disponibles `GET /api/ops` y `PATCH /api/ops/:id/etapas/:etapaId` con los derivados ya calculados por `@velco/domain`, pero la SPA todavía no muestra ningún tablero: hoy `App.tsx` renderiza el componente de salud de C-01. Sin C-05, HU-05/06/07/09 no son verificables por el usuario y el contrato de C-04 queda sin consumidor (RN-GLOBAL-02). Este change arma la pantalla operativa apoyándose en el DTO, sin mover ni reimplementar reglas de negocio en React.

## What Changes

- Agregar la ruta `/` del tablero con una **grilla única de tarjetas** —sin columnas Kanban ni slider de avance— y la estética industrial de `Docs/tablero-taller-v2.html`: KPIs superiores, franja amarilla/negra y tipografía condensada (HU-05, RN-GLOBAL-01, R3).
- Renderizar el semáforo, `avance`, `diasRestantes` y `etiquetaPlazo` **exactamente como vienen en `TarjetaOrdenDTO`**; la UI solo mapea `semaforo` → clase CSS y muestra el texto derivado, sin comparar fechas ni invocar funciones de cálculo (RN-GLOBAL-02).
- Agregar la tira superior *"Dónde está cada trabajo ahora"* desde `flujo` (`GrupoFlujo[]`) y el badge `ahora` en la tarjeta a partir de `etapaAhora`, sin recalcular la primera etapa pendiente (HU-06, HU-07, RN-FLujo-01, RN-AHORA-01).
- Agregar el checkbox de etapas con actualización optimista vía `PATCH /api/ops/:id/etapas/:etapaId`, repintando la tarjeta con el `TarjetaOrdenDTO` devuelto y haciendo **rollback** ante error (Flujo 3, RN-AVANCE-01/02).
- Agregar filtros por cliente, estado y etapa `ahora` más búsqueda por texto, enviados como query string de `GET /api/ops` (`clienteId`, `estado`, `etapaAhora`, `buscar`), y un **estado vacío con acciones sugeridas** cuando `ops` llega vacío (HU-09, Flujo 2).
- Separar contenedores que cargan el DTO (TanStack Query) de componentes presentacionales de tarjeta, y crear `frontend/src/shared/domain-client/` como adaptador HTTP delgado: reutiliza los tipos canónicos importados desde `@velco/domain` y valida la frontera con zod, sin lógica de negocio ni definición duplicada del DTO (§Container/Presentational, R2, R9).
- Cubrir cada comportamiento con tests de componente (Testing Library + jsdom) en secuencia RED → GREEN → TRIANGULATE (mínimo 2 casos) → REFACTOR: semáforo y badge `ahora`, ausencia de slider, y actualización optimista con rollback (R1, RN-GLOBAL-04).

No hay cambios rompientes. No se modifica el dominio, el backend, la base de datos, las plantillas `.xlsx`, `CHANGES.md` ni los changes archivados. No se introduce autenticación, PIN, RBAC ni modo kiosco (R5, HU-08 diferida).

## Capabilities

### New Capabilities

- `tablero-grilla-tarjetas`: grilla única de tarjetas autocontenidas con estética industrial, KPIs superiores y semáforo renderizado desde el DTO; prohibición explícita de columnas Kanban y de slider de avance.
- `tira-flujo-y-ahora`: tira *"Dónde está cada trabajo ahora"* construida desde `flujo` y badge `ahora` en la tarjeta por igualdad con `etapaAhora`, sin recálculo en React.
- `filtros-y-estado-vacio-tablero`: filtros por cliente/estado/etapa y búsqueda por texto sobre `GET /api/ops`, más estado vacío con acciones sugeridas.
- `avance-etapas-ui`: checkbox de etapas con mutación optimista contra `PATCH /api/ops/:id/etapas/:etapaId`, respuesta repintada desde el DTO y rollback en error.
- `cliente-y-contenedores-tablero`: adaptador HTTP `shared/domain-client` sin lógica de negocio y separación contenedor/presentacional de la tarjeta.

### Modified Capabilities

Ninguna. C-05 consume los contratos de `dto-derivados-orden`, `api-listado-ops`, `api-avance-etapas` y `avance-y-flujo-etapas` sin cambiar sus requisitos; el scenario *Consumo por el frontend* ya anticipa este change.

## Impact

- Frontend: nuevos archivos en `frontend/src/features/tablero/{components,hooks,queries}/` y en `frontend/src/shared/domain-client/`; ajuste del routing en `frontend/src/app/App.tsx` para montar el tablero en `/`; estilos en CSS Modules junto a `frontend/src/global.css` (clsx para clases condicionales). Sin dependencias nuevas: React 19.3.1, Vite 8.3.8, TanStack Query 5.108.1, react-router-dom 7.18.6, zod 4.6.7, clsx 2.1.1, Vitest 5.1.1 y @testing-library/react 16.3.3 ya están fijados.
- Contrato: se consumen `GET /api/ops` (`{ ops, kpis, flujo }`) y `PATCH /api/ops/:id/etapas/:etapaId` (`TarjetaOrdenDTO` recalculado). `TarjetaOrdenDTO`, `EtapaTarjeta`, `GrupoFlujo` y `EstadoSemaforo` se importan desde `@velco/domain`; no se redefine el DTO en el frontend.
- Datos: sin migraciones ni escrituras nuevas; el único write sigue siendo `etapas_orden.completada`, ya implementado en C-04 (R3).
- Tests: suite de componente en `frontend/src/features/tablero/` con jsdom; sin PostgreSQL (R10 no aplica: no hay tests de integración de BD en este change), sin builds ni commits.
- Backend, dominio y exportación: sin cambios. Las dudas de contrato detectadas se documentan en `design.md` antes del apply.
