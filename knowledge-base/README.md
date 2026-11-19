# Software-de-Seguimiento-Velco- — Base de Conocimiento

Base de conocimiento generada en **Mode A (ingest silencioso)** a partir de los documentos del proyecto y de las decisiones de la conversación de fundación. Todo el contenido está en español; no incluye código de aplicación.

## Índice de Archivos

| Archivo | Contenido |
|---|---|
| [01_vision_y_objetivos.md](01_vision_y_objetivos.md) | Propósito, principios de producto, actores, alcance v1.0, fuera de alcance y métricas |
| [02_descripcion_general.md](02_descripcion_general.md) | Stack elegido, arquitectura general, integraciones, API REST y derivados |
| [03_actores_y_roles.md](03_actores_y_roles.md) | Actores reales del MVP, matriz RBAC actual y planificada, rutas |
| [04_modelo_de_datos.md](04_modelo_de_datos.md) | Dominios, ERD, entidades, constraints, índices, agregados derivados y seed |
| [05_reglas_de_negocio.md](05_reglas_de_negocio.md) | Reglas `RN-XX-NN`: OP, etapas, semáforo, horas, márgenes, exportación, auth |
| [06_funcionalidades.md](06_funcionalidades.md) | 20 historias en 5 épicas con criterios de aceptación y trazabilidad de sprints |
| [07_flujos_principales.md](07_flujos_principales.md) | 8 flujos extremo a extremo con diagramas ASCII y casos de error |
| [08_arquitectura_propuesta.md](08_arquitectura_propuesta.md) | Patrones, árbol de directorios, seguridad, env vars, testing, spike Excel |
| [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md) | 10 decisiones `DD-NN` + 6 supuestos `SU-NN` con riesgo y validación |
| [10_preguntas_abiertas.md](10_preguntas_abiertas.md) | 9 inconsistencias `IN-NN` (6 resueltas/diferidas, 3 abiertas) y preguntas priorizadas |
| [README.md](README.md) | Este índice |

## Quick Start para Desarrolladores

1. Entender el dominio → [01](01_vision_y_objetivos.md), [03](03_actores_y_roles.md)
2. Entender los datos → [04](04_modelo_de_datos.md)
3. Entender las reglas → [05](05_reglas_de_negocio.md)
4. Entender la arquitectura → [02](02_descripcion_general.md), [08](08_arquitectura_propuesta.md)
5. Implementar → [07](07_flujos_principales.md), [06](06_funcionalidades.md)
6. Antes de codificar → [10](10_preguntas_abiertas.md) y [09](09_decisiones_y_supuestos.md)

**Orden de fundación del proyecto:** openspec init (ya ejecutado) → esta KB → `CHANGES.md` → `AGENTS.md` → change `velco-mvp-foundation`.

## Resumen Ejecutivo

Velco SRL necesita visibilidad centralizada de sus Órdenes de Producción: avance por etapas, control dual de plazo (semáforo) y horas (Reales vs. Vendidas), y rentabilidad por OP. El MVP es una aplicación web de un solo usuario —el gerente general— construida con React/Vite + TypeScript + Fastify + PostgreSQL/Prisma, con dominio hexagonal y TDD con Vitest. La grilla única de tarjetas autocontenidas reemplaza al Kanban, el avance se deriva del checklist, y las dos planillas oficiales se exportan por separado rellenando las plantillas `.xlsx` existentes con `exceljs`. No hay login (R5), no hay ZIP consolidado porque los documentos vigentes no lo piden, y la tasa por etapa quedó descartada del MVP (su reconsideración está diferida a Fase 2 según DD-04).

## Fuentes de la KB

- `Docs/definici_n_del_mvp_velco.md` (124 líneas) — MVP, reglas, fórmulas, esquema SQL y sprints.
- `Docs/historias_de_usuario_velco.md` (165 líneas) — 20 historias en 5 épicas.
- `Docs/tablero-taller-v2.html` (173 líneas) — prototipo visual y semáforo.
- `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` y `Docs/FichasExcel/A - OP-MASTER.xlsx` — plantillas oficiales.
- `Docs/MVP.md`, `Docs/HistoriasDeUsuario.md` y `Docs/Relevamiento.pdf` no son fuente: borrado deliberado por obsoletos (IN-09).
- Decisiones 1–10 de la conversación de fundación, consolidadas en [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md).
