# Definición de Producto Mínimo Viable (MVP v1.0) — Velco

**Objetivo del MVP:** Proveer a **Velco** una herramienta web centralizada de seguimiento de taller que permita cargar Órdenes de Producción (OP) con sus horas vendidas, gestionar su avance mediante tarjetas autocontenidas, imputar horas reales trabajadas, detectar desvíos de rentabilidad a tiempo y exportar por separado las planillas oficiales `MASTER COSTEO` y `OP-MASTER`.

---

## 1. Alcance Funcional (Incluido vs. Excluido)

| Módulo | Incluido en MVP v1.0 | Diferido a Fase 2 |
| :--- | :--- | :--- |
| **Gestión de OP y Línea Base** | • **HU-01:** Alta y edición de OP/OT.<br>• **HU-02:** Carga de horas vendidas por etapa y materiales.<br>• **HU-04:** Etapas autocontenidas y personalizables por tarjeta. | • **HU-03:** Importación automática desde Excel `MASTER COSTEO`. |
| **Tablero Visual de Taller** | • **HU-05:** Grilla única de tarjetas con semáforo de fechas.<br>• **HU-06:** Tira superior *"Dónde está cada trabajo ahora"*.<br>• **HU-07:** Checklist interno de etapas + etiqueta `ahora`.<br>• **HU-09:** Buscador y filtros por estado, cliente y etapa. | • **HU-08:** Modo Kiosco/TV dedicado con auto-refresh. |
| **Registro de Horas Reales** | • **HU-10:** Carga manual rápida de partes diarios por OP/etapa.<br>• **HU-13:** Edición y eliminación de registros de horas. | • **HU-11:** Cronómetro en vivo (Start/Pause).<br>• **HU-12:** Etiquetado de reprocesos vs. adicionales. |
| **Comparativa y Costos** | • **HU-14:** Termómetro `Horas Reales / Horas Vendidas` en tarjeta.<br>• **HU-15:** Tabla comparativa por etapa en detalle de OP.<br>• **HU-16:** Cálculo de costo real vs. cotizado y margen neto. | • **HU-17:** Dashboard gerencial histórico y promedios. |
| **Configuración y Exportación** | • **HU-18:** Configuración de valor hora y umbrales de alerta.<br>• **HU-20A:** Exportación `.xlsx` formato `MASTER COSTEO NUEVO`.<br>• **HU-20B:** Exportación `.xlsx` formato `A - OP-MASTER` + impresión. | • **HU-19:** Sistema completo de roles y permisos por usuario. |

---

## 2. Reglas de Negocio y Lógica del Sistema

### A. Comportamiento de Tarjetas Autocontenidas
* El tablero es una **grilla única de tarjetas** (una por OP). **No** existen columnas de Kanban por etapa.
* Cada tarjeta contiene:
  1. Cabecera con `N° OP`, `Cliente`, `Pieza/Descripción` y badge de estado de plazo.
  2. Indicador circular de `% de avance físico` y fecha de entrega (con cálculo de días restantes o días de atraso).
  3. **Barra comparativa de horas:** Muestra `Horas Reales / Horas Vendidas` y el `% de consumo`.
  4. **Lista de etapas internas:** Checklist ordenado. La primera etapa con `completada = false` muestra automáticamente la etiqueta **`ahora`**.
* El indicador superior *"Dónde está cada trabajo ahora"* agrupa y cuenta las órdenes activas según su etapa **`ahora`** actual.

### B. Semáforos y Alertas Automáticas
1. **Estado de Plazo (Fecha):**
   * **Terminado (Gris):** `porcentaje_avance === 100` o todas las etapas tildadas.
   * **Atrasado (Rojo):** `hoy > fecha_entrega` y no terminado.
   * **En riesgo (Amarillo):** `(fecha_entrega - hoy) <= dias_alerta_riesgo` (default: 3 días) y `porcentaje_avance < porcentaje_avance_riesgo` (default: 80%).
   * **En plazo (Verde):** Todos los demás casos activos.
2. **Alerta de Desvío de Horas:**
   * Se activa una advertencia visual en la barra de horas de la tarjeta si:
     $$\frac{\text{Horas Reales}}{\text{Horas Vendidas}} \times 100 > \text{Porcentaje Avance Físico} + 15\%$$
     o si $\text{Horas Reales} > \text{Horas Vendidas}$.

### C. Fórmulas Económicas por OP
* **Horas Vendidas Totales:** $\sum \text{horas\_vendidas}$ de todas las etapas de la OP.
* **Horas Reales Totales:** $\sum \text{horas}$ de todos los partes cargados en la OP.
* **Desvío de Horas:** $\text{Horas Vendidas Totales} - \text{Horas Reales Totales}$ (positivo = ahorro; negativo = pérdida).
* **Costo Mano de Obra Real:** $\text{Horas Reales Totales} \times \text{valor\_hora\_estandar}$.
* **Costo Total Real:** $\text{Costo Mano de Obra Real} + \text{costo\_materiales\_real}$.
* **Margen Real ($):** $\text{monto\_vendido} - \text{Costo Total Real}$.

### D. Exportación Excel Dual (`.xlsx`)
El sistema debe utilizar plantillas base `.xlsx` almacenadas en el servidor para generar dos archivos independientes, preservando estilos, celdas combinadas, encabezados y fórmulas originales de Velco:
1. **Exportación Costeo (`HU-20A`):** Basada en `MASTER COSTEO NUEVO.xlsx`. Vuelca datos de cliente, OP, desglose de materiales, horas vendidas, horas reales imputadas, valor hora y comparativa de márgenes.
2. **Exportación Orden de Producción (`HU-20B`):** Basada en `A - OP-MASTER.xlsx`. Vuelca datos operativos de la orden, detalle técnico de la pieza, fechas, ruta de etapas y horas asignadas/ejecutadas (sin exponer rentabilidad comercial).

---

## 3. Modelo de Datos (Esquema Relacional)

```sql
-- 1. Parámetros globales del sistema
CREATE TABLE configuracion (
  id INT PRIMARY KEY DEFAULT 1,
  valor_hora_estandar NUMERIC(12, 2) NOT NULL DEFAULT 0,
  dias_alerta_riesgo INT NOT NULL DEFAULT 3,
  porcentaje_avance_riesgo INT NOT NULL DEFAULT 80,
  etapas_default JSONB NOT NULL DEFAULT '["Corte", "Soldadura", "Mecanizado", "Pintura", "Entrega"]'
);

-- 2. Órdenes de Producción (Entidad principal / Tarjeta)
CREATE TABLE ordenes_trabajo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_op VARCHAR(50) UNIQUE NOT NULL,
  cliente VARCHAR(150) NOT NULL,
  descripcion_pieza TEXT NOT NULL,
  fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega DATE NOT NULL,
  porcentaje_avance INT NOT NULL DEFAULT 0 CHECK (porcentaje_avance >= 0 AND porcentaje_avance <= 100),
  monto_vendido NUMERIC(14, 2) NOT NULL DEFAULT 0,
  costo_materiales_cotizado NUMERIC(14, 2) NOT NULL DEFAULT 0,
  costo_materiales_real NUMERIC(14, 2) NOT NULL DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Etapas internas de cada tarjeta (Checklist + Línea base de horas)
CREATE TABLE etapas_orden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  orden_secuencia INT NOT NULL,
  completada BOOLEAN NOT NULL DEFAULT FALSE,
  horas_vendidas NUMERIC(8, 2) NOT NULL DEFAULT 0
);

-- 4. Imputación de horas reales trabajadas
CREATE TABLE registros_horas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
  etapa_id UUID REFERENCES etapas_orden(id) ON DELETE SET NULL,
  operario VARCHAR(100) NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  horas NUMERIC(6, 2) NOT NULL CHECK (horas > 0),
  observacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. Plan de Construcción Incremental (Sprints para IA)

Para construir el MVP mediante desarrollo asistido por especificaciones sin romper funcionalidades previas, ejecutar en este orden:

1. **Sprint 1 — Estructura Base y Tablero Visual (`HU-05`, `HU-06`, `HU-07`, `HU-09`):**
   * Configurar proyecto (React + TypeScript + Backend Node/Express o Next.js + PostgreSQL/SQLite).
   * Implementar el tablero manteniendo la estética industrial de `tablero-taller-v2.html` (KPIs superiores, tira de flujo *"Dónde está cada trabajo ahora"*, filtros y grilla de tarjetas autocontenidas con checklist interno y etiqueta `ahora`).
2. **Sprint 2 — Gestión de OP, Horas Vendidas e Imputación Real (`HU-01`, `HU-02`, `HU-04`, `HU-10`, `HU-13`):**
   * Crear modal/vista de **Nueva OP / Editar OP** permitiendo cargar datos comerciales, materiales y personalizar etapas con sus respectivas `horas_vendidas`.
   * Crear modal rápido de **Cargar Horas** desde cada tarjeta y listado editable de partes diarios dentro del detalle de la OP.
3. **Sprint 3 — Analítica de Desvíos y Configuración (`HU-14`, `HU-15`, `HU-16`, `HU-18`):**
   * Integrar en cada tarjeta el termómetro `Horas Reales / Horas Vendidas` con alerta de desvío.
   * Agregar pestaña de **Análisis de Rentabilidad** dentro del detalle de la OP (tabla comparativa por etapa + margen neto) y vista de **Configuración** (valor hora y umbrales).
4. **Sprint 4 — Motor de Exportación Excel Dual (`HU-20A`, `HU-20B`):**
   * Integrar librería de manipulación de Excel (`exceljs` en Node.js o `openpyxl` en Python) usando los archivos `MASTER COSTEO NUEVO.xlsx` y `A - OP-MASTER.xlsx` como plantillas base para generar ambas descargas por separado.