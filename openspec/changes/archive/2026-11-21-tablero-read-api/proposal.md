## Why

C-03 dejó en `packages/domain/` una única implementación canónica de avance, etapa `ahora`, semáforo y DTO de tarjeta, pero hoy ningún endpoint la sirve: C-05 no puede armar el tablero de HU-05/06/07/09 sin una API que aplique filtros y entregue los derivados ya calculados. Este change conecta ese dominio con Fastify sin mover ninguna regla de negocio al handler y sin duplicar cálculos en el frontend.

## What Changes

- Agregar `GET /api/ops` con `listOps({ fechaDesde, fechaHasta, estado })` más filtros por cliente, etapa `ahora` y búsqueda por N° de OP/pieza (HU-09); el cuerpo incluye KPIs y conteos de flujo construidos con `agruparFlujo`. Los filtros se aplican sobre derivados calculados por el dominio, nunca sobre columnas persistidas.
- Agregar `GET /api/ops/:id` con etapas, horas, materiales y derivados, reutilizando el contrato de `TarjetaOrdenDTO` que consumirán HU-14/15/16. El alcance de horas y materiales queda explicitado como decisión abierta en `design.md` porque sus reglas pertenecen a C-11.
- Agregar `PATCH /api/ops/:id/etapas/:etapaId` para alternar `completada`, con recálculo de avance, `ahora` y semáforo a través de las funciones puras de C-03; responder `404` cuando la etapa no existe o pertenece a otra OP (Flujo 3).
- Validar la frontera HTTP con esquemas Fastify generados desde `zod` (patrón ya usado por `/api/health`): fechas `YYYY-MM-DD`, rango `fechaDesde <= fechaHasta`, enums de estado y longitudes; ninguna regla de negocio dentro del handler, que solo valida y delega a casos de uso.
- Extender los puertos existentes `OpRepository` y `EtapaRepository` con lectura lista para listados y escritura de `completada`, implementándolos en sus adaptadores Prisma por feature. No se agregan columnas derivadas ni migraciones (R3).
- Obtener umbrales de `configuracion` mediante el puerto existente, con defaults de RN-CONFIG-01 si la fila singleton no existe, y tomar `hoy`/`zonaHoraria` del adaptador (variable `TZ`), inyectándolos al dominio como exige C-03.
- Cubrir cada endpoint con tests Vitest en secuencia RED → GREEN → TRIANGULATE (mínimo 2 casos) → REFACTOR (R1). Los tests de integración usan PostgreSQL 18.7 real en contenedor (`@testcontainers/postgresql`, imagen `postgres:18.7`) y nunca mocks de PostgreSQL (R10): filtros sobre semáforo derivado, OP terminada excluida del flujo y desmarcar una etapa que reactiva la OP.
- No introducir auth, PIN, RBAC ni tabla `usuarios` (R5); no tocar el frontend, las plantillas `.xlsx`, `CHANGES.md` ni los changes archivados.

Fuera de alcance: UI de C-05, reglas de horas/márgenes de C-11, exportación de C-14/C-15, alta/edición de OP de changes posteriores y resolución de los riesgos IN-08/DD-07. No hay cambios rompientes: los puertos actuales se amplían de forma aditiva y las rutas son nuevas.

## Capabilities

### New Capabilities

- `api-listado-ops`: contrato HTTP de `GET /api/ops`, validación de frontera, filtros sobre derivados, KPIs y conteos de flujo.
- `api-detalle-op`: contrato HTTP de `GET /api/ops/:id` con etapas, horas, materiales y derivados, reutilizable por HU-14/15/16.
- `api-avance-etapas`: contrato HTTP de `PATCH /api/ops/:id/etapas/:etapaId`, persistencia de `completada`, recálculo derivado y error 404 por etapa ajena a la OP.

### Modified Capabilities

- `puertos-persistencia-ordenes`: `OpRepository` y `EtapaRepository` amplían su contrato con lectura de listados y actualización de etapa completada, conservando los scenarios existentes.
- `dto-derivados-orden`: la respuesta de la API incorpora KPIs, flujo agrupado y el contrato de detalle, servidos sin recálculo en el handler ni en el frontend.

## Impact

- Backend: nuevos archivos en `backend/src/features/ordenes/{application,http,prisma}/` y `backend/src/features/etapas/{application,http,prisma}/`, registro de rutas en la app Fastify existente y lectura de `TZ` en `backend/src/shared/configuracion.ts`; sin dependencias nuevas (Fastify 5.12.8, Prisma 7.10.1, zod 4.6.7 y @fastify/swagger 9.9.5 ya están fijados).
- Dominio: sin cambios en las firmas de C-03; se consume `construirTarjetaOrden`, `agruparFlujo` y las funciones puras existentes. R2/R9 se verifican con typecheck y búsqueda de imports prohibidos.
- Persistencia: sin migraciones ni columnas nuevas; el único write es `etapas_orden.completada`. Los derivados siguen calculándose en memoria.
- Tests: suite de integración en `backend/test/tablero-read-api/` contra contenedor PostgreSQL real, más tests de los casos de uso; sin mocks de BD, sin builds ni commits.
- Frontend y exportación: sin cambios; C-05 y C-14/C-15 consumirán estos contratos en sus propios changes.
