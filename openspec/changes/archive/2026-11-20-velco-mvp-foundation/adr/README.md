# Decisiones arquitectónicas versionadas

Índice de los ADR DD-01…DD-10 del change `velco-mvp-foundation`, trazables a [CHANGES.md](../../../../CHANGES.md) y a [knowledge-base/](../../../../knowledge-base/).

| ADR | Decisión | Estado |
|---|---|---|
| [DD-01](DD-01-stack-tecnologico.md) | Stack Opción B con versiones exactas | Aceptada |
| [DD-02](DD-02-estrategia-excel.md) | Excel sobre plantillas oficiales | Aceptada |
| [DD-03](DD-03-avance-derivado.md) | Avance derivado de etapas | Aceptada |
| [DD-04](DD-04-tasa-hora-global.md) | Tasa de hora global | Aceptada |
| [DD-05](DD-05-materiales-normalizados.md) | Materiales normalizados | Aceptada |
| [DD-06](DD-06-clientes-entidad-propia.md) | Clientes como entidad propia | Aceptada |
| [DD-07](DD-07-auth-diferida.md) | Autenticación diferida | Aceptada con riesgo abierto |
| [DD-08](DD-08-exportacion-por-op.md) | Exportación por OP | Aceptada |
| [DD-09](DD-09-skills-instaladas.md) | Skills de apoyo | Aceptada |
| [DD-10](DD-10-fundacion-openspec.md) | Fundación con OpenSpec | Aceptada |

## Riesgos abiertos

| Riesgo | Estado | Decisor | Siguiente hito |
|---|---|---|---|
| IN-08 — enlace externo de ~577 KB y ruta UNC en `MASTER COSTEO NUEVO.xlsx` | ABIERTA (spike) | Equipo técnico + Velco (acceso al servidor) | Spike C-13, bloqueante de C-14: preservar, eliminar o reemplazar el enlace |
| DD-07 — ausencia de autenticación en el MVP | ABIERTA (diferida) | Aprobación humana explícita (R5) | Diseño de Fase 2 según HU-19; sin código de auth/PIN/RBAC hasta su aprobación |

IN-08 no se da por resuelta: su resultado depende del spike de Excel. DD-07 no se resuelve silenciosamente: cualquier cambio de auth requiere aprobación humana explícita.

## Decisiones resueltas

IN-09 está **RESUELTA** por el dueño del repositorio: `Docs/MVP.md` y `Docs/HistoriasDeUsuario.md` se borraron deliberadamente por obsoletos; la documentación vigente del repositorio es la fuente y **no se recuperan** documentos del historial de git. En consecuencia, la exportación consolidada en ZIP no es requisito del MVP, el PIN no es requisito (pertenece a la auth diferida) y la firma de exportación usa plantillas oficiales por OP con `incluirMargenes` como parámetro.

En cuanto a roles, solo se contempla HU-19 en Fase 2: Admin/Oficina puede ver costos y márgenes; Taller ve el tablero y carga horas **sin montos**. No se implementa auth, PIN ni RBAC en el MVP (R5).
