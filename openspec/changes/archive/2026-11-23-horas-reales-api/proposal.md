## Why

C-06 cerró la escritura de OP, etapas y materiales y C-07 entregó el formulario, pero todavía no existe ninguna forma de imputar horas reales: `DetalleOpDTO.horas` es hoy `readonly never[]` y la spec `api-detalle-op` documenta el arreglo vacío como "pendiente de C-08". Sin este change no se pueden verificar HU-10 ni HU-13, el termómetro de horas y el desvío de C-11 no tienen datos de entrada, y el camino crítico `C-06 → C-08 → C-11 → C-14 → C-15 → C-16` queda detenido (CHANGES.md §C-08, Flujo 4).

El change agrega la persistencia y la API de partes de horas apoyándose en los contratos ya publicados, sin adelantar la UI (C-09), la analítica (C-11) ni el dashboard (C-17).

## What Changes

- Agregar la migración 003 aditiva con la tabla `registros_horas`: `id UUID`, `orden_id` con `ON DELETE CASCADE`, `etapa_id` nullable con `ON DELETE SET NULL`, `operario VARCHAR(100) NOT NULL`, `fecha DATE`, `horas NUMERIC(6,2) CHECK (horas > 0)` y `created_at TIMESTAMPTZ`; índices `(orden_id, fecha)`, `(etapa_id)` y `(operario)`. Sin `usuario_id` en el MVP (DD-07, R5) y sin columnas de totales ni agregados (R3).
- Declarar el modelo `RegistroHora` en `backend/prisma/schema.prisma` con `Decimal @db.Decimal(6,2)` y las relaciones `Cascade`/`SetNull`, sin modelo `Usuario` ni derivados.
- Declarar el puerto `RegistroHoraRepository` en la feature `horas` y su adaptador Prisma, con horas viajando como cadena decimal exacta, y extender la unidad de trabajo para incluir el repositorio de horas sin exponer Prisma a la aplicación (R2, R9).
- Crear el caso de uso `imputarHoras` y las operaciones de corrección en dominio/application, con validación `horas > 0` en la frontera y en el `CHECK` de PostgreSQL (RN-HORAS-05).
- Exponer `POST /api/ops/:id/horas`, `GET /api/ops/:id/horas`, `PATCH /api/ops/:id/horas/:horaId` y `DELETE /api/ops/:id/horas/:horaId`, con 422 para `horas <= 0`, 404 para OP/parte inexistente, y rechazo de una etapa que no pertenezca a la OP.
- Reemplazar el placeholder `horas: readonly never[]` de `DetalleOpDTO` por la colección real de partes y actualizar `DetalleOpSchema`/Swagger, sin persistir totales: `horasRealesTotales`, desvío, consumo y alerta se calculan con las reglas puras ya existentes (RN-HORAS-01..04, RN-HORAS-06, RN-GLOBAL-02, R3).
- Escribir tests de reglas puras y de integración contra PostgreSQL 18.7 real con Testcontainers: parte con y sin etapa, edición, eliminación, recálculo y rechazo de horas no positivas (R1, R10).

No hay cambios rompientes en endpoints existentes: la única modificación de contrato es el contenido de `DetalleOpDTO.horas`, que pasa de arreglo vacío a partes reales. No se implementan UI (C-09), Excel (R6), auth/PIN/RBAC (R5), derivados persistidos (R3), `any` (R9) ni mocks de PostgreSQL (R10). La gobernanza es **MEDIO** y las decisiones de contrato no obvias quedan explícitas en `design.md` antes de la implementación.

## Capabilities

### New Capabilities

- `modelo-datos-horas`: migración 003 de `registros_horas`, modelo Prisma `RegistroHora`, semántica de FK, índices, decimales exactos y ausencia de `usuario_id` y de derivados.
- `puertos-persistencia-horas`: puerto de repositorio de partes de horas y unidad de trabajo inyectable, con adaptador Prisma por feature y dominio independiente de frameworks.
- `derivados-horas-reales`: reglas puras de totales, desvío, consumo, división por cero y alerta, con una sola implementación en `packages/domain/` y recálculo en cada mutación.
- `registros-horas-api`: caso de uso `imputarHoras` y endpoints de alta, listado, edición y baja, con esquemas Zod, códigos 404/422 y contrato del parte.

### Modified Capabilities

- `api-detalle-op`: `DetalleOpDTO.horas` pasa de arreglo vacío tipado a partes reales; el Swagger deja de anunciar "pendiente de C-08" y los totales siguen siendo derivados, nunca columnas.
- `dto-derivados-orden`: los derivados de horas reales se construyen en dominio y se consumen desde el DTO sin recálculo en handlers ni en React, extendiendo la regla de una sola implementación.

## Impact

- Base de datos: nueva migración `003_registros_horas`; la 001 y la 002 no se modifican ni se renumeran. Sin `usuario_id`, sin totales almacenados.
- Backend: nueva feature `backend/src/features/horas/{application,http,prisma}/`; ajustes en `backend/src/features/ordenes/{application,http}/` para el detalle, y en `backend/src/shared/dependencias.ts` para inyectar el repositorio. Caso de uso de dominio en `packages/domain/src/horas/`.
- Contratos HTTP: cuatro rutas nuevas bajo `/api/ops/:id/horas`; `GET /api/ops/:id` cambia el contenido de `horas` (mismo campo, antes vacío). Sin cambios en `GET /api/ops` ni en los endpoints de OP/etapas/materiales.
- Frontend: sin cambios. C-09 consumirá estos contratos.
- Dependencias: ninguna nueva; se usan Fastify 5.12.8, Prisma 7.10.1, PostgreSQL 18.7, zod 4.6.7, Vitest 5.1.1 y @testcontainers/postgresql 12.2.2 ya instalados.
- Tests: safety net de dominio/backend sin modificar; TDD RED → GREEN → TRIANGULATE (≥2 casos) → REFACTOR con trazabilidad `RN-XX-NN` (RN-GLOBAL-04); verificación final con `openspec status --change horas-reales-api --json` y `openspec validate horas-reales-api --strict`. Sin builds ni commits.
- Decisiones pendientes de contrato: exposición de `observacion`, forma de las respuestas de mutación, propiedad de la etapa y partial-update de `PATCH`; se documentan con alternativas y trade-offs en `design.md`, sin resolverse en este proposal.
