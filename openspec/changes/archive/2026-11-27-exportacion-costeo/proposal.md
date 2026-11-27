## Why

C-11 entrega los derivados de costos, horas y márgenes y C-13 cierra el spike de Excel con parche OOXML quirúrgico, `externalLinks/*` conservados y las 12 fórmulas `[1]` neutralizadas; sin embargo, hoy no existe ninguna exportación económica de una OP. Sin C-14, HU-20A no puede verificarse, el camino crítico `C-11 → C-14 → C-15 → C-16` queda detenido y el modelo semántico de C-11 no tiene MAP a las celdas reales de `MASTER COSTEO NUEVO.xlsx`.

## What Changes

- Definir la función pura `exportOp(opId, { incluirMargenes })` sobre entradas ya cargadas y un único MAP entidades → celdas; con `incluirMargenes: true` produce el modelo de costeo (cliente, `numeroOp` en `C7:R7`, bloque único `B38:R59` con descripciones prefijadas `[MP]` / `[INSUMOS]` / `[TERCERIZADOS]`, `UN / COST. UNIT. / COSTO TOTAL`, `horasReales` en `TOTAL horas`, `horasVendidas` solo en modelo/comparativa, valor hora y comparativa de márgenes) reutilizando `construirModeloPlanilla` y sin calcular derivados por su cuenta (R2, R3, RN-EXPORT-05).
- Ampliar el inventario autorizado del patcher de C-13 solo para la hoja `1` (`xl/worksheets/sheet2.xml`): además de las 12 celdas maestras `C6`/`C7`, escribir solo las celdas del MAP acordado en esa hoja; las hojas `2`..`5` y `GENERAL` son distintas, permanecen byte-a-byte intactas y Velco las completa MANUALMENTE tras la descarga, sin que ello sea un fallo CRITICAL de la compuerta automática. Se conservan estilos, merges, fórmulas propias, `externalLinks/*`, `calcChain.xml`, `printerSettings1.bin`, logotipo y `x15ac:absPath`; `exceljs` 4.4.0 queda exclusivamente para lectura y verificación (DD-02, R6).
- Implementar el adaptador en `backend/src/features/exportacion/excel/` que copia la plantilla desde `EXCEL_TEMPLATES_DIR`, aplica el parche, devuelve un `Buffer` y fija `Content-Disposition: COSTEO_[NroOP]_[Cliente].xlsx` con un nombre saneado, sin rutas del servidor (RN-EXPORT-01/02).
- Exponer `GET /api/ops/:id/export?variante=costeo` con validación Zod de parámetros y query, 200 con el `.xlsx`, 404 para OP inexistente, 422 para parámetros inválidos y 500 operativo `plantilla_no_encontrada` sin `Content-Disposition` ni archivo parcial (contrato ya especificado en `excel-plantilla-ausente`).
- Fijar el redondeo comercial a dos decimales exclusivamente en la frontera de exportación, sobre decimales exactos del dominio, sin `number`, `parseFloat` ni derives persistidos (RN-MARGEN-05, R9).
- Ejecutar TDD estricto (RED → GREEN → TRIANGULATE ≥ 2 casos → REFACTOR) con SAFETY NET de hashes de plantillas: test del MAP puro, contrato compartido con la variante de C-15, gate por hash del parche OOXML limitado a la hoja `1`, cotejo del costeo generado a partir de una OP real y compuerta manual en Excel firmada por el usuario en nombre de Velco, con el llenado MANUAL posterior de hojas `2`..`5`/`GENERAL` documentado como paso del flujo; no existe costeo histórico de Velco y la evidencia automática por sí sola no prueba renderizado.
- Gobernanza **MEDIO**: las decisiones no obvias (forma pura de `exportOp`, extensión del inventario de celdas y alcance de la comparativa de márgenes) se registran en `design.md` con alternativas y trade-offs, y quedan explícitas como confirmaciones requeridas antes del `apply` cuando corresponda; no se inventan decisiones `DD-NN`.

## Capabilities

### New Capabilities
- `exportacion-costeo-op`: función pura `exportOp` con MAP entidades → celdas, modelo de costeo por OP, nombre de descarga `COSTEO_[NroOP]_[Cliente].xlsx` y endpoint `GET /api/ops/:id/export?variante=costeo`.

### Modified Capabilities
- `modelo-planilla-compartido`: el MAP semántico → celdas es único, reutilizable por C-14 y C-15, y no introduce un segundo constructor ni derivados en el adaptador.
- `excel-roundtrip-plantillas`: extiende el inventario de celdas autorizadas de `MASTER COSTEO NUEVO.xlsx` para el contenido económico exigido por HU-20A, manteniendo el gate por hash y la preservación byte-a-byte de las piezas críticas.
- `excel-plantilla-ausente`: el contrato `plantilla_no_encontrada` pasa a consumirse en el endpoint real de costeo, sin workbook improvisado ni descarga parcial.
- `costos-y-margen-real`: el redondeo a dos decimales se fija explícitamente en la frontera de exportación de C-14/C-15, sin conversión a coma flotante.

## Impact

- Código: `packages/domain/src/exportacion/` (MAP y modelo puro), `backend/src/features/exportacion/{application,excel,http}/` (caso de uso, adaptador y ruta), registro de rutas y esquema de errores en `backend/src/features/salud/http/app.ts`; reutilización de `backend/src/features/exportacion/excel/{inventario,patcher,gate,xml,zip,carga,configuracion,respuesta}.ts` y de las utilidades de `backend/test/excel-template-spike/soporte.ts`.
- Plantillas: `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` solo como activo de lectura; `EXCEL_TEMPLATES_DIR` obligatorio; `EXCEL_UNC_BASE` permanece como referencia histórica sin uso en runtime.
- API: nueva ruta de descarga; sin cambios de esquema de PostgreSQL ni migraciones; sin UI, sin impresión y sin ZIP.
- Dependencias: `exceljs` 4.4.0, Vitest 5.1.1, zod 4.6.7 y Fastify 5.12.8 ya fijados; R10 aplica solo a tests de integración con BD real.
- Gobernanza: MEDIO; C-13 dejó GATE 11 habilitado con checklist firmada el 2026-11-26 (Excel 2611), por lo que no se reabre la compuerta del spike, pero C-14 exige su propia verificación manual del costeo exportado.
