## Why

IN-08 quedó resuelta con evidencia directa del OOXML y cinco decisiones aprobadas por el usuario en nombre de Velco. La comparación semántica daba falso positivo: el guardado y la reapertura con `exceljs` conservaron celdas, estilos y combinaciones, pero eliminaron piezas del paquete y corrompieron el área de impresión. Sin enmendar el change, `C-14` y el mapeo de `C-15` heredarían una estrategia de escritura ya descartada y una ubicación errónea del enlace grande.

## What Changes

- Adoptar el parche OOXML quirúrgico como mecanismo de escritura: copiar la plantilla oficial y reemplazar solo el par `<f>…</f><v>…</v>` por `<v>` con datos de BD en 12 celdas maestras (OP, hoja `1640`, `D10`/`D11`; costeo, hojas `1`..`5`, `C6`/`C7`). Toda otra pieza OOXML se conserva byte-a-byte; el contenedor ZIP se recomprime.
- Dejar `exceljs` 4.4.0 exclusivamente para lectura y verificación. Evidencia del descarte como escritor: 0 diferencias semánticas en 1.366 y 23.013 celdas, pero pérdida de `externalLinks`, `calcChain` y `printerSettings1.bin`, y corrupción de `_xlnm.Print_Area` de `'1640'!$A:$S` a `$ANaN:$SNaN`; tamaños OP 136.961 → 21.288 B (−84,5 %) y costeo 273.751 → 311.479 B (+13,8 %).
- Corregir la evidencia del enlace: el archivo de 577.125 bytes está en `xl/externalLinks/externalLink1.xml` de `A - OP-MASTER.xlsx` y apunta a `/COMERCIAL/FG48%20-%20FACTURACION%20REGISTRO.xlsx`. El archivo de costeo tiene un enlace de 994 bytes con Target `file:///K:\COMERCIAL\...COSTEO MASTER - PETROLERA EL TREBOL - MENDOZA.xlsx`. Conservar `externalLinks/*` como metadata histórica, no como fuente, y neutralizar las 12 fórmulas `[1]` con valores estáticos de BD.
- Escribir en la celda maestra `O7` de la hoja `1640` el texto `ID Plano: <codigoPlano>` o `ID Plano: S/P` cuando `codigoPlano === null`, con `t="inlineStr"` para no tocar `sharedStrings.xml`; conservar estilo `s="73"` y merge `O7:R8`, y dejar `J7:N8` (`PC N°: `) intacto. Sin prefijo `PL-` agregado por el exportador.
- Mantener `EXCEL_UNC_BASE` documentado solo como referencia histórica, sin uso en runtime. La UNC `\\Servidor\g\OPERACIONES\ORDENES DE PROCESO\OP - DIGITALIZADA\` no resuelve (`Host desconocido`, `Test-Path=False`) y aparece únicamente como `x15ac:absPath` en `xl/workbook.xml` de OP; se conserva byte-idéntica por fidelidad de formato. No eliminar la variable en este change.
- Incorporar validación en doble capa: gate automatizado por hash de piezas OOXML con diff controlado, y checklist manual en Excel firmada por el usuario en nombre de Velco como compuerta para archivar C-13 y para GATE 11 de C-14. Sin checklist, `verify-report.md` marca CRITICAL y C-15 permanece bloqueado.
- Enmendar DD-02 e IN-08 en la documentación canónica sin crear DD-14, con TDD estricto en las tareas: RED → GREEN → TRIANGULATE (mínimo 2 casos) → REFACTOR y SAFETY NET donde corresponda.

## Capabilities

### New Capabilities
- `excel-roundtrip-plantillas`: preservación de piezas OOXML y relleno quirúrgico de las plantillas oficiales, con evidencia de los enlaces y de la UNC histórica.
- `excel-plantilla-ausente`: contrato de error operativo cuando falta una plantilla, sin workbook improvisado.
- `excel-plano-rango-confirmado`: mapeo confirmado de `ID Plano: <valor>` / `ID Plano: S/P` en `O7`, con exclusión de `J7:N8`.
- `excel-spike-adricion`: informe/ADR con las cinco decisiones aprobadas, doble capa de validación y compuerta humana.

### Modified Capabilities
- `decisiones-arquitectonicas`: DD-02 pasa a parche OOXML quirúrgico con `exceljs` solo para lectura; IN-08 pasa a resuelta, condicionada al ADR y a la firma de la checklist (sin DD-14).

## Impact

- Plantillas: `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` y `Docs/FichasExcel/A - OP-MASTER.xlsx` (solo lectura; se trabaja sobre copias temporales).
- Código: adaptador de Excel por feature en `backend/src/features/exportacion/excel/` (patcher OOXML, comparador por hash y lectura con `exceljs`); tests de contrato en `backend/test/excel-template-spike/`; `packages/domain/` sigue sin importar `exceljs` (R2).
- Configuración: `EXCEL_TEMPLATES_DIR` sigue en uso; `EXCEL_UNC_BASE` queda como referencia histórica sin consumo en runtime. Sin nuevos secrets ni segunda lengua de runtime.
- Dependencias: `exceljs` 4.4.0 y Vitest 5.1.1 ya fijados; sin PostgreSQL (R10 no aplica a este spike).
- Gobernanza: MEDIO; las cinco decisiones ya fueron aprobadas por el usuario en nombre de Velco. Falta la compuerta manual firmada antes del archive.
