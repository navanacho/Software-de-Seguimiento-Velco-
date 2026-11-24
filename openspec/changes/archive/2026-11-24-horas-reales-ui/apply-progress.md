## Apply Progress: horas-reales-ui

**Change**: `horas-reales-ui` (C-09)  
**Schema**: `spec-driven`, 17/17 tareas completas en `tasks.md`  
**Estado**: 5 CRITICAL del `verify-report.md` corregidos con TDD estricto (R1).

### Criterio de evidencia

- **RECONSTRUIDO**: inferido de los artefactos finales, los tests existentes y la memoria de sesión. NO se observó la ejecución del ciclo en esta sesión; por eso RED/REFACTOR del apply original no se afirman como hechos presenciados.
- **VALIDADO AHORA**: comando ejecutado en esta sesión, con resultado capturado. Los números de tests corresponden a ejecuciones reales documentadas más abajo.

No se inventaron resultados históricos. La memoria disponible (`OPSX: apply completado para horas-reales-ui`, 2026-11-24) registra el estado final y los resultados agregados, pero no un log por task de RED→GREEN→TRIANGULATE.

### Safety net de esta sesión (antes de tocar código)

| Comando | Resultado |
|---|---|
| `npm test -w @velco/frontend -- --run src/features/ordenes/components/SeccionHoras.test.tsx src/features/ordenes/hooks/useHoras.test.tsx src/shared/domain-client/esquemas.test.ts src/shared/domain-client/horas.test.ts src/features/ordenes/DetalleOpPage.test.tsx` | 5 archivos, 26/26 tests OK |
| `npm test -w @velco/domain -- --run` | 12 archivos, 54/54 tests OK |

No había fallos preexistentes en esos archivos; no fue necesario detenerse.

### TDD Cycle Evidence

| Task / CRITICAL | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| Apply 1.2 — totales en dominio | `packages/domain/src/ordenes/tarjeta.test.ts` | Unit | RECONSTRUIDO (no verificable históricamente) | RECONSTRUIDO: tests con/sin partes presentes en el estado final; RED no observado | RECONSTRUIDO + VALIDADO AHORA: `npm test -w @velco/domain -- --run` → 54/54 | RECONSTRUIDO: casos con partes y sin partes en el archivo final | RECONSTRUIDO: no hay registro del paso; estado final pasa guardianes |
| Apply 1.3/1.4 — esquemas y API | `frontend/src/shared/domain-client/esquemas.test.ts`; `backend/test/tablero-read-api/listarOps.test.ts`; `backend/test/tablero-read-api/detalleOp.test.ts` | Unit / HTTP integration | RECONSTRUIDO | RECONSTRUIDO: tests de contrato presentes; RED no observado | RECONSTRUIDO: verify-report registró 30/30 backend y 139/139 frontend | RECONSTRUIDO: tarjeta con/sin horas y detalle con partes | RECONSTRUIDO: sin registro; sin derivados persistidos verificado en verify-report |
| Apply 2.1/2.3 — cliente HTTP de horas | `frontend/src/shared/domain-client/horas.test.ts` | Unit (HTTP boundary) | RECONSTRUIDO | RECONSTRUIDO: casos 422/404 y validación presentes; RED no observado | VALIDADO AHORA en el refactor de CRITICAL-5: 3 archivos, 21/21 | RECONSTRUIDO: POST/PATCH/DELETE y 422 | RECONSTRUIDO: sin registro; archivo sin cambios en estos fixes salvo herencia de esquema |
| Apply 2.2/2.3 — hooks TanStack Query | `frontend/src/features/ordenes/hooks/useHoras.test.tsx` | Hook / integration | RECONSTRUIDO | RECONSTRUIDO: casos de invalidación y errores presentes; RED no observado | VALIDADO AHORA junto a CRITICAL-4: 3 archivos, 17/17 | RECONSTRUIDO: éxito, 422 y 404 | RECONSTRUIDO: sin registro; hook sin cambios en estos fixes |
| Apply 3.1/3.4 — sección Horas | `frontend/src/features/ordenes/components/SeccionHoras.test.tsx` | Component | RECONSTRUIDO | RECONSTRUIDO: tests de listado/vacío/alta/edición/borrado presentes; RED no observado | VALIDADO AHORA: ver filas de CRITICAL-2/3/4/5 | RECONSTRUIDO: vacío vs. con partes | RECONSTRUIDO: sin registro; componente modificado solo por los CRITICAL |
| Apply 3.2/3.4 — modal de carga | `frontend/src/features/ordenes/components/SeccionHoras.test.tsx` | Component | RECONSTRUIDO | RECONSTRUIDO: casos de validación y alta presentes; RED no observado | VALIDADO AHORA: 17/17 en la suite combinada | RECONSTRUIDO: válido vs. inválido | RECONSTRUIDO: sin registro;fecha precargada se agregó como CRITICAL-2 |
| Apply 3.3/3.4 — edición y borrado | `frontend/src/features/ordenes/components/SeccionHoras.test.tsx`; `frontend/src/features/ordenes/hooks/useHoras.test.tsx` | Component / hook | RECONSTRUIDO | RECONSTRUIDO: casos de edición y borrado exitosos presentes; RED no observado | VALIDADO AHORA: 17/17 | RECONSTRUIDO: edición y borrado exitosos | RECONSTRUIDO: feedback de fallo de DELETE se agregó como CRITICAL-4 |
| Apply 4.1/4.3 — barra de horas en tarjeta | `frontend/src/features/tablero/components/TarjetaOrden.test.tsx` | Component | RECONSTRUIDO | RECONSTRUIDO: test de barra y guardian presentes; RED no observado | RECONSTRUIDO: verify-report registró frontend 139/139 | RECONSTRUIDO: DTO con horas y sin horas | RECONSTRUIDO: sin registro; sin cambios en estos fixes |
| Apply 4.2 — acción desde tarjeta | `frontend/src/features/ordenes/DetalleOpPage.test.tsx`; `frontend/src/features/tablero/components/TarjetaOrden.test.tsx` | Component / routing | RECONSTRUIDO | RECONSTRUIDO: test de `?accion=cargar-horas` presente; RED no observado | VALIDADO AHORA: 12/12 con `SeccionHoras.test.tsx` tras CRITICAL-3 | RECONSTRUIDO: con y sin query param | RECONSTRUIDO: sin registro; sin cambios en estos fixes |
| Apply 5.1/5.3 — verificación | `verify-report.md` | Verification | N/A (no produce código) | N/A | RECONSTRUIDO: `openspec validate --strict` OK, typecheck OK | N/A | N/A |
| CRITICAL-5 — mensaje de horas negativas (esquema) | `frontend/src/shared/domain-client/esquemas.test.ts` | Unit | VALIDADO AHORA: 26/26 baseline | VALIDADO AHORA RED: 2 tests fallaron (`Invalid string: must match pattern`; `horas debe ser mayor a 0`) | VALIDADO AHORA GREEN: 14/14 (`esquemas` + `SeccionHoras`) | VALIDADO AHORA: `-1`, `-0.01`, `0` y `abc` con expectativas distintas | VALIDADO AHORA: regex izada a `RE_HORAS_PARTE`; 21/21 con `horas.test.ts` |
| CRITICAL-5 — mensaje en UI | `frontend/src/features/ordenes/components/SeccionHoras.test.tsx` | Component | VALIDADO AHORA: misma baseline | VALIDADO AHORA RED: cero y negativo mostraban mensajes incorrectos | VALIDADO AHORA GREEN: 14/14 | VALIDADO AHORA: `0` y `-1`, sin POST en ambos | VALIDADO AHORA: mismo refactor de regex; 21/21 |
| CRITICAL-2 — fecha precargada (helper puro) | `frontend/src/features/ordenes/fechaCalendario.test.ts` | Unit | VALIDADO AHORA: 26/26 baseline | VALIDADO AHORA RED: fallo de resolución de módulo `./fechaCalendario.ts` | VALIDADO AHORA GREEN: 12/12 tras crear el helper | VALIDADO AHORA: dos fechas locales + reloj simulado | VALIDADO AHORA: se extrajo `fechaHoy()`; 12/12 |
| CRITICAL-2 — fecha precargada (formulario) | `frontend/src/features/ordenes/components/FormularioHora.test.tsx` | Component | VALIDADO AHORA: 26/26 baseline | VALIDADO AHORA RED: 2 tests fallaron (`''` vs `2026-11-24`) | VALIDADO AHORA GREEN: 11/11 | VALIDADO AHORA: alta inyectada, edición con fecha propia, reloj simulado | VALIDADO AHORA: reloj movido a `fechaHoy()`; tipado explícito de `etapas` para evitar `any[]` (R9); 12/12 y typecheck OK |
| CRITICAL-2 — propagación desde sección | `frontend/src/features/ordenes/components/SeccionHoras.test.tsx` | Component | VALIDADO AHORA: 26/26 baseline | VALIDADO AHORA RED: input con `''` en el modal | VALIDADO AHORA GREEN: 11/11 | VALIDADO AHORA: mismo día inyectado en alta; edición cubierta en el test del formulario | VALIDADO AHORA: 12/12 tras extraer `fechaHoy()` |
| CRITICAL-3 — etapa y observación del DTO | `frontend/src/features/ordenes/components/SeccionHoras.test.tsx` | Component | VALIDADO AHORA: suite verde tras CRITICAL-2 | VALIDADO AHORA RED: 1 test falló (`Etapa: ...` ausente) | VALIDADO AHORA GREEN: 8/8 | VALIDADO AHORA: parte con ambos campos vs. parte con `etapaId: null`/`observacion: null` | VALIDADO AHORA: `flex-wrap` en `.partes li`; 12/12 con `DetalleOpPage.test.tsx` |
| CRITICAL-4 — mensaje accionable de DELETE (helper) | `frontend/src/features/ordenes/mensajeErrorEliminar.test.ts` | Unit | VALIDADO AHORA: suite verde tras CRITICAL-3 | VALIDADO AHORA RED: fallo de resolución de módulo y 2 aserciones sobre texto ausente | VALIDADO AHORA GREEN: 17/17 tras ajustar el texto a `reintentá` | VALIDADO AHORA: `Error('falla del servidor')` vs. valor `unknown` | VALIDADO AHORA: mensaje unificado con acción de reintento; 17/17 |
| CRITICAL-4 — feedback y conservación de fila | `frontend/src/features/ordenes/components/SeccionHoras.test.tsx` | Component | VALIDADO AHORA: suite verde tras CRITICAL-3 | VALIDADO AHORA RED: 2 tests fallaron (sin `role="alert"`) | VALIDADO AHORA GREEN: 17/17 con helper y hook | VALIDADO AHORA: fallo 500 conserva fila; reintento exitoso la quita | VALIDADO AHORA: clase `.error` para el alert; 17/17 |

### Comandos de GREEN/REFACTOR usados en los fixes

| Comando | Resultado |
|---|---|
| `npm test -w @velco/frontend -- --run src/shared/domain-client/esquemas.test.ts src/features/ordenes/components/SeccionHoras.test.tsx` | 2 archivos, 14/14 tests OK |
| `npm test -w @velco/frontend -- --run src/shared/domain-client/esquemas.test.ts src/features/ordenes/components/SeccionHoras.test.tsx src/shared/domain-client/horas.test.ts` | 3 archivos, 21/21 tests OK |
| `npm test -w @velco/frontend -- --run src/features/ordenes/fechaCalendario.test.ts src/features/ordenes/components/FormularioHora.test.tsx src/features/ordenes/components/SeccionHoras.test.tsx` | 3 archivos, 12/12 tests OK |
| `npm test -w @velco/frontend -- --run src/features/ordenes/components/SeccionHoras.test.tsx src/features/ordenes/DetalleOpPage.test.tsx` | 2 archivos, 12/12 tests OK |
| `npm test -w @velco/frontend -- --run src/features/ordenes/mensajeErrorEliminar.test.ts src/features/ordenes/components/SeccionHoras.test.tsx src/features/ordenes/hooks/useHoras.test.tsx` | 3 archivos, 17/17 tests OK |

### Deviaciones conocidas

- El apply original no dejó un log por task: su evidencia está marcada como RECONSTRUIDO y no como observación directa.
- No se modificaron `proposal.md`, `design.md`, `tasks.md` ni specs: los cinco CRITICAL son correcciones de implementación/evidencia y no cambian requisitos.
- La etapa se renderiza desde `ParteHoraDTO.etapaId` porque el contrato canónico (`packages/domain/src/horas/reglas.ts:1-10`) no expone un nombre de etapa; no se inventó ni calculó un valor nuevo en React.
