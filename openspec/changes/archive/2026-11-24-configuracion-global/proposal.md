## Why

Los parámetros que gobiernan el tablero y la rentabilidad —tasa horaria, umbrales de riesgo y etapas por defecto— hoy solo pueden modificarse tocando código o la semilla: no hay endpoints de configuración y el adaptador Prisma acepta únicamente la lista canónica de cinco etapas. HU-18 exige mantenerlos actualizados sin cambios de código, y con C-09 archivado el GATE 8 habilita este change en paralelo a C-11.

## What Changes

- Exponer `GET /api/configuracion` y `PUT /api/configuracion` sobre la fila singleton `id = 1`, con `valorHoraEstandar` como cadena decimal exacta, `diasAlertaRiesgo`, `porcentajeAvanceRiesgo` y `etapasDefault`, y respuesta `422` fuera de rango o con etapas inválidas.
- Agregar la vista `/configuracion` para editar valor hora, días de alerta, porcentaje de avance de riesgo y la plantilla de etapas, con guardado, errores de validación y un aviso en la UI de que los márgenes se recalculan con la tasa vigente al leer cada OP (el cálculo de `margen` se implementa en C-11; C-10 solo informa).
- Eliminar la restricción que obliga a `etapas_default` a ser exactamente la lista canónica: la plantilla pasa a ser texto libre validado (no vacío, sin duplicados ignorando mayúsculas), conservando los cinco nombres canónicos como semilla y valor por defecto.
- Leer la configuración vigente en cada construcción de DTO del listado y del detalle, para que los umbrales del semáforo se apliquen y la tasa vigente quede disponible en `ContextoTarjeta` para el cálculo del margen de C-11, sin caché ni valores derivados persistidos.
- Precarregar el formulario de alta de OP desde `GET /api/configuracion`, manteniendo la regla de omitir `etapas` en el `POST` cuando el usuario no modifica la lista; invalidar las consultas del tablero y del detalle después de guardar.
- Cubrir con Vitest el singleton, los rangos (incluidos límites `0`, `100`, divisiones por cero y decimales), el cambio de umbrales en el semáforo y la ausencia de columnas derivadas, con PostgreSQL real en los tests de integración.
- Sin auth, PIN ni RBAC (R5), sin nuevas migraciones y sin persistir derivados (R3).

## Capabilities

### New Capabilities

- `configuracion-global-api`: lectura y actualización del singleton de configuración, validación de rangos y de la plantilla de etapas, contrato HTTP y puerto de persistencia de escritura.
- `configuracion-global-ui`: vista `/configuracion`, formulario de parámetros, navegación de entrada, guardado con TanStack Query, mensajes de validación y aviso de recálculo con tasa vigente.
- `configuracion-en-lectura-op`: inyección de los umbrales y la tasa vigentes en la construcción de los DTOs de tablero y detalle en cada lectura, con derivados calculados en el dominio y sin persistencia.

### Modified Capabilities

- `editor-etapas-orden`: la precarga de `/ops/nueva` pasa a consumir `GET /api/configuracion` en lugar de una constante hardcodeada; se conserva la omisión de `etapas` en el `POST` cuando no hay cambios y el fallback canónico ante fallo de lectura.
- `puertos-persistencia-ordenes`: `ConfiguracionRepository` incorpora escritura del singleton conservando `obtener()` y las firmas existentes.

## Impact

- `packages/domain/src/configuracion/`: contrato existente más validación pura de parámetros y plantilla de etapas; sin frameworks (R2).
- `backend/src/features/configuracion/{application,http,prisma}/`: caso de uso, rutas Fastify, esquemas Zod y adaptador Prisma con `actualizar`; registro en `backend/src/features/salud/http/app.ts` y composición en `backend/src/shared/dependencias.ts`.
- `backend/src/features/ordenes/application/` y `backend/src/features/etapas/application/`: contexto construido desde configuración vigente al listar, detallar y recalcular etapas.
- `frontend/src/features/configuracion/{components,hooks,queries}/` (nuevo), `frontend/src/app/App.tsx`, `frontend/src/features/tablero/TableroPage.tsx` y `frontend/src/features/ordenes/OrdenFormPage.tsx`.
- Esquema Prisma y migraciones sin cambios: la tabla `configuracion` ya existe con la fila `id = 1` y sus defaults.
- Dependencias: C-09 (completado). Habilita C-12 junto con C-11 y C-05; C-11 corre en paralelo y consume la misma tasa global inyectada, sin acoplamiento de código entre ambos changes.
