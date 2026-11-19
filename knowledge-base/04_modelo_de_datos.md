# Modelo de Datos

Este modelo es la versión canónica derivada del SQL propuesto en `Docs/definici_n_del_mvp_velco.md` **más** las decisiones de la conversación de fundación. Donde el documento y las decisiones difieren, prevalecen las decisiones (ver [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md)).

## Dominios

| Dominio | Descripción |
|---|---|
| Configuración | Parámetros globales: valor hora, umbrales de riesgo y etapas por defecto |
| Clientes | Entidad propia, reemplaza el `VARCHAR` libre del documento original |
| Órdenes de trabajo | Entidad raíz; cabecera comercial y de plazos de cada OP/OT |
| Etapas de orden | Checklist ordenado y línea base de horas vendidas por etapa |
| Horas reales | Partes diarios imputados por OP y etapa |
| Materiales | Insumos, MP y tercerizados normalizados por OP con seguimiento de remito/factura/nt/po |
| Exportación | Operación pura sobre los datos anteriores; no posee tablas propias |

## ERD (Entity Relationship Diagram)

```text
configuracion (id=1)
        |  etapas_default JSONB  (plantilla al crear OP)
        v
    clientes 1──────< ordenes_trabajo >──────1 (lógico: numero_op único)
                            |
              +-------------+--------------+---------------------+
              |             |              |                     |
              v             v              v                     v
      etapas_orden   registros_horas  materiales_orden      (derivados)
       (por OP)       (por OP/etapa)    (por OP, 3 tipos)    avance, horas,
                                                              costos, margen

  ordenes_trabajo.id ──┬─> etapas_orden.orden_id        (CASCADE)
                       ├─> registros_horas.orden_id     (CASCADE)
                       └─> materiales_orden.orden_id    (CASCADE)

  etapas_orden.id ───────> registros_horas.etapa_id     (SET NULL)
  ordenes_trabajo.cliente_id ─> clientes.id             (RESTRICT)
  registros_horas.usuario_id ─> usuarios.id             (nullable, Fase 2)
```

No existe tabla `usuarios` en el MVP. No existen columnas `porcentaje_avance`, `costo_materiales_cotizado` ni `costo_materiales_real` en `ordenes_trabajo`.

## Entidades

### configuracion

- Atributos: `id INT PK DEFAULT 1`, `valor_hora_estandar NUMERIC(12,2) NOT NULL DEFAULT 0`, `dias_alerta_riesgo INT NOT NULL DEFAULT 3`, `porcentaje_avance_riesgo INT NOT NULL DEFAULT 80`, `etapas_default JSONB NOT NULL DEFAULT '["Corte","Soldadura","Mecanizado","Pintura","Entrega"]'`.
- Relaciones: ninguna; fila única de parámetros globales.
- Constraints: `id = 1` (bloque de configuración singleton).
- Índices: no requeridos.
- Nota: `valor_hora_estandar` es la tasa **global**. La corrección diferida a tasa por etapa/categoría está documentada en DD-04.

### clientes

- Atributos: `id UUID PK DEFAULT gen_random_uuid()`, `nombre VARCHAR(150) UNIQUE NOT NULL`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- Relaciones: `1:N` con `ordenes_trabajo`.
- Constraints: nombre único y no vacío.
- Índices: índice único sobre `nombre`; índice sobre `ordenes_trabajo.cliente_id`.
- Nota: el SQL original guardaba `cliente VARCHAR(150)` dentro de la OP; se normaliza (DD-06).

### ordenes_trabajo

- Atributos: `id UUID PK DEFAULT gen_random_uuid()`, `numero_op VARCHAR(50) UNIQUE NOT NULL`, `cliente_id UUID NOT NULL FK -> clientes(id)`, `descripcion_pieza TEXT NOT NULL`, `fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE`, `fecha_entrega DATE NOT NULL`, `monto_vendido NUMERIC(14,2) NOT NULL DEFAULT 0`, `observaciones TEXT`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`.
- Relaciones: `N:1` con `clientes`; `1:N` con `etapas_orden`, `registros_horas` y `materiales_orden`.
- Constraints: `numero_op` único (CA de HU-01); `fecha_entrega` obligatoria; montos en `NUMERIC`, nunca `FLOAT`.
- Índices: único en `numero_op`; índices en `cliente_id`, `fecha_entrega`.
- Derivados (no columnas):
  - `porcentaje_avance = ROUND(100.0 * COUNT(*) FILTER (WHERE completada) / NULLIF(COUNT(*), 0))` sobre `etapas_orden` de la OP. Si la OP no tiene etapas, avance = 0.
  - `terminado` = todas las etapas completadas (o avance = 100 por la definición del documento).
  - `horas_vendidas_totales = SUM(horas_vendidas)` de sus etapas.
  - `horas_reales_totales = SUM(horas)` de sus partes.
  - `costo_materiales_cotizado = SUM(cantidad * costo_unitario_cotizado)`.
  - `costo_materiales_real = SUM(cantidad * COALESCE(costo_unitario_real, costo_unitario_cotizado))`.
  - `costo_mano_obra_real = horas_reales_totales * configuracion.valor_hora_estandar`.
  - `margen_real = monto_vendido - costo_mano_obra_real - costo_materiales_real`.

### etapas_orden

- Atributos: `id UUID PK DEFAULT gen_random_uuid()`, `orden_id UUID NOT NULL FK -> ordenes_trabajo(id) ON DELETE CASCADE`, `nombre VARCHAR(100) NOT NULL`, `orden_secuencia INT NOT NULL`, `completada BOOLEAN NOT NULL DEFAULT FALSE`, `horas_vendidas NUMERIC(8,2) NOT NULL DEFAULT 0`.
- Relaciones: `N:1` con `ordenes_trabajo`; `1:N` con `registros_horas`.
- Constraints: `horas_vendidas >= 0`; secuencia única por OP recomendada `(orden_id, orden_secuencia)`.
- Índices: `(orden_id, orden_secuencia)`.
- Nota: es la lista autocontenida de la tarjeta. La primera fila con `completada = false` en orden de secuencia es la etapa `ahora`.

### registros_horas

- Atributos: `id UUID PK DEFAULT gen_random_uuid()`, `orden_id UUID NOT NULL FK -> ordenes_trabajo(id) ON DELETE CASCADE`, `etapa_id UUID FK -> etapas_orden(id) ON DELETE SET NULL`, `operario VARCHAR(100) NOT NULL`, `fecha DATE NOT NULL DEFAULT CURRENT_DATE`, `horas NUMERIC(6,2) NOT NULL CHECK (horas > 0)`, `observacion TEXT`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `usuario_id UUID NULL FK -> usuarios(id)` (Fase 2).
- Relaciones: `N:1` con `ordenes_trabajo`; `N:1` opcional con `etapas_orden`.
- Constraints: `horas > 0`.
- Índices: `(orden_id, fecha)`, `(etapa_id)`, `(operario)`.
- Nota: `operario` sigue como texto libre en el MVP; `usuario_id` se agrega nullable cuando exista auth.

### materiales_orden

- Atributos: `id UUID PK DEFAULT gen_random_uuid()`, `orden_id UUID NOT NULL FK -> ordenes_trabajo(id) ON DELETE CASCADE`, `tipo ENUM('MP','INSUMOS','TERCERIZADOS') NOT NULL`, `descripcion TEXT NOT NULL`, `cantidad NUMERIC(12,4) NOT NULL DEFAULT 1`, `unidad VARCHAR(20)`, `costo_unitario_cotizado NUMERIC(14,2) NOT NULL DEFAULT 0`, `costo_unitario_real NUMERIC(14,2) NULL`, `nro_remito VARCHAR(50)`, `nro_factura VARCHAR(50)`, `nt VARCHAR(50)`, `po VARCHAR(50)`.
- Relaciones: `N:1` con `ordenes_trabajo`.
- Constraints: `cantidad > 0`; `costo_unitario_cotizado >= 0`; `costo_unitario_real >= 0` cuando no es `NULL`.
- Índices: `(orden_id, tipo)`, `(nro_factura)`, `(nt)`, `(po)`.
- Origen de los campos: bloques `MATERIALES` / `TERCERIZADOS` de `A - OP-MASTER.xlsx` con `CANTIDAD`, `DESCRIPCIÓN`, `NT N°`, `PO N°`, `REMITO`, `FACTURA`; y bloques `INSUMOS / MP / TERCEROS` con `UN / COST. UNIT. / COSTO TOTAL` de `MASTER COSTEO NUEVO.xlsx`.
- Nota: se descartó guardar el detalle en JSONB (DD-05).

## Seed data inicial

| Entidad | Datos mínimos |
|---|---|
| `configuracion` | Una única fila con `id = 1`, `valor_hora_estandar = 0` (a cargar por HU-18), `dias_alerta_riesgo = 3`, `porcentaje_avance_riesgo = 80`, `etapas_default = ["Corte","Soldadura","Mecanizado","Pintura","Entrega"]` |
| `clientes` | Vacío; se crea al dar de alta la primera OP |
| `ordenes_trabajo` | Vacío en producción. El prototipo HTML tiene datos de ejemplo (`OT-1041`, `OT-1038`, `OT-1036`, `OT-1033`, `OT-1030`) solo para desarrollo/demo |
| `etapas_orden` | Se generan desde `configuracion.etapas_default` al crear una OP, editables después (HU-04) |
| `registros_horas`, `materiales_orden` | Vacío |
| `usuarios` | No existe en el MVP |

## Fuentes

- `Docs/definici_n_del_mvp_velco.md` §3 — esquema SQL original.
- `Docs/historias_de_usuario_velco.md` — HU-01, HU-02, HU-04, HU-10, HU-18.
- Plantillas `Docs/FichasExcel/A - OP-MASTER.xlsx` y `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` (extracto estructural).
- Decisiones 3, 4, 5, 6 y 7 de [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md).
