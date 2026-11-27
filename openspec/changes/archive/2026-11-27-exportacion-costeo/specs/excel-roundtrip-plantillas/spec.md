## ADDED Requirements

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
