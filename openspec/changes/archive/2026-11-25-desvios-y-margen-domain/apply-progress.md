# Apply progress — desvios-y-margen-domain

Ejecutado en `C:\Users\navar\OneDrive\Documentos\GitHub\Software-de-Seguimiento-Velco-`. Sin build, commit, push ni PostgreSQL. Todos los comandos se ejecutaron desde la raíz salvo los `npx vitest` de `packages/domain`, indicados con su workdir.

## Grupo 1 — Decimal exacto en el dominio

| Fase | Comando / evidencia | Resultado |
|---|---|---|
| Safety net | `npm test -w @velco/domain` | 13 archivos, 61 tests |
| RED | `npx vitest run src/decimal/operaciones.test.ts` (en `packages/domain`) | `Cannot find module './operaciones.ts'` |
| GREEN | ídem | 1 archivo, 8 tests |
| TRIANGULATE | mismos tests: negativos, cero, ceros a la derecha, escala 4 y reutilización de `calcularConsumoHoras` | 8 tests, sin reimplementar la fórmula |
| REFACTOR | `npm run typecheck -w @velco/domain` | sin salida; exportado desde `packages/domain/src/index.ts` |

Errores resueltos durante RED/GREEN: signo duplicado (`'--1.00'`) y `TypeError: fraccionOriginal.slice(...).some is not a function`.

## Grupo 2 — Comparativa por etapa

| Fase | Comando / evidencia | Resultado |
|---|---|---|
| Safety net | `npx vitest run src/horas/reglas.test.ts src/etapas/horas-vendidas.test.ts` | 2 archivos, 16 tests |
| RED | `npx vitest run src/horas/comparativa.test.ts` | `Cannot find module './comparativa.ts'` |
| GREEN | ídem | 1 archivo, 8 tests |
| TRIANGULATE | mismos tests: etapa sin partes, límite estricto de 15, reales > vendidas y OP vacía | 8 tests |
| REFACTOR | grep sobre `packages/domain/src/horas/comparativa.ts` + `npm run typecheck -w @velco/domain` | sin fórmulas duplicadas; typecheck sin salida |

C-08 intacto: `packages/domain/src/horas/reglas.ts` y su spec no se modificaron.

## Grupo 3 — Costos de materiales y margen real

| Fase | Comando / evidencia | Resultado |
|---|---|---|
| Safety net | `npx vitest run src/materiales/agregados.test.ts` | 1 archivo, 2 tests |
| RED | `npx vitest run src/margen/reglas.test.ts` | `Cannot find module './reglas.ts'` |
| GREEN | ídem | 1 archivo, 9 tests |
| TRIANGULATE | `npx vitest run src/materiales/agregados.test.ts src/margen/reglas.test.ts` | RED previo: `expected '12.30' to be '12.3450'`; final 2 archivos, 12 tests |
| REFACTOR | imports del módulo + `npm run typecheck -w @velco/domain` | sin Prisma/Fastify/React/exceljs; typecheck sin salida |

`calcularAgregadosMateriales` delega en `costoMaterialesCotizado` y `costoMaterialReal`; `SU-02` conserva cuatro decimales.

## Grupo 4 — Modelo de planilla compartido

| Fase | Comando / evidencia | Resultado |
|---|---|---|
| Safety net | `npm test -w @velco/domain` | 16 archivos, 87 tests |
| RED | `npx vitest run src/exportacion/modelo.test.ts` | `Cannot find module './modelo.ts'` |
| GREEN | ídem | 1 archivo, 6 tests |
| TRIANGULATE | grep en `modelo.ts`: `EXCEL_TEMPLATES_DIR`, `O7:R8`, `J7:N8`, `Buffer` | solo presentes en el test; producción limpia |
| REFACTOR | copia aislada en `%TEMP%\opencode\desvios-y-margen-domain-verify`, adaptadores `http`/`prisma`/`excel` eliminados (count `0`), `npx tsc --noEmit -p ...\tsconfig.json` | sin salida; dominio compila sin adaptadores |

Error corregido: `Property 'incluirMargenes' is missing in type ...`; el fixture del test pasa `incluirMargenes: false`.

## Grupo 5 — DTOs canónicos y transporte

| Fase | Comando / evidencia | Resultado |
|---|---|---|
| Safety net | typechecks de backend y frontend; `npx vitest run test/tablero-read-api/detalleOp.test.ts`; `npx vitest run src/shared/domain-client` | typechecks sin salida; backend 8 tests; frontend 7 archivos, 38 tests |
| RED dominio | `npx vitest run src/ordenes/detalle.test.ts` | `Cannot find module './detalle.ts'` |
| GREEN dominio | ídem | 1 archivo, 2 tests |
| RED backend | `npx vitest run test/tablero-read-api/detalleOp.test.ts -t "C-11 RN-GLOBAL-02"` | `TypeError: Cannot read properties of undefined (reading 'length')`; tras ampliar el esquema, `expected 0 to be greater than 0` por etapas con `ordenId` distinto |
| GREEN backend | `npx vitest run test/tablero-read-api/detalleOp.test.ts` | 9 tests |
| TRIANGULATE backend | `npx vitest run test/tablero-read-api/detalleOp.test.ts -t "C-11"` | 2 tests, 8 omitidos (10 totales) |
| RED frontend | `npx vitest run src/shared/domain-client/esquemas.test.ts -t "C-11 valida"` | `expected undefined to deeply equal [...]` |
| GREEN frontend | `npx vitest run src/shared/domain-client/esquemas.test.ts` | 10 tests |
| TRIANGULATE frontend | `npx vitest run src/shared/domain-client -t "C-11"` | 2 tests, 38 omitidos (40 totales) |
| REFACTOR | grep en `backend/src/features/ordenes/application` y `backend/prisma` | `NO_DERIVED_CALCULATIONS_IN_HANDLERS`, `NO_DERIVED_COLUMNS_IN_MIGRATIONS`; typechecks sin salida |

El handler conserva literalmente `construirTarjetaOrden(... horas.map(` y delega los derivados a `construirDetalleOp`. El esquema de respuesta Fastify se amplió para no recortar los campos nuevos.

## Grupo 6 — Trazabilidad de reglas y regresión

| Fase | Comando / evidencia | Resultado |
|---|---|---|
| RED | `npx vitest run src/testing/cobertura-reglas.test.ts` | 14 tests, 7 fallidos (RN-HORAS-02/03/04/07, RN-MARGEN-04/05/06) |
| GREEN | `npx vitest run src/testing/cobertura-reglas.test.ts src/horas/comparativa.test.ts src/margen/reglas.test.ts src/exportacion/modelo.test.ts` | 4 archivos, 44 tests |
| TRIANGULATE | `npx vitest run src/testing/cobertura-reglas.test.ts` | 15 tests; verifica IN-02, umbral 15 y nombres únicos de C-08 |
| REFACTOR | `npm test -w @velco/domain` + 3 typechecks | 19 archivos, 117 tests; typechecks sin salida |

Se corrigió el título compuesto `RN-HORAS-01/02/03` a `RN-HORAS-01, RN-HORAS-02 y RN-HORAS-03` para que cada caso contenga su etiqueta RN completa. No se agregó lógica de producción en este grupo.

## Grupo 7 — Verificación del change

| Verificación | Comando | Resultado |
|---|---|---|
| Dominio | `npm test -w @velco/domain` | 19 archivos, 117 tests |
| Typecheck dominio | `npm run typecheck -w @velco/domain` | sin salida |
| Typecheck backend | `npm run typecheck -w @velco/backend` | sin salida |
| Typecheck frontend | `npm run typecheck -w @velco/frontend` | sin salida |
| Backend tablero | `npx vitest run test/tablero-read-api` | 9 archivos, 67 tests |
| Backend configuración | `npx vitest run test/configuracion-global` | 5 archivos, 20 tests |
| Backend horas | `npx vitest run test/horas-reales-api` | 6 archivos, 20 tests |
| Frontend completo | `npm test -w @velco/frontend` | 46 archivos, 176 tests |
| Validación estricta | `openspec validate desvios-y-margen-domain --strict` | `Change 'desvios-y-margen-domain' is valid` |
| Delta specs | `openspec status --change desvios-y-margen-domain --json` + grep de encabezados | 5 specs con `## ADDED Requirements`, sincronizables; no sincronizadas ni archivadas aún |

Durante la verificación frontend aparecieron 3 fallos en `escribirOps.test.ts` por un fixture sin los campos nuevos; se corrigió el fixture y la suite completa quedó en 176/176. No se inició PostgreSQL ni se corrió build.

## Estado final

- 27/27 tareas marcadas `[x]` en `tasks.md`.
- C-08, specs main, `CHANGES.md`, `AGENTS.md`, `CLAUDE.md` y roadmap sin cambios.
- Sin commit ni push. Siguiente paso: `/opsx:verify` y, tras aprobación, archivar el change y sincronizar specs.

## Correcciones post-verify (2026-11-24)

Alcance aprobado: F-01 (CRITICAL), F-02 (MEDIUM) y el LOW de la constante del umbral. Fuera de alcance: el MEDIUM pre-existente de C-06 sobre las dos implementaciones de `calcularHorasVendidasTotales` (F-03 del verify-report). No se modificaron `design.md`, specs, `tasks.md`, `verify-report.md`, `CHANGES.md`, `AGENTS.md` ni `CLAUDE.md`. Sin build, commit, push ni PostgreSQL.

| Corrección | Test File | Layer | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|
| F-01 — filtrar costos de la operativa | `packages/domain/src/exportacion/modelo.test.ts` | Unit (dominio puro) | `AssertionError: expected [ 'descripcion', 'cantidad', …(2) ] to deeply equal [ 'descripcion', 'cantidad' ]`; `Tests  1 failed \| 7 passed (8)` | `MaterialOperativoModeloPlanilla` + mapeo en la rama operativa; `Tests  8 passed (8)` | Materiales vacíos, varios materiales, tasa 0 con materiales y switch exhaustivo; `Tests  12 passed (12)` | Helper genérico `camposComunes` conserva el orden de claves; typecheck sin salida |
| F-02 — matriz no tautológica | `packages/domain/src/testing/cobertura-reglas.test.ts` | Unit (verificación de tests reales) | `RN-MARGEN-03 tiene al menos dos casos reales etiquetados` → `AssertionError: expected 1 to be greater than or equal to 2`; `Tests  1 failed \| 15 passed (16)` | Etiqueta real corregida en `margen/reglas.test.ts`; `Tests  16 passed (16)` | Control negativo en copia temporal: al renombrar la etiqueta vuelve el mismo fallo; repo intacto | `Set` de títulos distintos, sin `any`, `readFileSync`/URL solo en el test; typecheck sin salida |
| LOW — constante del umbral | `packages/domain/src/testing/cobertura-reglas.test.ts` | Unit (documentación del dominio) | `AssertionError: expected undefined to be 15 // Object.is equality` | `UMBRAL_DESVIO_PORCENTAJE = 15` en `horas/umbral.ts`, reexportado desde `index.ts`; `Tests  30 passed (30)` en los dos archivos dirigidos | `expect(alerta.avance + dominio.UMBRAL_DESVIO_PORCENTAJE).toBe(95)` y frontera `95.00`/`95.01` sin alerta/con alerta | Sin inyección en `horas/reglas.ts`; typecheck sin salida |

### Evidencia literal de correcciones

| Comando (workdir) | Resultado literal / extracto exacto |
|---|---|
| `npx vitest run src/exportacion/modelo.test.ts` (`packages/domain`, RED F-01) | `AssertionError: expected [ 'descripcion', 'cantidad', …(2) ] to deeply equal [ 'descripcion', 'cantidad' ]`; `Test Files  1 failed (1)`; `Tests  1 failed \| 7 passed (8)`; `Duration  629ms` |
| `npx vitest run src/exportacion/modelo.test.ts` (`packages/domain`, GREEN F-01) | `Test Files  1 passed (1)`; `Tests  8 passed (8)`; `Duration  422ms` |
| `npx vitest run src/exportacion/modelo.test.ts` (`packages/domain`, TRIANGULATE F-01) | `Test Files  1 passed (1)`; `Tests  12 passed (12)`; `Duration  557ms` |
| `npx vitest run src/testing/cobertura-reglas.test.ts` (`packages/domain`, RED F-02) | `× RN-MARGEN-03 tiene al menos dos casos reales etiquetados`; `AssertionError: expected 1 to be greater than or equal to 2`; `Tests  1 failed \| 15 passed (16)`; `Duration  773ms` |
| `npx vitest run src/testing/cobertura-reglas.test.ts` (`packages/domain`, GREEN F-02) | `Test Files  1 passed (1)`; `Tests  16 passed (16)`; `Duration  476ms` |
| `& '...\node_modules\.bin\vitest.cmd' run src/testing/cobertura-reglas.test.ts` (`%TEMP%\opencode\desvios-y-margen-domain-f02-negativo\packages\domain`, línea base) | `Test Files  1 passed (1)`; `Tests  16 passed (16)`; `Duration  1.07s` |
| ídem tras renombrar `RN-MARGEN-03` a `MARGEN-03` en la copia | `AssertionError: expected 1 to be greater than or equal to 2`; `Test Files  1 failed (1)`; `Tests  1 failed \| 15 passed (16)`; `Duration  1.08s` |
| `npx vitest run src/testing/cobertura-reglas.test.ts` (`packages/domain`, RED LOW) | `AssertionError: expected undefined to be 15 // Object.is equality`; `Tests  1 failed \| 15 passed (16)`; `Duration  608ms` |
| `npx vitest run src/testing/cobertura-reglas.test.ts src/horas/reglas.test.ts` (`packages/domain`, GREEN + TRIANGULATE LOW) | `Test Files  2 passed (2)`; `Tests  30 passed (30)`; `Duration  562ms` |
| `npm run typecheck -w @velco/domain` | `> tsc --noEmit -p tsconfig.json`; sin salida de errores (tras cada fase) |

`packages/domain/tsconfig.json` fija `types: []`, así que el test que lee archivos lleva `/// <reference types="node" />`; no se cambió la configuración ni se importó `node:fs` en producción.

### Verificación final literal

| Comando (workdir) | Resultado literal |
|---|---|
| `npx vitest run` (`packages/domain`) | `Test Files  19 passed (19)`; `Tests  122 passed (122)`; `Duration  4.18s` |
| `npm run typecheck -w @velco/domain` (raíz) | `> @velco/domain@0.1.0 typecheck` / `> tsc --noEmit -p tsconfig.json`; sin salida de errores |
| `npm run typecheck -w @velco/backend` (raíz) | `> @velco/backend@0.1.0 typecheck` / `> tsc --noEmit -p tsconfig.json`; sin salida de errores |
| `npm run typecheck -w @velco/frontend` (raíz) | `> @velco/frontend@0.1.0 typecheck` / `> tsc --noEmit -p tsconfig.json`; sin salida de errores |
| `openspec validate desvios-y-margen-domain --strict` (raíz) | `Change 'desvios-y-margen-domain' is valid` |
| `git diff -- packages/domain/src/horas/reglas.ts packages/domain/src/etapas/horas-vendidas.ts openspec/specs CHANGES.md AGENTS.md CLAUDE.md openspec/changes/desvios-y-margen-domain/{verify-report.md,tasks.md,design.md,specs}` | `SIN_SALIDA` |

`git status --short` al cierre: los 13 archivos `M` pre-existentes más las rutas `??` del change; se agregó `packages/domain/src/horas/umbral.ts` dentro de `packages/domain/src/horas/`. No aparece como modificado `horas/reglas.ts`, `etapas/horas-vendidas.ts`, `openspec/specs/**`, `CHANGES.md`, `AGENTS.md`, `CLAUDE.md`, `verify-report.md`, `tasks.md` ni `design.md`. Sin build, commit ni push.

Engram actualizado con `topic_key: opsx/desvios-y-margen-domain/apply`. **Next step: re-verify independiente; queda pendiente.**
