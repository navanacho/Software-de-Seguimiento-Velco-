# DD-02 — Estrategia Excel sobre plantillas oficiales

Versión: 1
Estado: Aceptada

## Contexto

La continuidad contable y operativa de Velco depende de `MASTER COSTEO NUEVO.xlsx` y `A - OP-MASTER.xlsx`, con fórmulas, celdas combinadas y bloques propios.

## Decisión

Cargar y rellenar esas plantillas con `exceljs` 4.4.0; nunca generar `.xlsx` desde cero (R6). `incluirMargenes` es parámetro de la exportación. La ruta UNC se lee desde `EXCEL_UNC_BASE`, sin literales en código.

## Alternativas

- Generar `.xlsx` nuevos recreando estilos: rompe fórmulas y disposición oficial.
- Exportar CSV o reportes HTML/PDF: pierde continuidad documental.

## Justificación

Principio 3 del producto y criterios de HU-20A/HU-20B: preservar el formato oficial.

## Trade-offs

Dependencia de archivos binarios como activos del servidor y fragilidad ante cambios de plantilla. Queda abierto IN-08 por el enlace externo de ~577 KB y la ruta UNC; se resuelve en el spike C-13 antes de C-14.

## Trazabilidad

[CHANGES.md](../../../../CHANGES.md) C-01, C-13, C-14; [design.md](../design.md) D10; [knowledge-base/09_decisiones_y_supuestos.md](../../../../knowledge-base/09_decisiones_y_supuestos.md) DD-02; [knowledge-base/10_preguntas_abiertas.md](../../../../knowledge-base/10_preguntas_abiertas.md) IN-08.
