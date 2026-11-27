# Inventario justificado de celdas — `MASTER COSTEO NUEVO.xlsx` (C-14)

## Procedimiento y prueba de no mutación

- Volcado en modo **solo lectura** con `exceljs` 4.4.0: se recorren las celdas no vacías de las hojas `1`..`5` y se registran valores y fórmulas originales. No se llamó a `xlsx.writeFile`, `writeBuffer` ni a ningún otro escritor.
- Corrección del usuario: las hojas `1`..`5` son distintas y contienen información diferente; no son copias ni réplicas celda a celda. El **único alcance automatizado** de C-14 es la hoja `1` (`xl/worksheets/sheet2.xml`). Las hojas `2`..`5` (`sheet3.xml`..`sheet6.xml`) y `GENERAL` (`sheet1.xml`) se completan **MANUALMENTE** con Velco después de descargar el archivo; permanecen byte-a-byte intactas en la salida automatizada y su cumplimentación no es un fallo CRITICAL de la compuerta automática.
- Correspondencia verificada en `xl/workbook.xml` + `xl/_rels/workbook.xml.rels`: `GENERAL` → `xl/worksheets/sheet1.xml`; hojas `1`, `2`, `3`, `4`, `5` → `xl/worksheets/sheet2.xml`, `sheet3.xml`, `sheet4.xml`, `sheet5.xml`, `sheet6.xml`, respectivamente.
- SHA-256 antes: `1FA2DA0031D2A06BBAC506057F3679D77CA835D1EB70B8657F19D95A47649602`.
- SHA-256 después: `1FA2DA0031D2A06BBAC506057F3679D77CA835D1EB70B8657F19D95A47649602`.
- Conclusión: hash idéntico; la plantilla oficial NO fue modificada.

## Inventario de celdas gobernadas candidatas

La columna de confianza distingue cuatro niveles: **confirmada por etiqueta** (existe un rótulo literal en la plantilla), **inferida de fórmula** (la relación salta de la fórmula o del contexto inmediato), **confirmada por el usuario** (decisión explícita de Velco, en nombre de quien resolvió el usuario) e **incierta** (no hay evidencia literal suficiente; requiere verificación humana manual y queda fuera del alcance automatizado).

Decisiones **confirmadas por el usuario** en nombre de Velco:

1. `C7:R7` transporta `numeroOp` aunque la etiqueta impresa diga `"Descripción:"`.
2. En `TOTAL horas` se escribe únicamente `horasReales`, deducido de `P13=SUM(I13:O13)*H13` y `R13=Q13*P13`; `horasVendidas` permanece en el modelo semántico y en la comparativa y NO se escribe en la hoja de costeo.
3. El alcance automatizado es solo la hoja `1` (`sheet2.xml`); las hojas `2`..`5` y `GENERAL` quedan byte-a-byte intactas y su llenado es un paso MANUAL documentado, no un fallo CRITICAL de la compuerta automática. La firma humana de la salida automatizada sigue siendo obligatoria.
4. Los tres tipos comparten el único bloque `B38:R59`: se llevan como prefijo `[MP]` / `[INSUMOS]` / `[TERCERIZADOS]` en la descripción, un material por fila, sin inserciones estructurales.

| Hoja | Pieza OOXML | Celda/rango | Etiqueta o fórmula original | Clave semántica destino | Confianza |
|---|---|---|---|---|---|
| `1` | `sheet2.xml` | `B6` | `"Cliente:"` | `cliente` | confirmada por etiqueta |
| `1` | `sheet2.xml` | `C6:R6` | `+[1]GENERAL!C4` (12 celdas maestras) | `cliente` | confirmada por etiqueta |
| `1` | `sheet2.xml` | `B7` | `"Descripción:"` (etiqueta impresa) | `numeroOp` | confirmada por el usuario |
| `1` | `sheet2.xml` | `C7:R7` | `+[1]GENERAL!D4` (12 celdas maestras) | `numeroOp` | confirmada por el usuario |
| `1` | `sheet2.xml` | `B10:G10` | `"MANO DE OBRA: Desarme, Limpieza, Rebabado, Esmeril, Pintura, Armado, etc"` | `manoDeObra` | confirmada por etiqueta |
| `1` | `sheet2.xml` | `I11:O11` | `"DIA 1 (HxOPERARIO)"` … `"DIA 7 (HxOPERARIO)"` | `horasReales` (distribución diaria) | inferida de fórmula |
| `1` | `sheet2.xml` | `H12`, `I12:O12` | `"Q"`, `"h"` | `operarios`, `horasPorDia` | confirmada por etiqueta |
| `1` | `sheet2.xml` | `P11:P12` | `"TOTAL horas"` | `horasReales` (etiqueta; valor canónico en `P13`) | confirmada por el usuario |
| `1` | `sheet2.xml` | `R10` | `SUM(P13:P21)` | `horasReales` (espejo neutralizado del valor canónico de `P13`) | confirmada por el usuario |
| `1` | `sheet2.xml` | `P13` | `SUM(I13:O13)*H13`; `R13=Q13*P13` | `horasReales` (celda canónica); `horasVendidas` solo en modelo/comparativa | confirmada por el usuario |
| `1` | `sheet2.xml` | `Q11:Q12` | `"COSTO UNIT."` | `valorHora` | confirmada por etiqueta |
| `1` | `sheet2.xml` | `Q13:Q21` | `Q13` numérico fijo en la plantilla; la salida reemplaza todas las filas con `valorHora` | `valorHora` | inferida de fórmula |
| `1` | `sheet2.xml` | `R11:R12`, `R13:R21`, `R22` | `"COSTO TOTAL"`, `Q13*P13`, `SUM(R13:R21)` | `costos.costoManoObra` | inferida de fórmula |
| `1` | `sheet2.xml` | `B24:O24` | `"FABRICACIÓN - uso máquinas"` | `maquinaria` | confirmada por etiqueta |
| `1` | `sheet2.xml` | `P27:P35`, `Q27:Q35`, `R27:R35`, `R36` | `SUM(I27:O27)`, `32`, `Q27*P27`, `SUM(R27:R35)` | `horasMaquinaria`, `valorHoraMaquinaria`, `costos.costoMaquinaria` | inferida de fórmula |
| `1` | `sheet2.xml` | `B38:R59` | `"MATERIALES/TERCERIZADOS"`; bloque único compartido | `materiales` con prefijo `[MP]` / `[INSUMOS]` / `[TERCERIZADOS]` en la descripción, un material por fila, sin inserciones estructurales | confirmada por el usuario |
| `1` | `sheet2.xml` | `B40:B58` | `1` … `19` | `materiales[i].item` | inferida de fórmula |
| `1` | `sheet2.xml` | `O39` | `"Q"` | `materiales[i].cantidad` | confirmada por etiqueta |
| `1` | `sheet2.xml` | `P39` | `"UN"` | `materiales[i].unidad` | confirmada por etiqueta |
| `1` | `sheet2.xml` | `Q39` | `"COST. UNIT."` | `materiales[i].costoUnitarioCotizado` / `costoUnitarioReal` | confirmada por etiqueta |
| `1` | `sheet2.xml` | `R39`, `R40:R58`, `R59` | `"COSTO TOTAL"`, `+Q40*O40` (compartida), `SUM(R40:R58)` | `materiales.{i}.costoTotal` en `R40:R58`; `costos.costoMaterialesReal` en `R59` | inferida de fórmula |
| `1` | `sheet2.xml` | `S38:S39` | `"CAMBIO"`, `0` | `cambio` (derivado, sin uso en el MAP) | incierta |
Las filas de `GENERAL` a continuación son **contexto del paso MANUAL**: `sheet1.xml` queda byte-a-byte intacto y su cumplimentación posterior por Velco está **fuera de alcance** de la compuerta automática.

| `GENERAL` | `sheet1.xml` | `C2:C3` | `"CLIENTE "` | `cliente` | confirmada por etiqueta; manual, fuera de alcance |
| `GENERAL` | `sheet1.xml` | `C4`, `D4` | vacías en la plantilla; objetivo de `+[1]GENERAL!C4` y `+[1]GENERAL!D4` | `cliente`, `numeroOp` | incierta |
| `GENERAL` | `sheet1.xml` | `E4:F4`, `E5:F5` | `='1'!R$22`, `='2'!R$36` | `costos.costoManoObra`, `costos.costoMaquinaria` | inferida de fórmula |
| `GENERAL` | `sheet1.xml` | `G4:G5` | `='3'!R$59` | `costos.costoMaterialesCotizado` | inferida de fórmula |
| `GENERAL` | `sheet1.xml` | `H2:H4` | `"PREVENTIVO"`, `(E4+G4+F4)*0.1` | `preventivo` | inferida de fórmula |
| `GENERAL` | `sheet1.xml` | `I2:J4` | `"MARCK UP  MO / MOM"`, `"MARCK UP MP / INSU"`, `2`, `1.7` | `markupManoObra`, `markupMateriales` | confirmada por etiqueta |
| `GENERAL` | `sheet1.xml` | `K2:K5` | `"VENTA  S/GN"`, `((E4+F4)*I4)+(G4*J4)+H4` | `ventaSinGN` | inferida de fórmula |
| `GENERAL` | `sheet1.xml` | `L2:N4` | `"DDJJ GN"`, `"DDJJ IIBB"`, `"FONDO MINERO"`; `K4*30%`, `K4*2.77%`, `K4*0.8%` | `impuestos` | inferida de fórmula |
| `GENERAL` | `sheet1.xml` | `O2:O4` | `"VENTA"`, `+K4+L4+M4+N4` | `venta` | confirmada por etiqueta |
| `GENERAL` | `sheet1.xml` | `P2:Q4` | `"GANANCIA"`, `"RENTABILIDAD"`; `O4-(E4+F4+G4+L4+M4+N4)`, `+P4/O4` | `margenReal`, `comparativa.margen` | inferida de fórmula |
| `GENERAL` | `sheet1.xml` | `R2:V5` | `"DESCUENTO"`, `"$ DESCUENTO"`, `"P/VENTA DTO"`, `"GANANCIA CON DTO"`, `"RENTABILIDAD CON DTO"` | `comparativa.descuento`, `comparativa.margenConDto` | inferida de fórmula |
| `GENERAL` | `sheet1.xml` | `A4:A43` | `1` … `40` | `comparativa` (una fila por OP ítem); la fila concreta la elige Velco manualmente | incierta; manual, fuera de alcance automatizado |

## Resoluciones confirmadas, puntos inciertos y trabajo manual

1. **RESUELTO por el usuario:** `B7` dice `"Descripción:"`, no `"OP"`, pero `C7:R7` transporta `numeroOp` (confirmado por el usuario, no solo inferido de `+[1]GENERAL!D4`).
2. **RESUELTO por el usuario:** en `TOTAL horas` se escribe solo `horasReales`; la deducción de `P13=SUM(I13:O13)*H13` y `R13=Q13*P13` es la justificación. `horasVendidas` sigue en el modelo semántico y en la comparativa, y NO se escribe en la hoja de costeo.
3. **RESUELTO por el usuario:** solo la hoja `1` está automatizada; hojas `2`..`5` y `GENERAL` permanecen byte-a-byte intactas y Velco las completa manualmente. Ese lleno manual no es un fallo CRITICAL de la compuerta automática, sin debilitar la firma humana obligatoria de la salida generada.
4. **RESUELTO por el usuario:** los tres tipos comparten el bloque único `B38:R59`; se identifican con el prefijo `[MP]` / `[INSUMOS]` / `[TERCERIZADOS]` en la descripción, un material por fila, sin inserciones estructurales.
5. No existe la etiqueta `"valor hora"`: `Q11:Q12` (`"COSTO UNIT."`) y el valor fijo `32` en `Q13:Q21` / `Q27:Q35` justifican la tarifa por `R13=Q13*P13`, pero no está confirmada por etiqueta.
6. `P39` (`"UN"`) etiqueta la unidad; `tipo` y `unidad` viajan como datos semánticos del modelo y se traducen al bloque y a la columna `UN` sin inserciones. El detalle de implementación del MAP pertenece a la tranche 3.
7. La comparativa de márgenes vive en `GENERAL` (`P4:Q4`, `U4:V4` y columnas `L`..`V`), no en la hoja `1`; **qué fila concreta de `A4:A43` usa Velco sigue siendo incierta y es una decisión MANUAL, fuera de alcance automatizado**.
8. `S38:S39` (`"CAMBIO"`, `0`) no alimenta ninguna fórmula de costeo; se conserva byte-a-byte pero no se declara como destino del MAP.
9. Los porcentajes `0.1`, `2`, `1.7`, `30%`, `2.77%`, `0.8%` son valores de la plantilla, no reglas de negocio de Velco confirmadas: NO deben copiarse al dominio (R2, R3).

Este inventario es evidencia de origen, **no un descriptor congelado**: la congelación en `backend/src/features/exportacion/excel/inventario.ts` pertenece a la tranche 3; Q2 y Q3 quedan RESUELTAS por las decisiones confirmadas, y la firma del costeo generado sigue siendo obligatoria.
