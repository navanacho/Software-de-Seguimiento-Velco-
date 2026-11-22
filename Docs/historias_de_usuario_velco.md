# Backlog de Historias de Usuario — Sistema de Seguimiento de Trabajo (Velco)

Este documento define las historias de usuario para el sistema de gestión y seguimiento de taller de **Velco**, unificando la lógica visual de tarjetas autocontenidas, la línea base presupuestaria (`MASTER COSTEO NUEVO`) y el control operativo en planta (`A - OP-MASTER`).

---

## Principios de Diseño del Producto
1. **Tarjetas Autocontenidas (Sin Kanban de Columnas):** Las órdenes de trabajo no se mueven entre columnas. Cada tarjeta reside en una grilla única y contiene dentro de sí su propia lista ordenada de etapas (`checklist`), destacando automáticamente cuál es la etapa **`ahora`**.
2. **Control Dual (Plazo vs. Horas):** Cada orden se evalúa tanto por su fecha de entrega como por el consumo de **Horas Reales vs. Horas Vendidas**.
3. **Continuidad Documental:** El sistema debe respetar y exportar de manera independiente los formatos estándar de Velco (`MASTER COSTEO` y `OP-MASTER`).

---

## Épica 1: Gestión de Órdenes de Trabajo (OT / OP) y Presupuesto Base

### HU-01 — Alta de Orden de Producción (OP/OT) completa con ID Único de Plano
* **Como** administrador o responsable de producción,
* **Quiero** crear una nueva orden ingresando N° de OP/OT, ID/Código de Plano (opcional), Cliente, Descripción/Pieza, Fecha de ingreso, Fecha de entrega prometida y Monto vendido,
* **Para** centralizar todos los trabajos en un único registro maestro y vincularlos con su documentación técnica cuando corresponda.
* **Criterios de Aceptación:**
  * El N° de OP/OT es obligatorio y único.
  * El **ID de Plano (`codigo_plano`)** es **opcional**: si el trabajo tiene plano asociado, el sistema valida que sea único en toda la base de datos; si no tiene plano, permite guardarlo vacío (`NULL` / `"Sin plano"`) sin restricciones de unicidad.
  * El estado de plazo se calcula automáticamente (`En plazo`, `En riesgo`, `Atrasado`, `Terminado`) según la fecha de entrega y el porcentaje de avance.

### HU-02 — Carga de Horas Vendidas y Costos Teóricos (Línea Base)
* **Como** presupuestista o administrador,
* **Quiero** registrar en la OP las horas vendidas desglosadas por rubro/etapa (ej. Corte, Plegado, Soldadura, Mecanizado, Pintura, Entrega) junto con el costo de materiales e insumos cotizados,
* **Para** establecer la línea base contra la cual medir la rentabilidad y eficiencia real.
* **Criterios de Aceptación:**
  * Suma automática del total de horas vendidas a partir del desglose por etapa.
  * Registro de costo de materiales cotizados y reales.

### HU-03 — Importación desde planilla de costeo (`MASTER COSTEO`) *(Fase 2)*
* **Como** administrador,
* **Quiero** importar o pegar los datos de un presupuesto cerrado desde Excel/CSV (cliente, ítem, horas vendidas por proceso, materiales),
* **Para** dar de alta una OP sin duplicar carga manual.

### HU-04 — Gestión de Etapas Personalizables por Orden
* **Como** jefe de taller,
* **Quiero** definir, reordenar, agregar o quitar etapas específicas dentro de cada tarjeta de OP (partiendo de plantillas estándar como *Corte → Soldadura → Mecanizado → Pintura → Entrega*),
* **Para** reflejar la ruta real de fabricación de cada pieza sin mover la tarjeta de lugar.
* **Criterios de Aceptación:**
  * Cada tarjeta mantiene su propia lista independiente de etapas.
  * Permite agregar o quitar etapas en cualquier momento durante la vida de la OP.

---

## Épica 2: Seguimiento Visual en Taller (Tablero Operativo)

### HU-05 — Tablero de Tarjetas Autocontenidas con Semáforo de Estado
* **Como** usuario de oficina o taller,
* **Quiero** visualizar todas las órdenes activas en una grilla única con su porcentaje de avance, días restantes/atraso, identificador de plano (si posee) y semáforo de estado (*En plazo, En riesgo, Atrasado, Terminado*),
* **Para** detectar urgencias de un vistazo.
* **Criterios de Aceptación:**
  * **Verde (`En plazo`):** Fecha de entrega futura y fuera de umbral de riesgo.
  * **Amarillo (`En riesgo`):** Faltan $\le 3$ días (configurable) y el avance es $< 80\%$.
  * **Rojo (`Atrasado`):** Fecha actual mayor a la fecha de entrega y avance $< 100\%$.
  * **Gris (`Terminado`):** Avance al $100\%$.

### HU-06 — Indicador de Flujo por Etapa ("Dónde está cada trabajo ahora")
* **Como** jefe de taller,
* **Quiero** ver un resumen superior que agrupe cuántas órdenes tienen activa cada etapa en este momento,
* **Para** balancear la carga de trabajo entre sectores sin necesidad de un tablero de columnas.
* **Criterios de Aceptación:**
  * Calcula dinámicamente la cantidad de tarjetas cuya primera etapa sin tildar coincide con cada nombre de etapa.

### HU-07 — Checklist de Etapas y Marcador "Ahora" dentro de la Tarjeta
* **Como** operario o supervisor,
* **Quiero** marcar etapas como completadas con un clic dentro de la tarjeta,
* **Para** que la tarjeta actualice automáticamente cuál es la etapa **`ahora`** y refleje el progreso.
* **Criterios de Aceptación:**
  * La primera etapa no completada de la lista interna recibe automáticamente el badge visual `ahora`.
  * Si todas las etapas están tildadas, el avance pasa automáticamente al $100\%$ (`Terminado`).

### HU-08 — Vista de Solo Lectura para Pantalla de Taller (Modo TV/Kiosco) *(Fase 2)*
* **Como** encargado de planta,
* **Quiero** abrir el tablero en modo solo lectura con actualización automática y tema claro/oscuro,
* **Para** proyectarlo en un monitor de taller sin riesgo de modificaciones accidentales.

### HU-09 — Filtros, Búsqueda y Ordenamiento
* **Como** usuario,
* **Quiero** filtrar las tarjetas por Cliente, Estado (`Atrasados`, `En riesgo`, `En plazo`, `Terminados`), Etapa actual (`ahora`) o buscar por N° de OP, ID de Plano o descripción de pieza,
* **Para** encontrar rápidamente una orden cuando el volumen de trabajos crezca.
* **Criterios de Aceptación:**
  * Búsqueda instantánea por `numero_op`, `codigo_plano`, `cliente` y `descripcion_pieza`.
  * Filtro rápido para ver órdenes con plano asignado vs. sin plano.

---

## Épica 3: Registro de Horas Reales (Imputación de Tiempos)

### HU-10 — Carga Rápida de Partes Diarios de Horas por OP
* **Como** operario o supervisor,
* **Quiero** cargar las horas trabajadas en una OP indicando fecha, etapa/proceso, operario y cantidad de horas (ej. `2.5 hs`),
* **Para** acumular el tiempo real invertido en cada trabajo.
* **Criterios de Aceptación:**
  * Formulario ágil accesible directamente desde la tarjeta o detalle de la OP.
  * Validación de valores numéricos positivos.

### HU-11 — Cronómetro / Fichaje en Vivo *(Fase 2)*
* **Como** operario en puesto de trabajo,
* **Quiero** iniciar y pausar un temporizador sobre la etapa activa de una OP desde una tablet o celular,
* **Para** registrar tiempos exactos en tiempo real.

### HU-12 — Registro de Reprocesos o Horas No Contempladas *(Fase 2)*
* **Como** jefe de taller,
* **Quiero** clasificar un bloque de horas imputadas como "Reproceso / Error interno" o "Adicional pedido por cliente",
* **Para** distinguir si el desvío de horas se debió a ineficiencia interna o a un cambio de alcance cobrable.

### HU-13 — Edición y Auditoría de Partes de Horas
* **Como** administrador,
* **Quiero** revisar, editar o eliminar registros de horas cargados por fecha u operario,
* **Para** corregir errores de tipeo antes de cerrar el costeo de una obra.

---

## Épica 4: Comparativa Horas Vendidas vs. Horas Reales, Dashboard y Rentabilidad

### HU-14 — Indicador de Consumo de Horas en Tarjeta (Alerta Temprana)
* **Como** supervisor,
* **Quiero** ver dentro de cada tarjeta de trabajo un indicador visual de `Horas Reales / Horas Vendidas` (ej. `32h / 40h — 80%`) junto al `% de avance físico`,
* **Para** detectar si una orden ya consumió gran parte de sus horas vendidas estando a mitad de camino.
* **Criterios de Aceptación:**
  * Alerta visual en la tarjeta cuando el porcentaje de horas consumidas supera al porcentaje de avance físico en más de un $15\%$ (o cuando `Horas Reales > Horas Vendidas`).

### HU-15 — Desglose Comparativo por Etapa/Sector
* **Como** administrador o presupuestista,
* **Quiero** ver dentro del detalle de cada OP una tabla comparativa por etapa (*Horas Vendidas vs. Horas Reales vs. Desvío en hs y %*),
* **Para** identificar exactamente qué proceso (ej. Soldadura o Mecanizado) está subcotizado o demorado.

### HU-16 — Cálculo de Costo Real vs. Cotizado y Margen de la OP
* **Como** dueño/gerente de Velco,
* **Quiero** que el sistema multiplique las horas reales por el valor hora configurado (sumando los materiales reales) y lo compare contra el monto vendido,
* **Para** conocer la rentabilidad neta real de cada trabajo terminado.

### HU-21 — Dashboard General de Panorama y Tiempos de Producción
* **Como** gerente o responsable de producción,
* **Quiero** contar con una sección dedicada (`/dashboard`) que muestre el panorama general de todos los trabajos, sus tiempos acumulados, promedios de ejecución y desvíos globales,
* **Para** tomar decisiones estratégicas sobre capacidad de taller y rentabilidad sin revisar tarjeta por tarjeta.
* **Criterios de Aceptación:**
  * **KPIs Globales:** Total de Horas Vendidas vs. Horas Reales (activas e históricas), eficiencia global (`%`), distribución de OPs por estado y tiempo promedio de ciclo (días desde ingreso hasta entrega).
  * **Tiempos por Sector/Etapa:** Comparativa de horas vendidas vs. horas reales y tiempo promedio invertido por etapa (*Corte, Soldadura, Mecanizado, Pintura*, etc.).
  * **Tabla Consolidada de Trabajos y Desvíos:** Listado ordenable de todas las OPs con `N° OP`, `ID Plano`, `Cliente`, `Estado`, `Horas Vendidas`, `Horas Reales`, `Desvío (hs y %)` y `Margen Neto`.
  * Filtros por período de fechas y estado de orden (`Todas`, `Activas`, `Terminadas`).

### HU-17 — Analítica Histórica Avanzada y Tendencias por Cliente *(Fase 2)*
* **Como** gerente,
* **Quiero** visualizar curvas de tendencia intermensual y rankings de rentabilidad histórica por cliente y tipo de pieza,
* **Para** ajustar los coeficientes de futuros presupuestos.

---

## Épica 5: Administración, Configuración y Exportación

### HU-18 — Configuración de Parámetros de Taller
* **Como** administrador,
* **Quiero** configurar el valor hora estándar, los umbrales de alerta (días para "En riesgo", porcentaje de avance mínimo) y las plantillas de etapas por defecto,
* **Para** mantener los cálculos actualizados sin modificar código.

### HU-19 — Gestión de Operarios y Permisos (Roles) *(Fase 2)*
* **Como** administrador,
* **Quiero** crear usuarios con distintos permisos (*Admin/Oficina*: ve costos y márgenes; *Taller*: ve tablero, avanza etapas y carga horas, sin ver montos en pesos),
* **Para** proteger la información financiera sensible.

### HU-20A — Exportación de Planilla de Costeo (`MASTER COSTEO`)
* **Como** administrador o presupuestista,
* **Quiero** exportar los datos económicos y de horas de una o varias órdenes a un archivo `.xlsx` respetando exactamente las columnas, fórmulas, encabezados y estructura visual de la planilla `MASTER COSTEO NUEVO.xlsx` (comparando horas/costos presupuestados vs. reales),
* **Para** mantener continuidad total con los registros históricos y contables de Velco sin rearmar planillas manualmente.
* **Criterios de Aceptación:**
  * Generación de archivo `.xlsx` independiente (`COSTEO_[NroOP]_[Cliente].xlsx`).
  * Mapeo exacto de estructura, bloques de rubros/materiales, horas vendidas, horas reales imputadas y totales calculados según la plantilla original.

### HU-20B — Exportación de Orden de Producción (`OP-MASTER`)
* **Como** jefe de taller o administrador,
* **Quiero** descargar un archivo `.xlsx` (y contar con vista de impresión limpia) de una orden específica respetando el formato, disposición de celdas, encabezados e ítems operativos de `A - OP-MASTER.xlsx` (detalle de pieza, ID de plano si posee, cliente, fechas, etapas y horas asignadas/ejecutadas),
* **Para** emitir la orden de taller oficial en el formato estándar de la empresa.
* **Criterios de Aceptación:**
  * Descarga independiente (`OP_[NroOP]_[Cliente].xlsx`) desde la tarjeta o detalle de la OP.
  * Respeta la estructura exacta de `A - OP-MASTER.xlsx`, incluyendo el `codigo_plano` y excluyendo márgenes financieros comerciales para uso operativo en planta.