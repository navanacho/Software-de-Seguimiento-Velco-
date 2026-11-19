# Preguntas Abiertas

## Inconsistencias detectadas

### IN-01 — Avance: slider del prototipo vs. columna manual vs. derivado — **RESUELTA**

**Fuente (`Docs/tablero-taller-v2.html` y `Docs/definici_n_del_mvp_velco.md` §3):** el prototipo tiene `<input type="range" ... data-f="av">` y la OP guarda `av`; el SQL incluye `porcentaje_avance INT ... DEFAULT 0`.

**Fuente (`Docs/historias_de_usuario_velco.md` HU-07 CA):** tildar etapas actualiza el progreso y todas tildadas ⇒ 100%.

**Impacto (si no se resolviera):** dos fuentes de verdad: avance manual 100% con etapas pendientes, o checklist completo con avance 40%.

**Resolución:** **RESUELTA** en DD-03. El avance es derivado de `etapas_orden.completada`; se elimina el slider y la columna.

### IN-02 — Tasa de hora global vs. por etapa/categoría — **DIFERIDA**

**Fuente (`Docs/definici_n_del_mvp_velco.md` §2.C y §3):** la fórmula de mano de obra usa `configuracion.valor_hora_estandar` como tasa única y el esquema SQL solo prevé ese valor global.

**Fuente (`Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` y `Docs/historias_de_usuario_velco.md` HU-16):** la plantilla incluye `COST. UNIT.` por operación; HU-16 calcula el margen con el valor hora configurado sin definir tarifas por categoría.

**Impacto:** el margen calculado puede no coincidir con la planilla oficial en operaciones con tarifa propia.

**Resolución:** **DIFERIDA** a Fase 2 según DD-04 / RN-MARGEN-04. Por ahora se usa la tasa global.

### IN-03 — Detalle de materiales: agregados escalares vs. tabla normalizada vs. JSONB — **RESUELTA**

**Fuente (`Docs/definici_n_del_mvp_velco.md` §3):** `ordenes_trabajo` tiene `costo_materiales_cotizado` y `costo_materiales_real`.

**Fuente (plantillas `Docs/FichasExcel/`):** exigen detalle por ítem con cantidad, descripción, NT, PO, remito y factura.

**Impacto (si no se resolviera):** imposible exportar el detalle exigido por HU-20A/B; agregados y detalle podrían divergir.

**Resolución:** **RESUELTA** en DD-05. Tabla `materiales_orden`; agregados derivados; JSONB descartado.

### IN-04 — Roles y visibilidad de montos — **RESUELTA / DIFERIDA**

**Fuente (`Docs/historias_de_usuario_velco.md` HU-19, Fase 2):** `Admin/Oficina` ve costos y márgenes; `Taller` ve el tablero, avanza etapas y carga horas sin ver montos en pesos.

**Fuente (`Docs/definici_n_del_mvp_velco.md` §1):** HU-19 está diferida a Fase 2. Los documentos vigentes no definen un mecanismo de autenticación ni PIN.

**Impacto (si no se resolviera):** riesgo de incluir RBAC en el primer entregable.

**Resolución:** **RESUELTA para el MVP** en DD-07: un único usuario ve todos los montos, sin login. Ocultar montos en planta y los roles quedan **diferidos** a Fase 2 según HU-19. Cualquier auth/PIN/RBAC requiere aprobación humana explícita (R5).

### IN-05 — Formato de exportación — **RESUELTA**

**Fuente (`Docs/historias_de_usuario_velco.md` HU-20A):** exportación a `.xlsx` con el formato de `MASTER COSTEO NUEVO.xlsx`; el criterio de aceptación exige el archivo independiente `COSTEO_[NroOP]_[Cliente].xlsx`.

**Fuente (`Docs/historias_de_usuario_velco.md` HU-20B y `Docs/definici_n_del_mvp_velco.md` §2.D):** un archivo por OP sobre `A - OP-MASTER.xlsx`, con descarga independiente `OP_[NroOP]_[Cliente].xlsx`. Los documentos vigentes no definen un formato consolidado.

**Impacto (si no se resolviera):** diseñar un consolidado sin respaldo documental cambia por completo el diseño del exportador.

**Resolución:** **RESUELTA** en DD-08. Solo exportación por OP con las plantillas reales y `incluirMargenes` como parámetro. No hay ZIP ni workbook con hoja resumen en la documentación vigente: sin respaldo, no incluidos en el MVP y requieren confirmación futura.

### IN-06 — Numeración HU-20A / HU-20B sin HU-20 — **ABIERTA (bajo impacto)**

**Fuente (`Docs/historias_de_usuario_velco.md`):** el backlog lista `HU-20A` y `HU-20B`.

**Fuente (`Docs/definici_n_del_mvp_velco.md` §1):** tampoco existe `HU-20` genérico en los documentos vigentes.

**Impacto:** trazabilidad inconciente; no afecta la funcionalidad.

**Resolución propuesta:** conservar `HU-20A`/`HU-20B` como identificadores canónicos y documentar que no hay `HU-20` genérico (ya aplicado en [06_funcionalidades.md](06_funcionalidades.md)).

### IN-07 — Lista no canónica de etapas — **ABIERTA**

**Fuente (`Docs/definici_n_del_mvp_velco.md` §3 y `Docs/historias_de_usuario_velco.md` HU-02):** la plantilla por defecto es Corte → Soldadura → Mecanizado → Pintura → Entrega; HU-02 menciona además Plegado.

**Fuente (`Docs/tablero-taller-v2.html`):** los ejemplos usan Pulido, Torneado, Fresado, Rectificado, Control y Galvanizado.

**Impacto:** si se impone un catálogo cerrado, no se puede reflejar la ruta real de cada pieza (HU-04).

**Resolución propuesta:** mantener etapas como texto libre por OP, con `etapas_default` solo como plantilla inicial (RN-ETAPA-03). Confirmar si Velco quiere un catálogo maestro en Fase 2.

### IN-08 — Enlace externo de ~577 KB y ruta UNC en las plantillas — **ABIERTA (spike)**

**Fuente (`Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx`):** contiene un enlace externo de ~577 KB; la ruta de las OP digitalizadas es `\\Servidor\g\OPERACIONES\ORDENES DE PROCESO\OP - DIGITALIZADA\`.

**Fuente (`Docs/historias_de_usuario_velco.md` principio 3 y HU-20A/B CA):** el MVP debe preservar celdas combinadas, estilos y fórmulas al rellenar la plantilla.

**Impacto:** `exceljs` podría eliminar o corromper el enlace externo, o fallar al resolver la UNC; bloquea Sprint 4 si no se valida.

**Resolución propuesta:** spike técnico acotado antes de Sprint 4: clonar la plantilla, rellenarla, abrirla con Excel y decidir si el enlace se preserva, se elimina o se reemplaza por un valor estático. Ver [08_arquitectura_propuesta.md](08_arquitectura_propuesta.md).

### IN-09 — Validez como fuente de los documentos recuperados del historial de git — **RESUELTA**

**Pregunta:** ¿eran fuente válida `Docs/MVP.md` y `Docs/HistoriasDeUsuario.md`, recuperados de commits anteriores?

**Respuesta del dueño del repositorio (definitiva):** "Docs/MVP.md" y "Docs/HistoriasDeUsuario.md" se borraron deliberadamente porque quedaron obsoletos; los documentos vigentes son los reales. No hace falta recuperarlos ni tratarlos como fuente.

**Resolución:** **RESUELTA**. Los documentos recuperados de git (`Docs/MVP.md`, `Docs/HistoriasDeUsuario.md`, `Docs/Relevamiento.pdf`) no son fuente válida. Solo valen los documentos vigentes (`Docs/definici_n_del_mvp_velco.md`, `Docs/historias_de_usuario_velco.md`, `Docs/tablero-taller-v2.html`) y las plantillas reales (`Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx`, `Docs/FichasExcel/A - OP-MASTER.xlsx`). En consecuencia se revisaron DD-04, DD-07 y DD-08 para eliminar requisitos sin respaldo: exportación consolidada, PIN y tasa por etapa.

## Preguntas abiertas (priorizadas)

| Prioridad | Pregunta | Bloquea | Decisor |
|---|---|---|---|
| Alta | ¿Cómo maneja `exceljs` el enlace externo de ~577 KB y la ruta UNC? (IN-08) | Sprint 4 — exportación | Equipo técnico + Velco (acceso al servidor) |
| Alta | ¿Se aprueba el diseño de auth de Fase 2 antes de escribir cualquier código de autenticación? (DD-07) | Fase 2 | Aprobación humana explícita |
| Media | ¿Velco quiere un catálogo maestro de etapas o texto libre por OP? (IN-07) | Carga de OP | Jefe de taller |
| Media | ¿Qué zonas horaria y moneda se fijan en configuración? (SU-02, SU-05) | Semáforo y exportación | Gerente / contaduría |
| Media | ¿Se confirma la tasa por etapa/categoría para reemplazar la global? (IN-02) | Fase 2 | Gerente / contaduría |
| Baja | ¿Se conserva la numeración `HU-20A/B` sin `HU-20`? (IN-06) | Trazabilidad | Product Owner |

## Campos de discovery

Los seis campos de `state.kb.discovery` se obtuvieron de las fuentes y de las decisiones explícitas del usuario, por lo que **no hay valores de baja confianza** que registrar.

## Fuentes

- Fuentes vigentes: `Docs/definici_n_del_mvp_velco.md`, `Docs/historias_de_usuario_velco.md`, `Docs/tablero-taller-v2.html`, `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` y `Docs/FichasExcel/A - OP-MASTER.xlsx`.
- `Docs/MVP.md`, `Docs/HistoriasDeUsuario.md` y `Docs/Relevamiento.pdf` no son fuente: borrado deliberado por obsoletos (IN-09).
- Decisiones 2, 3, 4, 5, 7 y 8 de [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md).
