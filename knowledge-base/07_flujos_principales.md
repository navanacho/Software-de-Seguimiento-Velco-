# Flujos Principales

Cada flujo se documenta extremo a extremo. En el MVP no hay login: el actor es siempre el único usuario (gerente general).

## Flujo 1: Alta de una OP con línea base

**Disparador:** el usuario presiona *Nueva OP*  
**Actor:** gerente general

**Pasos:**
1. [Frontend] Abre formulario con cliente, N° OP, pieza, fechas, monto vendido y etapas precargadas desde `configuracion.etapas_default`.
2. [Frontend] Valida `numero_op` único y `fecha_entrega` en cliente; muestra errores por campo.
3. [API] `createOp` verifica unicidad nuevamente en la transacción (RN-OP-01).
4. [Dominio] Deriva el semáforo inicial con `hoy` y los umbrales globales (RN-SEMAFORO).
5. [Prisma] Inserta `clientes` si hace falta, `ordenes_trabajo` y sus `etapas_orden` en una transacción.
6. [Frontend] Recarga la grilla y muestra la tarjeta con etapa `ahora` en la primera etapa.

```text
Usuario → Formulario React → POST /ops → createOp → Prisma → PostgreSQL
                                   ↑
                        reglas RN-OP / RN-SEMAFORO (purificadas en dominio)
```

**Casos de error:**
- OP duplicada → 409 con mensaje "N° de OP ya existe" → el formulario resalta el campo.
- Cliente vacío → 422 antes de persistir.
- Sin etapas → se permiten 0 etapas, avance = 0 y se registra la duda IN-07 / RN-GLOBAL-03.

## Flujo 2: Lectura del tablero y cálculo de semáforo

**Disparador:** carga inicial de `/` o aplicación de filtros  
**Actor:** gerente general

**Pasos:**
1. [Frontend] Llama `listOps({ fechaDesde, fechaHasta, estado })`.
2. [API] Obtiene OPs con etapas, horas y materiales; aplica filtros de cliente y etapa `ahora`.
3. [Dominio] Para cada OP calcula avance, semáforo, horas, desvío y alerta.
4. [Frontend] Renderiza KPIs superiores, tira *"Dónde está cada trabajo ahora"* y grilla de tarjetas.
5. [Dominio] Agrupa conteos por etapa `ahora` (RN-FLujo-01).

**Casos de error:**
- Sin resultados → estado vacío con acciones sugeridas (ver prototipo `.empty`).
- Configuración ausente → se aplican defaults de RN-CONFIG-01.

## Flujo 3: Marcar una etapa y actualizar "ahora"

**Disparador:** click en el checkbox de una etapa  
**Actor:** gerente general (en Fase 2, operario/supervisor)

**Pasos:**
1. [Frontend] Actualización optimista de `etapas_orden.completada`.
2. [API] Persiste el cambio.
3. [Dominio] Recalcula `porcentaje_avance` derivado (RN-AVANCE-01).
4. [Dominio] Todas completadas ⇒ avance 100 ⇒ semáforo `Terminado` (RN-AVANCE-02, RN-SEMAFORO-01).
5. [Dominio] Recalcula la primera etapa pendiente ⇒ badge `ahora` y conteo de flujo.

```text
Checkbox → PATCH /ops/:id/etapas/:etapaId → dominio (avance + ahora + semáforo)
        ← estado derivado ← Prisma ← PostgreSQL
```

**Casos de error:**
- Etapa inexistente o de otra OP → 404.
- Desmarcar una etapa de una OP terminada → vuelve a estado activo y recalcula `ahora`.

## Flujo 4: Cargar, editar y eliminar horas reales

**Disparador:** *Cargar horas* desde la tarjeta o el detalle de la OP  
**Actor:** gerente general

**Pasos:**
1. [Frontend] Formulario con fecha, etapa (opcional), operario y horas.
2. [Dominio] Valida `horas > 0` (RN-HORAS-05).
3. [API] Inserta `registros_horas`.
4. [Dominio] Recalcula totales, desvío, consumo y alerta de desvío (RN-HORAS-01..04).
5. [Frontend] Actualiza termómetro de la tarjeta y tabla comparativa por etapa.
6. Desde el detalle se pueden editar o eliminar partes (HU-13); todo se recalcula.

**Casos de error:**
- Horas ≤ 0 → 422.
- Horas vendidas = 0 → sin `% consumo`; alerta solo por `reales > vendidas` (RN-HORAS-06).

## Flujo 5: Análisis de rentabilidad de una OP

**Disparador:** abrir pestaña *Análisis de Rentabilidad* en el detalle  
**Actor:** gerente general (ve todos los montos)

**Pasos:**
1. [API] `getOp(id)` devuelve etapas, partes, materiales, monto vendido y tasa global vigente.
2. [Dominio] Calcula horas vendidas/reales por etapa y desvío en horas y % (HU-15).
3. [Dominio] Calcula `costo_materiales_cotizado` y `costo_materiales_real` con fallback por ítem (RN-MARGEN-02/03).
4. [Dominio] Calcula `margen_real = monto_vendido - horas_reales × valor_hora - costo_materiales_real` (RN-MARGEN-01).
5. [Frontend] Muestra tabla comparativa y resultado en `NUMERIC(14,2)`.

**Casos de error:**
- `valor_hora_estandar = 0` (seed) → margen igual a `monto_vendido - costo materiales`; se advierte que falta configurar la tasa (HU-18).

## Flujo 6: Exportación dual de Excel

**Disparador:** descargar planillas desde la tarjeta o el detalle  
**Actor:** gerente general

**Pasos:**
1. [Frontend] Solicita `exportOp(opId, { incluirMargenes })`.
2. [Dominio] La función pura construye el modelo de datos de la planilla: MAP entre entidades y celdas. **No toca archivos**.
3. [Adaptador de infraestructura] Carga la plantilla correspondiente desde `EXCEL_TEMPLATES_DIR` con `exceljs`.
4. [Adaptador] Rellena celdas preservando estilos, combinaciones, encabezados, bloques y fórmulas.
5. [Adaptador] Devuelve el `Buffer` del `.xlsx`.
6. [Frontend] Descarga `COSTEO_[NroOP]_[Cliente].xlsx` o `OP_[NroOP]_[Cliente].xlsx`.
7. [Navegador] Para HU-20B, permite además *Imprimir o guardar PDF*.

```text
exportOp(opId,{incluirMargenes})  [PURO, testeable]
        |
        v
ExcelTemplateRepository (parche OOXML) → plantilla .xlsx existente → Buffer → descarga
```

**Casos de error:**
- Plantilla ausente → 500 con mensaje operativo; no se genera un workbook improvisado (RN-EXPORT-02).
- Enlace externo (577.125 B en OP, 994 B en costeo) y UNC inaccesible → **resueltos en C-13**: `externalLinks/*` se conserva como metadata, las fórmulas `[1]` se sustituyen por valores de BD y la UNC no se usa en runtime; ver IN-08 y DD-02.
- `incluirMargenes: false` → se omiten columnas de rentabilidad en la salida (RN-EXPORT-06).

## Flujo 7: Configuración de parámetros

**Disparador:** abrir `/configuracion`  
**Actor:** gerente general

**Pasos:**
1. [API] Lee la fila singleton `configuracion.id = 1`.
2. [Frontend] Edita valor hora, días de riesgo, % de avance de riesgo y etapas por defecto.
3. [API] Persiste los cambios.
4. [Dominio] Los nuevos umbrales afectan el semáforo y el margen desde ese momento; las OPs históricas se recalculan al leerse.

**Casos de error:**
- Valores negativos o porcentaje > 100 → 422.
- Cambio de tasa → se documenta que el margen histórico se recalcula con la tasa vigente (tasa global, DD-04).

## Flujo 8 (Fase 2, NO implementar): roles / ocultamiento de montos (HU-19; requiere aprobación humana)

**Disparador:** acceso de un usuario con rol `Admin/Oficina` o `Taller`  
**Actor:** usuario de Fase 2 (en el MVP lo ejecuta todo el gerente general)

**Pasos (planificados, sujetos a aprobación):**
1. Definir los roles de HU-19: `Admin/Oficina` ve costos y márgenes; `Taller` ve el tablero, avanza etapas y carga horas sin ver montos.
2. Diseñar DTOs de salida sin importes para `Taller`, sin tocar el dominio.
3. Usar `exportOp(..., incluirMargenes: false)` para la variante operativa.
4. Aprobar el diseño de autenticación antes de escribir cualquier código (R5). Los documentos vigentes no definen PIN ni mecanismo de autenticación.

**Bloqueo:** cualquier auth/PIN/RBAC es dominio CRITICAL y requiere aprobación humana explícita (R5; RN-AU-03).

## Fuentes

- `Docs/definici_n_del_mvp_velco.md` §2 y §4 (sprints).
- `Docs/historias_de_usuario_velco.md` (HU-01, HU-05..07, HU-09, HU-10, HU-13..16, HU-18, HU-20A/B).
- `Docs/tablero-taller-v2.html` (comportamiento del prototipo).
- Decisiones 2, 3, 4, 7 y 8 de [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md).
