# ADR — Estrategia de escritura de plantillas Excel del spike C-13

## Estado

Aceptado: cinco decisiones aprobadas por el usuario en nombre de Velco el 2026-11-26.

Decisor: usuario en nombre de Velco  
Fecha: 2026-11-26  
Alcance: C-13 `excel-template-spike`, GATE 11 de C-14 y desbloqueo condicionado de C-15.

Con checklist firmada por el usuario en nombre de Velco, el ADR habilita el archive de C-13 y GATE 11 de C-14; el ADR por sí solo no cambia el veredicto de `verify-report.md`.

Sin checklist firmada, el ADR mantiene la compuerta bloqueada con veredicto CRITICAL y no habilita C-15.

En el estado actual, ahora el reporte refleja la frase firmada con veredicto READY FOR ARCHIVE / compuerta cumplida; el ADR por sí solo no cambia el veredicto, que depende de la firma humana registrada en el reporte.

## Contexto

El MVP debe exportar sobre las plantillas oficiales sin generar workbooks nuevos (R6). Las dos plantillas canónicas son `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` y `Docs/FichasExcel/A - OP-MASTER.xlsx`, con hashes verificados al inicio y al cierre del apply.

La evidencia del spike descarta el guardado/reapertura con `exceljs` 4.4.0 como escritor: la OP pasó de 136.961 → 21.288 B y el costeo de 273.751 → 311.479 B, con pérdida de `externalLinks`, `calcChain` y `printerSettings1.bin`, y corrupción de `_xlnm.Print_Area` de `'1640'!$A:$S` a `$ANaN:$SNaN`.

La atribución errónea que situaba los 577.125 B en costeo queda corregida: los 577.125 B en OP y los 994 B en costeo. La corrección es explícita y no modifica los hashes de las plantillas.

## Decisión

- D1 — Enlaces externos como metadata histórica: se conservan byte a byte; la UNC `K:\COMERCIAL\...` no se usa en runtime.
- D2 — Parche OOXML quirúrgico: se reemplazan únicamente las celdas declaradas, sin reconstruir el paquete.
- D3 — Celda maestra O7: fuente única del `ID Plano: <valor>` o `ID Plano: S/P`; `J7:N8` permanece intacto.
- D4 — UNC histórica sin uso en runtime: `UNC sin uso en runtime` es condición de aceptación del adaptador.
- D5 — Validación en doble capa: gate estructural por hash más verificación semántica de celdas y `doble capa` de texto plano.

Las 12 `[1]` neutralizadas con valores de BD son la única excepción controlada a la conservación estricta de fórmulas.

## Alternativas

- guardado/reapertura con `exceljs`: descartada por pérdida de piezas OOXML, corrupción del área de impresión y crecimiento del costeo.
- Generar un workbook desde cero: prohibido por R6 y por pérdida de plantillas oficiales.
- Reemplazar enlaces externos por valores embebidos: descartado; son metadata histórica y su alteración invalida el roundtrip.
- Confiar solo en el diff de celdas: descartado; no detecta pérdida de `printerSettings1.bin` ni corrupción de `_xlnm.Print_Area`.

## Justificación

El parche quirúrgico preserva las firmas binarias y la semántica de las plantillas. El gate compara todas las piezas por hash, informa hoja/celda/valor esperado/valor obtenido para cada diferencia autorizada y rechaza cualquier cambio fuera del inventario.

La verificación semántica complementa al gate: controla `ID Plano: <valor>` o `ID Plano: S/P`, exige `'1640'!$A:$S` y confirma que `J7:N8` sigue siendo `PC N°: `.

`exceljs` 4.4.0 solo para lectura y verificación; nunca como mecanismo de escritura en el adaptador.

## Trade-offs

- Se acepta mayor complejidad en el parser XML a cambio de conservar el paquete original.
- Se mantiene la UNC histórica como metadata aunque no sea accesible en el entorno actual.
- La checklist manual sigue siendo obligatoria: el gate automático no sustituye la apertura en Excel.
- El ADR habilita decisiones técnicas, no el archive: el veredicto final depende de la firma humana real.

## Trazabilidad

- Specs delta: `excel-spike-adricion`, `excel-roundtrip-plantillas`, `excel-plano-rango-confirmado`, `excel-plantilla-ausente`, `decisiones-arquitectonicas`.
- Roadmap: `CHANGES.md`, C-13, C-14, C-15 y GATE 11.
- Canónicos y KB: `Docs/definici_n_del_mvp_velco.md`, `knowledge-base/09_decisiones_y_supuestos.md`, `knowledge-base/10_preguntas_abiertas.md`.
- Estado de decisiones: DD-02 queda enmendada por esta estrategia; IN-08 queda RESUELTA condicionada a la firma manual; sin crear DD-14.
- Evidencia ejecutable: `gate-controlado.test.ts`, `validate-cli.test.ts`, `verificacion-final.test.ts` y `verify-report.md`.
