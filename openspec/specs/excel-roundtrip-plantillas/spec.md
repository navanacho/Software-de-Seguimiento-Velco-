# excel-roundtrip-plantillas Specification

## Purpose
TBD - created by archiving change excel-template-spike. Update Purpose after archive.
## Requirements
### Requirement: Preservación de piezas OOXML y relleno quirúrgico

El adaptador DEBE (SHALL) copiar `MASTER COSTEO NUEVO.xlsx` y `A - OP-MASTER.xlsx` desde `EXCEL_TEMPLATES_DIR` y parchear únicamente las celdas autorizadas: el par `<f>…</f><v>…</v>` se sustituye por `<v>` con datos de BD en 12 celdas maestras (hoja `1640` de OP: `D10`/`D11`; hojas `1`..`5` de costeo: `C6`/`C7`), y la celda maestra `O7` recibe el texto de plano definido en `excel-plano-rango-confirmado`. Toda otra pieza OOXML DEBE (SHALL) conservarse byte-a-byte; el contenedor ZIP puede recomprimirse. El sistema NO DEBE (SHALL NOT) generar un workbook desde cero ni usar `exceljs` como escritor (DD-02, R6).

#### Scenario: Parche de las diez celdas de costeo

- **WHEN** se parchea `MASTER COSTEO NUEVO.xlsx` con valores de BD
- **THEN** `C6` y `C7` de las hojas `1`..`5` contienen `<v>` con esos valores y las demás piezas OOXML mantienen el mismo hash que la plantilla original

#### Scenario: Parche de las dos celdas de OP

- **WHEN** se parchea `A - OP-MASTER.xlsx` con valores de BD
- **THEN** `D10` y `D11` de la hoja `1640` contienen `<v>` con esos valores, el ZIP se recomprime y las piezas no autorizadas quedan byte-idénticas

#### Scenario: Celda objetivo sin estructura esperada

- **WHEN** una celda maestra no contiene el par `<f>…</f><v>…</v>` previsto
- **THEN** la operación falla antes de escribir la salida y no produce un archivo parcial

### Requirement: Comparación por hash con diff controlado

El gate DEBE (SHALL) comparar por hash TODAS las piezas OOXML de la plantilla y de la copia resultante. Cuando una pieza difiera, DEBE (SHALL) exigir un diff controlado a nivel de celda cuyo único contenido posible sean las 12 celdas maestras y, si aplica, la celda `O7`. Un inventario semántico de celdas, estilos y combinaciones NO DEBE (SHALL NOT) considerarse suficiente: por sí solo produjo falso positivo al no detectar pérdida de piezas ni corrupción del área de impresión.

#### Scenario: Diferencia autorizada

- **WHEN** solo cambian las celdas maestras autorizadas y `O7` cuando corresponde
- **THEN** el gate pasa y enumera cada celda modificada con valor esperado y obtenido

#### Scenario: Diferencia no autorizada en el enlace

- **WHEN** `xl/externalLinks/externalLink1.xml` cambia de hash
- **THEN** el gate falla aunque celdas, estilos y combinaciones sean idénticos

#### Scenario: Diferencia no autorizada en impresión

- **WHEN** `xl/printerSettings/printerSettings1.bin` falta o cambia de hash, o `_xlnm.Print_Area` difiere de `'1640'!$A:$S`
- **THEN** el gate falla y la salida NO DEBE considerarse conforme

#### Scenario: Falso positivo del inventario semántico

- **WHEN** el inventario semántico reporta 0 diferencias en 1.366 o 23.013 celdas mientras una pieza OOXML cambió de hash
- **THEN** el gate automatizado falla por la diferencia de hash y documenta la pieza afectada

#### Scenario: Gate de error operativo y validación estricta

- **WHEN** falta una plantilla o `openspec validate excel-template-spike --strict` reporta un error
- **THEN** se devuelve HTTP 500 sin workbook ni `Content-Disposition`, o la validación queda en rojo, según corresponda, y el gate NO DEBE marcarse como superado

### Requirement: Piezas OOXML críticas conservadas

El parche DEBE (SHALL) conservar byte-a-byte `xl/externalLinks/*`, `xl/calcChain.xml`, `xl/printerSettings/printerSettings1.bin`, el logo y las definiciones de nombres `_xlnm.Print_Area`, además del valor `x15ac:absPath` de `xl/workbook.xml`. El valor esperado del área de impresión de OP es exactamente `'1640'!$A:$S`.

#### Scenario: Área de impresión

- **WHEN** se inspecciona la salida de OP
- **THEN** `_xlnm.Print_Area` sigue siendo `'1640'!$A:$S` y no aparece `$ANaN:$SNaN`

#### Scenario: Configuración de impresora y logo

- **WHEN** se comparan las piezas de impresión y de imagen
- **THEN** `printerSettings1.bin` y el logo conservan su hash original

#### Scenario: Enlaces externos

- **WHEN** se comparan las piezas `xl/externalLinks/*`
- **THEN** permanecen byte-idénticas y no se eliminan del paquete

#### Scenario: Ruta absoluta histórica

- **WHEN** se inspecciona `xl/workbook.xml` de ambas plantillas
- **THEN** `x15ac:absPath` conserva su valor original byte-a-byte

### Requirement: Enlace externo conservado como metadata histórica

El sistema DEBE (SHALL) registrar la evidencia del OOXML real y conservar los enlaces como metadata histórica, sin usarlos como fuente de datos. Las 12 fórmulas `[1]` de las celdas maestras DEBEN (SHALL) reemplazarse por valores estáticos de BD; el inventario de `[1]` en esas celdas pasa de 12 a 0 y NO DEBE (SHALL NOT) introducirse ninguna referencia `[1]` nueva fuera de ellas.

#### Scenario: Enlace de la plantilla de OP

- **WHEN** se inspecciona `xl/externalLinks/externalLink1.xml` de `A - OP-MASTER.xlsx`
- **THEN** el informe registra 577.125 bytes y el Target `/COMERCIAL/FG48%20-%20FACTURACION%20REGISTRO.xlsx`

#### Scenario: Enlace de la plantilla de costeo

- **WHEN** se inspecciona `xl/externalLinks/externalLink1.xml` de `MASTER COSTEO NUEVO.xlsx`
- **THEN** el informe registra 994 bytes y el Target `file:///K:\COMERCIAL\...COSTEO MASTER - PETROLERA EL TREBOL - MENDOZA.xlsx`

#### Scenario: Neutralización de fórmulas externas

- **WHEN** se genera una salida con datos de BD
- **THEN** las 12 celdas maestras no contienen `[1]` y las piezas de enlace siguen presentes como metadata

### Requirement: Alternativa de escritura con `exceljs` descartada

El ADR DEBE (SHALL) documentar el guardado y la reapertura con `exceljs` como alternativa descartada, con la evidencia medida, y el adaptador NO DEBE (SHALL NOT) usar `exceljs` para escribir la salida.

#### Scenario: Evidencia del descarte

- **WHEN** se consulta el ADR del spike
- **THEN** constan 0 diferencias semánticas en 1.366 y 23.013 celdas, pérdida de `externalLinks`, `calcChain` y `printerSettings1.bin`, corrupción de `_xlnm.Print_Area` a `$ANaN:$SNaN`, y tamaños OP 136.961 → 21.288 B (−84,5 %) y costeo 273.751 → 311.479 B (+13,8 %)

#### Scenario: Escritor excluido

- **WHEN** se inspecciona el adaptador de exportación
- **THEN** `exceljs` aparece solo en lectura o verificación y ningún llamado de escritura produce el `.xlsx` final

### Requirement: UNC histórica sin uso en runtime

`EXCEL_UNC_BASE` DEBE (SHALL) permanecer documentado como referencia histórica, sin consumo en runtime. La exportación NO DEBE (SHALL NOT) fallar cuando la variable esté ausente, NO DEBE (SHALL NOT) escribir la UNC como literal en código ni en tests y DEBE (SHALL) conservar `x15ac:absPath` sin cambios.

#### Scenario: Variable ausente

- **WHEN** `EXCEL_UNC_BASE` no está definida
- **THEN** la exportación produce el mismo resultado que con la variable definida y no se emite ningún error de configuración

#### Scenario: Ruta no resoluble

- **WHEN** la UNC histórica no resuelve desde el host
- **THEN** se documenta la limitación, no se inventa una fuente alternativa y el spike NO DEBE quedar bloqueado por ese solo motivo

#### Scenario: Sin literal de ruta en código

- **WHEN** se buscan literales de UNC en código y fixtures del spike
- **THEN** no aparecen fuera de la documentación histórica

### Requirement: Validación humana como compuerta

El gate automatizado es necesario pero insuficiente. El archive de C-13 y GATE 11 de C-14 DEBEN (SHALL) condicionarse a una checklist manual en Excel firmada por el usuario en nombre de Velco, adjunta al `verify-report.md` con fecha, versión de Excel y responsable. Sin esa firma, el reporte DEBE (SHALL) marcar CRITICAL, NO DEBE archivarse C-13 ni habilitarse C-15. Se DEBE (SHALL) ejecutar `openspec verify` antes del archive.

#### Scenario: Checklist firmada

- **WHEN** el `verify-report.md` incluye la compuerta firmada con (a) apertura sin aviso de reparación, (b) merges/encabezados/bloques/logo, (c) área de impresión `'1640'!$A:$S` e impresión/PDF, (d) `ID Plano: …` o `S/P` en `O7` y `PC N°:` intacto en `J7:N8`, (e) costos/horas/márgenes contra un costeo real de Velco, (f) variante operativa sin importes y (g) fecha, versión de Excel y responsable, y se ejecutó `openspec verify`
- **THEN** el reporte puede pasar a READY FOR ARCHIVE y quedan habilitados el archive de C-13 y GATE 11 de C-14

#### Scenario: Checklist ausente o sin firma

- **WHEN** falta la checklist manual, alguna casilla no está conformada o no consta la firma del usuario en nombre de Velco
- **THEN** el reporte marca CRITICAL, C-13 no se archiva y C-15 permanece bloqueado aunque el gate automático esté en verde

### Requirement: Inventario ampliado de celdas gobernadas para costeo

Para la variante de C-14, el descriptor de `MASTER COSTEO NUEVO.xlsx` DEBE (SHALL) declarar celdas ÚNICAMENTE en `xl/worksheets/sheet2.xml` (hoja `1`): las 12 celdas maestras `C6`/`C7` y el conjunto de celdas que reciben cliente, `numeroOp` en `C7:R7`, bloques `INSUMOS`/`MP`/`TERCERIZADOS` con `UN`/`COST. UNIT.`/`COSTO TOTAL`, `horasReales` en `TOTAL horas` y valor hora. `horasVendidas` NO DEBE (SHALL NOT) escribirse en la hoja de costeo y permanece en el modelo semántico y la comparativa. Las piezas `sheet1.xml` (`GENERAL`) y `sheet3.xml`..`sheet6.xml` (hojas `2`..`5`) DEBEN (SHALL) conservarse byte-a-byte idénticas a la plantilla oficial; su completación posterior por Velco es un paso MANUAL documentado y NO DEBE (SHALL NOT) considerarse un fallo CRITICAL de la compuerta automática, sin debilitar la firma humana obligatoria de la salida generada. El inventario DEBE (SHALL) fijarse por inspección de solo lectura, con su justificación documentada en `inventario-celdas.md`, y congelarse antes de la escritura previa revisión humana; toda celda no declarada DEBE (SHALL) conservarse byte-a-byte. El adaptador NO DEBE (SHALL NOT) escribir una celda ausente del inventario ni generar el workbook desde cero (RN-EXPORT-02/03, DD-02, R6).

#### Scenario: Inventario declarado antes de parchear

- **WHEN** se inspecciona el descriptor de la plantilla de costeo
- **THEN** constan las 12 celdas maestras y las celdas adicionales del MAP de HU-20A con su hoja, pieza, referencia, clave semántica y tipo

#### Scenario: Escritura dentro del inventario

- **WHEN** se parchea la plantilla con el modelo de costeo
- **THEN** las celdas declaradas en `xl/worksheets/sheet2.xml` contienen los valores esperados y todas las demás piezas OOXML mantienen el mismo hash que la plantilla original

#### Scenario: Hojas distintas con llenado manual

- **WHEN** se inspecciona la salida automatizada y las hojas `2`..`5` o `GENERAL` siguen sin completar
- **THEN** esas piezas permanecen byte-a-byte idénticas, la compuerta automática no declara un fallo CRITICAL por ese motivo y el flujo documenta que Velco las completa manualmente después de la descarga

#### Scenario: Celda objetivo sin estructura esperada

- **WHEN** una celda maestra no contiene el par `<f>…</f><v>…</v>` previsto o una celda adicional no existe en la plantilla
- **THEN** la operación falla antes de devolver el `Buffer` y no produce salida parcial

### Requirement: Gate por hash aplicado a la salida real de costeo

El adaptador DEBE (SHALL) reutilizar `compararConDiffControlado`, `compararPiezas` y las utilidades de `exceljs` en modo solo lectura para verificar cada `.xlsx` generado. El gate DEBE (SHALL) comparar por hash TODAS las piezas OOXML y exigir que el único diff esté en las celdas declaradas; DEBE (SHALL) conservar `externalLinks/*`, `calcChain.xml`, `printerSettings1.bin`, logo, `_xlnm.Print_Area` y `x15ac:absPath`, y verificar que el inventario de fórmulas `[1]` en las 12 celdas maestras pase de 12 a 0 sin introducir referencias nuevas. Un inventario semántico de celdas NO DEBE (SHALL NOT) considerarse suficiente por sí solo (DD-02, lección C-13).

#### Scenario: Diff controlado conforme

- **WHEN** se comparan la plantilla original y la salida de costeo
- **THEN** el gate enumera cada celda modificada con hoja, valor esperado y valor obtenido y declara la salida conforme

#### Scenario: Pieza crítica alterada

- **WHEN** cambia el hash de `xl/externalLinks/externalLink1.xml`, de `xl/calcChain.xml`, de `xl/printerSettings/printerSettings1.bin` o del logotipo
- **THEN** el gate falla aunque celdas, estilos y combinaciones sean idénticos

#### Scenario: Fórmula externa no neutralizada

- **WHEN** alguna de las 12 celdas maestras de la salida conserva `[1]`
- **THEN** el gate falla y la descarga NO DEBE considerarse conforme

#### Scenario: Salida sin escritor `exceljs`

- **WHEN** se inspecciona el adaptador de C-14
- **THEN** `exceljs` aparece solo en lectura o verificación y ninguna llamada suya produce el `.xlsx` final

### Requirement: Validación manual del costeo exportado

La verificación automática DEBE (SHALL) complementarse con una compuerta manual en Excel firmada por el usuario en nombre de Velco, con apertura sin aviso de reparación, conservación de bloques y estilos, y cotejo de cliente, OP, bloques económicos, horas, valor hora y márgenes. No existe costeo histórico de Velco; la evidencia DEBE (SHALL) ser un costeo generado a partir de datos reales de una OP, abierto y verificado por el usuario en nombre de Velco en Excel. El registro DEBE (SHALL) incluir fecha, versión de Excel y responsable; sin la firma, la salida se declara CRITICAL y NO DEBE (SHALL NOT) considerarse aceptada para cerrar C-14. Esta compuerta es propia de C-14 y NO DEBE (SHALL NOT) reabrir ni reemplazar la checklist ya firmada de C-13 (DD-02, GATE 11).

#### Scenario: Compuerta manual cumplida

- **WHEN** el usuario en nombre de Velco abre en Excel el costeo generado a partir de una OP real, verifica cliente, OP, bloques, horas, valor hora y márgenes y registra fecha, versión de Excel y responsable
- **THEN** la evidencia manual se adjunta al cierre del change junto con el gate automático en verde

#### Scenario: Solo evidencia automática

- **WHEN** el gate automático está en verde pero no consta la firma manual del costeo generado
- **THEN** la salida se declara CRITICAL, C-14 NO DEBE considerarse verificado y la compuerta permanece abierta

#### Scenario: Costeo histórico inexistente

- **WHEN** se solicita cotejar contra un costeo histórico de Velco
- **THEN** no se inventa tal evidencia y la compuerta DEBE (SHALL) usar el costeo generado descrito en este requerimiento

