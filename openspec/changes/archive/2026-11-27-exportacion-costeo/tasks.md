## 1. SAFETY NET y compuertas de gobernanza (tranche 1)

- [x] 1.1 SAFETY NET: registrar los hashes SHA-256 de `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` y `A - OP-MASTER.xlsx` y un test que falla si cambian; reutilizar `backend/test/excel-template-spike/soporte.ts` sin duplicarlo.
- [x] 1.2 SAFETY NET: ejecutar la suite base y el typecheck antes de tocar código, dejando constancia de cero fallos preexistentes (R1).
- [x] 1.3 BLOQUEANTE Q1: obtener confirmación explícita del usuario en nombre de Velco sobre conservar `exportOp(opId, …)` como caso de uso con I/O y mantener puro el núcleo; sin confirmación no ejecutar las tareas 2.7 ni 4.2.
- [x] 1.4 BLOQUEANTE Q2 RESUELTA: revisar el inventario justificado de `inventario-celdas.md`, derivado en solo lectura de etiquetas y fórmulas de `MASTER COSTEO NUEVO.xlsx`; el usuario confirmó en nombre de Velco el alcance a la hoja `1` (`xl/worksheets/sheet2.xml`), `C7:R7` con `numeroOp` aunque diga `Descripción:`, `TOTAL horas` con solo `horasReales` y el bloque único `B38:R59` con prefijo `[MP]`/`[INSUMOS]`/`[TERCERIZADOS]`; habilita 3.1–3.3 y 3.11–3.17, sin congelar `inventario.ts` hasta la tranche 3.
- [x] 1.5 BLOQUEANTE Q3 RESUELTA: escala 2 y `HALF_UP` confirmadas por el usuario; `horasVendidas` queda solo en el modelo y la comparativa, y la comparativa de `GENERAL` se completa MANUALMENTE fuera del alcance automatizado; habilita 5.4 con firma obligatoria del costeo generado.
- [x] 1.6 RED: test que falla si el change no registra Q1, Q2 y Q3 como resueltas en `design.md` ni mantiene la compuerta manual de C-14 distinta de la de C-13.

## 2. MAP puro, decimales y contrato compartido (tranche 2)

- [x] 2.1 RED: test unitario que exige `mapearModeloACeldas` determinista, sin `Buffer`, sin `fs`, sin rutas y sin literales de celda en `packages/domain/src/exportacion/`.
- [x] 2.2 GREEN: implementar `mapearModeloACeldas` en `backend/src/features/exportacion/excel/mapeo.ts` consumiendo solo claves semánticas de `ModeloPlanilla` y el descriptor de plantilla (R2, R6, R9).
- [x] 2.3 TRIANGULATE: casos con materiales `MP`/`INSUMOS`/`TERCERIZADOS` y sin materiales, verificando cliente, OP, `UN`/`COST. UNIT.`/`COSTO TOTAL`, `TOTAL horas` con `horasReales`, `horasVendidas` solo en modelo/comparativa, valor hora y comparativa.
- [x] 2.4 RED: test de conversión de importes exactos a cadena de celda con escala 2 y regla confirmada en Q3, sin `number`, `parseFloat`, `toNumber`, `Math.round` ni `toFixed`.
- [x] 2.5 GREEN: implementar el formateo decimal en la frontera del adaptador usando `bigint` del módulo decimal; el modelo permanece intacto (RN-MARGEN-05).
- [x] 2.6 TRIANGULATE: `32.8250` → `32.83`, margen `-33.75` con signo y cantidad `1.2345` sin pérdida de escala.
- [x] 2.7 RED: test de contrato compartido que falla si la variante operativa se deriva de un constructor distinto o contiene `margen`, costos o importes.
- [x] 2.8 GREEN/TRIANGULATE: afirmar el mismo `construirModeloPlanilla` para `incluirMargenes: true` y `false`, sin implementar la plantilla ni el endpoint de C-15.
- [x] 2.9 RED: test de aislamiento que elimina todos los adaptadores por feature y compila `packages/domain` (R2).
- [x] 2.10 REFACTOR: extraer el barrel de exportación, tipar todas las firmas sin `any` y reutilizar utilidades de C-13 en lugar de duplicarlas.

## 3. Inventario ampliado, patcher y gate OOXML (tranche 3)

- [x] 3.1 RED: test que falla si el descriptor de costeo solo declara las 12 celdas maestras de `xl/worksheets/sheet2.xml` y no las demás celdas confirmadas en Q2 dentro de esa misma hoja.
- [x] 3.2 GREEN: ampliar `inventario.ts` con las celdas de `sheet2.xml` leídas en modo solo lectura de `MASTER COSTEO NUEVO.xlsx`, conservando las 12 originales y `piezasAutorizadas()`; `sheet1.xml` y `sheet3.xml`..`sheet6.xml` quedan byte-a-byte intactas.
- [x] 3.3 TRIANGULATE: verificar el descriptor con una OP con todos los bloques y con una OP vacía, sin escribir nunca sobre `Docs/FichasExcel/`, las hojas `2`..`5` ni `GENERAL`.
- [x] 3.4 RED: test que falla cuando una celda gobernada no tiene la estructura OOXML esperada y exige fallo antes de devolver `Buffer`.
- [x] 3.5 GREEN: reutilizar `parchearPlantilla` con los valores del MAP sobre una copia temporal, sin introducir un segundo escritor (DD-02).
- [x] 3.6 TRIANGULATE: inyectar una celda ausente y una fórmula `[1]` no neutralizada; la salida no debe producirse.
- [x] 3.7 RED: test de `compararConDiffControlado` sobre la salida real de costeo que falla si aparece una celda no declarada.
- [x] 3.8 GREEN: integrar el gate por hash, el inventario `[1]` 12 → 0 y la lectura con `exceljs` solo para verificación.
- [x] 3.9 TRIANGULATE: mutar `xl/externalLinks/externalLink1.xml`, `xl/calcChain.xml`, `xl/printerSettings/printerSettings1.bin`, logo y `_xlnm.Print_Area`, además de cualquier pieza de las hojas `2`..`5` o `GENERAL`; cada mutación debe fallar el gate.
- [x] 3.10 REFACTOR: unificar los dobles de plantilla con `backend/test/excel-template-spike/soporte.ts`, sin tocar las plantillas oficiales ni `EXCEL_UNC_BASE`.
- [x] 3.11 RED: extender `MaterialModeloPlanilla` y `EntradaModeloPlanilla` con `tipo` y `unidad` semánticos, ya presentes en `MaterialOrden` y `materiales_orden`, sin migración ni literales de celda en el dominio; `tipo` no inserta subbloques.
- [x] 3.12 GREEN: incorporar `tipo` y `unidad` al constructor puro y a las claves de `construirModeloPlanilla`, conservando la unión discriminada por `incluirMargenes`.
- [x] 3.13 TRIANGULATE: verificar el tránsito de `tipo`/`unidad` para `MP`, `INSUMOS` y `TERCERIZADOS`, con unidad nula y con unidad declarada, sin cambiar cálculos de costos ni la fila de cada material.
- [x] 3.14 RED: actualizar `mapearModeloACeldas` para que `tipo` anteponga `[MP]` / `[INSUMOS]` / `[TERCERIZADOS]` a la descripción y `unidad` alimente la clave `UN`, usando solo `B38:R59` y los rangos justificados en `inventario-celdas.md`, un material por fila y sin inserciones estructurales.
- [x] 3.15 GREEN: traducir `tipo` y `unidad` en el MAP puro del adaptador, sin escribir en `inventario.ts` hasta la revisión humana, sin referencias de celda en `packages/domain/` y sin tocar las hojas `2`..`5` ni `GENERAL`.
- [x] 3.16 TRIANGULATE: verificar el MAP con los tres prefijos en el bloque único `B38:R59` y con unidades vacías, comprobando que no se agregan filas ni celdas fuera del inventario de la hoja `1`.
- [x] 3.17 REFACTOR: tipar `tipo` como `TipoMaterial` y `unidad` como `string | null`, sin `any`, reutilizando los formateadores de la tranche 2.

## 4. Caso de uso, endpoint y error operativo (tranche 4)

- [x] 4.1 RED: test del caso de uso con dobles de puertos en memoria (nunca mocks de PostgreSQL) que exige carga de OP, etapas, horas, materiales, cliente y tasa y delega en `construirModeloPlanilla`.
- [x] 4.2 GREEN: implementar `exportOp(opId, { incluirMargenes })` en `backend/src/features/exportacion/application/`, siguiendo el patrón de `obtenerOp.ts` (Q1).
- [x] 4.3 TRIANGULATE: OP inexistente devuelve `null` y tasa global `0.00` produce margen exacto sin tarifa inventada.
- [x] 4.4 RED: test de esquema Zod que rechaza `variante` distinta de `costeo` y valida `ParamsOpSchema`.
- [x] 4.5 GREEN: crear `registrarRutasExportacion` y montarlo en `buildApp`, documentando la ruta en Swagger (R5: sin auth).
- [x] 4.6 TRIANGULATE: 200 con `Content-Disposition: COSTEO_[NroOP]_[Cliente].xlsx`, 422 para variante inválida y 404 para OP inexistente.
- [x] 4.7 RED: test con directorio temporal sin `MASTER COSTEO NUEVO.xlsx` que exige 500 tipado, sin `Content-Disposition` ni `Buffer`.
- [x] 4.8 GREEN: traducir `plantilla_no_encontrada` con el contrato existente de `excel-plantilla-ausente`.
- [x] 4.9 TRIANGULATE: el mensaje nombra la plantilla y no revela `EXCEL_TEMPLATES_DIR`, `EXCEL_UNC_BASE` ni la UNC; sin descarga parcial.
- [x] 4.10 REFACTOR: sanear el nombre del cliente, fijar cabeceras y tipos sin `any`; verificar que la variante `op` sigue sin existir en C-14.

## 5. Integración real y cotejo con Velco (tranche 5)

- [x] 5.1 RED: test de integración con PostgreSQL 18.7 en contenedor que siembra una OP con etapas, horas y materiales reales (R10, sin mocks).
- [x] 5.2 GREEN: ejecutar el caso de uso y el adaptador con repositorios Prisma reales y verificar que el `Buffer` pasa el gate por hash.
- [x] 5.3 TRIANGULATE: dos OPs, una con costos reales y otra con `costo_unitario_real` nulo, comparando el `COALESCE` por ítem.
- [x] 5.4 RED/GREEN: generar el `.xlsx` desde una OP real, cotejar la hoja `1` con el usuario en nombre de Velco y documentar como paso MANUAL que Velco complete las hojas `2`..`5` y `GENERAL`; no hay costeo histórico (Q3 resuelta).
- [x] 5.5 RED/GREEN: registro de compuerta manual con fecha, versión de Excel y responsable; sin firma, el veredicto queda CRITICAL; el llenado MANUAL pendiente de hojas `2`..`5`/`GENERAL` no es CRITICAL de la compuerta automática.
- [x] 5.6 TRIANGULATE: ausencia de firma o casilla económica no conformada → CRITICAL; firma completa → evidencia aceptada; hojas `2`..`5`/`GENERAL` sin completar → paso MANUAL documentado, no fallo de la compuerta automática.

## 6. Verificación final y cierre sin archive (tranche 6)

- [x] 6.1 RED: test que falla si el `verify-report.md` no distingue la compuerta de C-14 de la ya firmada en C-13/GATE 11.
- [x] 6.2 GREEN: redactar el reporte con gate automático limitado a la hoja `1`, cotejo del costeo generado, firma, fecha, versión de Excel y responsable, documentando el llenado MANUAL posterior de hojas `2`..`5`/`GENERAL` y dejando constancia de que no existe costeo histórico.
- [x] 6.3 TRIANGULATE: mutar el reporte para simular firma ausente y verificar que el test falla.
- [x] 6.4 Ejecutar `openspec validate exportacion-costeo --strict` y `openspec validate --specs --strict` hasta dejar ambos en verde.
- [x] 6.5 Verificar hashes idénticos de las plantillas oficiales, typecheck limpio y suite completa sin fallos; sin build.
- [x] 6.6 Cerrar el apply sin archive, sin commit, sin push y sin editar `CHANGES.md`, `AGENTS.md`, `CLAUDE.md`, knowledge base ni `Docs/FichasExcel/`.
