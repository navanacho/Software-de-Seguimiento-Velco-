## Verification Report: ordenes-form

**Date**: 2026-11-22
**Change**: C-07 `ordenes-form` (frontend/UI)
**Tasks**: 53/53 completadas (`- [x]` = 53, `- [ ]` = 0 en `tasks.md`)
**OpenSpec status**: 4/4 artefactos `done`, `isComplete: true`, `applyRequires: ["tasks"]`
**OpenSpec validate**: `openspec validate ordenes-form --strict` → `Change 'ordenes-form' is valid`

### Test Results

| Comando | Resultado | Duración |
|---------|-----------|----------|
| `npm test -w @velco/domain` | 11 archivos / **38/38 tests** OK | 3.19 s |
| `npm test -w @velco/frontend` | 34 archivos / **117/117 tests** OK | 262.89 s |
| `npm run typecheck -w frontend` | OK (`tsc --noEmit`) | — |
| `npm run typecheck -w backend` | OK (`tsc --noEmit`) | — |
| `npm run typecheck -w @velco/domain` | OK (`tsc --noEmit`) | — |
| `npm test` en `backend/` (safety net, Docker/Testcontainers disponible) | 47 archivos / **155/155 tests** OK | 701.02 s (~11.7 min) |

Notas: frontend tarda por jsdom (65% del tiempo); no es fallo. No se corrió coverage: no hay proveedor `@vitest/coverage-*` instalado. No hay linter configurado en el repo; la calidad está cubierta por los tres typechecks.

### Guardrails

| Regla | Resultado | Evidencia |
|-------|-----------|-----------|
| R1 TDD | OK (trazable) | `tasks.md` registra RED/GREEN/TRIANGULATE por sección; tests nuevos presentes y verdes. No existe artefacto `apply-progress` en este change, así que no hay tabla ciclo por ciclo que auditar. |
| R2 dominio puro | OK | `git status` muestra **cero** cambios en `backend/` y `packages/domain/`; guardianes en `frontend/src/shared/domain-client/guardian.test.ts:13-19` y `frontend/src/features/tablero/guardian.test.ts`. |
| R3 sin derivados persistidos/calculados en React | OK | `aPayload.ts:4-40` y `esquemas.ts:101-117` no envían `avance`, `semaforo`, totales ni `fechaIngreso`; `OrdenFormPage.tsx:55-57` y `DetalleOpPage.tsx:28-34` solo leen el DTO; `EditorEtapas.tsx:89-102` muestra horas persistidas como texto; `EditorEtapas.test.tsx:118` verifica ausencia de `input[type=range]`. |
| R4 solo TypeScript | OK | Sin archivos Python ni otro lenguaje runtime en el change. |
| R5 sin auth/PIN/RBAC | OK | Búsqueda de `auth|login|token|PIN|RBAC|role` en `features/ordenes/**/*.ts` → 0 resultados; rutas públicas en `App.tsx:32-34`. |
| R6 sin xlsx desde cero | OK | Sin imports de `exceljs`/`xlsx` en código nuevo; único match es un guardián que prohíbe el import (`guardian.test.ts:19`). |
| R8 openspec vía CLI | OK | `openspec status` y `openspec validate` corridos por CLI. Único archivo nuevo bajo `openspec/` es este `verify-report.md`, solicitado explícitamente por la skill. |
| R9 sin `any`, estricto, PascalCase | OK | `grep \bany\b` en `frontend/src/**/*.{ts,tsx}` → solo 4 menciones en texto de tests y `expect.any(Object)`; cero anotaciones `: any`. Typechecks limpios. Componentes nuevos en PascalCase. |
| R10 sin mocks de PostgreSQL | OK | Búsqueda de `testcontainers|pg-mem|mock.*postgres|Pool` en `frontend/` → 0 resultados. Los mocks son de `fetch` (frontera HTTP), no de BD. |
| Alcance AGENTS/CLAUDE | OK | Único cambio en esos archivos es la línea de estado del roadmap; cambio intencional y autorizado por el usuario. |
| Correcciones previas del review | OK (verificado) | Enlace 409 usa `<Link to>` cuando hay router (`FormularioOrden.tsx:108,242-246`) y test de navegación real con click (`OrdenFormPage.guardar.test.tsx:117-129`); horas de etapas persistidas son de solo lectura (`EditorEtapas.tsx:89-102`) con test dedicado (`EditorEtapas.test.tsx:53-60`, `OrdenFormPage.etapas.test.tsx:160-178`). |

### Spec Compliance

Leyenda: PASS = requerimiento/esenario cubierto por código + test verde; PARTIAL = cubierto con limitación documentada en el diseño; FAIL = incumplimiento.

#### `formulario-ordenes` (nueva)

| Requerimiento / Escenario | Status | Evidencia |
|---------------------------|--------|-----------|
| Rutas `/ops/nueva` y `/ops/:id/editar` sin auth; edición carga `GET /api/ops/:id` | PASS | `App.tsx:32-34`; `OrdenFormPage.tsx:16-47`; `useOrden.ts:5-10`; `App.ordenes.test.tsx:16-26` |
| Alta vacía con placeholder literal del plano | PASS | `FormularioOrden.tsx:236`; `OrdenFormPage.guardar.test.tsx:54-77`; `FormularioOrden.test.tsx:33-41` |
| Sin login/PIN/token en rutas ni peticiones | PASS | `App.tsx:23-38`; `escribirOps.ts:25-89` (sin headers de auth); guardrail R5 |
| Campos y contrato C-06; decimales como string; sin `fechaIngreso`/derivados | PASS | `esquemas.ts:92-117`; `aPayload.ts:4-40`; `FormularioOrden.tsx:184-213`; `OrdenFormPage.guardar.test.tsx:64-77` |
| Edición envía solo cabecera aceptada por `BodyUpdateOpSchema` | PASS | `aPayload.ts:31-40`; `esquemas.ts:117`; `OrdenFormPage.guardar.test.tsx:79-95` |
| `fechaIngreso` informativa, no editable ni en payload | PASS | `FormularioOrden.tsx:280`; `OrdenFormPage.guardar.test.tsx:75`; `FormularioOrden.test.tsx:38-39` |
| Cliente existente vs alta inline `POST /api/clientes` con `{nombre}` | PASS | `FormularioOrden.tsx:124-150,248-269`; `useAltaClienteInline.ts:5-12`; `escribirOps.ts:47-52`; `FormularioOrden.test.tsx:88-99` |
| Reutilización de cliente inline 200 | PASS | `FormularioOrden.tsx:140-145`; `OrdenFormPage.guardar.test.tsx:207-226` |
| 409 plano: mensaje literal, `aria-invalid` y enlace que navega a `/ops/<uuid>` | PASS | `errores.ts:6-11,74-89`; `erroresFormulario.ts:9-15`; `FormularioOrden.tsx:108,242-246`; `OrdenFormPage.guardar.test.tsx:97-129` |
| 409 `numero_op` resalta campo sin enlace | PASS | `errores.ts:13-17,85-89`; `erroresFormulario.ts:16-18`; `OrdenFormPage.guardar.test.tsx:131-151` |
| 422 por `details[].path` conservando valores | PASS | `errores.ts:19-23,90-99`; `erroresFormulario.ts:19-25`; `OrdenFormPage.guardar.test.tsx:153-169` |
| Validación local de `numero_op` sin enviar petición | PASS | `FormularioOrden.tsx:200-213,226-230`; `FormularioOrden.test.tsx:64-71` |
| Tras guardar: invalidar `['tablero']` y navegar a `/` (alta y edición) | PASS | `useGuardarOrden.ts:17-29`; `OrdenFormPage.guardar.test.tsx:54-95` |
| Fallo: no navegar, no invalidar, conservar datos | PASS | `useGuardarOrden.ts:25-29` (solo `onSuccess`); `OrdenFormPage.guardar.test.tsx:120-122,146-150,166-169` |
| Sin cálculo de semáforo/avance/totales ni normalización de plano en React | PASS | `aPayload.ts:4-40`; `FormularioOrden.tsx:1-20`; `EditorEtapas.tsx:1-4`; guardianes R3 |

#### `editor-etapas-orden` (nueva)

| Requerimiento / Escenario | Status | Evidencia |
|---------------------------|--------|-----------|
| Precarga canónica de 5 etapas en alta | PASS | `precargaEtapas.ts:3-9`; `FormularioOrden.tsx:73`; `FormularioOrden.test.tsx:33-38` |
| Sin cambios omite `etapas` del POST; con cambios las envía | PASS | `aPayload.ts:20-27`; `OrdenFormPage.guardar.test.tsx:54-77`; `OrdenFormPage.etapas.test.tsx:93-108` |
| Alta/quita etapa de texto libre con POST/DELETE y reconsulta | PASS | `EditorEtapas.tsx:26-60`; `useEditorEtapas.ts:19-35`; `escribirOps.ts:54-62,75-78`; `OrdenFormPage.etapas.test.tsx:110-127` |
| Nombre vacío / >100 rechazado sin pedir alta | PASS | `esquemas.ts:92-95`; `EditorEtapas.tsx:26-31`; `EditorEtapas.test.tsx:95-105`; `OrdenFormPage.etapas.test.tsx:129-139` |
| Sin renombrar ni lista cerrada | PASS | `EditorEtapas.tsx:79-90` (nombre persistido como texto); `precargaEtapas.ts` solo es valor inicial; `EditorEtapas.test.tsx:117` |
| Reorden vía `PATCH .../orden` con `ordenSecuencia` entero ≥1 | PASS | `esquemas.ts:97-99`; `escribirOps.ts:64-73`; `EditorEtapas.tsx:62-71,103-111`; `OrdenFormPage.etapas.test.tsx:141-158` |
| Reconsulta y repinta con DTO del servidor; conserva `id`, nombre y `horasVendidas: '7.50'` | PASS | `useEditorEtapas.ts:8-27`; `OrdenFormPage.etapas.test.tsx:150-157` (`invalidateQueries(['orden','op-1'])`) |
| Reorden fallido: aviso y orden servido intacto | PASS | `EditorEtapas.tsx:66-70`; `EditorEtapas.test.tsx:121-130`; `OrdenFormPage.etapas.test.tsx:180-192` |
| Derivados del DTO, sin cálculo en el editor | PASS | `OrdenFormPage.tsx:55-57`; `EditorEtapas.tsx:1-4`; `OrdenFormPage.etapas.test.tsx:154-157` |
| Sin slider de avance ni `input[type=range]` | PASS | `EditorEtapas.tsx:73-123`; `EditorEtapas.test.tsx:107-119` |

#### `badge-plano-op` (nueva)

| Requerimiento / Escenario | Status | Evidencia |
|---------------------------|--------|-----------|
| Tarjeta con plano → `Plano: PL-2026-045` | PASS | `BadgePlano.tsx:7-12`; `TarjetaOrden.tsx:26`; `TarjetaOrden.plano.test.tsx:10-18` |
| Tarjeta sin plano → `Sin plano`, nunca `Plano: null` | PASS | `BadgePlano.tsx:10`; `TarjetaOrden.plano.test.tsx:20-30` |
| Muchas tarjetas sin plano sin error de unicidad | PASS | `TarjetaOrden.plano.test.tsx:20-30` (3 tarjetas) |
| Detalle con/sin plano usa la misma regla | PASS | `DetalleOpPage.tsx:24`; `DetalleOpPage.test.tsx:28-35` (con plano); `formulario-ordenes` y fixture cubren `null` vía `BadgePlano` |
| Solo comparación contra `null`; sin `trim()`/`toUpperCase()`/normalizador | PASS | `BadgePlano.tsx:10`; búsqueda de normalizadores en `features/ordenes` → 0 en badge |
| Sin campos derivados en esquemas/tipos (`planoVisible`, `textoPlano`) | PASS | `esquemas.ts:103`; `tipos.ts`; guardianes `frontend/src/app/convenciones.test.ts:16-23` |

#### `detalle-op-ui` (nueva)

| Requerimiento / Escenario | Status | Evidencia |
|---------------------------|--------|-----------|
| Ruta `/ops/:id` con `GET /api/ops/:id` validado por Zod | PASS | `App.tsx:34`; `consultarOp.ts:9-13`; `useOrden.ts:5-10`; `App.ordenes.test.tsx:28-32` |
| Muestra cabecera, badge, etapas con horas y materiales del DTO | PASS | `DetalleOpPage.tsx:21-56`; `DetalleOpPage.test.tsx:28-35` |
| 404 con estado de error claro, sin datos de ejemplo | PASS | `errores.ts:25-28,100-105`; `DetalleOpPage.tsx:16-18`; `DetalleOpPage.test.tsx:46-51` |
| Derivados (`semaforo`, `avance`, `diasRestantes`, `etapaAhora`) leídos del DTO | PASS | `DetalleOpPage.tsx:28-34`; sin comparaciones de fechas en el componente |
| Acción *Editar* a `/ops/:id/editar` | PASS | `DetalleOpPage.tsx:57`; `DetalleOpPage.test.tsx:37-44` |
| Tarjeta enlaza a `/ops/:id` con el mismo badge | PASS | `TarjetaOrden.tsx:22,26,52`; `TarjetaOrden.plano.test.tsx:10-18` |
| Sin analítica, horas reales, exportación ni edición de materiales | PASS | `DetalleOpPage.tsx:35-56`; `DetalleOpPage.test.tsx:37-44` |

#### `cliente-y-contenedores-tablero` (modificada)

| Requerimiento / Escenario | Status | Evidencia |
|---------------------------|--------|-----------|
| Tipos canónicos de `@velco/domain` sin duplicados | PASS | `TarjetaOrden.tsx:3`; `consultarTablero.ts` sin cambios; guardianes R2 |
| Envelope `GET /api/ops` validado con Zod | PASS | `esquemas.ts:26-40`; `esquemas.test.ts:22-27` (safety net sin modificar) |
| Sin cálculos en `shared/domain-client/` | PASS | `escribirOps.ts:25-89` solo transporta/valida; `consultarTablero.ts:19` solo filtra parámetros |
| Escritura tipada sin `any` ni imports de Fastify/Prisma/exceljs | PASS | `escribirOps.ts:1-89`; `esquemas.ts:148-159`; `guardian.test.ts:13-19`; typecheck limpio |
| Errores 409/422 discriminados y tipados | PASS | `errores.ts:30-64,74-107`; `escribirOps.test.ts` (cuerpos exactos); `OrdenFormPage.guardar.test.tsx:97-169` |
| Plano transportado sin normalizar | PASS | `esquemas.ts:103` (sin `trim`); `escribirOps.test.ts:92-97` verifica `'  pl-2026-045  '` intacto |

#### `filtros-y-estado-vacio-tablero` (modificada)

| Requerimiento / Escenario | Status | Evidencia |
|---------------------------|--------|-----------|
| *Nueva OP* en barra navega a `/ops/nueva` sin tocar filtros/query | PASS | `TableroPage.tsx:23,57-59`; `TableroPage.nueva-op.test.tsx:35-47` |
| Sin auth/roles/PIN en la acción | PASS | `TableroPage.tsx:58`; guardrail R5 |
| Estado vacío con *Nueva OP*, *Limpiar filtros* y *Recargar tablero* | PASS | `EstadoVacioTablero.tsx:8-16`; `TableroPage.tsx:66-73`; `TableroPage.nueva-op.test.tsx:49-61` |
| Alta desde el estado vacío sin petición adicional al listado | PASS | `TableroPage.nueva-op.test.tsx:49-61` (conteo de `fetch` invariante) |
| Con resultados no se muestra estado vacío | PASS | `TableroPage.tsx:66-84`; `TableroPage.nueva-op.test.tsx:63-68` |

### Design Coherence

- **D1 (slice `ordenes`, contenedor/presentacional)**: FOLLOWED — `OrdenFormPage.tsx` orquesta hooks y pasa props a `FormularioOrden`/`EditorEtapas`/`DetalleOpPage`.
- **D2 (espejo Zod + errores discriminados)**: FOLLOWED — `esquemas.ts`, `errores.ts`, `erroresFormulario.ts`, sin `any`.
- **D3 (plano: UI envía, backend normaliza, 409 enlazado)**: FOLLOWED — `esquemas.ts:103`, `FormularioOrden.tsx:242-246`, test de click real.
- **D4 (cliente base + alta inline idempotente)**: FOLLOWED — `FormularioOrden.tsx:124-150`, `useAltaClienteInline.ts`, `escribirOps.ts:47-52`.
- **D5 (precarga canónica, envío condicional, persistencia verificada)**: FOLLOWED with documented debt — `precargaEtapas.ts`, `aPayload.ts:20-27`, `useEditorEtapas.ts:19-35`; el reorden expone "Mover al inicio" (secuencia 1), que es lo exigido por tareas 5.7-5.9.
- **D6 (materiales: alta transaccional + alta independiente)**: FOLLOWED — `FormularioOrden.tsx:152-182,316-364`, `OrdenFormPage.tsx:68`, `useAltaMaterial`.
- **D7 (detalle mínimo de solo lectura)**: FOLLOWED — `DetalleOpPage.tsx`, sin horario real ni exportación.
- **D8 (invalidación centralizada + navegación)**: FOLLOWED — `useGuardarOrden.ts:25-29`, sin inserción optimista en caché.
- **D9 (`fechaEntrega` editable, `fechaIngreso` informativa)**: FOLLOWED — `FormularioOrden.tsx:280-289`, `aPayload.ts:4-40`.
- **D10 (safety net, TDD y guardianes)**: FOLLOWED — safety net ejecutado verde (dominio, backend y frontend), 53/53 tareas, guardianes y typechecks limpios.

### TDD / Calidad de aserciones

- No hay artefacto `apply-progress` en el change: la evidencia disponible es la secuencia RED/GREEN/TRIANGULATE registrada en `tasks.md` más los archivos de test existentes y verdes. Esto se registra como limitación de auditoría, no como incumplimiento de R1.
- Distribución de tests nuevos: mayoría de integración de componente (`@testing-library/react` + `MemoryRouter`/`QueryClientProvider`) y unitarios de mapeo/esquemas; sin E2E (no hay tooling de browser en el stack). Tooling disponible y usado: Vitest 5.1.1 + jsdom 31.0.1.
- Revisión de aserciones en los tests del slice: sin tautologías, loops vacíos ni aserciones de puro humo detectadas; los casos críticos (409 con click, reorden con reconsulta, horas persistentes de solo lectura, navegación desde barra/estado vacío) afirman comportamiento observable.
- Coverage: omitido (sin proveedor instalado). Linter: no configurado. Typecheck: limpio en los tres workspaces.

### Summary

- **CRITICAL**: Ninguno. No hay bloqueantes para archivar.
- **WARNING**: Ninguno que bloquee. Se registran dos deudas ya documentadas en el diseño: (1) `ETAPAS_PRECARGADAS` hardcodea los cinco nombres canónicos porque no existe `GET /api/configuracion` (D5, C-10 deberá exponerlo); (2) el reorden de etapas solo ofrece "Mover al inicio" (`ordenSecuencia: 1`), suficiente para los escenarios del spec pero no un reorden arbitrario. También se observa que el change no incluye `apply-progress` con evidencia ciclo por ciclo de TDD.
- **SUGGESTION**: (1) En C-10/C-18, reemplazar la constante por configuración servida y enriquecer el control de reorden. (2) Evaluar `pool: 'vmThreads'` o `isolate: false` en la config de Vitest de frontend para reducir los ~263 s de suite (jsdom representa el 65%). (3) Agregar un test de regresión que verifique que las horas de etapas persistidas nunca aparecen como input cuando el DTO cambia de `horasVendidas` tras una reconsulta.

**Verdict**: READY FOR ARCHIVE

**Recommended next step**: Ejecutar `/opsx:archive ordenes-form` (la CLI actualiza los main specs, R8), marcar C-07 como `[x]` en `CHANGES.md` y re-sincronizar AGENTS.md/CLAUDE.md; luego continuar con `C-08` (`horas-reales-api`) en el camino crítico. No se realizó build, commit ni archivado en esta verificación.
