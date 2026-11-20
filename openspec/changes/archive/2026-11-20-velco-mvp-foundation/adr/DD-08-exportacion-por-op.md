# DD-08 — Exportación por OP con plantillas oficiales

Versión: 1
Estado: Aceptada

## Contexto

HU-20A y HU-20B exigen un archivo independiente por orden de producción sobre las plantillas reales. La documentación vigente no pide consolidado alguno.

## Decisión

`exportOp(opId, { incluirMargenes })` es una función pura; los adaptadores rellenan `MASTER COSTEO NUEVO.xlsx` y `A - OP-MASTER.xlsx`. Un archivo por OP. No hay ZIP ni workbook con hoja resumen: requieren confirmación futura.

## Alternativas

- Exportación consolidada en ZIP: sin respaldo documental, requiere confirmación futura.
- Workbook con hoja resumen y hojas por OP: sin respaldo documental.
- Un único archivo por rango de fechas sin desglose: rompe la unidad por OP.

## Justificación

Mantiene continuidad documental: un archivo equivale a una OP con el formato oficial.

## Trade-offs

Exportar muchas OP requiere N descargas. La firma de `exportOp` queda congelada desde el inicio. IN-09 quedó resuelta por el usuario: no se recuperan documentos obsoletos ni se usa PIN como requisito.

## Trazabilidad

[CHANGES.md](../../../../CHANGES.md) C-01, C-13, C-14; [design.md](../design.md) D10; [knowledge-base/09_decisiones_y_supuestos.md](../../../../knowledge-base/09_decisiones_y_supuestos.md) DD-08; [knowledge-base/10_preguntas_abiertas.md](../../../../knowledge-base/10_preguntas_abiertas.md) IN-05 e IN-09.
