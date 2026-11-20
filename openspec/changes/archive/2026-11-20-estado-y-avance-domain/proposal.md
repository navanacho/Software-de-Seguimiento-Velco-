## Why

C-02 entregó las tablas, los tipos TS puros y los puertos, pero ninguna regla de negocio: el tablero de HU-05/06/07 no puede mostrar avance, semáforo, días restantes ni la etapa `ahora` sin que alguien los calcule. Hoy no existe una única implementación canónica de esos derivados, y C-04 (API de lectura) y C-05 (tablero) están bloqueados por esa ausencia. Este change instala esas reglas como funciones puras en `packages/domain/`, antes de que cualquier handler o componente pueda reimplementarlas.

## What Changes

- Agregar en `packages/domain/src/ordenes/` las funciones puras `calcularAvance`, `etapaAhora` y `agruparFlujo`, y en `packages/domain/src/costos/` (o el módulo que corresponda según la convención de feature) `calcularSemaforo` y `diasRestantes`, todas sobre los tipos ya definidos por C-02 (`OrdenTrabajo`, `EtapaOrden`, `Configuracion`) y sin importar Fastify, Prisma, React ni `exceljs` (R2, R9).
- Calcular el avance como `100 * etapas_completadas / total_etapas` redondeado a entero, con `0` cuando la OP no tiene etapas; todas completadas ⇒ `100` (RN-AVANCE-01/02, DD-03).
- Resolver la etapa `ahora` como la primera pendiente por `orden_secuencia`, con estado `Todo listo` cuando no quedan pendientes, y agrupar las OPs activas por ese nombre para la tira de flujo (RN-AHORA-01, RN-FLujo-01, HU-06/07).
- Evaluar el semáforo con prioridad estricta `Terminado` → `Atrasado` → `En riesgo` → `En plazo`, con `diasAlertaRiesgo` y `porcentajeAvanceRiesgo` inyectados desde `Configuracion` y comparación de fechas a medianoche de la zona horaria `TZ` recibida como parámetro; una OP terminada con fecha vencida se muestra gris (RN-SEMAFORO-01..06, SU-05).
- Definir un DTO de salida con los derivados (avance, semáforo, días restantes y etapa `ahora`) en `packages/domain/`, para que la API de C-04 lo sirva y el frontend lo consuma sin recalcular nada (RN-GLOBAL-02, HU-05).
- Cubrir cada regla con tests Vitest puros bajo TDD estricto RED → GREEN → TRIANGULATE (mínimo 2 casos) → REFACTOR, sin PostgreSQL (R1, R10), trazando cada test a su código RN-XX.
- Re-encuadrar el guardián `backend/test/fundacion/alcance.test.ts`: hoy escanea las fuentes vivas y prohíbe `calcularAvance|calcularSemaforo|calcularMargen`, premisa válida solo mientras C-01 era el último change. Debe pasar a verificar esa prohibición sobre los artefactos del change archivado de C-01, conservando la fuerza de las aserciones, sin `skip`, sin `todo` y sin tautologías. No es un bug de C-03: es una premisa de fundación que C-03 invalida por diseño, por el mismo mecanismo que obligó a re-encuadrar los ADR en C-02.
- No persistir ningún derivado ni agregar columnas `GENERATED`, endpoints HTTP, componentes React, authentication, PIN, RBAC ni plantillas Excel (R3, R5, R6).

Fuera de alcance: endpoints de C-04, UI de C-05, horas/márgenes de C-11, exportación de C-14/C-15, lectura de la fila singleton de configuración (los umbrales se inyectan, no se consultan) y modificación de `CHANGES.md`. No hay cambios rompientes: C-02 no definió aún ninguna función ni DTO derivado.

## Capabilities

### New Capabilities

- `avance-y-flujo-etapas`: avance derivado del checklist, etapa `ahora` y agrupamiento de conteos por etapa activa.
- `semaforo-de-plazo`: semáforo priorizado, días restantes y comparación a medianoche de `TZ` con umbrales inyectados.
- `dto-derivados-orden`: contrato de salida con avance, semáforo, días restantes y etapa `ahora`, de uso exclusivo por API y frontend.

### Modified Capabilities

- `paquete-dominio-compartido`: pasa de contener solo tipos a exponer también las reglas puras de estado y el DTO derivado, manteniendo compilación autónoma y sin frameworks.
- `fundacion-testing`: el guardián de alcance de C-01 se re-encuadra sobre los artefactos archivados de `velco-mvp-foundation` en lugar de las fuentes vivas, preservando la intención original sin impedir reglas de negocio en C-03.

## Impact

- Dominio: nuevos archivos en `packages/domain/src/{ordenes,costos}/` y reexportaciones en `packages/domain/src/index.ts`; cero dependencias nuevas y cero imports de framework (R2).
- Tests: nueva suite pura en `packages/domain/` con Vitest 5.1.1, sin contenedor PostgreSQL; `@velco/domain` incorpora su propio script `test` y `vitest.config.ts` porque hoy solo declara `typecheck`; ajuste quirúrgico de `backend/test/fundacion/alcance.test.ts` documentado en `design.md`.
- Backend/frontend: ningún handler, caso de uso ni componente en este change; el DTO queda disponible para que C-04 lo componga y C-05 lo renderice.
- Persistencia: sin migraciones ni cambios de esquema; se consumen los tipos de C-02 y los umbrales se inyectan como parámetros.
- Compatibilidad: `Configuracion`, `OrdenTrabajo` y `EtapaOrden` se reutilizan sin romperse; las funciones nuevas son aditivas.
- Documentación: `openspec/` se gestiona solo por CLI (R8); `CHANGES.md` se marca recién al archivar el change.
