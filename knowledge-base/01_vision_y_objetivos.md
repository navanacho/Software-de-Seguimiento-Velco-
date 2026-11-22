# Visión y Objetivos

## Propósito del sistema

Velco SRL necesita una herramienta web centralizada para seguir sus Órdenes de Producción (OP/OT): saber qué se está haciendo, en qué etapa está cada trabajo, cuántas horas reales se consumieron frente a las vendidas y si el trabajo sigue siendo rentable.

Hoy la información vive dispersa entre el tablero visual del prototipo, los partes de horas y dos planillas Excel oficiales (`MASTER COSTEO NUEVO.xlsx` y `A - OP-MASTER.xlsx`). El MVP unifica esa información en una única fuente de verdad sin reemplazar los formatos contables y operativos que Velco ya usa. **No es un sistema de tracking de flotas**: la entidad raíz es `ordenes_trabajo` y el domino es gestión de producción de un taller metalúrgico.

## Principios de producto

1. **Grilla única con tarjetas autocontenidas, sin columnas Kanban.** Cada tarjeta es una OP y contiene su propia lista ordenada de etapas. La primera etapa pendiente lleva el badge `ahora`.
2. **Control dual de plazo y horas.** El semáforo evalúa la fecha de entrega; el termómetro compara `Horas Reales / Horas Vendidas` contra el avance físico.
3. **Continuidad documental.** Las dos planillas oficiales se exportan por separado, preservando el formato de Velco. Se genera un archivo económico y otro operativo, nunca un único workbook con hoja resumen en el MVP.

## Objetivos por actor

| Actor | Objetivo principal | Objetivos secundarios |
|---|---|---|
| Gerente general (único usuario del MVP) | Ver el estado real y la rentabilidad de cada OP sin armar planillas a mano | Consultar `/dashboard`; ajustar valor hora y umbrales; exportar costeo con márgenes |
| Jefe de taller | Balancear carga entre sectores viendo la etapa `ahora` de cada trabajo | Reordenar etapas por OP; detectar atrasos |
| Presupuestista / administración | Cargar la línea base de horas vendidas y materiales cotizados | Comparar lo cotizado contra lo real; exportar `COSTEO_[NroOP]_[Cliente].xlsx` |
| Operario / supervisor (Fase 2) | Imputar horas y avanzar etapas desde el tablero | Sin acceso a montos económicos (Fase 2) |
| Encargado de planta (Fase 2) | Proyectar el tablero en modo TV solo lectura | Tema claro/oscuro y actualización automática |

> En el MVP **una sola persona** —el gerente general— ejecuta todas estas responsabilidades y ve **todos los montos**. Los actores de la tabla son roles funcionales, no cuentas de usuario.

## Alcance v1.0 (MVP)

- **Épica 1 — Órdenes y presupuesto base:** HU-01, HU-02, HU-04.
- **Épica 2 — Tablero operativo:** HU-05, HU-06, HU-07, HU-09.
- **Épica 3 — Horas reales:** HU-10, HU-13.
- **Épica 4 — Comparativa, dashboard y costos:** HU-14, HU-15, HU-16, HU-21 (`/dashboard` con KPIs, promedios por etapa y tabla de desvíos).
- **Épica 5 — Configuración y exportación:** HU-18, HU-20A, HU-20B.
- Semáforo de plazo, alerta de desvío de horas y cálculo de margen por OP.
- `codigo_plano` opcional y único cuando está presente (HU-01), con búsqueda global por OP/plano/cliente/pieza (HU-09).
- Exportación `.xlsx` dual basada en las plantillas existentes, con `exportOp(opId, { incluirMargenes })` como función pura.
- `listOps({ fechaDesde, fechaHasta, estado })` con filtros por cliente y etapa actual, según HU-09. El rango de fechas filtra `fecha_entrega` (fecha comprometida), no fecha de ejecución.
- Tokens visuales y anatomía de componentes según `Docs/design_system_velco.md`, implementados con CSS Modules y `clsx`.
- Arquitectura hexagonal con dominio separado de framework y base de datos; TDD estricto con Vitest.

## Fuera de alcance

### Diferido a Fase 2

- HU-03: importación automática desde Excel/CSV.
- HU-08: modo Kiosco/TV con auto-refresh.
- HU-11: cronómetro en vivo; HU-12: reprocesos vs. adicionales.
- HU-17: analítica histórica avanzada y tendencias por cliente (el dashboard general HU-21 sí está en el MVP).
- HU-19: roles `Admin/Oficina` (ve costos y márgenes) y `Taller` (ve tablero, avanza etapas y carga horas sin ver montos). Cualquier auth/PIN/RBAC requiere aprobación humana explícita (R5).
- Tasa de hora por etapa/categoría (la plantilla de costeo expone `COST. UNIT.` por operación).
- `usuario_id` nullable en `registros_horas`.

### Explícitamente descartado

- Columnas Kanban: la tarjeta no se mueve entre columnas.
- Slider manual de porcentaje de avance: el avance es derivado de etapas completadas.
- Detalle de materiales en una columna JSONB: se normaliza en `materiales_orden`.
- Generar los `.xlsx` desde cero: se cargan y rellenan las plantillas oficiales.
- Exportación consolidada (ZIP o workbook con hoja resumen): sin respaldo en documentación vigente; no incluida en MVP; requiere confirmación futura (DD-08).
- Next.js, SQLite, Python/openpyxl. Ver [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md).

## Métricas de éxito

- **Visibilidad:** toda OP activa muestra etapa `ahora`, días restantes/atraso y semáforo sin cálculo manual.
- **Fidelidad horizontal:** `Horas Reales`, `Horas Vendidas` y `% de avance` se muestran juntos en la tarjeta (HU-14).
- **Rentabilidad:** cada OP terminada tiene margen real calculado con la tasa global y el costo material real.
- **Continuidad documental:** los dos archivos exportados abren con la estructura visual de las plantillas oficiales y se descargan por separado.
- **Calidad:** reglas puras de semáforo, horas y márgenes cubiertas por tests unitarios antes de su integración; cero lógica de dominio dentro de componentes React o handlers Fastify.

## Fuentes

- `Docs/definici_n_del_mvp_velco.md` — ámbito, fórmulas, SQL y sprints.
- `Docs/historias_de_usuario_velco.md` — historias en 5 épicas y 3 principios de diseño; incluye HU-21.
- `Docs/design_system_velco.md` — tokens, tipografía, anatomía de componentes y mapeo a implementación.
- `Docs/tablero-taller-v2.html` — prototipo visual, semáforo y etiqueta `ahora`.
- `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` y `Docs/FichasExcel/A - OP-MASTER.xlsx` — plantillas oficiales.
- `Docs/MVP.md` y `Docs/HistoriasDeUsuario.md` no son fuente: borrado deliberado por obsoletos (IN-09).
- Decisiones de la conversación de fundación, consolidadas en [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md).
