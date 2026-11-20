# DD-07 — Autenticación diferida a Fase 2

Versión: 1
Estado: Aceptada con riesgo abierto

## Contexto

El MVP lo usa una sola persona. HU-19 (Fase 2) diferencia Admin/Oficina, que ve costos y márgenes, de Taller, que no ve montos en pesos. Los documentos vigentes no definen PIN ni mecanismo de autenticación.

## Decisión

No existe tabla `usuarios`, login, PIN ni RBAC en el MVP; un único usuario ve todos los montos. Cualquier implementación de autenticación requiere aprobación humana explícita (R5). La variante `incluirMargenes: false` cubre la necesidad operativa inmediata sin inventar identidades.

## Alternativas

- PIN simple para el MVP: descartado por R5 y sin respaldo documental.
- Login completo desde el día uno: fuera de alcance.
- Ocultar columnas de dinero solo con CSS: no resuelve visibilidad real.

## Justificación

El objetivo es validar tablero, horas y costos con un único usuario, sin mezclar seguridad con validación del modelo de negocio.

## Trade-offs

Cualquier persona con acceso a la app ve montos; no hay auditoría de quién modificó horas. Riesgo abierto: requiere decisor humano y diseño aprobado antes de Fase 2. Despliegue asumido en intranet.

## Trazabilidad

[CHANGES.md](../../../../CHANGES.md) C-01; [design.md](../design.md) D10; [knowledge-base/09_decisiones_y_supuestos.md](../../../../knowledge-base/09_decisiones_y_supuestos.md) DD-07; [knowledge-base/10_preguntas_abiertas.md](../../../../knowledge-base/10_preguntas_abiertas.md) IN-04.
