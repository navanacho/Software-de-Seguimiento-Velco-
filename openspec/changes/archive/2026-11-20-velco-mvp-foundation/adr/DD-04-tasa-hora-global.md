# DD-04 — Tasa de hora global con corrección diferida

Versión: 1
Estado: Aceptada

## Contexto

La plantilla de costeo expone `COST. UNIT.` por operación, mientras el documento vigente define solo `configuracion.valor_hora_estandar` como tasa global; HU-16 calcula con ese valor sin definir categorías.

## Decisión

Usar `valor_hora_estandar` como tasa única para mano de obra en todo el MVP. Registrar como corrección diferida la evolución a tarifas por etapa o categoría.

## Alternativas

- `valor_hora` por `etapas_orden`.
- Tabla de categorías o tarifas con vigencia por fecha.

## Justificación

Evita diseñar una tabla de tarifas que Velco todavía no definió y reduce la configuración del MVP.

## Trade-offs

El margen por etapa puede desviarse de la planilla oficial en operaciones con costo unitario propio; la corrección implicará migración y recálculo histórico. IN-02 queda diferida a Fase 2.

## Trazabilidad

[CHANGES.md](../../../../CHANGES.md) C-01, C-02; [design.md](../design.md) D1; [knowledge-base/09_decisiones_y_supuestos.md](../../../../knowledge-base/09_decisiones_y_supuestos.md) DD-04; [knowledge-base/10_preguntas_abiertas.md](../../../../knowledge-base/10_preguntas_abiertas.md) IN-02.
