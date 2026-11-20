## 1. Preparación: runner de dominio y andamiaje (RED)

- [x] 1.1 Verificar el punto de partida: C-02 archivado, tipos de `packages/domain/src/{configuracion,ordenes,etapas}/` presentes, `openspec list --json` sin changes activos además de este y `CHANGES.md` con C-03 en `[ ]`
- [x] 1.2 Crear `packages/domain/vitest.config.ts` con `environment: 'node'` e `include: ['src/**/*.test.ts']`, agregar `vitest` 5.1.1 a `devDependencies` y el script `"test": "vitest run"` en `packages/domain/package.json`, sin modificar `backend/vitest.config.ts` (D7)
- [x] 1.3 Escribir el test de smoke fallido que importa `calcularAvance`, `etapaAhora`, `agruparFlujo`, `calcularSemaforo`, `diasRestantes` y el constructor del DTO desde `@velco/domain`; ejecutar `npm test -w @velco/domain` y confirmar RED por imports inexistentes (R1)
- [x] 1.4 Crear los fixtures tipados reutilizables de `OrdenTrabajo`, `EtapaOrden` y `Configuracion` con `hoy`, `zonaHoraria` y umbrales fijos, sin `any` ni aserciones de tipo que callen errores (R9); ejecutar la suite y confirmar que el único fallo sigue siendo el de los imports

## 2. Avance derivado — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 2.1 RED: escribir el test de 5 etapas con 2 completadas ⇒ avance `40`, referenciado a RN-AVANCE-01; ejecutar `npm test -w @velco/domain` y confirmar que falla
- [x] 2.2 GREEN: implementar `calcularAvance` en `packages/domain/src/ordenes/` con `Math.round(100 * completadas / total)` sobre `EtapaOrden.completada`; ejecutar la suite hasta que pase
- [x] 2.3 TRIANGULATE: agregar los casos de todas completadas ⇒ `100` (RN-AVANCE-02), lista vacía ⇒ `0` (RN-GLOBAL-03) y redondeo de 1/3 ⇒ `33`; ejecutar la suite en cada caso
- [x] 2.4 REFACTOR: extraer el helper de conteo sin tocar las aserciones y ejecutar la suite completa de dominio

## 3. Etapa `ahora` — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 3.1 RED: escribir el test de la primera pendiente por `orden_secuencia` (RN-AHORA-01); ejecutar la suite y confirmar que falla
- [x] 3.2 GREEN: implementar `etapaAhora` ordenando por `ordenSecuencia` y devolviendo la primera con `completada = false`; ejecutar la suite hasta que pase
- [x] 3.3 TRIANGULATE: agregar el caso con el arreglo desordenado y el caso de todas completadas ⇒ `Todo listo` (RN-AHORA-01); ejecutar la suite en cada caso
- [x] 3.4 REFACTOR: unificar la comparación de secuencia con el helper de etapas sin cambiar aserciones y ejecutar la suite

## 4. Flujo agrupado — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 4.1 RED: escribir el test que agrupa dos OPs activas en `Soldadura` y una en `Pintura` (RN-FLujo-01); ejecutar la suite y confirmar que falla
- [x] 4.2 GREEN: implementar `agruparFlujo` sobre `etapaAhora`, devolviendo `{ etapa, cantidad }[]`; ejecutar la suite hasta que pase
- [x] 4.3 TRIANGULATE: agregar los casos de exclusión de OP terminada y OP sin etapas (HU-06 CA) y el de orden estable con entradas permutadas; ejecutar la suite en cada caso
- [x] 4.4 REFACTOR: extraer el helper de normalización de conteos sin tocar aserciones y ejecutar la suite

## 5. Fecha calendaria y días restantes — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 5.1 RED: escribir el test de `diasRestantes` con `hoy` fijo, `zonaHoraria` inyectada y fecha a 3 días ⇒ `3` (RN-SEMAFORO-06); ejecutar la suite y confirmar que falla
- [x] 5.2 GREEN: implementar la conversión a `YYYY-MM-DD` con `Intl.DateTimeFormat` y `formatToParts` en la zona recibida, sin `Date.parse` ni aritmética de milisegundos; ejecutar la suite hasta que pase
- [x] 5.3 TRIANGULATE: agregar los casos `Vence hoy` ⇒ `0`, `Pasó hace 2 días` ⇒ `-2`, etiqueta `Terminado` y el mismo instante en dos zonas con resultado distinto (SU-05); ejecutar la suite en cada caso
- [x] 5.4 REFACTOR: aislar el helper de fecha calendaria sin tocar aserciones y ejecutar la suite

## 6. Semáforo y prioridad — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 6.1 RED: escribir el test de OP terminada con fecha vencida ⇒ `Terminado` (RN-SEMAFORO-01/05); ejecutar la suite y confirmar que falla
- [x] 6.2 GREEN: implementar `calcularSemaforo` en `packages/domain/src/costos/` con retorno anticipado en el orden `Terminado` → `Atrasado` → `En riesgo` → `En plazo`, leyendo los umbrales del contexto inyectado; ejecutar la suite hasta que pase
- [x] 6.3 TRIANGULATE: agregar los casos `Atrasado` (RN-SEMAFORO-02), `En riesgo` (RN-SEMAFORO-03), `En plazo` (RN-SEMAFORO-04), límite inclusivo de días, avance `100` con etapa pendiente y cambio de umbrales de 3 a 5 días; ejecutar la suite en cada caso
- [x] 6.4 REFACTOR: simplificar la cadena de decisión manteniendo el orden de prioridad y ejecutar la suite completa

## 7. DTO con derivados — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 7.1 RED: escribir el test que construye el DTO de una OP y exige `avance`, `semaforo`, `diasRestantes`, `etapaAhora` y `etiquetaPlazo` aplanados (RN-GLOBAL-02); ejecutar la suite y confirmar que falla
- [x] 7.2 GREEN: definir el tipo del DTO y la función pura que compone las cuatro reglas anteriores en `packages/domain/src/ordenes/`; ejecutar la suite hasta que pase
- [x] 7.3 TRIANGULATE: agregar los casos de datos mínimos de tarjeta, de ausencia de escritura en base de datos y de import del tipo desde `@velco/domain` sin duplicación; ejecutar la suite en cada caso
- [x] 7.4 REFACTOR: reexportar funciones y tipo desde `packages/domain/src/index.ts`, verificar imports prohibidos y ejecutar la suite

## 8. Deuda del guardián de fundación — RED → GREEN → TRIANGULATE → REFACTOR

- [x] 8.1 RED: ejecutar `npm test -w @velco/backend -- test/fundacion/alcance.test.ts` con las funciones ya presentes y confirmar que falla con el mensaje `calcula un derivado` sobre `packages/domain/src/`; dejar la evidencia del fallo antes de tocar el guardián
- [x] 8.2 GREEN: re-encuadrar `backend/test/fundacion/alcance.test.ts` según D5: retirar el escaneo de `fuentes` de las dos regex de RN y derivados, aplicarlas a los artefactos Markdown del archive de `2026-11-20-velco-mvp-foundation` y ejecutar el archivo hasta que pase
- [x] 8.3 TRIANGULATE: verificar las tres situaciones del guardián —reglas nuevas en fuentes vivas no lo rompen, artefacto archivado con una regla hipotética sí lo rompería (sin editar `openspec/`, por inspección de la ruta y el mensaje de aserción), casos de auth/`.xlsx` y ADR siguen activos— ejecutando el archivo en cada verificación
- [x] 8.4 REFACTOR: renombrar el `describe`/`it` y los mensajes de `expect` para nombrar el alcance archivado, sin `skip`, `todo`, `only`, excepciones en las regex ni tautologías; ejecutar el archivo y luego `npm test -w @velco/backend` completo

## 9. Aislamiento y verificación final

- [x] 9.1 Ejecutar `npm run typecheck -w @velco/domain` y `rg -n "from ['\"](fastify|@prisma/client|react|exceljs)" packages/domain/src` con cero resultados
- [x] 9.2 Eliminar temporalmente `backend/src/features/*/{prisma,http,excel}`, ejecutar `npm run typecheck -w @velco/domain` y restaurar los directorios (R2)
- [x] 9.3 Verificar cero `any` en archivos nuevos, cero columnas derivadas, cero auth/PIN/RBAC y cero archivos `.xlsx` nuevos (R3, R5, R6, R9)
- [x] 9.4 Ejecutar `npm test` en la raíz: dominio (puro), fundación con el guardián re-encuadrado y tests de integración de C-02; sin builds ni commits
- [x] 9.5 Ejecutar `openspec validate estado-y-avance-domain --strict` y `openspec status --change estado-y-avance-domain --json`, con los cuatro artefactos en `done` y `isComplete: true`
- [x] 9.6 Confirmar que `CHANGES.md` sigue con `[ ]` en C-03: el checkbox se marca recién al archivar el change (R8)

## 10. Guardián adicional de ubicación de reglas (D8)

- [x] 10.1 RED: crear `backend/test/fundacion/ubicacion-reglas.test.ts` referenciando `definicionesFueraDeDominio`, `definicionesEncontradas`, `citasRnEnProduccion` y `fuentesProduccion` antes de que existan; ejecutar el archivo y evidenciar el fallo
- [x] 10.2 GREEN: implementar el mínimo (regex de definiciones y RN, helpers con `leer` inyectado, `fuentesProduccion` sin tests) y ejecutar el archivo hasta que pase
- [x] 10.3 TRIANGULATE: agregar el segundo caso de los cuatro comportamientos —adaptador `http`, no vacío/no tautología, exclusión explícita de `avance.test.ts` y detección de `calcularMargen`— ejecutando el archivo en cada inserción
- [x] 10.4 REFACTOR: extraer constantes (`DOMINIO`, `FUENTE_PRODUCCION`, `TEST`) y `normalizar`/`esFuenteProduccion` sin tocar aserciones y ejecutar el archivo
- [x] 10.5 Agregar el requirement `Reglas de negocio definidas solo en el dominio` con sus cuatro scenarios al delta `fundacion-testing`, conservando byte-idéntico el requirement existente y validando con `openspec validate --strict`
- [x] 10.6 Registrar D8 en `design.md` y actualizar la nota de trazabilidad para que diga que el guardián quedó creado como D8
- [x] 10.7 Verificación final: suite completa de backend, typecheck de los tres workspaces, validate y status del change, diff de `alcance.test.ts`, `git status --short` y comprobación de que `calcularMargen` sigue ausente en fuentes vivas

## 11. Corrección del guardián de ubicación: definiciones const/arrow y citas RN

- [x] 11.1 RED: agregar en `backend/test/fundacion/ubicacion-reglas.test.ts` el caso con `leer` inyectado que devuelve `const calcularMargen = (op) => op.total;` para una ruta de adaptador y esperar que sea reportado; ejecutar el archivo y confirmar el fallo
- [x] 11.2 GREEN: ampliar la regex de definiciones para cubrir `function nombre(` y `const|let|var nombre =` con arrow, factorizando el alternador de nombres en una constante; ejecutar el archivo hasta que pase
- [x] 11.3 TRIANGULATE: agregar el caso de `const calcularAvance = (etapas) => ...` bajo `packages/domain/src/` (detectado pero no reportado), el caso sin falsos positivos con `import { calcularSemaforo }`, `export { calcularSemaforo }` y `const avance = calcularAvance(etapas)` en un adaptador, y el caso que detecta las cinco definiciones reales; ejecutar tras cada inserción
- [x] 11.4 REFACTOR: extraer `nombresDefinidos` sobre el patrón compartido sin tocar aserciones, quitar el conteo `21` del mensaje del test y de D8 en `design.md`, ajustar el scenario "Definición en un adaptador" del delta `fundacion-testing` a ambas sintaxis y verificar suite completa, typecheck, `validate --strict` y SHA256 de `alcance.test.ts`
