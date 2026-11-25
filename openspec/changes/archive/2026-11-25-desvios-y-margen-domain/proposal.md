## Why

C-08 y C-09 entregan los totales de horas en el DTO y C-10 deja disponible la tasa global vigente en `ContextoTarjeta.valorHoraEstandar`, pero el dominio todavía no produce la comparativa por etapa, el costo material real con `COALESCE` ni el margen real: el spec `configuracion-en-lectura-op` congela explícitamente ese cálculo para C-11. Sin una única implementación pura, C-12 calcularía en React y C-14/C-15 duplicarían el mapeo de la planilla (HU-14/15/16, Flujo 5, RN-GLOBAL-02, R2).

## What Changes

- Reutilizar en `packages/domain/src/horas/` las funciones canónicas de C-08 (`calcularHorasVendidasTotales`, `calcularHorasRealesTotales`, `calcularDesvioHoras`, `calcularConsumoHoras`, `evaluarAlertaDesvio`) y agregar `comparativaPorEtapa`, que agrupa vendidas vs. reales por etapa e incluye explícitamente un bucket para horas sin etapa asignada (RN-HORAS-01..07, HU-15).
- Agregar en `packages/domain/src/margen/` las reglas puras `costoMaterialReal` —`cantidad × COALESCE(costo_unitario_real, costo_unitario_cotizado)` por ítem—, el agregado cotizado y `margenReal`, con `valor_hora_estandar` inyectado como parámetro desde `ContextoTarjeta` (RN-MARGEN-01..06, DD-04, DD-05, IN-02).
- Mantener la división por cero sin excepción: con horas vendidas `0`, `calcularConsumoHoras` es `null` y `evaluarAlertaDesvio` se evalúa solo con `reales > vendidas` (RN-HORAS-06).
- Usar aritmética decimal exacta en todo el change; el redondeo a dos decimales queda exclusivamente en la presentación (C-12) y en la exportación (C-14/C-15), nunca en el dominio ni con coma flotante (RN-MARGEN-05, R9).
- Ampliar los DTOs canónicos construidos por el dominio con la comparativa por etapa, los agregados de materiales y `margenReal`, para que API y frontend transporten los derivados sin recalcularlos; la API no incorpora endpoints nuevos (RN-GLOBAL-02, R3).
- Definir en `packages/domain/src/exportacion/` el modelo puro de planilla compartido por `exportCosteo` y `exportOpSinMargenes` sobre `exportOp(opId, { incluirMargenes })`: claves semánticas, sin `Buffer`, sin sistema de archivos y sin `exceljs` (DD-08, RN-EXPORT-05/06, R6).
- Cubrir las reglas con Vitest en `packages/domain` mediante RED → GREEN → TRIANGULATE (mínimo dos casos por regla) → REFACTOR: RN-HORAS-01..07, RN-MARGEN-01..06, el caso de tasa global `0` y la tasa inyectada diferida de IN-02. No se requiere PostgreSQL ni contenedores (R1, R10).
- No introducir autenticación, PIN ni RBAC; no crear migraciones ni columnas derivadas; no duplicar la API de configuración de C-10 ni prometer cálculo o visualización en la UI (R3, R5; C-12).

## Capabilities

### New Capabilities

- `comparativa-horas-por-etapa`: función pura de comparación vendidas/reales/desvío por etapa, con bucket explícito para horas sin etapa y reutilización de los derivados canónicos de horas.
- `costos-y-margen-real`: reglas puras de costo material real con fallback por ítem, costo cotizado y margen real con tasa global inyectada, en decimal exacto y sin persistencia.
- `modelo-planilla-compartido`: modelo de datos puro y compartido por las dos variantes de `exportOp`, con claves semánticas y sin acceso a archivos ni a librerías de Excel.

### Modified Capabilities

- `dto-derivados-orden`: incorpora en el detalle canónico los campos derivados de comparativa, costos y margen producidos por el dominio, sin cálculo en handlers ni en React.
- `paquete-dominio-compartido`: reexporta desde el barrel del paquete las nuevas reglas puras y garantiza su compilación aislada sin adaptadores ni frameworks.

## Impact

- `packages/domain/src/{horas,margen,exportacion}/` y `packages/domain/src/index.ts`: nuevas reglas puras, tipos decimales explícitos y reexportación única; sin dependencias de Fastify, Prisma, React, `exceljs` ni `zod` (R2, R9).
- `backend/src/features/ordenes/application/` y el `DetalleOpDTO`: el constructor del dominio compone los nuevos derivados con la tasa leída por C-10; los handlers y adaptadores Prisma no calculan ni persisten nada nuevo.
- `frontend/src/shared/domain-client/`: espejos de tipos/Zod necesarios para transportar los campos nuevos derivados; sin lógica de cálculo ni alertas en componentes (C-12).
- `openspec/specs/{derivados-horas-reales,configuracion-global-api,configuracion-en-lectura-op,modelo-datos-horas}/`: no se modifican; C-11 consume sus contratos y no duplica sus reglas.
- Dependencias: C-08 y C-03 completadas, ejecutado después de C-09 según GATE 8; habilita C-12 junto con C-10 y es prerrequisito de C-14/C-15. Sin cambios de esquema ni de migraciones.
