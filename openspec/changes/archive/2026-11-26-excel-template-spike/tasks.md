## 1. Preparación, SAFETY NET e inventario de solo lectura

- [x] 1.1 Confirmar en disco los nombres exactos de `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` y `Docs/FichasExcel/A - OP-MASTER.xlsx`, sin renombrarlos ni modificarlos
- [x] 1.2 Confirmar que `.env.example` documenta `EXCEL_TEMPLATES_DIR` y `EXCEL_UNC_BASE` como referencia histórica, sin literal de UNC en código ni en tests
- [x] 1.3 Crear el espacio de tests de contrato en `backend/test/excel-template-spike/` y el adaptador en `backend/src/features/exportacion/excel/` sin introducir lógica de producción todavía
- [x] 1.4 SAFETY NET: registrar hashes SHA-256 de ambas plantillas y de todas sus piezas OOXML antes de cualquier escritura, y verificarlos de nuevo al final de cada caso
- [x] 1.5 RED: escribir el test de inventario que falla si alguna plantilla oficial falta o si el adaptador intenta construir un workbook vacío en lugar de cargar la plantilla
- [x] 1.6 TRIANGULATE: dos casos, uno por plantilla, verificando que la copia temporal usa directorio distinto y que `Docs/FichasExcel/` queda intacto

## 2. Patcher OOXML quirúrgico — MASTER COSTEO NUEVO

- [x] 2.1 RED: test que falla si, tras parchear, el hash de cualquier pieza OOXML no autorizada difiere del original
- [x] 2.2 RED: test que falla si `C6`/`C7` de las hojas `1`..`5` no sustituyen el par `<f>…</f><v>…</v>` por `<v>` con el dato de BD
- [x] 2.3 GREEN: copiar la plantilla, reemplazar solo esas diez celdas en el XML de hoja, conservar byte-a-byte las demás piezas y recomprimir el ZIP
- [x] 2.4 TRIANGULATE: dos casos de valores de BD — decimal exacto y cero/negativo — con aserción sobre `<v>` y sobre el hash del resto de piezas
- [x] 2.5 TRIANGULATE: inyectar una diferencia en `xl/externalLinks/externalLink1.xml` y verificar que el gate falla en lugar de aprobar el archivo
- [x] 2.6 REFACTOR: extraer el patcher a una función pura y tipada, sin `any` y sin importar `exceljs` en `packages/domain/` (R2, R9)

## 3. Patcher OOXML quirúrgico — A - OP-MASTER

- [x] 3.1 RED: test que falla si el hash de piezas no autorizadas cambia tras parchear la hoja `1640`
- [x] 3.2 RED: test que falla si `D10`/`D11` no sustituyen el par `<f>…</f><v>…</v>` por `<v>` con el dato de BD
- [x] 3.3 GREEN: reutilizar el patcher del punto 2 con el inventario de celdas de OP y copias temporales separadas
- [x] 3.4 TRIANGULATE: dos casos — con plano y sin plano — verificando `D10`/`D11`, `O7` con `inlineStr` y `J7:N8` intacto
- [x] 3.5 TRIANGULATE: dos casos negativos — `_xlnm.Print_Area` corrupto y `printerSettings1.bin` ausente — con fallo explícito del gate
- [x] 3.6 REFACTOR: unificar el descriptor de inventario de ambas plantillas sin duplicación ni dependencias de framework en el dominio

## 4. Enlaces externos y UNC histórica

- [x] 4.1 RED: test que falla si no se registran 577.125 bytes y el Target `/COMERCIAL/FG48%20-%20FACTURACION%20REGISTRO.xlsx` en OP, y 994 bytes con su Target en costeo
- [x] 4.2 GREEN: extraer la evidencia de `xl/externalLinks/*` y conservar esas piezas byte-a-byte como metadata histórica, sin usarlas como fuente de datos
- [x] 4.3 GREEN: verificar que el inventario de `[1]` en las 12 celdas maestras pasa de 12 a 0 y que no aparece ninguna referencia `[1]` nueva fuera de ellas
- [x] 4.4 RED/GREEN: test con dos casos — `EXCEL_UNC_BASE` definida y ausente — que falla si la salida cambia o si aparece un error de configuración por la ausencia; la exportación no depende de la variable
- [x] 4.5 TRIANGULATE: dos casos de `x15ac:absPath` — UNC histórica en OP y `C:\Users\jerem\Desktop\` en costeo — verificando conservación byte-a-byte y sin fuente de datos
- [x] 4.6 REFACTOR: centralizar la lectura de configuración en un puerto del adaptador, sin literal de UNC en código ni en fixtures

## 5. Plantilla ausente y contrato HTTP 500

- [x] 5.1 RED: test que falla cuando falta `MASTER COSTEO NUEVO.xlsx` y exige error tipado `plantilla_no_encontrada`
- [x] 5.2 RED: test que falla cuando falta `A - OP-MASTER.xlsx` y exige el mismo contrato con el nombre de la plantilla ausente
- [x] 5.3 GREEN: resolver la carga desde `EXCEL_TEMPLATES_DIR` y devolver el error tipado con mensaje operativo, sin crear workbook ni continuar con datos parciales
- [x] 5.4 RED: test del doble de ruta que falla si la traducción HTTP no devuelve 500 con `{ error: 'plantilla_no_encontrada', message }`
- [x] 5.5 TRIANGULATE: dos casos adicionales — sin `Content-Disposition` y sin `Buffer` de `.xlsx` en la respuesta de error
- [x] 5.6 REFACTOR: separar la traducción del error de la lógica de carga, sin implementar endpoints de producción que pertenecen a `C-14`/`C-15`

## 6. Celda maestra `O7` con `ID Plano: <valor>` / `ID Plano: S/P`

- [x] 6.1 RED: test que falla si `O7:R8` no está combinada, si `O7` no está vacía con `s="73"`, si `J7:N8` no contiene `PC N°: ` o si `ID Plano:` / `S/P` aparecen en `sharedStrings.xml`
- [x] 6.2 RED: test que falla si un `codigoPlano` no nulo no produce exactamente `ID Plano: <codigoPlano>` en `O7` con `t="inlineStr"`
- [x] 6.3 RED: test que falla si `codigoPlano === null` no produce exactamente `ID Plano: S/P` en `O7`
- [x] 6.4 GREEN: formatear el valor ya normalizado por el dominio, sin prefijo `PL-`, conservando estilo `s="73"` y merge `O7:R8`
- [x] 6.5 TRIANGULATE: dos casos — entrada `' pl-2026-045 '` normalizada a `ID Plano: PL-2026-045` y entrada vacía normalizada a `ID Plano: S/P` — con `sharedStrings.xml` intacto en ambos
- [x] 6.6 TRIANGULATE: dos casos verificando que `J7:N8`, `_xlnm.Print_Area` y `printerSettings1.bin` permanecen byte-a-byte tras la escritura de `O7`
- [x] 6.7 REFACTOR: mover la decisión de rango a un descriptor configurado por evidencia, sin literales de celda en `packages/domain/` (R2, DD-11)

## 7. Informe/ADR con las cinco decisiones aprobadas

- [x] 7.1 RED: test de contrato documental que falla si el ADR no contiene Estado, Contexto, Decisión, Alternativas, Justificación, Trade-offs y Trazabilidad
- [x] 7.2 RED: test que falla si no figuran las cinco decisiones con la evidencia de 577.125 B en OP, 994 B en costeo, las 12 `[1]` neutralizadas, `ID Plano: <valor>` / `ID Plano: S/P` en `O7`, la UNC sin uso en runtime y el gate en doble capa
- [x] 7.3 RED: test que falla si no constan el descarte del guardado/reapertura con `exceljs` con sus tamaños, DD-02 enmendada, IN-08 condicionada al ADR y firma, o si aparece DD-14
- [x] 7.4 GREEN: redactar el ADR con alternativas y trade-offs, decisor usuario en nombre de Velco (2026-11-26) y compuerta para C-13/C-14/C-15
- [x] 7.5 TRIANGULATE: dos casos documentales — checklist firmada y checklist ausente — verificando que el ADR no cambia el veredicto del `verify-report.md` por sí solo
- [x] 7.6 REFACTOR: completar la trazabilidad cruzada entre ADR, specs delta, `CHANGES.md` y documentación canónica

## 8. Gate automatizado de validación

- [x] 8.1 RED: test que falla si el comparador no calcula el hash de todas las piezas OOXML y no limita el diff a las 12 celdas maestras más `O7` cuando corresponde
- [x] 8.2 GREEN: implementar el comparador por hash con informe de diferencias que incluya hoja, celda, valor esperado y valor obtenido
- [x] 8.3 TRIANGULATE: tres casos — diff autorizado que pasa, cambio en `externalLink1.xml` que falla y cambio en `printerSettings1.bin` que falla
- [x] 8.4 RED: test que falla si `_xlnm.Print_Area` no es exactamente `'1640'!$A:$S` o si aparece `$ANaN:$SNaN`
- [x] 8.5 RED: test que falla si `O7` no contiene el texto exacto esperado o si `PC N°: ` en `J7:N8` dejó de estar intacto
- [x] 8.6 RED: test que falla si, sin plantilla, la respuesta no es 500 sin workbook ni `Content-Disposition`
- [x] 8.7 GREEN/TRIANGULATE: dos casos de `openspec validate excel-template-spike --strict` y `openspec validate --specs --strict`, verificando que el gate detecta un delta inválido y acepta el válido
- [x] 8.8 REFACTOR: mantener el comparador como función pura y tipada en el adaptador, sin `any` ni frameworks en `packages/domain/`

## 9. Checklist manual, `openspec verify` y compuerta de archive

- [x] 9.1 RED: test documental que falla si el `verify-report.md` no incluye la checklist manual (a)–(g) con firma del usuario en nombre de Velco
- [x] 9.2 GREEN: ejecutar `openspec verify excel-template-spike --strict` y generar `verify-report.md` con el resultado del gate automático y la checklist firmada, fecha, versión de Excel y responsable
- [x] 9.3 TRIANGULATE: dos casos — checklist completa firmada que permite READY FOR ARCHIVE y checklist ausente que marca CRITICAL, sin archive de C-13 ni habilitación de C-15
- [x] 9.4 RED: test que falla si no consta que esa firma es compuerta de GATE 11 de C-14 y que el decisor es el usuario en nombre de Velco
- [x] 9.5 GREEN: registrar la compuerta con referencia al precedente `openspec/changes/archive/2026-11-25-desvios-y-margen-domain/verify-report.md`
- [x] 9.6 REFACTOR: dejar el reporte como evidencia de verificación; el archive y el marcado de tareas quedan para el flujo OPSX posterior a la firma

## 10. Verificación final del apply sin build

- [x] 10.1 Ejecutar únicamente los tests de contrato del spike con Vitest y registrar el resultado; no ejecutar build
- [x] 10.2 Verificar aislamiento de `packages/domain/` (sin `exceljs`, Fastify, Prisma ni React) y tipado estricto sin `any`
- [x] 10.3 Ejecutar `openspec status --change excel-template-spike --json`, `openspec validate excel-template-spike --strict` y `openspec validate --specs --strict`
- [x] 10.4 Verificar `git status --short` y confirmar con búsqueda textual que no queda el guardado/reapertura con `exceljs` como mecanismo de escritura ni atribución del enlace grande a costeo
- [x] 10.5 No hacer commit ni push sin solicitud explícita, y no marcar tareas como completadas ni archivar el change desde esta verificación
