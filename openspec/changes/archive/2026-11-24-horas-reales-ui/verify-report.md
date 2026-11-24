## Verification Report: horas-reales-ui

**Date**: 2026-11-24  
**Change**: `horas-reales-ui` (C-09)  
**Re-verificación**: tras los fixes de los 5 CRITICAL del reporte anterior  
**Tasks**: 17/17 completas en `tasks.md`  
**Verdict**: **READY FOR ARCHIVE**

### Alcance de la verificación

Se relearon el `verify-report.md` anterior, el `apply-progress.md` nuevo, `proposal.md`, `design.md`, `tasks.md`, los 5 specs delta y `openspec/config.yaml` (sin cláusula `rules.verify`). Se inspeccionaron los archivos tocados por los fixes y sus tests, más el cableado en `DetalleOpPage.tsx` y `useHoras.ts`. No se modificó código de producción, planes ni tests: el único archivo escrito en esta pasada es este reporte. No se ejecutaron build, commit ni push.

Nota de rutas: los archivos `fechaCalendario.ts` y `mensajeErrorEliminar.ts` están en `frontend/src/features/ordenes/` (no en `shared/domain-client/` ni en `components/` como figuraba en el pedido); las rutas del `apply-progress.md` son las correctas y fueron confirmadas en disco.

### OPSX Artifact Status

| Comando | Resultado |
|---|---|
| `openspec status --change "horas-reales-ui" --json` | `isComplete: true`; proposal, specs, design y tasks en `done` |
| `openspec validate --strict horas-reales-ui` | `Change 'horas-reales-ui' is valid` |

### Test Results

| Comando | Resultado |
|---|---|
| `npm test -w @velco/domain -- --run` | 12 archivos, **54/54** OK |
| `npm test -w @velco/frontend -- --run` | 40 archivos, **156/156** OK (antes 139/139: +17 tests nuevos) |
| `npm run typecheck` | OK en `@velco/domain`, `@velco/backend` y `@velco/frontend` |
| `npm test -w @velco/frontend -- --run` (7 archivos del change) | **39/39** OK: fechaCalendario 3, esquemas 9, FormularioHora 3, SeccionHoras 10, mensajeErrorEliminar 2, useHoras 5, horas 7 |
| `npm test -w @velco/backend -- --run test/tablero-read-api/listarOps.test.ts test/tablero-read-api/detalleOp.test.ts test/horas-reales-api` | 8 archivos, **50/50** OK (258 s) |
| Verificación directa del esquema con `node --experimental-strip-types` | `-1`, `-0.01`, `0` → único issue `las horas deben ser mayores a cero`; `-0.001` → `formato` antes que `mayores a cero` (ver WARNING-2) |

**Limitación de ejecución**: la suite completa de backend no se re-ejecutó en esta pasada (el reporte anterior documentó timeouts de 600 s y 300 s). Sí se ejecutaron íntegramente las 8 suites de backend relacionadas con el change (50/50). Los fixes son exclusivamente de frontend, por lo que no se considera un bloqueo.

### Critical Resolution Matrix

| ID | Estado | Evidencia verificable |
|---|---|---|
| **CRITICAL-1** — evidencia TDD | **RESUELTO** | Existe `apply-progress.md` con tabla `TDD Cycle Evidence` de 18 filas (10 de apply + 8 de fixes) y columnas Safety net / RED / GREEN / TRIANGULATE / REFACTOR. Los 12 archivos de test referenciados existen. La tabla distingue explícitamente `RECONSTRUIDO` de `VALIDADO AHORA` y documenta la baseline (26/26 frontend, 54/54 domain) previa a tocar código. Es honesta y verificable. |
| **CRITICAL-2** — fecha precargada | **RESUELTO** | `frontend/src/features/ordenes/fechaCalendario.ts:1-10` expone `fechaCalendario(fecha)` puro y `fechaHoy()` inyectable vía reloj; `FormularioHora.tsx:18` usa `parte?.fecha ?? hoy ?? fechaHoy()` y la prop `hoy` está tipada en `:9`. Tests: 3 de helper (incluye `vi.setSystemTime`), 3 de formulario (alta inyectada, edición, reloj simulado) y 1 de propagación en `SeccionHoras.tsx`. 7/7 pasan. |
| **CRITICAL-3** — etapa y observación | **RESUELTO** | `SeccionHoras.tsx:74-75` renderiza `Etapa: {parte.etapaId}` y `Observación: {parte.observacion}` sólo cuando existen; CSS `.partes li` con `flex-wrap` en `:38-43`. Tests de presencia y ausencia en `SeccionHoras.test.tsx:132-146`. 2/2 pasan. |
| **CRITICAL-4** — fallo de DELETE | **RESUELTO** | `SeccionHoras.tsx:37,89-101` calcula `mensajeErrorEliminar(eliminar.error)` y muestra `role="alert"` con botón *Reintentar eliminación* que reenvía `eliminar.variables`. No hay eliminación optimista, por lo que la fila permanece. `mensajeErrorEliminar.ts:1-6` cubre `Error` y `unknown`. Tests en `mensajeErrorEliminar.test.ts` (2) y `SeccionHoras.test.tsx:148-187` (2: conserva fila + reintento exitoso). 4/4 pasan. |
| **CRITICAL-5** — mensaje de horas | **RESUELTO** | `esquemas.ts:80-83` separa el formato (`RE_HORAS_PARTE`, permite `-`) del refinamiento de positividad con mensaje `las horas deben ser mayores a cero`; `FormularioHora.tsx:33` muestra `issues[0]`. Verificado contra el esquema real: `-1`, `-0.01` y `0` producen sólo el mensaje requerido; `abc` conserva el mensaje de formato. Tests en `esquemas.test.ts:47-72` y `SeccionHoras.test.tsx:63-92`. 5/5 pasan. |

### Spec Compliance

Leyenda: `PASS` = satisface el escenario; `PARTIAL` = implementación parcial; `FAIL` = incumple.

| Requerimiento / Escenario | Estado | Evidencia |
|---|---|---|
| **carga-horas-ui — Modal de carga rápida** | PASS | `SeccionHoras.tsx:66,103-117`; `FormularioHora.tsx` completo. |
| Alta exitosa desde detalle | PASS | `SeccionHoras.test.tsx:110-130`; `useHoras.ts:30-36` invalida detalle/tablero/horas. |
| Alta con etapa opcional | PASS | `FormularioHora.tsx:16,26,46-52`; `esquemas.ts:84,98-104`. |
| Error de validación del backend (422) | PASS | `horas.test.ts:72-79`; `useHoras.test.tsx:64-76`. |
| Precargar fecha con el día actual | **PASS (antes FAIL)** | `fechaCalendario.ts:8-10`; `FormularioHora.tsx:9,18`; tests en 3 archivos. |
| **carga-horas-ui — Validación de frontera** | PASS | `esquemas.ts:80-83` + `FormularioHora.tsx:25-35`. |
| Horas cero | PASS | `esquemas.test.ts:57-65`; `SeccionHoras.test.tsx:63-77`. |
| Horas negativas | **PASS (antes FAIL)** | `esquemas.test.ts:47-55`; `SeccionHoras.test.tsx:79-92`; verificación directa del esquema. |
| Reintento tras corregir | PASS | `FormularioHora.tsx:32-38` limpia el error al guardar correctamente (ver SUGGESTION-2). |
| **edicion-horas-ui — Listado editable** | PASS | `SeccionHoras.tsx:68-87`; orden heredado del backend. |
| Listado con partes existentes | **PASS (antes PARTIAL)** | `SeccionHoras.tsx:73-75`; `SeccionHoras.test.tsx:132-138`. |
| Listado vacío | PASS | `SeccionHoras.tsx:69`; test `:50-61`. |
| **edicion-horas-ui — Edición con recálculo visible** | PASS | `SeccionHoras.tsx:110-114`; `useHoras.ts:38-45`; test `:189-213`. |
| **edicion-horas-ui — Eliminación con confirmación** | PASS | `SeccionHoras.tsx:37,77-84,89-101`; tests `:148-187`. |
| Falla al eliminar | **PASS (antes FAIL)** | Error accionable, fila conservada y reintento verificados. |
| **detalle-op-ui — Ruta de detalle mínima** | PASS | `DetalleOpPage.tsx:22-73`; `DetalleOpPage.test.tsx:37-66`. |
| Sin derivados calculados en la vista | PASS | `DetalleOpPage.tsx:52-58`; guardian `SeccionHoras.test.tsx:59-60`. |
| **detalle-op-ui — Acceso a la edición** | PASS | `DetalleOpPage.tsx:71`; `TarjetaOrden.test.tsx:32-35`. |
| **detalle-op-ui — Alcance deliberado** | PASS | Sin analítica/exportación/edición de etapas o materiales; gestiona horas (spec modificado). |
| **dto-derivados-orden** (todos los escenarios) | PASS | Sin cambios desde la verificación anterior: dominio, esquemas back/front y APIs 50/50. |
| **tablero-grilla-tarjetas** (todos los escenarios) | PASS | Sin cambios regresivos; `TarjetaOrden.test.tsx` 5/5. |

### Verificación de preguntas abiertas

| Pregunta | Resultado | Evidencia |
|---|---|---|
| OQ-1=A — totales en `TarjetaOrdenDTO`/listado desde dominio | CUMPLIDA | Sin cambios; `listarOps.ts`, `obtenerOp.ts` y `tarjeta.ts` desde dominio. |
| OQ-2=A — tarjeta navega al detalle con intención de abrir modal | CUMPLIDA | `DetalleOpPage.tsx:13,59`; `DetalleOpPage.test.tsx:55-59`. |
| OQ-3 — campos expuestos | CUMPLIDA | `horasVendidasTotales`/`horasRealesTotales` presentes en tarjeta y detalle. |

### Design Coherence

| Decisión | Estado | Detalle |
|---|---|---|
| D1 — totales derivados en `TarjetaOrdenDTO` desde dominio | FOLLOWED | Sin cambios. |
| D2 — horas en detalle + disparador desde tarjeta | FOLLOWED | Sin cambios. |
| D3 — mutaciones TanStack con invalidación dirigida | FOLLOWED | `useHoras.ts:19-53`; sin optimismo de derivados. |
| D4 — validación de frontera con Zod | **FOLLOWED (antes PARCIAL)** | Mensaje de positividad separado del formato; backend sigue siendo autoridad. |
| D5 — componentes presentacionales y pruebas | **FOLLOWED (antes DEVIATED)** | Cobertura de fecha, etapa/observación y fallo de DELETE añadida. |

### Guardianes

| Guardián | Resultado | Evidencia |
|---|---|---|
| R9 — sin `any` | OK | Sin coincidencias de `any` en `frontend/src/features/ordenes`; tipado explícito de `etapas` en `FormularioHora.test.tsx:6`. Persisten `as any` preexistentes en tests de backend no tocados. |
| R3 — sin derivados persistidos | OK | Sin columnas de totales en `backend/prisma` (búsqueda en `.prisma`/`.sql` sin resultados). |
| R2 / RN-GLOBAL-02 — dominio puro, sin cálculo en React | OK | `new Date()` aparece sólo en `fechaCalendario.ts:9` (helper puro de frontera) y en tests; `SeccionHoras.tsx` y `FormularioHora.tsx` sin `calcular|toFixed|reduce(`. |
| R5 — sin auth/PIN/RBAC | OK | Sin coincidencias en `frontend/src/features/ordenes`. |
| R6 — sin Excel | OK | Sin `exceljs`/`.xlsx` en el feature. |
| R10 — sin mocks de PostgreSQL | OK en tests del change | Tests de UI con `fetch` simulado y suites de backend con BD real; el cambio no tocó adaptadores de persistencia. |

### TDD Compliance

| Check | Resultado | Detalles |
|---|---|---|
| Evidencia TDD reportada | ✅ | `apply-progress.md` con tabla de 18 filas; 12 archivos de test referenciados existen en disco. |
| Todas las tareas have tests | ✅ | 9/9 tareas de apply con código + 8/8 filas de fix con test; 2 tareas de verificación sin código. |
| RED confirmado (tests existen) | ⚠️ | 8/8 filas `VALIDADO AHORA` con fallo RED documentado y archivo existente; 9 filas de apply marcadas `RECONSTRUIDO` (RED no presenciado, declarado explícitamente). |
| GREEN confirmado (tests pasan) | ✅ | 39/39 en los 7 archivos del change, 156/156 en frontend completo, 54/54 en dominio, 50/50 en backend relevante. |
| Triangulación adecuada | ✅ | Fecha: 2 fechas + reloj simulado; horas: `-1`, `-0.01`, `0`, `abc`; etapa/observación: presentes y ausentes; DELETE: fallo y reintento. |
| Safety Net para archivos modificados | ⚠️ | Baseline documentada (26/26 frontend, 54/54 domain) ejecutada antes de los fixes; la del apply original es `RECONSTRUIDO`. |

**TDD Compliance**: 4/6 ✅ y 2/6 ⚠️ por limitación histórica declarada, **0 checks CRITICAL**. Se acepta el formato `RECONSTRUIDO`/`VALIDADO AHORA` en lugar de los literales `✅ Written`/`✅ Passed`: es más honesto marcar lo no observado que afirmar ✅ históricos sin evidencia, y cumple la exigencia del módulo de una tabla verificable.

### Test Layer Distribution (tests nuevos/modificados del change)

| Layer | Tests | Archivos | Herramienta |
|---|---:|---:|---|
| Unit | 21 (+ dominio) | 4 (+ 1) | Vitest (`esquemas`, `horas`, `fechaCalendario`, `mensajeErrorEliminar`, `tarjeta`) |
| Integration (componente/hook) | 27 | 5 | Vitest + Testing Library + React Query |
| Integration (HTTP/API) | 50 | 8 | Vitest + Fastify `app.inject` + BD real |
| E2E | 0 | 0 | No aplica |
| **Total ejecutado en esta pasada** | **260** | **20+** | `54 + 156 + 50` |

No se detectaron tests con herramientas fuera de las capacidades declaradas. No se marca SUGGESTION de capa: la lógica crítica de negocio ya tiene tests puros en dominio y validación HTTP.

### Changed File Coverage

Coverage analysis skipped: no hay provider de cobertura configurado en los scripts ni dependencia directa (`@vitest/coverage-v8` sólo transitivo en `package-lock.json`). No se marca como fallo.

### Assertion Quality

| Archivo | Línea | Aserción | Problema | Severidad |
|---|---:|---|---|---|
| `frontend/src/shared/domain-client/horas.test.ts` | 78 | `expect(ErrorApi).toBeDefined()` | Verificación trivial de existencia de un import; redundante frente a `rejects.toMatchObject` de `:74`. | WARNING |
| `frontend/src/features/ordenes/components/SeccionHoras.test.tsx` | 75 | `expect(dialogo).toBeDefined()` | Redundante: `dialogo` ya viene de `findByRole`. | SUGGESTION |
| `frontend/src/features/ordenes/DetalleOpPage.test.tsx` | 58 | `expect(await screen.findByRole(...)).toBeDefined()` | Redundante: `findByRole` ya falla si no existe. | SUGGESTION |
| `frontend/src/features/tablero/components/TarjetaOrden.test.tsx` | 29 | `expect(screen.getByTestId('barra-horas')).toBeDefined()` | Aserción de existencia sin comportamiento; la línea 28 ya valida el contenido del DTO. | SUGGESTION |

No se encontraron tautologías, aserciones sin código de producción, ni loops vacíos: el `for` de `esquemas.test.ts:48` itera un literal no vacío y todas las aserciones de mensaje pasan por `safeParse`. Las aserciones `readFileSync` + regex son acoplamiento a código fuente, pero responden a escenarios explícitos de los specs (guardianes RN-GLOBAL-02), por lo que no se penalizan.

**Assertion quality**: 0 CRITICAL, 1 WARNING, 3 SUGGESTION.

### Quality Metrics

**Linter**: ➖ no disponible (sin script ni configuración de lint en el repo).  
**Type Checker**: ✅ `npm run typecheck` sin errores en los tres workspaces.

### Summary

- **CRITICAL abiertos**: ninguno. CRITICAL-1 a CRITICAL-5 verificados como **RESUELTOS** con evidencia en código y tests ejecutados.
- **WARNING-1**: el apply original no dejó log por task; 9 filas de la tabla TDD son `RECONSTRUIDO`. El artefacto lo declara explícitamente, por lo que no es una falsificación ni bloquea el archive.
- **WARNING-2**: un negativo con más de dos decimales (p. ej. `-0.001`) produce primero el issue de formato y recién después `las horas deben ser mayores a cero`; `FormularioHora.tsx:33` muestra `issues[0]`, así que ese caso límite muestra “número decimal válido”. El envío sigue bloqueado y `-1`/`-0.01`/`0` sí muestran el mensaje exigido. No bloquea: es un matiz del escenario no cubierto por el fix ni por los tests.
- **WARNING-3**: suite completa de backend no re-ejecutada en esta pasada; 50/50 tests de las suites relevantes OK. Fixes son frontend-only.
- **WARNING-4**: aserción trivial `expect(ErrorApi).toBeDefined()` en `horas.test.ts:78`.
- **SUGGESTION-1**: la etapa se muestra como UUID crudo (`SeccionHoras.tsx:74`); el componente ya recibe `etapas` con `nombre`, por lo que podría mostrar el nombre legible sin cálculo de negocio.
- **SUGGESTION-2**: el error de validación se limpia recién tras un guardado exitoso (`FormularioHora.tsx:38`); corregir el campo sin guardar deja el mensaje visible.
- **SUGGESTION-3**: modal con `<div role="dialog">` sin focus trap ni cierre con Escape; `design.md:75` lo sugería como mitigación de accesibilidad.
- **SUGGESTION-4**: `barra-horas` sigue siendo un `<div>` sin ancho proporcional; el texto del DTO cumple el spec, pero la barra no comunica consumo visualmente.
- **SUGGESTION-5**: `FormularioHora.tsx:20,30` convierte observación vacía en `undefined`, por lo que no se puede limpiar ese campo al editar aunque el puerto backend acepta `null`.
- **SUGGESTION-6**: limpiar los `as any` preexistentes en tests de backend no tocados por C-09.

**Veredicto**: **READY FOR ARCHIVE**. Los cinco bloqueadores fueron corregidos con evidencia TDD verificable, los specs delta relevantes pasan y no hay regresiones en las 260 ejecuciones de tests realizadas. Los ítems restantes son WARNING/SUGGESTION y no bloquean según las reglas de la skill.
