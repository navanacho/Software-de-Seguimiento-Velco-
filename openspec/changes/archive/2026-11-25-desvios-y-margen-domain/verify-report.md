## Verification Report: desvios-y-margen-domain

**Fecha**: 2026-11-24 (re-verify independiente tras el pase de correcciones aprobado)
**Change**: `desvios-y-margen-domain` (C-11)
**Tasks**: 27/27 completas (`openspec list --json` → `"completedTasks": 27, "totalTasks": 27, "status": "complete"`)
**Modo**: solo análisis. No se corrigió código, tests, specs ni artefactos de planeación. No se ejecutó build, commit ni push.

### Veredicto final

**READY FOR ARCHIVE**

El bloqueo anterior (F-01, CRITICAL) quedó resuelto; F-02 y el LOW del umbral también. La ejecución automatizada completa pasa: 122/122 tests de dominio, 10/10 + 20/20 + 20/20 tests backend dirigidos, 11/11 + 176/176 frontend, 3/3 typechecks, validación estricta del change y de los 37 specs. No aparecieron hallazgos nuevos CRITICAL ni HIGH. Quedan hallazgos LOW pre-existentes o diferidos, documentados como no bloqueantes.

---

### Historial y estado de hallazgos

**Veredicto anterior**: NEEDS FIXES (2026-11-24), con 1 CRITICAL (F-01), 1 MEDIUM introducido (F-02), 1 MEDIUM pre-existente (F-03) y 4 LOW (F-04..F-07). La ejecución anterior reportaba 117/117 tests de dominio; las correcciones elevaron el total a 122/122. El historial completo de cada hallazgo se conserva en la tabla siguiente con su estado actual.

| ID | Severidad original | Estado | Evidencia (`file:line`) | Nota de no-bloqueo / detalle |
|---|---|---|---|---|
| F-01 | **CRITICAL** | **RESUELTO** | `packages/domain/src/exportacion/modelo.ts:5-13` (`MaterialOperativoModeloPlanilla` sin campos de costo; `MaterialModeloPlanilla` los agrega solo en costeo), `:46-49` (variante operativa), `:53-72` (mapeo `{descripcion, cantidad}`); `modelo.test.ts:50-67`, `:81-107`, `:157-173`, `:190-204` | Claves anidadas verificadas: `Object.keys` de cada material operativo es `['descripcion','cantidad']` (`:58`, `:90-93`, `:170`) y `JSON.stringify(modelo)` no contiene `costoUnitario` (`:59`, `:73`, `:95`, `:171`). La variante `costeo` conserva `costos` y `margenReal` con valores concretos (`:46-47`, `:105-106`, `:149-150`, `:162`, `:202-203`). Sin hallazgo nuevo: `valorHora` permanece en `CamposComunesModelo` (`:27-34`) porque el propio spec lo lista como clave semántica compartida (`specs/modelo-planilla-compartido/spec.md:29`); no es un importe de rentabilidad. |
| F-02 | MEDIUM | **RESUELTO** | `packages/domain/src/testing/cobertura-reglas.test.ts:26-49` (lee `*.test.ts` reales desde disco, excluye el propio verificador y extrae títulos `it(...)`/`test(...)`), `:62-66` (≥2 por RN); `apply-progress.md:111`, `:121-124` (RED y control negativo) | Conteo independiente: 28 títulos `it('...RN-...')` reales en los archivos de dominio; RN-HORAS-01/02/03 = 2, RN-HORAS-04 = 4, RN-HORAS-05 = 3, RN-HORAS-06 = 4, RN-HORAS-07 = 2; RN-MARGEN-01/02/03/04/05/06 = 2 cada uno. Todos los títulos citados corresponden a llamadas `it(...)` ejecutables (verificados en `horas/comparativa.test.ts`, `horas/reglas.test.ts`, `margen/reglas.test.ts`, `exportacion/modelo.test.ts`). Control negativo creíble: al renombrar `RN-MARGEN-03` en una copia temporal, `casosPorRegla` baja de 2 a 1 y reproduce `expected 1 to be greater than or equal to 2`. Obsolescencia menor no bloqueante: la matriz sigue siendo lectura de texto, no un registro runtime; hoy no genera falsos positivos. |
| LOW (umbral) | LOW | **RESUELTO** | `packages/domain/src/horas/umbral.ts:1` (`export const UMBRAL_DESVIO_PORCENTAJE = 15;`), `packages/domain/src/index.ts:66` (barrel), `cobertura-reglas.test.ts:69`, `:77-79` | `git diff` de `packages/domain/src/horas/reglas.ts` y `horas/reglas.test.ts` → `SIN_SALIDA`: el `15` literal y la firma de `evaluarAlertaDesvio` siguen intactos; hay exportación documental sin inyección. Frontera cubierta con `95.00` (sin alerta) y `95.01` (con alerta). |
| F-03 | MEDIUM | **PRE-EXISTENTE (SIGUE)** | `packages/domain/src/index.ts:44` (exporta `calcularHorasVendidasTotales` de `etapas/horas-vendidas.ts`), `packages/domain/src/horas/index.ts:12` (exporta la versión `bigint` de `horas/reglas.ts`), `etapas/horas-vendidas.ts:1-13` | **No bloqueante**: duplicación heredada de C-06/C-08, fuera del alcance aprobado. Confirmado que NO fue "arreglada" en este pase: `git diff` de ambos archivos y del barrel en esas líneas → `SIN_SALIDA`; para entradas válidas ambas coinciden. Seguimiento: unificar en change posterior. |
| F-04 | LOW | **RESUELTO** | `design.md:31`, `:50`; `horas/umbral.ts:1`; `index.ts:66` | El redactado «se expone solo como documentación del dominio» ahora es verdadero: la constante existe y se exporta sin modificar `horas/reglas.ts`. |
| F-05 | LOW (PARTIAL) | **SIGUE (diferido)** | `specs/modelo-planilla-compartido/spec.md:17-20`, `:41-44`; búsqueda de `exportCosteo|exportOpSinMargenes` → sin coincidencias | **No bloqueante**: el scenario «Un solo modelo para dos adaptadores» pertenece a C-14/C-15 (C-13/IN-08). La compilación aislada del dominio sigue apoyada en la evidencia manual de `apply-progress.md:49`; no hay prueba permanente en el repo. |
| F-06 | LOW | **PRE-EXISTENTE (SIGUE)** | `backend/test/tablero-read-api/detalleOp.test.ts:212-233` (`readFileSync` + regex sobre `obtenerOp.ts` y `PrismaOpRepository.ts`), `:222` (mojibake `conversiÃ³n`) | **No bloqueante**: advertencia del módulo `strict-tdd-verify` (acoplamiento a detalle de implementación). El diff de C-11 solo inserta las líneas 160-210; estas aserciones son anteriores. |
| F-07 | LOW | **PRE-EXISTENTE (SIGUE)** | `frontend/src/shared/domain-client/tipos.ts:49-52`, `esquemas.ts:178,192-194`; `specs/paquete-dominio-compartido/spec.md:12-15` | **No bloqueante**: definición paralela de `DetalleOpDTO` en el frontend, mitigada por `EsquemaDetalleOp: z.ZodType<DetalleOpDTO>` (typecheck detectable) y sin `default` en los campos nuevos. Patrón pre-existente ampliado por C-11. |

**Clasificación final**: 0 CRITICAL, 0 HIGH, 0 MEDIUM nuevos; 1 MEDIUM pre-existente no bloqueante (F-03); 3 LOW pre-existentes/diferidos no bloqueantes (F-05, F-06, F-07). Sin hallazgos nuevos en esta ejecución. R1/R2/R3/R4/R5/R6/R8/R9/R10 sin violaciones (detalle más abajo).

---

### Tabla de ejecución (resultados literales)

| Comando (workdir) | Resultado literal / extracto exacto |
|---|---|
| `npx vitest run` (`packages/domain`) | `Test Files  19 passed (19)` / `Tests  122 passed (122)` / `Duration  4.46s` |
| `npx vitest run test/tablero-read-api/detalleOp.test.ts` (`backend`) | `Test Files  1 passed (1)` / `Tests  10 passed (10)` / `Duration  5.27s` |
| `npx vitest run test/configuracion-global` (`backend`) | `Test Files  5 passed (5)` / `Tests  20 passed (20)` / `Duration  366.01s` |
| `npx vitest run test/horas-reales-api` (`backend`) | `Test Files  6 passed (6)` / `Tests  20 passed (20)` / `Duration  482.55s` |
| `npx vitest run src/shared/domain-client/esquemas.test.ts` (raíz) | `Test Files  1 passed (1)` / `Tests  11 passed (11)` / `Duration  4.65s` |
| `npm test -w @velco/frontend` (raíz) | `Test Files  46 passed (46)` / `Tests  176 passed (176)` / `Duration  127.02s` |
| `npm run typecheck -w @velco/domain` (raíz) | `> @velco/domain@0.1.0 typecheck` / `> tsc --noEmit -p tsconfig.json`; sin salida de errores |
| `npm run typecheck -w @velco/backend` (raíz) | `> @velco/backend@0.1.0 typecheck` / `> tsc --noEmit -p tsconfig.json`; sin salida de errores |
| `npm run typecheck -w @velco/frontend` (raíz) | `> @velco/frontend@0.1.0 typecheck` / `> tsc --noEmit -p tsconfig.json`; sin salida de errores |
| `openspec validate desvios-y-margen-domain --strict` (raíz) | `Change 'desvios-y-margen-domain' is valid` |
| `openspec validate --specs --strict` (raíz) | `Totals: 37 passed, 0 failed (37 items)` |
| `openspec status --change desvios-y-margen-domain --json` (raíz) | `"artifacts": [proposal/done, design/done, specs/done, tasks/done]`, `"isComplete": true`; 5 rutas de specs listadas |
| `openspec list --json` (raíz) | `"completedTasks": 27, "totalTasks": 27, "status": "complete"` |
| `git diff -- packages/domain/src/horas/reglas.ts ... hours-vendidas.ts backend/prisma openspec/specs CHANGES.md AGENTS.md CLAUDE.md` | `SIN_SALIDA` |
| `git status --short` (raíz) | 13 archivos `M` (apply original) + 7 rutas `??` del change/dominio; sin entradas nuevas de corrección fuera de esas rutas |
| Búsqueda de `any`/frameworks en `packages/domain/src` (`*.ts`) | `Found 1 matches`: `cobertura-reglas.test.ts:2` → `import { readdirSync, readFileSync } from 'node:fs';` (solo test; sin `any`, Fastify, Prisma, React, `exceljs`, `zod` ni Testcontainers) |
| Búsqueda de títulos RN en `packages/domain/src` (`*.test.ts`) | `Found 28 matches`; distribución mínima por RN: 2 casos (detalle en F-02) |
| Auxiliar: `rg` para conteo de RN | `rg : El término 'rg' no se reconoce como nombre de un cmdlet...` — herramienta no instalada; sustituido por búsqueda de contenido y conteo manual, sin impacto en el veredicto |
| Auxiliar: script de PowerShell con regex de comillas | `TITULOS_TOTALES => 0` (escape de regex incorrecto); no usado como evidencia, reemplazado por la búsqueda de 28 coincidencias reales |

No se ejecutó la suite completa de backend (solo los tres objetivos obligatorios). Las suites con Testcontainers tardaron 366.01 s y 482.55 s; es lentitud del entorno, no fallo. Tampoco se ejecutó `--coverage`: `package.json` no declara proveedor ni script de cobertura (informativo, no bloqueante).

---

### Matriz de cumplimiento specs ↔ código ↔ tests

| Requirement (delta spec) | Estado | Evidencia |
|---|---|---|
| `modelo-planilla-compartido` — unión discriminada y variante operativa sin costos | **PASS** | `exportacion/modelo.ts:5-13,46-49,53-72`; `modelo.test.ts:50-67,81-107,157-173,190-204`; F-01 RESUELTO |
| `modelo-planilla-compartido` — claves semánticas sin fs/Excel | PASS | `modelo.ts:27-34,68-88`; `modelo.test.ts:129-136,175-188,206-211`; sin importaciones prohibidas |
| `modelo-planilla-compartido` — dos adaptadores / compilación aislada | PARTIAL (diferido) | F-05: sin `exportCosteo`/`exportOpSinMargenes` todavía; evidencia de compilación aislada en `apply-progress.md:49` |
| `comparativa-horas-por-etapa` — comparativa pura, `Sin etapa`, reutilización y división por cero | PASS | `horas/comparativa.ts:1-79`; `horas/comparativa.test.ts:5,39,61,74,83,106,115,124,135`; `horas/reglas.ts` intacto |
| `costos-y-margen-real` — `COALESCE`, cotizado, tasa inyectada, decimal exacto | PASS | `margen/reglas.ts:14-35`; `margen/reglas.test.ts:11,15,24,53,82,92`; `decimal/operaciones.ts` |
| `dto-derivados-orden` — derivados en el detalle y transporte sin recalcular | PASS | `ordenes/detalle.ts:17-95`; `backend/application/obtenerOp.ts:26-38`; `backend/http/esquemas.ts:121-137`; `frontend/esquemas.ts:168-194`; `detalleOp.test.ts:160-210`; `esquemas.test.ts:94-137` |
| `paquete-dominio-compartido` — barrel, nombres canónicos, aislamiento | PASS con observación | `index.ts:1-73`, `horas/index.ts:1-16`, `cobertura-reglas.test.ts:68-94`; F-03 pre-existente no bloqueante |

---

### TDD Compliance (módulo `strict-tdd-verify`)

| Check | Resultado | Detalle |
|---|---|---|
| TDD Evidence reported | ✅ | `apply-progress.md:104-129` documenta RED/GREEN/TRIANGULATE/REFACTOR para F-01, F-02 y LOW |
| RED confirmado | ✅ (por correspondencia) | Los errores literales son reproducibles por el código actual: `modelo.test.ts:58` con el mapeo antiguo da `expected [ 'descripcion', 'cantidad', …(2) ]`; `cobertura-reglas.test.ts:64` con la etiqueta antigua da `expected 1 to be greater than or equal to 2`; `:69` sin la constante da `expected undefined to be 15`. No se re-ejecutó RED porque revertir el código está fuera del alcance de este re-verify. |
| GREEN confirmado | ✅ | 122/122 dominio (incluye 12 tests de `modelo.test.ts` y 16 de `cobertura-reglas.test.ts`); 3 typechecks limpios |
| Triangulación adecuada | ✅ | F-01: materiales vacíos/varios/tasa 0/switch exhaustivo; F-02: control negativo con renombrado; LOW: `95.00`/`95.01` y `alerta.avance + 15 === 95` |
| Safety Net para archivos modificados | ✅ | Registrado en `apply-progress.md:110-112`; el repositorio no muestra cambios nuevos fuera de las 7 rutas ya conocidas |
| Calidad de aserción | ✅ con aviso LOW | Sin tautologías, assertions sin código de producción ni loops fantasma; F-06 sigue como acoplamiento pre-existente a código fuente |

**TDD Compliance**: 6/6 checks; el único aviso es F-06 (LOW, pre-existente).

#### Distribución de capas de test (informativo)

| Capa | Tests | Archivos | Herramienta |
|---|---|---|---|
| Unit (dominio puro) | 122 | 19 | Vitest 5.1.1, entorno `node` |
| Integración HTTP dirigida (`app.inject`, sin mocks de PostgreSQL) | 50 | 12 | Fastify + dependencias falsas |
| Frontend (includes esquemas + UI) | 176 | 46 | Vitest 5.1.1 + jsdom |
| E2E | 0 | 0 | no aplica en C-11 |

#### Cobertura y calidad

- Changed-file coverage: omitido; no hay proveedor de cobertura configurado. No se reporta como fallo.
- Type Checker: ✅ 3/3 workspaces sin errores.
- Linter: ➖ no hay script `lint` en la raíz ni en los workspaces.

---

### Coherencia con decisiones aprobadas y reglas duras

| Decisión / regla | Resultado |
|---|---|
| 1. C-08 intacto, sin alias ni cambio de firma de `evaluarAlertaDesvio` | FOLLOWED (`git diff` vacío en `horas/reglas.ts` y su test; F-03 pre-existente documentado) |
| 3. Umbral 15 fijo sin columna ni inyección | FOLLOWED (`umbral.ts:1`, `index.ts:66`; `reglas.ts` sin diff) |
| 6. Modelo de planilla semántico sin costos en la operativa | FOLLOWED tras corrección (F-01 RESUELTO) |
| R1 TDD estricto | FOLLOWED (6/6 checks; F-02 resuelto) |
| R2 dominio puro / puertos y adaptadores | FOLLOWED (búsqueda sin frameworks en `packages/domain/src`) |
| R3 sin derivados persistidos | FOLLOWED (`git diff -- backend/prisma` → `SIN_SALIDA`) |
| R4 solo TypeScript | FOLLOWED |
| R5 sin auth/PIN/RBAC | FOLLOWED |
| R6 plantillas oficiales, sin `.xlsx` generados en dominio | FOLLOWED (`modelo.test.ts:129-136,206-211`) |
| R8 `openspec/` solo vía CLI | FOLLOWED (solo se escribe este reporte) |
| R9 sin `any`, tipado estricto | FOLLOWED (3 typechecks limpios; sin `any`) |
| R10 sin mocks de PostgreSQL | FOLLOWED (dominio sin Testcontainers; suites backend con BD real) |

---

### Confirmación de alcance e integridad

- **Único archivo editado en este re-verify**: `openspec/changes/desvios-y-margen-domain/verify-report.md`. Hash SHA256 inicial del reporte: `037ADB47D74B832C...`; el resto de los archivos del manifest quedó con los mismos hashes.
- No se corrigió código, tests, specs, `tasks.md`, `apply-progress.md`, `proposal.md`, `design.md`, `CHANGES.md`, `AGENTS.md` ni `CLAUDE.md`.
- No se ejecutó build, commit ni push.
- No se inició PostgreSQL adicional; las suites de Testcontainers usaron el entorno ya disponible.
- `git diff` de rutas protegidas (`horas/reglas.ts`, `horas/reglas.test.ts`, `etapas/horas-vendidas.ts`, `backend/prisma`, `openspec/specs`, `CHANGES.md`, `AGENTS.md`, `CLAUDE.md`) → `SIN_SALIDA`.

### Summary y next step

- **CRITICAL/HIGH**: ninguno.
- **Resueltos**: F-01 (CRITICAL), F-02 (MEDIUM), LOW/F-04 (constante del umbral).
- **No bloqueantes**: F-03 (MEDIUM pre-existente), F-05 (LOW diferido), F-06 y F-07 (LOW pre-existentes).
- **Recomendación**: archive directo del change (sincronizando los 5 delta specs según el flujo OPSX). Registrar F-03/F-05/F-06/F-07 como follow-ups de changes posteriores; no requieren correcciones adicionales antes de archivar C-11.

**Verdict**: READY FOR ARCHIVE
