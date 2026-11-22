# Reglas de Negocio

Cada regla tiene un código único `RN-{DOMINIO}-{NN}` para trazabilidad. La evidencia documental se cita entre paréntesis. Los derivados se implementan como funciones puras en el dominio y se testean con Vitest.

## Dominio: Órdenes de producción (RN-OP)

- **RN-OP-01 — Unicidad de OP:** `numero_op` es único en todo el sistema; la validación ocurre al guardar (Docs: HU-01 CA).
- **RN-OP-02 — Datos obligatorios:** toda OP tiene cliente, descripción de pieza, fecha de ingreso, fecha de entrega y monto vendido (Docs: HU-01).
- **RN-OP-03 — Entidad raíz:** el seguimiento gira alrededor de `ordenes_trabajo`; no existe seguimiento de flotas ni de vehículos.
- **RN-OP-04 — Cliente normalizado:** el cliente se resuelve por `cliente_id` contra `clientes`; no se acepta texto libre en la OP (Decisión 6).
- **RN-OP-05 — ID de plano opcional y único:** `codigo_plano VARCHAR(80)` es nullable; si está presente es único en toda la base mediante índice parcial `WHERE codigo_plano IS NOT NULL`. Varias OP pueden no tener plano (`NULL` / `Sin plano`) (Docs: HU-01 CA; DD-11).
- **RN-OP-06 — Normalización y conflicto de plano:** en la frontera HTTP se aplica `trim()` + `toUpperCase()`; cadena vacía ⇒ `NULL`; `CHECK` prohíbe `''`. Duplicado ⇒ `409 {error:'codigo_plano_duplicado', message:'El ID de plano PL-2026-045 ya está asignado a la OP 1871.', codigoPlano:'PL-2026-045', opExistente:{id:'<uuid>', numeroOp:'1871'}}`, con fallback a P2002 por carrera (DD-11).

## Dominio: Etapas y avance (RN-ETAPA / RN-AVANCE / RN-AHORA)

- **RN-ETAPA-01 — Lista por OP:** cada tarjeta posee su propia lista ordenada de etapas; se pueden agregar, quitar y reordenar en cualquier momento (Docs: HU-04 CA).
- **RN-ETAPA-02 — Plantilla inicial:** al crear una OP se precargan las etapas de `configuracion.etapas_default`: Corte → Soldadura → Mecanizado → Pintura → Entrega (Docs: §3 SQL; Decisión 3).
- **RN-ETAPA-03 — Lista no canónica:** la ruta real puede incluir Plegado, Pulido, Torneado, Fresado, Rectificado, Control o Galvanizado según la pieza (Docs: `tablero-taller-v2.html`). No se fuerza un taxón cerrado.
- **RN-AVANCE-01 — Avance derivado:** `porcentaje_avance` NO se persiste ni se edita con un slider. Se calcula como `100 * etapas_completadas / total_etapas`, redondeado a entero; sin etapas, avance = 0 (Decisión 3; resuelve la inconsistencia IN-01).
- **RN-AVANCE-02 — Terminación por checklist:** si todas las etapas están tildadas, el avance pasa a 100 automáticamente (Docs: HU-07 CA; prototipo `change` handler de `ck`).
- **RN-AHORA-01 — Etapa actual:** la primera etapa con `completada = false` en `orden_secuencia` recibe el badge `ahora`. Si no hay pendientes, el estado es `Todo listo` (Docs: HU-07 CA; prototipo `actual(j)`).
- **RN-FLujo-01 — Tira de flujo:** el indicador *"Dónde está cada trabajo ahora"* agrupa y cuenta las órdenes activas por nombre de etapa `ahora` (Docs: HU-06 CA; prototipo `render()`).

## Dominio: Semáforo de plazo (RN-SEMAFORO)

Evidencia: `Docs/definici_n_del_mvp_velco.md` §2.B y `Docs/historias_de_usuario_velco.md` HU-05 CA.

- **RN-SEMAFORO-01 — Terminado (gris):** el estado es `Terminado` cuando `porcentaje_avance = 100` **o** todas las etapas están completadas. Prevalece sobre cualquier otra condición de fecha.
- **RN-SEMAFORO-02 — Atrasado (rojo):** el estado es `Atrasado` cuando `hoy > fecha_entrega` y la OP no está terminada.
- **RN-SEMAFORO-03 — En riesgo (amarillo):** el estado es `En riesgo` cuando `(fecha_entrega - hoy) <= dias_alerta_riesgo` (default 3) y `porcentaje_avance < porcentaje_avance_riesgo` (default 80).
- **RN-SEMAFORO-04 — En plazo (verde):** todos los demás casos activos.
- **RN-SEMAFORO-05 — Prioridad de evaluación:** `Terminado` → `Atrasado` → `En riesgo` → `En plazo`. Evita que una OP terminada con fecha vencida se muestre como atrasada.
- **RN-SEMAFORO-06 — Días restantes:** `dias = fecha_entrega - hoy` en días calendario, comparado a medianoche local; se muestra "Faltan N días", "Vence hoy", "Pasó hace N días" o "Terminado" (Docs: prototipo `estado(j)` / `ld`).

## Dominio: Horas (RN-HORAS)

- **RN-HORAS-01 — Totales:** `Horas Vendidas Totales = Σ etapas_orden.horas_vendidas`; `Horas Reales Totales = Σ registros_horas.horas` de la OP (Docs: §2.C).
- **RN-HORAS-02 — Desvío en horas:** `Desvío = Horas Vendidas Totales - Horas Reales Totales`. Positivo = ahorro; negativo = pérdida (Docs: §2.C).
- **RN-HORAS-03 — Consumo:** `% Consumo = (Horas Reales / Horas Vendidas) * 100` (Docs: §2.B.2, HU-14).
- **RN-HORAS-04 — Alerta de desvío:** se activa advertencia visual en la barra de horas si `% Consumo > % Avance Físico + 15%` **o** si `Horas Reales > Horas Vendidas`, aunque la fecha esté lejos (Docs: `definici_n_del_mvp_velco.md` §2.B; `historias_de_usuario_velco.md` HU-07 y HU-08 para avance y vista de taller, HU-14 CA para la alerta y HU-18 para umbrales).
- **RN-HORAS-05 — Imputación positiva:** cada parte de horas tiene `horas > 0`, fecha y operario; etapa opcional (Docs: HU-10 CA; esquema SQL `CHECK (horas > 0)`).
- **RN-HORAS-06 — División por cero:** si `Horas Vendidas = 0`, no se calcula `% Consumo`; en ese caso la alerta se evalúa solo con `Horas Reales > Horas Vendidas`. **Supuesto técnico** registrado por no estar en los documentos.
- **RN-HORAS-07 — Comparativa por etapa:** el detalle de la OP muestra, por etapa, vendidas vs. reales y desvío en horas y porcentaje (Docs: HU-15).

## Dominio: Costos y margen (RN-MARGEN)

- **RN-MARGEN-01 — Margen real:** `Margen Real = monto_vendido - (Horas Reales Totales × valor_hora_estandar) - costo_materiales_real` (Docs: `definici_n_del_mvp_velco.md` §2.C; `historias_de_usuario_velco.md` HU-16 para la comparativa y HU-18 para el valor hora configurable).
- **RN-MARGEN-02 — Costo material real:** por ítem, `costo_real = cantidad × COALESCE(costo_unitario_real, costo_unitario_cotizado)`; el agregado es la suma sobre `materiales_orden` (Decisión 5). El detalle está normalizado; no hay columna agregada.
- **RN-MARGEN-03 — Costo material cotizado:** `Σ (cantidad × costo_unitario_cotizado)` (Decisión 5).
- **RN-MARGEN-04 — Tasa global:** la mano de obra se valora con `configuracion.valor_hora_estandar` para todo el MVP. La tasa por etapa/categoría está diferida aunque el Excel exponga `COSTO UNIT.` por operación (Decisión 4).
- **RN-MARGEN-05 — Moneda y redondeo:** importes en `NUMERIC(14,2)`. Se usa aritmética decimal, nunca coma flotante; el redondeo a 2 decimales se aplica al mostrar y al exportar.
- **RN-MARGEN-06 — Visibilidad:** el MVP tiene un único usuario que ve **todos** los montos. Ocultar márgenes en planta se resuelve con el parámetro `incluirMargenes` de la exportación y, en Fase 2, con roles (Decisión 7).

## Dominio: Configuración (RN-CONFIG)

- **RN-CONFIG-01 — Valores por defecto:** valor hora = 0, días de riesgo = 3, avance de riesgo = 80, etapas estándar = Corte/Soldadura/Mecanizado/Pintura/Entrega (Docs: esquema SQL §3).
- **RN-CONFIG-02 — Cambio sin código:** el valor hora y los umbrales se editan desde la UI de configuración (Docs: HU-18 CA).
- **RN-CONFIG-03 — Singleton:** existe una sola fila de configuración (`id = 1`).

## Dominio: Exportación (RN-EXPORT)

- **RN-EXPORT-01 — Dos archivos independientes:** se generan `COSTEO_[NroOP]_[Cliente].xlsx` y `OP_[NroOP]_[Cliente].xlsx`, nunca un único workbook con hoja de resumen (Docs: §2.D, HU-20A/B CA; Decisión 8).
- **RN-EXPORT-02 — Plantillas oficiales:** se cargan y rellenan `MASTER COSTEO NUEVO.xlsx` y `A - OP-MASTER.xlsx`; se preservan estilos, celdas combinadas, encabezados, bloques y fórmulas originales (Docs: §2.D; Decisión 2).
- **RN-EXPORT-03 — Contenido económico:** el archivo de costeo incluye cliente, OP, materiales, horas vendidas, horas reales, valor hora y comparativa de márgenes (Docs: HU-20A).
- **RN-EXPORT-04 — Contenido operativo:** el archivo de OP incluye datos de la orden, detalle técnico de la pieza, fechas, ruta de etapas y horas asignadas/ejecutadas. **No expone rentabilidad comercial** (Docs: HU-20B CA).
- **RN-EXPORT-05 — Por OP con plantillas oficiales:** `exportOp(opId, { incluirMargenes })` es una **función pura**; los adaptadores `exportCosteo` y `exportOpSinMargenes` rellenan `MASTER COSTEO NUEVO.xlsx` y `A - OP-MASTER.xlsx` (HU-20A/HU-20B; Decisión 8). No hay consolidado en los documentos vigentes.
- **RN-EXPORT-06 — Variantes:** `incluirMargenes: true` genera la variante de costeo; `false` genera la variante operativa. Cubre la distinción entre uso administrativo y uso en planta (HU-20B CA; Decisión 8).
- **RN-EXPORT-07 — Listado filtrable:** `listOps({ fechaDesde, fechaHasta, estado })` ya existe desde HU-09 y alimenta la grilla y los filtros (Decisión 8). `fechaDesde`/`fechaHasta` filtran `fecha_entrega` (fecha comprometida), etiquetada así en UI y specs; la búsqueda global incluye `numero_op`, `codigo_plano`, cliente y pieza (HU-09).
- **RN-EXPORT-08 — ID de plano en OP-MASTER:** la variante operativa escribe `ID Plano:` con el valor de `codigo_plano` o `S/P` en el rango `O7:R8` de `A - OP-MASTER.xlsx`. No se usa `J7:N8` (`PC N°:`). El mapeo queda **bloqueado** por C-13/IN-08 hasta confirmar la plantilla real (DD-11).

## Dominio: Dashboard general (RN-DASH)

- **RN-DASH-01 — Alcance MVP:** `/dashboard` (HU-21) muestra KPIs globales, tiempos promedio por etapa y una matriz ordenable de todas las OP con `N° OP`, `ID Plano`, cliente, horas vendidas/reales, desvío en horas y % y margen neto. No es analítica histórica avanzada (HU-17 sigue en Fase 2).
- **RN-DASH-02 — Filtro por fecha comprometida:** los filtros de período y el KPI de ciclo usan `fecha_entrega` (entrega prometida), nunca la fecha de imputación de horas ni la fecha de ejecución. El rango significa "entregas prometidas en el período" y se etiqueta en UI/spec como `Fecha comprometida` (contrato vigente en `listOps`).
- **RN-DASH-03 — Derivados, no duplicados:** todos los indicadores se calculan con las reglas ya existentes (RN-HORAS, RN-MARGEN, RN-AVANCE, RN-SEMAFORO); el dashboard no persiste agregados ni reimplementa fórmulas en React (RN-GLOBAL-02, R3).

## Dominio: Autenticación (RN-AU)

- **RN-AU-01 — MVP sin auth:** no hay tabla `usuarios`, login ni mecanismo de autenticación. Un único usuario con acceso total (R5; Decisión 7).
- **RN-AU-02 — Fase 2 (HU-19):** `Admin/Oficina` ve costos y márgenes; `Taller` no ve montos. El mecanismo de autenticación no está definido en la documentación vigente; cualquier auth/PIN/RBAC requiere aprobación humana explícita (R5; Decisión 7).
- **RN-AU-03 — Dominio CRITICAL:** auth requiere aprobación humana explícita antes de escribir código (R5; Decisión 7).

## Excepciones globales

- **RN-GLOBAL-01 — Sin Kanban:** ninguna regla puede introducir columnas por etapa; el cambio de etapa ocurre dentro de la tarjeta (Principio 1).
- **RN-GLOBAL-02 — Derivados canónicos:** semáforo, avance, horas y márgenes tienen una sola implementación en el dominio. Frontend y API consumen la misma definición.
- **RN-GLOBAL-03 — Datos faltantes:** fechas inválidas u OP sin etapas se tratan como avance 0 y se marcan `En plazo`/`En riesgo` según corresponda; nunca se lanza una excepción de UI por datos incompletos. **Supuesto técnico**.
- **RN-GLOBAL-04 — Trazabilidad:** toda regla implementada debe referenciar su código RN-XX-NN en el test que la cubre.

## Fuentes

- `Docs/definici_n_del_mvp_velco.md` §2 (A, B, C, D).
- `Docs/historias_de_usuario_velco.md` (5 épicas, HU-05, HU-07, HU-08, HU-14, HU-15, HU-16, HU-18, HU-19, HU-20A/B).
- `Docs/tablero-taller-v2.html` (`estado`, `actual`, `render`, handlers `ck`/`av`).
- `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` y `Docs/FichasExcel/A - OP-MASTER.xlsx`.
- `Docs/MVP.md` no es fuente: borrado deliberado por obsoleto (IN-09).
- Decisiones 2–8 de [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md).
