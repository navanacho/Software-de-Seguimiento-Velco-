# Funcionalidades

Organizadas por **épica** y luego por **historia de usuario** (`HU-NN`, identificador canónico del proyecto; el template genérico las llama `US-NNN`). Estado: **MVP** = incluida en v1.0, **F2** = diferida a Fase 2.

## Épica 1: Gestión de Órdenes de Trabajo (OT/OP) y Presupuesto Base

### HU-01 — Alta de Orden de Producción (OP/OT) completa — MVP

**Como** administrador o responsable de producción  
**Quiero** crear una nueva orden ingresando N° de OP/OT, Cliente, Descripción/Pieza, Fecha de ingreso, Fecha de entrega prometida y Monto vendido  
**Para** centralizar todos los trabajos en un único registro maestro.

**Criterios de aceptación**:
- [ ] `numero_op` único, validado al guardar.
- [ ] El estado de plazo se calcula automáticamente (`En plazo`, `En riesgo`, `Atrasado`, `Terminado`).
- [ ] El cliente se selecciona de `clientes` (entidad propia).

**Reglas relacionadas**: RN-OP-01, RN-OP-02, RN-OP-04, RN-SEMAFORO-01..05.

### HU-02 — Carga de Horas Vendidas y Costos Teóricos (Línea Base) — MVP

**Como** presupuestista o administrador  
**Quiero** registrar horas vendidas desglosadas por etapa y el costo de materiales e insumos cotizados  
**Para** establecer la línea base contra la cual medir rentabilidad y eficiencia.

**Criterios de aceptación**:
- [ ] Total de horas vendidas = suma automática del desglose por etapa.
- [ ] Materiales cargados con tipo `MP`/`INSUMOS`/`TERCERIZADOS`, cantidad, costo unitario cotizado y opcionalmente real.
- [ ] Costos agregados se derivan, no se editan a mano.

**Reglas relacionadas**: RN-HORAS-01, RN-MARGEN-02, RN-MARGEN-03, RN-AVANCE-01.

### HU-03 — Importación desde planilla de costeo (`MASTER COSTEO`) — F2

**Como** administrador  
**Quiero** importar o pegar datos de un presupuesto cerrado desde Excel/CSV (cliente, ítem, horas por proceso, materiales)  
**Para** dar de alta una OP sin duplicar carga manual.

**Criterios de aceptación**:
- [ ] Diferido; no implementar en MVP.

**Reglas relacionadas**: RN-EXPORT-02 (reutilización futura del mapeo de plantilla).

### HU-04 — Gestión de Etapas Personalizables por Orden — MVP

**Como** jefe de taller  
**Quiero** definir, reordenar, agregar o quitar etapas específicas dentro de cada tarjeta (partiendo de la plantilla estándar)  
**Para** reflejar la ruta real de fabricación sin mover la tarjeta.

**Criterios de aceptación**:
- [ ] Cada tarjeta mantiene su lista independiente de etapas.
- [ ] Se pueden agregar o quitar etapas en cualquier momento de la vida de la OP.
- [ ] No existe una taxonomía cerrada de etapas.

**Reglas relacionadas**: RN-ETAPA-01, RN-ETAPA-02, RN-ETAPA-03, RN-AVANCE-01.

## Épica 2: Seguimiento Visual en Taller (Tablero Operativo)

### HU-05 — Tablero de Tarjetas Autocontenidas con Semáforo de Estado — MVP

**Como** usuario de oficina o taller  
**Quiero** visualizar todas las órdenes activas en una grilla única con avance, días restantes/atraso y semáforo  
**Para** detectar urgencias de un vistazo.

**Criterios de aceptación**:
- [ ] Grilla única; **sin columnas Kanban**.
- [ ] Verde = en plazo; amarillo = faltan ≤3 días (configurable) y avance <80%; rojo = hoy > entrega y avance <100%; gris = avance 100%.
- [ ] Estética industrial de `tablero-taller-v2.html` (KPIs superiores, franja amarilla/negra, tipografía condensada).

**Reglas relacionadas**: RN-SEMAFORO-01..06, RN-GLOBAL-01.

### HU-06 — Indicador de Flujo por Etapa ("Dónde está cada trabajo ahora") — MVP

**Como** jefe de taller  
**Quiero** ver un resumen superior que agrupe cuántas órdenes tienen activa cada etapa  
**Para** balancear carga entre sectores sin un tablero de columnas.

**Criterios de aceptación**:
- [ ] Conteo dinámico por nombre de la primera etapa pendiente.
- [ ] Las OP terminadas no cuentan en el flujo activo.

**Reglas relacionadas**: RN-AHORA-01, RN-FLujo-01.

### HU-07 — Checklist de Etapas y Marcador "Ahora" dentro de la Tarjeta — MVP

**Como** operario o supervisor  
**Quiero** marcar etapas como completadas con un clic dentro de la tarjeta  
**Para** que se actualice automáticamente la etapa `ahora` y el progreso.

**Criterios de aceptación**:
- [ ] Primera etapa no completada con badge `ahora`.
- [ ] Todas tildadas ⇒ avance 100% ⇒ `Terminado`.
- [ ] **No hay slider de avance**: el porcentaje es derivado.

**Reglas relacionadas**: RN-AHORA-01, RN-AVANCE-01, RN-AVANCE-02, RN-SEMAFORO-01.

### HU-08 — Vista de Solo Lectura para Pantalla de Taller (Modo TV/Kiosco) — F2

**Como** encargado de planta  
**Quiero** abrir el tablero en modo solo lectura con auto-refresh y tema claro/oscuro  
**Para** proyectarlo sin modificaciones accidentales. Diferida; el prototipo ya tenía la variable `RO` y `prefers-color-scheme`.

**Reglas relacionadas**: RN-AU-02.

### HU-09 — Filtros, Búsqueda y Ordenamiento — MVP

**Como** usuario  
**Quiero** filtrar por Cliente, Estado, Etapa actual (`ahora`) o buscar por N° de OP/pieza  
**Para** encontrar rápidamente una orden cuando crezca el volumen.

**Criterios de aceptación**:
- [ ] Implementado en la consulta `listOps({ fechaDesde, fechaHasta, estado })` + filtros de cliente y etapa.
- [ ] Los filtros respetan el semáforo calculado, no un estado almacenado.

**Reglas relacionadas**: RN-SEMAFORO-01..05, RN-AHORA-01, RN-EXPORT-07.

## Épica 3: Registro de Horas Reales (Imputación de Tiempos)

### HU-10 — Carga Rápida de Partes Diarios de Horas por OP — MVP

**Como** operario o supervisor  
**Quiero** cargar horas trabajadas indicando fecha, etapa/proceso, operario y cantidad  
**Para** acumular el tiempo real invertido.

**Criterios de aceptación**:
- [ ] Formulario ágil desde la tarjeta o el detalle de la OP.
- [ ] Validación numérica positiva (`horas > 0`).

**Reglas relacionadas**: RN-HORAS-01, RN-HORAS-05.

### HU-11 — Cronómetro / Fichaje en Vivo — F2

**Como** operario en puesto de trabajo  
**Quiero** iniciar y pausar un temporizador sobre la etapa activa desde tablet o celular  
**Para** registrar tiempos exactos en tiempo real. Diferida.

**Reglas relacionadas**: RN-HORAS-05.

### HU-12 — Registro de Reprocesos o Horas No Contempladas — F2

**Como** jefe de taller  
**Quiero** clasificar horas como "Reproceso / Error interno" o "Adicional pedido por cliente"  
**Para** distinguir ineficiencia interna de cambio de alcance cobrable. Diferida.

**Reglas relacionadas**: RN-HORAS-02.

### HU-13 — Edición y Auditoría de Partes de Horas — MVP

**Como** administrador  
**Quiero** revisar, editar o eliminar registros de horas por fecha u operario  
**Para** corregir errores de tipeo antes de cerrar el costeo.

**Criterios de aceptación**:
- [ ] Listado editable dentro del detalle de la OP.
- [ ] Los derivados se recalculan al editar o eliminar.

**Reglas relacionadas**: RN-HORAS-01, RN-HORAS-05, RN-GLOBAL-02.

## Épica 4: Comparativa Horas Vendidas vs. Reales y Rentabilidad

### HU-14 — Indicador de Consumo de Horas en Tarjeta (Alerta Temprana) — MVP

**Como** supervisor  
**Quiero** ver en cada tarjeta `Horas Reales / Horas Vendidas` (ej. `32h / 40h — 80%`) junto al `% de avance`  
**Para** detectar consumo anticipado de horas.

**Criterios de aceptación**:
- [ ] Termómetro visible en la tarjeta.
- [ ] Alerta si consumo > avance + 15% o si reales > vendidas.

**Reglas relacionadas**: RN-HORAS-03, RN-HORAS-04, RN-HORAS-06.

### HU-15 — Desglose Comparativo por Etapa/Sector — MVP

**Como** administrador o presupuestista  
**Quiero** ver en el detalle de la OP una tabla por etapa: vendidas vs. reales vs. desvío en horas y %  
**Para** identificar el proceso subcotizado o demorado.

**Criterios de aceptación**:
- [ ] Agrupación por `etapas_orden`, incluyendo horas sin etapa asignada.

**Reglas relacionadas**: RN-HORAS-01, RN-HORAS-02, RN-HORAS-07.

### HU-16 — Cálculo de Costo Real vs. Cotizado y Margen de la OP — MVP

**Como** dueño/gerente de Velco  
**Quiero** multiplicar horas reales por el valor hora configurado, sumar materiales reales y comparar contra el monto vendido  
**Para** conocer la rentabilidad neta real de cada trabajo.

**Criterios de aceptación**:
- [ ] Margen real calculado con `configuracion.valor_hora_estandar` (tasa global).
- [ ] Costo material real con fallback a cotizado cuando no hay costo real.
- [ ] Pestaña *Análisis de Rentabilidad* dentro del detalle de la OP.

**Reglas relacionadas**: RN-MARGEN-01..06.

### HU-17 — Dashboard de Métricas Históricas — F2

**Como** gerente  
**Quiero** ver desvío promedio por cliente/tipo de trabajo, horas productivas por mes y tasa de entregas en término  
**Para** ajustar futuros presupuestos. Diferida.

**Reglas relacionadas**: RN-HORAS-02.

## Épica 5: Administración, Configuración y Exportación

### HU-18 — Configuración de Parámetros de Taller — MVP

**Como** administrador  
**Quiero** configurar valor hora estándar, días para "En riesgo", avance mínimo y plantillas de etapas  
**Para** mantener cálculos actualizados sin modificar código.

**Criterios de aceptación**:
- [ ] Fila singleton `configuracion.id = 1`.
- [ ] Valores por defecto: 0 / 3 días / 80% / cinco etapas estándar.

**Reglas relacionadas**: RN-CONFIG-01..03, RN-MARGEN-04.

### HU-19 — Gestión de Operarios y Permisos (Roles) — F2

**Como** administrador  
**Quiero** crear usuarios con permisos diferenciados (Oficina ve costos; Taller no ve montos en pesos)  
**Para** proteger información financiera sensible. **Diferida deliberadamente**: el MVP usa un único usuario. Dominio CRITICAL con aprobación humana obligatoria antes de codificar.

**Reglas relacionadas**: RN-AU-01..03.

### HU-20A — Exportación de Planilla de Costeo (`MASTER COSTEO`) — MVP

**Como** administrador o presupuestista  
**Quiero** exportar datos económicos y de horas de una OP a `.xlsx` respetando columnas, fórmulas y estructura visual de `MASTER COSTEO NUEVO.xlsx`  
**Para** mantener continuidad contable.

**Criterios de aceptación**:
- [ ] Archivo independiente `COSTEO_[NroOP]_[Cliente].xlsx`.
- [ ] Mapeo exacto de bloques `INSUMOS / MP / TERCEROS` con `UN / COST. UNIT. / COSTO TOTAL`.
- [ ] Generado por `exportOp(opId, { incluirMargenes: true })`.
- [ ] Se rellena la plantilla existente; no se genera desde cero.

**Reglas relacionadas**: RN-EXPORT-01..03, RN-EXPORT-05, RN-EXPORT-06, RN-MARGEN-01..03.

### HU-20B — Exportación de Orden de Producción (`OP-MASTER`) — MVP

**Como** jefe de taller o administrador  
**Quiero** descargar `.xlsx` y contar con vista de impresión limpia de una OP respetando `A - OP-MASTER.xlsx`  
**Para** emitir la orden oficial en el formato estándar de la empresa.

**Criterios de aceptación**:
- [ ] Archivo independiente `OP_[NroOP]_[Cliente].xlsx`.
- [ ] Bloques `MATERIALES / TERCERIZADOS` con `CANTIDAD / DESCRIPCIÓN / NT N° / PO N° / REMITO / FACTURA`.
- [ ] Sin márgenes financieros comerciales (`incluirMargenes: false`).
- [ ] Vista de impresión desde el navegador.

**Reglas relacionadas**: RN-EXPORT-01, RN-EXPORT-02, RN-EXPORT-04..06.

> **Nota de numeración:** no existe `HU-20` genérico en el backlog; las variantes son `HU-20A` y `HU-20B`. Ver inconsistencia IN-06 en [10_preguntas_abiertas.md](10_preguntas_abiertas.md).

## Trazabilidad de sprints (según Docs)

| Sprint | Historias | Entregable |
|---|---|---|
| 1 | HU-05, HU-06, HU-07, HU-09 | Tablero visual y estructura base |
| 2 | HU-01, HU-02, HU-04, HU-10, HU-13 | Alta/edición de OP y partes de horas |
| 3 | HU-14, HU-15, HU-16, HU-18 | Analítica de desvíos y configuración |
| 4 | HU-20A, HU-20B | Motor de exportación Excel dual |

El plan original menciona Node/Express o Next.js, SQLite y openpyxl; esas opciones quedan **superadas** por el stack elegido (ver DD-01).
