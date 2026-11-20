# DD-05 — Materiales normalizados y agregados derivados

Versión: 1
Estado: Aceptada

## Contexto

Las plantillas exigen detalle por ítem con remito, factura, NT y PO; el SQL original guardaba solo dos agregados escalares en la orden de trabajo.

## Decisión

Crear `materiales_orden` con tipo (`MP`, `INSUMOS`, `TERCERIZADOS`), descripción, cantidad, unidad, costos cotizado y real, remito, factura, NT y PO. Los agregados `costo_materiales_cotizado` y `costo_materiales_real` se derivan por sumatoria y no se persisten (R3). Se descarta JSONB.

## Alternativas

- Columna JSONB con el detalle.
- Agregados escalares sin detalle.
- Tabla maestra global de materiales desde el MVP.

## Justificación

Normalizar permite consultar, filtrar y exportar cada ítem; los derivados evitan desincronización.

## Trade-offs

Más filas y un `ENUM` a migrar si aparecen nuevos tipos; `costo_unitario_real` nullable obliga a usar `COALESCE`.

## Trazabilidad

[CHANGES.md](../../../../CHANGES.md) C-01, C-02; [design.md](../design.md) D7; [knowledge-base/09_decisiones_y_supuestos.md](../../../../knowledge-base/09_decisiones_y_supuestos.md) DD-05; [knowledge-base/10_preguntas_abiertas.md](../../../../knowledge-base/10_preguntas_abiertas.md) IN-03.
