## Verification Report: horas-reales-api

**Date**: 2026-11-23
**Re-verificación**: sí, tras la corrección de CRITICAL-1 y CRITICAL-2 del verify anterior (mismo archivo de reporte, sin segundo reporte).
**Tasks**: 76/76 complete (0 pendientes)
**Change root**: `openspec/changes/horas-reales-api/`
**Base**: commit `dbdc307d956bd9d93d099fd95bfdd9db5da0bb51` (`HEAD == origin/main`) más los cambios de corrección presentes en el working tree: `M` esquemas.ts, registrarRutas.ts y 2 tests; `??` listarHoras.ts, listado-horas-api.test.ts y este reporte. Ningún artefacto `openspec/` modificado salvo `verify-report.md`.

### Test Results

**Validate (resultado literal):**
```
$ openspec validate horas-reales-api --strict
Change 'horas-reales-api' is valid
```
**Status:** `openspec status --change "horas-reales-api" --json` → `isComplete: true`; los cuatro artefactos (`proposal`, `design`, `specs`, `tasks`) en `done`.

**Suites (ejecución real, conteos exactos):**

| Suite | Comando | Archivos | Tests PASSED | FAILED | Duración |
|---|---|---|---|---|---|
| Dominio | `npm run test -w @velco/domain` | 12 | 52 | 0 | 3.37 s |
| Backend | `npm run test -w @velco/backend` | 53 | 175 | 0 | 777.06 s |
| Backend (test nuevo, verbose) | `npx vitest run test/horas-reales-api/listado-horas-api.test.ts --reporter=verbose --maxWorkers=1` | 1 | 4 | 0 | 57.21 s |

Los 4 tests nuevos se ejecutaron (ninguno omitido): "5.9 GET ordena por fecha...", "5.10 OP sin partes...", "5.11 UUID de OP inexistente...", "5.11 aislamiento entre OPs y desempate por created_at" — 18.316 s, 13.288 s, 10.277 s y 10.769 s respectivamente. El backend completo pasó de 171/171 a 175/175, exactamente +4. Ejecución contra PostgreSQL 18.7 real vía Testcontainers (`conAppReal()`, Docker Engine 28.1.1); sin mocks de base.

**Typechecks:**

| Paquete | Comando | Resultado |
|---|---|---|
| Dominio | `npm run typecheck -w @velco/domain` | OK, 0 errores |
| Backend | `npm run typecheck -w @velco/backend` | OK, 0 errores |
| Frontend | no ejecutado | C-08 es API; sin cambios en `frontend/` |

Sin builds (regla global). Sin linter configurado en los workspaces.

### Resolución de los CRITICAL del verify anterior

**CRITICAL-1 — RESUELTO.** Evidencia:
- Ruta registrada: `backend/src/features/horas/http/registrarRutas.ts:23-29` → `app.get('/api/ops/:id/horas', ...)`, con `ParamsOpJSONSchema`, `preValidar(ParamsOpSchema)` y `RespuestaListarHorasJSONSchema` (derivado de `z.array(ParteHoraSchema)`, `http/esquemas.ts:44`).
- Caso de uso: `backend/src/features/horas/application/listarHoras.ts:5-14` — `ut.ejecutar(async ({ horas, ops }) => {...})`, comprueba `ops.buscarPorId(ordenId)` y lanza `RecursoNoEncontradoError` (→ 404 por `app.ts:38-39`), luego delega a `horas.listarPorOrden(ordenId)`. Vive en `application/`, sin Fastify ni Prisma (R2).
- Orden: `backend/src/features/horas/prisma/PrismaRegistroHoraRepository.ts:53` → `orderBy: [{ fecha: 'asc' }, { createdAt: 'asc' }]`.
- Contrato: `PrismaRegistroHoraRepository.ts:23` convierte con `toFixed(2)` (cadena decimal exacta) y `:25` expone `observacion: fila.observacion` (`string | null`, P-1); `ParteHoraSchema` (`http/esquemas.ts:33-42`) tipa `horas: z.string()` y `observacion: z.string().nullable()`.
- R3: ni la ruta ni el caso de uso consultan ni escriben agregados; el test 5.10 comprueba que `ordenTrabajo.updatedAt` no cambia y que `registroHora.count` sigue en 0.
- Cobertura: los 4 scenarios de `specs/registros-horas-api/spec.md:52-74` están en `backend/test/horas-reales-api/listado-horas-api.test.ts:35,60,74,82`. Todos ejecutan `app.inject({ method: 'GET', url: '/api/ops/.../horas' })` y asumen `200` con contenido: sin la ruta, Fastify respondería 404 y `expect(res.statusCode).toBe(200)` (L50, L65) fallaría. Los 4 pasaron en la ejecución real.

**CRITICAL-2 — RESUELTO.** Evidencia:
- `git diff` muestra `crearOp(app: any)` → `crearOp(app: FastifyInstance)` con `import type { FastifyInstance } from 'fastify'` en `backend/test/horas-reales-api/registros-horas-edicion-api.test.ts:2,6` y `detalle-op-horas.test.ts:3,6`.
- Búsqueda literal `\bany\b` en `backend/test/horas-reales-api/` (todos los archivos, incluido el nuevo) → 0 coincidencias. En `backend/src/features/horas/` → 0 coincidencias de `any`, `auth`, `usuario_id`, `parseFloat`, `toNumber`, `exceljs`.
- Ambos typechecks en 0 errores; el nuevo test también usa `FastifyInstance` (`listado-horas-api.test.ts:3,7`).

### Spec Compliance

| Requisito (spec) | Tareas | Evidencia de test | Estado |
|---|---|---|---|
| `modelo-datos-horas`: migración 003, columnas, FKs, CHECK, índices | 2.1–2.6 | `modelo-datos-horas.test.ts` (7 tests) | PASS |
| `modelo-datos-horas`: integridad en BD real (CASCADE, SET NULL, sin etapa, observacion) | 2.2, 2.5 | ídem | PASS |
| `modelo-datos-horas`: modelo Prisma `RegistroHora` | 2.4, 2.9 | `test/fundacion/entorno.test.ts` + typechecks | PARTIAL (WARNING-6) |
| `puertos-persistencia-horas`: puerto, UoW, decimal exacto, R2 | 4.1–4.9 | `puertos.test.ts` (2 tests), `aislamiento-dominio.test.ts` | PASS |
| `derivados-horas-reales`: validación, totales, desvío, consumo, alerta | 3.1–3.16 | `packages/domain/src/horas/reglas.test.ts` (14 tests) | PASS |
| `registros-horas-api`: alta (con/sin etapa, observacion, 422, P-3) | 5.1–5.8 | `registros-horas-api.test.ts` (3 tests) + `detalle-op-horas.test.ts` | PARTIAL (WARNING-6) |
| `registros-horas-api`: listado `GET /api/ops/:id/horas` | 5.9–5.11 | `listado-horas-api.test.ts` (4 tests, ejecutados) | **PASS (ANTES FAIL)** |
| `registros-horas-api`: corrección y baja (P-4, P-5) | 6.1–6.9 | `registros-horas-edicion-api.test.ts` (2 tests) | PARTIAL (WARNING-6) |
| `registros-horas-api`: validación de frontera (UUID, fecha, derivados rechazados) | 5.1–5.3 | cobertura indirecta vía HTTP | PARTIAL (WARNING-6) |
| `registros-horas-api`: trazabilidad RN y contenedor real | 8.4 | títulos `RN-*`, Docker real | PASS |
| `api-detalle-op`: partes reales, derivados hermanos, Swagger sin "pendiente" | 7.1–7.5 | `detalle-op-horas.test.ts` (2 tests), `tablero-read-api/detalleOp.test.ts`; grep sin `pendiente de C-08` | PASS |
| `dto-derivados-orden`: derivados en dominio, listado intacto, sin duplicación | 7.2–7.6 | `detalle-op-horas.test.ts` + tests de dominio | PARTIAL (WARNING-3, WARNING-4) |

### Design Coherence

| Decisión / Pregunta | Resultado | Detalle |
|---|---|---|
| D1 migración aditiva | FOLLOWED | 003 aislada; 001/002 intactas; sin derivados ni `usuario_id` |
| D2 decimal exacto | FOLLOWED | `Decimal @db.Decimal(6,2)`, `toFixed(2)`, sin `parseFloat`/`toNumber` |
| D3 feature + UoW propia | FOLLOWED | `UnidadTrabajoOps` intacta; `Prisma.TransactionClient` solo en `horas/prisma/` |
| D4 una sola implementación | DEVIATED | `calcularHorasVendidasTotales` duplicada (WARNING-3, sin tocar) |
| D5 Zod + CHECK | FOLLOWED | esquemas `.strict()`, 422/404, P-3 con `details[].path = ['etapaId']` |
| D6 detalle y Swagger | DEVIATED | esquema inline en `ordenes/http/esquemas.ts` (WARNING-4, sin tocar); el nuevo `RespuestaListarHorasJSONSchema` sí reutiliza `ParteHoraSchema` |
| D7 PATCH/DELETE | FOLLOWED | parcial, cuerpo vacío 422, `DELETE → {ok:true}`, `SET NULL` por FK |
| D8 checkpoints / safety net | FOLLOWED parcial | sin `apply-progress` (WARNING-7) |
| P-1 = A `observacion` | FOLLOWED | migración, modelo, puertos, DTO, Zod, Swagger y tests; el listado expone `string | null` |
| P-2 = A campos hermanos | FOLLOWED | `DetalleOpDTO.ts:17-21`, sin `{partes,totales}` |
| P-3 = A 422 `etapaId` | FOLLOWED | `registrarRutas.ts:47-48,74-75` (desplazado por el nuevo bloque GET) |
| P-4 = A PATCH parcial | FOLLOWED | `editarHora.ts:16-23`, `esquemas.ts:30` |
| P-5 = A mutaciones pequeñas | FOLLOWED | POST/PATCH devuelven el parte; DELETE `{ok:true}` |
| P-6 = B tarjeta intacta | FOLLOWED | `TarjetaOrdenDTO`/`api-listado-ops` sin cambios; la alternativa "GET de horas" citada en la decisión **ahora existe** |

**Referencia residual:** no aparece "según P-1" en los artefactos del change (solo en el texto histórico de este reporte, que describe la comprobación). P-1..P-6 siguen consistentes entre `design.md`, los seis delta specs y `tasks.md` 1.5/1.6; ninguno fue modificado en esta ronda.

### TDD Compliance

| Check | Result | Detalle |
|---|---|---|
| Evidencia TDD reportada | NO | Sin `apply-progress` ni tabla `TDD Cycle Evidence` (WARNING-7) |
| Todas las tareas tienen tests | OK | 76/76 marcadas; 5.9–5.11 ahora respaldadas por `listado-horas-api.test.ts` |
| RED confirmado (tests existen) | OK | 6 archivos de integración + 1 de reglas puras presentes |
| GREEN confirmado (tests pasan) | OK | 34/34 tests específicos del change (14 dominio + 20 backend), ejecutados |
| Triangulación | OK / PARCIAL | 4 escenarios distintos para el listado; otros casos agrupados en un mismo `it` (WARNING-6) |
| Safety net para archivos modificados | OK | Suites completas verdes antes y después de la corrección |

**TDD Compliance**: 5/6 checks completos; el único pendiente es la ausencia del artefacto `apply-progress`, registrada como WARNING-7 por el precedente del change archivado `2026-11-22-ordenes-form`.

### Test Layer Distribution

| Capa | Tests | Archivos | Herramienta |
|---|---|---|---|
| Unit (reglas puras) | 14 | 1 | Vitest |
| Integration (BD real + HTTP inject) | 20 | 6 | Vitest + Testcontainers `postgres:18.7` |
| E2E (browser) | 0 | 0 | No aplica al alcance C-08 |
| **Total específico del change** | **34** | **7** | |

### Changed File Coverage

Cobertura no ejecutada: no hay proveedor `@vitest/coverage-*` configurado. No se marca como fallo (informativo según la skill).

### Assertion Quality

Sin tautologías ni loops vacíos. `expect(partes.every(...)).toBe(true)` en `listado-horas-api.test.ts:56,98-99` está precedido de aserciones de longitud/orden (`L52-55`, `L95-97`), por lo que no es un ghost loop. Un hallazgo nuevo no bloqueante: `listado-horas-api.test.ts:67` verifica `calcularHorasRealesTotales([]) === '0.00'` como función aislada, sin exercitar el endpoint; se registra como WARNING-11.

### Guardrails R1–R10

| Regla | Estado | Evidencia |
|---|---|---|
| R1 TDD estricto | PARCIAL | Secuencias en `tasks.md`, títulos `RN-*`, 34 tests verdes; sin `apply-progress` (WARNING-7) |
| R2 dominio puro | OK | `listarHoras.ts` importa solo tipos de `@velco/domain`, errores compartidos y el puerto `UnidadTrabajoHoras`; sin Fastify/Prisma. `grep` en `packages/domain/src/` → 0 coincidencias de frameworks |
| R3 sin derivados persistidos | OK | El listado no calcula ni escribe agregados; test 5.10 verifica `updatedAt` inalterado y `count = 0` |
| R4 solo TypeScript | OK | Archivos nuevos `.ts`; sin runtime Python |
| R5 sin auth/usuario | OK | `grep` de `auth|PIN|RBAC|usuario_id|usuarioId` en `backend/src/features/horas/` → 0 coincidencias |
| R6 plantillas Excel | OK / N/A | Sin `.xlsx` ni código de exportación tocado |
| R8 OpenSpec vía CLI | OK | Único archivo `openspec/` escrito en esta verificación: `verify-report.md`; `git status` lo confirma |
| R9 estricto, sin `any` | OK | 0 coincidencias de `\bany\b` en `backend/test/horas-reales-api/` y en `backend/src/features/horas/`; `FastifyInstance` en los 3 helpers; typechecks limpios |
| R10 sin mocks de PostgreSQL | OK | Sin `vi.mock`/dobles de `PrismaClient`; `conAppReal()` + BD real; el test 5.10 consulta Prisma real para verificar no escritura |

### Estado de los WARNING del verify anterior

| ID | Estado | Evidencia |
|---|---|---|
| WARNING-3 (duplicación `calcularHorasVendidasTotales`) | SIN TOCAR | `packages/domain/src/horas/reglas.ts` no aparece en `git status` |
| WARNING-4 (esquema inline en `ordenes/http/esquemas.ts`) | SIN TOCAR | Archivo ausente en `git status` |
| WARNING-5 (`:parteId` vs `:horaId`) | SIN TOCAR | `registrarRutas.ts:57,84` siguen con `:parteId` |
| WARNING-6 (cobertura incompleta) | PARCIALMENTE MITIGADO, sin editar archivos previos | El ítem GET quedó cubierto por el test nuevo; permanecen 404 en POST, PATCH parcial/fecha/observación/no positivo, DELETE recálculo, frontera UUID/fecha/derivados y `prisma generate` |
| WARNING-7 (sin `apply-progress`) | SIN TOCAR | 0 coincidencias de `TDD Cycle Evidence` fuera de los reportes |
| WARNING-8 (Node v22.20.0 vs 26.13.1) | SIN TOCAR | `node --version` → v22.20.0 |
| WARNING-9 (mojibake en `tasks.md`) | SIN TOCAR | Lectura UTF-8 sigue devolviendo `PreparaciÃ³n`; 76 tareas `[x]` |
| SUGGESTION-10 (sintaxis de validate) | SIN TOCAR | Se documentó la forma válida; la inválida sigue sin existir en la CLI |

### Hallazgos pendientes (no bloquean el archive)

- **WARNING-3**: `packages/domain/src/horas/reglas.ts:75-83` duplica `calcularHorasVendidasTotales` de `packages/domain/src/etapas/horas-vendidas.ts:1`. Fix: importar la canónica o extraer implementación `bigint` única.
- **WARNING-4**: `backend/src/features/ordenes/http/esquemas.ts:115` define el parte inline en vez de usar `ParteHoraSchema`. Fix: `z.array(ParteHoraSchema)`.
- **WARNING-5**: `registrarRutas.ts:57,84` usan `:parteId`; el spec dice `:horaId`. Fix: renombrar en rutas, `ParamsOpHoraSchema`, tests y Swagger.
- **WARNING-6**: sin tests propios para 404 en POST, PATCH conservar ausentes/fecha editable/`observacion: null`/no positivo, DELETE recálculo, UUID/fecha inválidos, derivados rechazados y `prisma generate`.
- **WARNING-7**: sin artefacto `apply-progress` con evidencia TDD ciclo por ciclo.
- **WARNING-8**: verificación ejecutada con Node v22.20.0, no con el 26.13.1 fijado en C-01.
- **WARNING-9**: `tasks.md` con UTF-8 doble codificado; regenerar vía skill/CLI (R8).
- **WARNING-11 (nuevo, no bloqueante)**: `backend/test/horas-reales-api/listado-horas-api.test.ts:67` — `expect(calcularHorasRealesTotales([])).toBe('0.00')` comprueba una función aislada, no el endpoint; sustituir por una aserción sobre la respuesta del GET o eliminarla, conservando la comprobación de no escritura de `L68-70`.
- **SUGGESTION-10**: documentar `openspec validate <name> --strict` (la variante con `--change` no existe en esta CLI).

### Summary

- **CRITICAL**: 0 — CRITICAL-1 y CRITICAL-2 verificados como resueltos con evidencia de código, typecheck y tests ejecutados.
- **WARNING**: 8 — los 7 del verify anterior (uno parcialmente mitigado) más uno nuevo de calidad de aserción; ninguno bloquea según las reglas de la skill.
- **SUGGESTION**: 1.
- Tests del repositorio: 227/227 en verde (52 dominio + 175 backend), incluidos 34 específicos de C-08.

### Recommendation

El change está listo para archivar. La siguiente acción es integrar (commitear) los seis archivos de corrección que hoy están en el working tree y ejecutar `/opsx:archive horas-reales-api`, marcando `C-08` como `[x]` en `CHANGES.md`. Los WARNING y la SUGGESTION quedan registrados como deuda no bloqueante para C-09/C-11.

**Verdict**: READY FOR ARCHIVE
