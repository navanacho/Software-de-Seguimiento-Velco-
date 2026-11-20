# DD-03 — Avance derivado de etapas

Versión: 1
Estado: Aceptada

## Contexto

El prototipo tiene un slider de avance y el SQL original una columna `porcentaje_avance`; HU-07 indica que tildar etapas actualiza el progreso. Dos fuentes de verdad producirían estados contradictorios.

## Decisión

`porcentaje_avance` NO se persiste. Se deriva de `etapas_orden.completada` como `100 * completadas / total`; todas tildadas implica 100%. Se elimina el slider del prototipo (R3).

## Alternativas

- Mantener la columna y sincronizarla con el checklist: divergencia garantizada.
- Avance ponderado por horas: sin respaldo en HU-07/HU-08; fuera del MVP.

## Justificación

El checklist es la señal operativa real; un valor manual agrega fricción y permite inconsistencias.

## Trade-offs

Todas las etapas pesan lo mismo, sin distinción por horas o dificultad; limitación conciente del MVP.

## Trazabilidad

[CHANGES.md](../../../../CHANGES.md) C-01, C-02; [design.md](../design.md) D7; [knowledge-base/09_decisiones_y_supuestos.md](../../../../knowledge-base/09_decisiones_y_supuestos.md) DD-03; [knowledge-base/10_preguntas_abiertas.md](../../../../knowledge-base/10_preguntas_abiertas.md) IN-01.
