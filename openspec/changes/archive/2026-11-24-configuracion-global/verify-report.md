## Verification Report: configuracion-global (C-10) — RE-VERIFY #2 FINAL

**Fecha**: 2026-11-24 (ejecuciones propias 18:55–19:19)  
**Rol**: verificador independiente final; alcance = **solo reescribir este reporte**. No corregí código, tests, specs, design, tasks, proposal ni `apply-progress`. Sin build, commit ni push.  
**Tasks**: 27/27 completas en `tasks.md` (sin cambios)  
**Veredicto final**: **READY FOR ARCHIVE**  
**Hallazgos**: CRITICAL 0 · HIGH 0 · MEDIUM 3 (2 resueltos históricamente, MEDIUM-2 cerrado en esta ronda, MEDIUM-3 pendiente no bloqueante) · LOW 3 (LOW-1/2 aceptados, LOW-3 nuevo informativo)

### Criterio del veredicto

MEDIUM-2 está **cerrado con evidencia de test ejecutado por mí**: existe el test del `id` extra, ejerce `app.inject()` contra PostgreSQL real, comprueba `422`, `path: 'id'`, mensaje que contiene `id` y no modificación de la fila. El cambio de producción está acotado por el discriminante `issue.code === 'unrecognized_keys'`; los demás `422` conservan `issue.path.join('.')`. No hay HIGH/CRITICAL nuevos. MEDIUM-3 sigue presente porque el usuario **no pidió corregirlo en esta ronda**. El error reportado queda asociado a `id` y la fila no se modifica.

---

### Tabla de hallazgos históricos y estados finales

| ID | Severidad | Estado final | Evidencia |
|---|---|---|---|
| **HIGH-1** — spec prometía cálculo de margen en C-10 | HIGH | ✅ **RESUELTO** (re-verify #1) | `specs/configuracion-en-lectura-op/spec.md:5,12-20,36-39` y `design.md:34,44` separan inyección de tasa (C-10) de cálculo de margen (C-11); sin cambios desde 18:37 (no aparece en el escaneo de mtimes). |
| **MEDIUM-1** — documentación decía que el `PUT` aceptaba `id` | MEDIUM | ✅ **RESUELTO** (re-verify #1) | `design.md:24`, `specs/configuracion-global-api/spec.md:5,22-25` describen rechazo `422`; implementación real en `esquemas.ts:12-17`, `registrarRutas.ts:35,37`, `app.ts:35-45`. |
| **MEDIUM-2** — escenario `id` extra sin test / `path` vacío | MEDIUM | ✅ **CERRADO EN ESTA RONDA** | Test: `backend/test/configuracion-global/api.test.ts:44-68` (`PUT` con `id: 1` extra → `:57` 422, `:59` `validation_error`, `:62` `path: 'id'` + mensaje con `id`, `:65-66` relectura `0.00` = fila no modificada). Triangulación con otra clave: `:70-96`. Producción: `backend/src/features/salud/http/app.ts:25-30,41`. Re-ejecutado por mí: 1/1 aislado, 7/7 el archivo, 24/24 la suite focal, 201/201 la suite backend completa. Detalle de aserción en LOW-3. |
| **MEDIUM-3** — redacción de margen recalculado en C-10 | MEDIUM | ⏳ **PENDIENTE (no solicitado en esta ronda)** | Sigue literal en `tasks.md:24,27`, `proposal.md:8,10`, `specs/configuracion-global-ui/spec.md:52,57`. Mtimes: `tasks.md` 17:53:30, `proposal.md` 16:03:03, UI spec anterior a 18:37 → **no tocados**. No lo marco resuelto. No bloquea el archive según el criterio recibido, pero conviene alinearlo antes de `sync-specs`. |
| **LOW-1** (aceptado) | LOW | ⏳ **SIGUE** | `apply-progress.md:7-11,15-25` sin cambios (mtime 17:53:24): sin columna `SAFETY NET`, RED cualitativo y sin entrada del nuevo ciclo del `id`. |
| **LOW-2** (aceptado) | LOW | ⏳ **SIGUE** | `frontend/src/features/configuracion/guardian.test.ts:16-27` y `frontend/src/features/ordenes/configuracion.guardian.test.ts:16-30`: `expect` dentro de `for` sin comprobar `fuentes.length > 0`. Sin cambios. Ghost loop estructural, no activo: los directorios tienen fuentes y los tests fallarían si detectaran código prohibido. |
| **LOW-3** (nuevo, informativo) | LOW | ⚠️ **DETECTADO POR MÍ** | En `api.test.ts:78-88` el `vi.spyOn(dependencias.configuracion, 'actualizar')` se instala **después** del `PUT` inválido con `foo`; por eso `expect(escrituras).not.toHaveBeenCalled()` (`:88`) no pudo observar esa llamada. No contradice el cierre de MEDIUM-2: la no-escritura del caso `id` se comprueba de verdad por relectura de BD en `:65-66` (payload `1250.50` vs. `0.00` persistido). WARNING de calidad de aserción, no CRITICAL ni HIGH. |

---

### Cambios posteriores al re-verify #1 (auditoría)

`git status --porcelain=v1` y `git log --oneline -5`:**ejecutado por mí**. Todo C-10 sigue sin commitear; `HEAD = 9b67f52` (archivado de C-09). Por eso `git diff` **no puede aislar** los cambios del apply #2; usé `LastWriteTime` con corte en `2026-11-24 18:37:00` (hora del re-verify #1): **ejecutado por mí**.

| Archivo | LastWriteTime | Declarado por el agente #2 |
|---|---|---|
| `openspec/changes/configuracion-global/verify-report.md` | 18:39:21 | Sí (reporte anterior) |
| `backend/test/configuracion-global/api.test.ts` | 18:48:42 | Sí |
| `backend/src/features/salud/http/app.ts` | 18:50:42 | Sí |
| `tasks.md` / `proposal.md` / `apply-progress.md` | 17:53:30 / 16:03:03 / 17:53:24 | Sin cambios |

**Resultado**: después del re-verify #1 cambiaron **exactamente** los dos archivos declarados, más el propio `verify-report`. No aparecieron otros cambios de código o tests; `backend/prisma` intacto; sin `.py`. No hay hallazgo HIGH por cambios no declarados.

---

### Tabla de ejecución real

| Comando / comprobación | Resultado | Origen |
|---|---|---|
| `npx vitest run test/configuracion-global/api.test.ts --maxWorkers=2 --reporter=verbose -t "Cuerpo con id rechazado"` (backend) | 1 archivo, **1 passed / 6 skipped**, exit 0 | **Ejecutado por mí** |
| `npx vitest run test/configuracion-global/api.test.ts --maxWorkers=2 --reporter=verbose` (backend) | 1 archivo, **7/7**, exit 0, BD real | **Ejecutado por mí** |
| `npx vitest run test/configuracion-global test/core-order-models/etapas-default.test.ts --maxWorkers=2 --reporter=verbose` (backend) | 6 archivos, **24/24**, 190,01 s, PostgreSQL real vía Testcontainers | **Ejecutado por mí** |
| `npm test -w @velco/backend -- --fileParallelism --maxWorkers=2 --reporter=dot --no-color` | 58 archivos, **201/201**, 982 s, exit 0 (eran 199; +2 tests nuevos) | **Ejecutado por mí** (fuera del mínimo del mandato; para evaluar el error handler global) |
| `npx vitest run src/configuracion/validar.test.ts --reporter=verbose` (packages/domain) | 1 archivo, **7/7**, exit 0 | **Ejecutado por mí** |
| `npx vitest run <6 archivos focales> --maxWorkers=2 --reporter=verbose` (frontend) | 6 archivos, **18/18**, exit 0, jsdom | **Ejecutado por mí** |
| `npm run typecheck -w @velco/domain` / `-w @velco/backend` / `-w @velco/frontend` | los 3 con `exit 0` | **Ejecutado por mí** |
| `openspec validate configuracion-global --strict` | `Change 'configuracion-global' is valid`, exit 0 | **Ejecutado por mí** |
| `docker info --format '{{.ServerVersion}}'` | `28.1.1` → Docker disponible | **Ejecutado por mí** |
| `node --experimental-strip-types --input-type=module -e "... BodyConfiguracionSchema.safeParse({ id: 1, ... }) ..."` | `{code:'unrecognized_keys', keys:['id'], path:[], message:'Unrecognized key: "id"'}` | **Ejecutado por mí** |
| Escaneo de `LastWriteTime` post-18:37 en todo el repo | Solo 3 archivos listados arriba | **Ejecutado por mí** |
| `git status` / `git log` / búsquedas estáticas (R2/R3/R5/R9, `path: ''`, `.strict()`) | sin cambios no declarados; 0 imports prohibidos en `packages/domain/src`; 0 `any`/`parseFloat`/`toNumber`/`calcularMargen`/auth en la feature de configuración; 0 tests que esperen `path: ''`; 13 usos de `.strict()` en 7 features | **Ejecutado por mí** |
| Safety net 5/5; RED `-t "Cuerpo con id rechazado"` → 1 failed / 5 skipped con diff `- "path": "id"` / `+ "path": ""`; GREEN 6/6; triangulación 7/7; suite focal 24/24; typecheck backend y `validate` | según lo reportado | **Citado del agente de apply #2**, no re-ejecutado como RED (ver siguiente sección) |
| `openspec status --change configuracion-global --json` → `isComplete: true`, 4/4 artefactos `done` | — | **Citado del verify #1** |

No ejecuté suites completas de dominio/frontend ni build (regla global: no buildear). El RED del apply #2 **no quedó como salida literal en ningún archivo** (`apply-progress.md` no fue tocado). No lo doy por ejecutado por mí: lo marco como **citado y contrastado**, no como evidencia literal.

---

### Evidencia TDD del nuevo ciclo (módulo strict-tdd-verify)

| Check | Resultado | Detalles |
|---|---|---|
| TDD Evidence reported | ✅ | `apply-progress.md:13-25` existe (tabla original, sin cambios). |
| Nuevo ciclo del `id` documentado en el artefacto | ⚠️ | **No**. LOW-1: la tabla no tiene fila ni salida literal para `api.test.ts:44-95`. Solo el reporte del agente #2. |
| RED contrastado | ✅ (contraste, no literal) | El apply citó 1 failed / 5 skipped con `- "path": "id"` / `+ "path": ""`. Yo ejecuté `safeParse` del esquema real y obtuve `unrecognized_keys` con `path: []`, `keys: ['id']`: sin el helper, `app.ts:29` produciría `''`; con él, `app.ts:27` produce `'id'`. El diff citado es **exactamente** lo que predice esa implementación. No hay RED inventado, pero **tampoco salida literal propia**. |
| GREEN confirmado | ✅ | 7/7 el archivo, 24/24 focal, 201/201 backend completo, ejecutados por mí. |
| Triangulación adecuada | ✅ | 2 casos nuevos: `id` (`:44-68`) y `foo` (`:70-96`), más 4 casos de rango/tipo/etapas preexistentes. El caso `foo` comprueba además la ruta válida con 200 y exactamente 1 escritura (`:89-91`). |
| Safety Net | ⚠️ | 5/5 **citado**; no documentado en `apply-progress.md` (LOW-1). |

**TDD Compliance**: 4/6 completos, 2 parciales informativos. Sin incumplimiento CRITICAL: la tabla existe, el test existe y pasa, y el RED es coherente con la implementación.

---

### Decisión global del error handler: evaluada ✅ SEGURA EN EL ALCANCE VERIFICADO

- `app.ts:35-45`: el `setErrorHandler` es global, pero `details[].path` se calcula con `rutaDelIssue` (`:41`).
- `app.ts:25-30`: `if (issue.code === 'unrecognized_keys')` → `[...issue.path, ...issue.keys].join('.')`; en **cualquier otro issue** se devuelve `issue.path.join('.')` sin cambios (`:29`). El discriminante evita alterar paths de rango, tipo, decimales, etapas ni `refine` (p. ej. `horas/http/esquemas.ts:30` usa `.strict().refine(...)`; el issue de `refine` no es `unrecognized_keys`).
- Efecto observable: antes, una clave extra daba `path: ''` (confirmado por el `safeParse` crudo y por el sondeo del re-verify #1); ahora da la clave (`id`, `foo`). Es un cambio intencionado y **global** para los 13 `.strict()` de clientes, etapas, configuración, materiales, ordenes y horas. No hay consumidor ni test en el repo que dependa de `path: ''` (búsqueda ejecutada por mí: 0 coincidencias).
- Regresión: **201/201** en la suite backend completa con PostgreSQL real, incluidos los tests de esas features; `api.test.ts:119-121` y `:177-179` siguen comprobando paths anidados (`valorHoraEstandar`, `etapasDefault.1`) para issues que no son `unrecognized_keys`.
- Conclusión: no hallazgo HIGH. La globalidad está acotada por el tipo de issue y cubierta por la suite completa. Riesgo residual no verificado: clientes HTTP **externos** que consume `path: ''`; no hay evidencia de tales consumidores en este repositorio.

---

### Test Layer Distribution

| Capa | Tests | Archivos | Herramienta |
|---|---|---|---|
| Unit / puro (dominio + reglas) | 17 | 4 | Vitest |
| Integración HTTP / PostgreSQL real | 14 | 4 | Vitest + Testcontainers (`postgres:18.7`) + `app.inject()` (`api.test.ts` pasó de 5 a 7) |
| Componente / routing (frontend) | 18 | 6 | Vitest + jsdom + Testing Library |
| E2E navegador | 0 | 0 | No configurado en el stack |
| **Total focal** | **49** | **14** | Antes 47 |

### Changed File Coverage

Cobertura no ejecutada: no hay `@vitest/coverage-v8` ni script de cobertura. Informativo según el módulo strict; no bloquea.

### Assertion Quality

| Archivo | Línea | Patrón | Problema | Severidad |
|---|---|---|---|---|
| `backend/test/configuracion-global/api.test.ts` | 87-88 | `vi.spyOn(...)` instalado tras el `PUT` inválido de `:78-80` | `not.toHaveBeenCalled()` no observa esa llamada: aserción ineficaz para el caso `foo` | WARNING (LOW-3) |
| `frontend/src/features/configuracion/guardian.test.ts` | 16-27 | `expect` dentro de `for (const archivo of fuentes)` | Vacuidad estructural no comprobada | WARNING (LOW-2) |
| `frontend/src/features/ordenes/configuracion.guardian.test.ts` | 16-30 | ídem | ídem | WARNING (LOW-2) |

**Assertion quality**: 0 CRITICAL, 3 WARNING. El test del `id` no tiene aserciones tautológicas ni ghost loops; su comprobación de no-escritura es real vía relectura de BD.

### Quality Metrics

**Linter**: ➖ no configurado en el repo.  
**Type Checker**: ✅ 3/3 workspaces sin errores, ejecutados por mí.  
**OpenAPI**: ✅ `openapi.test.ts` expone solo `get`/`put`; incluido en los 201/201.

### Reglas duras R1–R10

| Regla | Estado | Evidencia |
|---|---|---|
| R1 — TDD estricto | ✅ con LOW-1/LOW-3 | Nuevo test escrito antes del cambio (citado + contrastado); RED/GREEN/TRIANGULATE auditables en el test; 49/49 focales y 201/201 backend re-ejecutados por mí. |
| R2 — dominio sin frameworks | ✅ | 0 imports de Fastify/Prisma/React/exceljs en `packages/domain/src` (búsqueda ejecutada por mí); typecheck dominio OK. |
| R3 — sin derivados persistidos | ✅ | `backend/prisma` sin cambios desde el re-verify #1; `sin-derivados.test.ts` en verde; 0 `calcularMargen` en la feature de configuración. |
| R4 — solo TypeScript en runtime | ✅ | Sin `.py` en `git status` ni en el escaneo de mtimes. |
| R5 — sin auth/PIN/RBAC | ✅ | 0 coincidencias en código de la feature; el único cambio en `app.ts` es el mapeo de errores Zod. |
| R6 — plantillas Excel oficiales | ✅ N/A | Sin `.xlsx` ni código de exportación tocado. |
| R7 | — | No existe en este repositorio; no se inventa. |
| R8 — `openspec/` solo vía CLI | ✅ con limitación | Solo se reescribió este `verify-report.md`, autorizado explícitamente. `validate --strict` OK. No puedo verificar retroactivamente el comando usado por el agente #2. |
| R9 — sin `any`, tsconfig estricto | ✅ | 0 `any` en `backend/src/features/configuracion`; 3 typechecks OK. |
| R10 — PostgreSQL real, sin mocks | ✅ | `ayuda.ts:27-38` + `contenedor.ts` usan Testcontainers y **no** simulan Prisma; 201 tests backend corrieron contra BD real. |

---

### Cobertura de los 5 specs

| Spec | Escenarios | Resultado final |
|---|---|---|
| `configuracion-global-api` | 13 | **PASS 13/13**: el escenario `id` extra (`:22-25`) dejó de ser PARTIAL; cubierto por `api.test.ts:44-68` y triangulado en `:70-96`. |
| `configuracion-global-ui` | 9 | **PASS 8/9, PARTIAL 1**: redacción de margen en `:52,57` → MEDIUM-3. |
| `configuracion-en-lectura-op` | 6 | **PASS 5/6, PARTIAL 1**: repintado verificado como invalidación de queries, no como DTO repintado. Sin cambios en esta ronda. |
| `editor-etapas-orden` | 5 | **PASS 4/5, PARTIAL 1**: caso «API devuelve la canónica de 5» probado con 3 desde API y 5 en fallback. Sin cambios. |
| `puertos-persistencia-ordenes` | 6 | **PASS 6/6**. Sin cambios. |

---

### Acción siguiente

1. **Aceptar el veredicto READY FOR ARCHIVE**: MEDIUM-2 cerrado, 0 CRITICAL, 0 HIGH nuevos.
2. Antes de `openspec sync-specs configuracion-global`, alinear **MEDIUM-3** (`tasks.md:24,27`, `proposal.md:8,10`, `specs/configuracion-global-ui/spec.md:52,57`) vía CLI de OpenSpec (R8) para no promover al contrato canónico una redacción de margen que pertenece a C-11. **No implementar `calcularMargen` en C-10**: `ubicacion-reglas.test.ts:181-187` lo prohíbe hasta C-11.
3. Opcional, no bloqueante: documentar el nuevo ciclo del `id` en `apply-progress.md` (LOW-1) y mover el `spyOn` anterior al `PUT` de `foo` (LOW-3).
4. Luego `openspec archive configuracion-global` y marcar C-10 en `CHANGES.md`. **No ejecutado en este re-verify** (fuera del alcance).

---

**Verdict**: **READY FOR ARCHIVE** — HIGH-1 ✅, MEDIUM-1 ✅, MEDIUM-2 ✅ cerrado con test ejecutado; MEDIUM-3 pendiente y LOW-1/2/3 documentados; 49/49 tests focales y 201/201 backend re-ejecutados por mí; 3 typechecks y `validate --strict` en verde.
