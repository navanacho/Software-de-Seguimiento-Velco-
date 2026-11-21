# CHANGES — Secuencia de Implementación

> Índice canónico de todos los changes del proyecto **Software-de-Seguimiento-Velco- (Velco SRL)**.
> Cada change es atómico: un agente puede implementarlo en una sesión (~4-6 horas).
> **Leer este archivo antes de ejecutar cualquier `/opsx:propose`.**

---

## Cómo usar este documento

1. Identificar el change a implementar (verificar que sus dependencias están en `openspec/changes/archive/`).
2. Leer los archivos de la knowledge-base indicados en "Leer antes" para ese change.
3. Ejecutar `/opsx:propose <slug-del-change>` (el slug es el nombre en `backticks` de cada change; el ID `C-NN` es solo la referencia de este índice).
4. Al terminar el change, archivarlo con `/opsx:archive <slug-del-change>`.
5. Marcar el checkbox `[x]` en este archivo.

---

## Árbol de dependencias

```
C-01 velco-mvp-foundation
  ├── C-02 core-order-models
  │     └── C-03 estado-y-avance-domain
  │           └── C-04 tablero-read-api
  │                 └── C-05 tablero-visual
  │                       └── C-06 ordenes-y-linea-base-api
  │                             ├── C-07 ordenes-form
  │                             └── C-08 horas-reales-api
  │                                   ├── C-09 horas-reales-ui
  │                                   │     └── C-10 configuracion-global
  │                                   └── C-11 desvios-y-margen-domain   ← depende además de C-03
  │                                         ├── C-12 analitica-de-rentabilidad-ui  ← + C-10 + C-05
  │                                         └── C-14 exportacion-costeo           ← + C-13
  │                                               └── C-15 exportacion-op-master
  │                                                     └── C-16 descargas-y-impresion-ui
  └── C-13 excel-template-spike   ← se ejecuta en paralelo desde C-01; exigido por C-14
```

### Paralelismo por fase

> Cada "gate" es un punto de sincronización. Los changes dentro de un gate pueden ejecutarse en paralelo.

```
GATE 0: ninguna
  → C-01 velco-mvp-foundation                    (solo)

GATE 1: C-01 ✓                                   ← PRIMER FORK
  → C-02 core-order-models                       [Agente A]
  → C-13 excel-template-spike                    [Agente B — spike, se resuelve antes de C-14]

GATE 2: C-02 ✓
  → C-03 estado-y-avance-domain                  (solo)

GATE 3: C-03 ✓
  → C-04 tablero-read-api                        (solo)

GATE 4: C-04 ✓
  → C-05 tablero-visual                          [Agente C]

GATE 5: C-05 ✓
  → C-06 ordenes-y-linea-base-api                [Agente A]

GATE 6: C-06 ✓                                   ← FORK Sprint 2
  → C-07 ordenes-form                            [Agente C]
  → C-08 horas-reales-api                        [Agente A]

GATE 7: C-08 + C-05 ✓
  → C-09 horas-reales-ui                         [Agente C]

GATE 8: C-09 ✓                                   ← FORK Sprint 3
  → C-10 configuracion-global                    [Agente B]
  → C-11 desvios-y-margen-domain                 [Agente A — si C-03 ✓]

GATE 9: C-10 + C-11 + C-05 ✓
  → C-12 analitica-de-rentabilidad-ui            [Agente C]

GATE 10: C-11 + C-13 ✓                           ← cierre del spike antes de exportar
  → C-14 exportacion-costeo                      [Agente A]

GATE 11: C-14 ✓
  → C-15 exportacion-op-master                   [Agente A]

GATE 12: C-15 ✓
  → C-16 descargas-y-impresion-ui                [Agente C]
```

### Camino crítico (11 changes — mínimo irreducible)

```
C-01 → C-02 → C-03 → C-04 → C-05 → C-06 → C-08 → C-11 → C-14 → C-15 → C-16
```

`C-13` no está en el camino crítico porque corre en paralelo desde GATE 1, pero es **bloqueante** para `C-14`: si el spike no cierra, Sprint 4 no arranca.

### Plan óptimo con 3 agentes

```
Paso │ Agente A (Backend Core)         │ Agente B (Backend Aux / Spike) │ Agente C (Frontend)
─────┼─────────────────────────────────┼────────────────────────────────┼─────────────────────────────
  1  │ C-01 velco-mvp-foundation       │                —               │             —
  2  │ C-02 core-order-models          │ C-13 excel-template-spike      │             —
  3  │ C-03 estado-y-avance-domain     │                —               │             —
  4  │ C-04 tablero-read-api           │                —               │             —
  5  │                —                │                —               │ C-05 tablero-visual
  6  │ C-06 ordenes-y-linea-base-api   │                —               │             —
  7  │ C-08 horas-reales-api           │                —               │ C-07 ordenes-form
  8  │                —                │                —               │ C-09 horas-reales-ui
  9  │ C-11 desvios-y-margen-domain    │ C-10 configuracion-global      │             —
 10  │                —                │                —               │ C-12 analitica-de-rentabilidad-ui
 11  │ C-14 exportacion-costeo         │                —               │             —
 12  │ C-15 exportacion-op-master      │                —               │             —
 13  │                —                │                —               │ C-16 descargas-y-impresion-ui
```

---

## FASE 0 — Fundación y decisiones canónicas

> Sin change de autenticación: DD-07/RN-AU-01 la difieren a Fase 2 y exigen aprobación humana explícita antes de escribir código (dominio CRITICO).

### [C-01] `velco-mvp-foundation`
- **Estado**: `[x]` completado
- **Scope**: Fundación del proyecto y congelamiento de decisiones; sin código de aplicación de negocio
  - Registrar DD-01…DD-10 como ADR versionados: stack Opción B, esquema canónico, auth diferida, Excel sobre plantillas, avance derivado, exportación por OP
  - Scaffolding `backend/` (Fastify 5.12.8, `GET /api/health`, `src/features/<feature>/{application,http,prisma,excel}` y `src/shared/`) y `frontend/` (Vite 8.3.8 + React 19.3.1 + TypeScript 7.0.2, `src/features/<feature>/{components,hooks,queries}`, `src/shared/`, `src/app/` y `global.css`)
  - `docker-compose.yml` con PostgreSQL 18.7 (imagen `postgres:18.7`) para desarrollo; `backend/prisma/schema.prisma` inicializado con Prisma 7.10.1 (`datasource`/`generator`), sin modelos de negocio todavía
  - `.env.example` con `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `TZ`, `EXCEL_TEMPLATES_DIR`, `EXCEL_UNC_BASE`; `.env` ignorado por git
  - Vitest configurado en ambos proyectos con un test de smoke que corre antes de cualquier implementación
  - Tests: humo de health check y de configuración de Vitest
- **Dependencias**: ninguna
- **Governance**: CRITICO
- **Leer antes**:
  - `knowledge-base/01_vision_y_objetivos.md` §Principios de producto, §Fuera de alcance
  - `knowledge-base/02_descripcion_general.md` §Stack tecnológico
  - `knowledge-base/08_arquitectura_propuesta.md` §Estructura de directorios, §Variables de entorno
  - `knowledge-base/09_decisiones_y_supuestos.md` DD-01, DD-02, DD-07, DD-10
  - `knowledge-base/10_preguntas_abiertas.md` IN-08

---

## FASE 1 — Sprint 1: Estructura base y tablero visual

> HU-05, HU-06, HU-07 y HU-09. El tablero se alimenta de datos reales desde el primer change; no se usa `localStorage` ni el slider del prototipo.

### [C-02] `core-order-models`
- **Estado**: `[x]` completado
- **Scope**: Modelos core y primera migración
  - Migración 001: `configuracion` (fila singleton `id=1`), `clientes` (nombre único), `ordenes_trabajo` (`numero_op` único, `cliente_id` FK RESTRICT, `monto_vendido NUMERIC(14,2)`), `etapas_orden` (`orden_id` FK CASCADE, único `(orden_id, orden_secuencia)`)
  - Modelos Prisma y puertos `ConfiguracionRepository`, `ClienteRepository`, `OpRepository`, `EtapaRepository` en `application/ports`
  - Seed mínimo: `valor_hora_estandar=0`, `dias_alerta_riesgo=3`, `porcentaje_avance_riesgo=80`, `etapas_default=["Corte","Soldadura","Mecanizado","Pintura","Entrega"]`; sin tabla `usuarios`
  - Sin columnas `porcentaje_avance` ni agregados de materiales en `ordenes_trabajo`
  - Tests de integración: unicidad de `numero_op` y de cliente, CASCADE/RESTRICT, singleton de configuración
- **Dependencias**: C-01
- **Governance**: CRITICO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §configuracion, §clientes, §ordenes_trabajo, §etapas_orden, §Seed data inicial
  - `knowledge-base/09_decisiones_y_supuestos.md` DD-03, DD-06
  - `knowledge-base/05_reglas_de_negocio.md` RN-OP-01, RN-ETAPA-02, RN-CONFIG-01..03
  - `knowledge-base/02_descripcion_general.md` §Persistencia y reglas derivadas
  - `knowledge-base/08_arquitectura_propuesta.md` §Patrones aplicados

---

### [C-03] `estado-y-avance-domain`
- **Estado**: `[x]` completado
- **Scope**: Reglas puras de estado, avance y flujo (TDD: tests primero)
  - Funciones puras en `domain/ordenes` y `domain/costos`: `calcularAvance`, `etapaAhora`, `calcularSemaforo`, `diasRestantes`, `agruparFlujo`
  - Prioridad de semáforo: `Terminado` → `Atrasado` → `En riesgo` → `En plazo`; umbrales inyectados desde configuración, sin importar Prisma; comparación a medianoche de `TZ`
  - DTO de salida con derivados (avance, semáforo, días restantes, etapa `ahora`) para consumo de API y frontend; el frontend no recalcula
  - Tests Vitest: RN-SEMAFORO-01..06, RN-AVANCE-01/02, RN-AHORA-01, RN-FLujo-01; OP sin etapas ⇒ avance 0; OP terminada con fecha vencida ⇒ gris
- **Dependencias**: C-02
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/05_reglas_de_negocio.md` §Semáforo de plazo, §Etapas y avance
  - `knowledge-base/06_funcionalidades.md` HU-05, HU-06, HU-07
  - `knowledge-base/07_flujos_principales.md` Flujo 2, Flujo 3
  - `knowledge-base/09_decisiones_y_supuestos.md` DD-03, SU-05
  - `knowledge-base/01_vision_y_objetivos.md` §Principios de producto

---

### [C-04] `tablero-read-api`
- **Estado**: `[x]` completado
- **Scope**: Endpoints que alimentan el tablero
  - `GET /api/ops` con `listOps({ fechaDesde, fechaHasta, estado })` más filtros por cliente, etapa `ahora` y búsqueda por N° de OP/pieza (HU-09); DTO con KPIs y conteos de flujo
  - `GET /api/ops/:id` con etapas, horas, materiales y derivados; contrato reutilizado por HU-14/15/16
  - `PATCH /api/ops/:id/etapas/:etapaId` para `completada` con recálculo de avance, `ahora` y semáforo; 404 si la etapa es de otra OP
  - Validación de frontera con esquemas Fastify: fechas válidas y rangos; ninguna regla de negocio dentro del handler
  - Tests de integración: filtros sobre semáforo derivado, OP terminada excluida del flujo, desmarcar etapa reactiva la OP
- **Dependencias**: C-03
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/07_flujos_principales.md` Flujo 2, Flujo 3
  - `knowledge-base/02_descripcion_general.md` §API REST (resumen)
  - `knowledge-base/06_funcionalidades.md` HU-05, HU-06, HU-07, HU-09
  - `knowledge-base/08_arquitectura_propuesta.md` §DTO de salida, §Regla de oro
  - `knowledge-base/05_reglas_de_negocio.md` RN-GLOBAL-02

---

### [C-05] `tablero-visual`
- **Estado**: `[ ]` pendiente
- **Scope**: Tablero operativo de la SPA
  - Grilla única de tarjetas (sin columnas Kanban ni slider de avance) con estética industrial de `Docs/tablero-taller-v2.html`: KPIs superiores, franja amarilla/negra, tipografía condensada
  - Tira superior *"Dónde está cada trabajo ahora"* con conteo por etapa; badge `ahora` en la primera etapa pendiente; checkbox con actualización optimista vía `PATCH`
  - Filtros y búsqueda por cliente, estado, etapa y texto; estado vacío con acciones sugeridas
  - Contenedores que cargan DTOs y componentes presentacionales de tarjeta; `shared/domain-client` sin lógica de negocio
  - Tests de componente: semáforo y `ahora` en tarjeta, ausencia de slider, actualización optimista con rollback
- **Dependencias**: C-04
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` HU-05, HU-06, HU-07, HU-09
  - `knowledge-base/08_arquitectura_propuesta.md` §Container / Presentational, §Estructura de directorios
  - `knowledge-base/01_vision_y_objetivos.md` §Principios de producto
  - `knowledge-base/05_reglas_de_negocio.md` RN-GLOBAL-01
  - `knowledge-base/07_flujos_principales.md` Flujo 2

---

## FASE 2 — Sprint 2: Gestión de OP, línea base e imputación real

> HU-01, HU-02, HU-04, HU-10 y HU-13. `C-07` y `C-08` pueden ejecutarse en paralelo tras `C-06`.

### [C-06] `ordenes-y-linea-base-api`
- **Estado**: `[ ]` pendiente
- **Scope**: Escritura de OP, materiales y etapas
  - Migración 002: `materiales_orden` con `tipo ENUM('MP','INSUMOS','TERCERIZADOS')`, `cantidad > 0`, `costo_unitario_cotizado`, `costo_unitario_real NULL`, `nro_remito`, `nro_factura`, `nt`, `po` e índices
  - Casos de uso `createOp`, `updateOp`, `altaCliente`, `gestionarEtapas` en una transacción: cliente + OP + `etapas_default` + materiales
  - Endpoints: `POST /api/ops` (409 duplicado, 422 cliente vacío), `PUT /api/ops/:id`, `POST /api/clientes`, `POST /api/ops/:id/etapas`, `PATCH /api/ops/:id/etapas/:etapaId/orden`, `DELETE /api/ops/:id/etapas/:etapaId`, `POST /api/ops/:id/materiales`
  - Horas vendidas por etapa y agregados de materiales calculados en dominio, nunca columnas editables
  - Tests de integración: atomicidad de la transacción, unicidad, reorden sin pérdida de `horas_vendidas`, derivados recalculados
- **Dependencias**: C-05
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §materiales_orden, §ordenes_trabajo (derivados)
  - `knowledge-base/06_funcionalidades.md` HU-01, HU-02, HU-04
  - `knowledge-base/07_flujos_principales.md` Flujo 1
  - `knowledge-base/09_decisiones_y_supuestos.md` DD-05, DD-06
  - `knowledge-base/05_reglas_de_negocio.md` §Órdenes de producción, §Etapas y avance

---

### [C-07] `ordenes-form`
- **Estado**: `[ ]` pendiente
- **Scope**: Alta y edición de OP desde la UI
  - Vistas `/ops/nueva` y `/ops/:id/editar`: cliente existente o alta inline, N° OP, pieza, fechas, monto vendido, horas vendidas por etapa y materiales por tipo
  - Editor de etapas: agregar, quitar y reordenar texto libre; precarga de `etapas_default`; sin taxonomía cerrada
  - Manejo de 409/422 con resaltado por campo y retorno al tablero con la tarjeta creada
  - Tests de componente: precarga de etapas, validación de `numero_op`, reorden persistido
- **Dependencias**: C-06
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` HU-01, HU-02, HU-04
  - `knowledge-base/07_flujos_principales.md` Flujo 1
  - `knowledge-base/03_actores_y_roles.md` §Rutas públicas
  - `knowledge-base/05_reglas_de_negocio.md` RN-ETAPA-01..03
  - `knowledge-base/01_vision_y_objetivos.md` §Alcance v1.0 (MVP)

---

### [C-08] `horas-reales-api`
- **Estado**: `[ ]` pendiente
- **Scope**: Imputación y corrección de partes de horas
  - Migración 003: `registros_horas` con FK `orden_id` CASCADE, `etapa_id` SET NULL, `operario VARCHAR(100)`, `horas NUMERIC(6,2) > 0`, `fecha`, `created_at`; índices `(orden_id, fecha)`, `(etapa_id)`, `(operario)`; sin `usuario_id` en MVP
  - Caso de uso `imputarHoras` y endpoints `POST /api/ops/:id/horas`, `GET /api/ops/:id/horas`, `PATCH /api/ops/:id/horas/:horaId`, `DELETE /api/ops/:id/horas/:horaId`; 422 si `horas <= 0`
  - Recálculo de totales y derivados tras cada mutación; una sola implementación de la regla en dominio
  - Tests de integración: parte con y sin etapa, edición, eliminación, recálculo, rechazo de horas no positivas
- **Dependencias**: C-06
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §registros_horas
  - `knowledge-base/05_reglas_de_negocio.md` §Horas
  - `knowledge-base/06_funcionalidades.md` HU-10, HU-13
  - `knowledge-base/07_flujos_principales.md` Flujo 4
  - `knowledge-base/09_decisiones_y_supuestos.md` DD-07 (diferimiento de `usuario_id`)

---

### [C-09] `horas-reales-ui`
- **Estado**: `[ ]` pendiente
- **Scope**: Carga rápida y edición de horas desde tarjeta y detalle
  - Modal *Cargar horas* con fecha, etapa opcional, operario en texto libre y validación `horas > 0`
  - Listado editable de partes en el detalle de la OP con editar/eliminar y recálculo visible de totales
  - Barra `Horas Reales / Horas Vendidas` en la tarjeta alimentada por el DTO, sin cálculo en React
  - Tests de componente: validación de horas, actualización de la lista, ausencia de lógica de negocio en componentes
- **Dependencias**: C-08, C-05
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` HU-10, HU-13
  - `knowledge-base/07_flujos_principales.md` Flujo 4
  - `knowledge-base/08_arquitectura_propuesta.md` §Container / Presentational
  - `knowledge-base/05_reglas_de_negocio.md` RN-HORAS-05
  - `knowledge-base/04_modelo_de_datos.md` §registros_horas

---

## FASE 3 — Sprint 3: Analítica de desvíos y configuración

> HU-14, HU-15, HU-16 y HU-18. `C-10` y `C-11` pueden ejecutarse en paralelo tras `C-09`.

### [C-10] `configuracion-global`
- **Estado**: `[ ]` pendiente
- **Scope**: Parámetros globales editables sin cambio de código
  - `GET /api/configuracion` y `PUT /api/configuracion` sobre la fila singleton `id=1`; validación `valor_hora >= 0`, `dias_alerta_riesgo >= 0`, `0 <= porcentaje_avance_riesgo <= 100`, 422 fuera de rango
  - Vista `/configuracion`: valor hora estándar, días para "En riesgo", % de avance de riesgo y edición de `etapas_default`
  - Los umbrales se aplican al leer las OP; aviso de que el margen histórico se recalcula con la tasa vigente
  - Tests: singleton, validación de rangos, efecto del cambio de umbrales en el semáforo
- **Dependencias**: C-09
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/05_reglas_de_negocio.md` §Configuración, RN-MARGEN-04
  - `knowledge-base/06_funcionalidades.md` HU-18
  - `knowledge-base/07_flujos_principales.md` Flujo 7
  - `knowledge-base/04_modelo_de_datos.md` §configuracion
  - `knowledge-base/09_decisiones_y_supuestos.md` DD-04, SU-05

---

### [C-11] `desvios-y-margen-domain`
- **Estado**: `[ ]` pendiente
- **Scope**: Reglas puras de desvío, comparativa y rentabilidad (tests antes que la implementación)
  - Funciones puras: `horasVendidasTotales`, `horasRealesTotales`, `desvioHoras`, `consumoPorcentaje`, `alertaDesvio` (consumo > avance + 15% o reales > vendidas), `comparativaPorEtapa`, `costoMaterialReal` con `COALESCE`, `margenReal` con tasa global inyectada
  - División por cero: con horas vendidas = 0 no se calcula `% consumo` y la alerta se evalúa solo con `reales > vendidas`
  - Aritmética decimal con `NUMERIC`; redondeo a 2 decimales solo al mostrar y exportar, nunca con coma flotante
  - Modelo de planilla compartido por ambas variantes de `exportOp`, sin acceso a archivos
  - Tests Vitest: RN-HORAS-01..07, RN-MARGEN-01..06, RN-HORAS-06, tasa global diferida (IN-02)
- **Dependencias**: C-08, C-03
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/05_reglas_de_negocio.md` §Horas, §Costos y margen
  - `knowledge-base/06_funcionalidades.md` HU-14, HU-15, HU-16
  - `knowledge-base/07_flujos_principales.md` Flujo 5
  - `knowledge-base/09_decisiones_y_supuestos.md` DD-04, DD-05
  - `knowledge-base/02_descripcion_general.md` §Persistencia y reglas derivadas

---

### [C-12] `analitica-de-rentabilidad-ui`
- **Estado**: `[ ]` pendiente
- **Scope**: Visualización de desvíos y márgenes
  - Termómetro `Horas Reales / Horas Vendidas` con `% consumo` y alerta visual de desvío en cada tarjeta (HU-14)
  - Pestaña *Análisis de Rentabilidad* en el detalle: tabla por etapa con vendidas/reales/desvío en horas y %, incluidas horas sin etapa; costos cotizados vs. reales y margen neto (HU-15/16)
  - Advertencia cuando `valor_hora_estandar = 0` indicando que falta configurar la tasa; importes mostrados con 2 decimales
  - Tests de componente: alerta del 15%, división por cero, ausencia de cálculo local en React
- **Dependencias**: C-11, C-10, C-05
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` HU-14, HU-15, HU-16
  - `knowledge-base/07_flujos_principales.md` Flujo 5
  - `knowledge-base/05_reglas_de_negocio.md` §Horas, §Costos y margen
  - `knowledge-base/08_arquitectura_propuesta.md` §Container / Presentational
  - `knowledge-base/10_preguntas_abiertas.md` IN-02

---

## FASE 4 — Sprint 4: Motor de exportación Excel dual

> HU-20A y HU-20B. El spike `C-13` corre desde GATE 1 pero debe estar cerrado antes de `C-14`. Se rellenan plantillas; nunca se genera un workbook desde cero.

### [C-13] `excel-template-spike`
- **Estado**: `[ ]` pendiente
- **Scope**: Spike técnico acotado sobre las plantillas oficiales (IN-08)
  - Clonar `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` y `Docs/FichasExcel/A - OP-MASTER.xlsx`; cargar y volver a guardar con `exceljs` 4+ y comparar celdas combinadas, estilos, encabezados, bloques y fórmulas antes/después
  - Probar el enlace externo de ~577 KB y la ruta UNC `\\Servidor\g\OPERACIONES\ORDENES DE PROCESO\OP - DIGITALIZADA\` leyendo `EXCEL_UNC_BASE` desde configuración, sin hardcodearla
  - Entregable: informe/ADR con la decisión de preservar, eliminar o reemplazar el enlace por un valor estático y la mitigación antes de `C-14`; ajustar DD-02 si corresponde
  - Tests de contrato: round-trip de plantilla y verificación de fórmulas/celdas combinadas; plantilla ausente ⇒ 500 operativo, nunca workbook improvisado
- **Dependencias**: C-01
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/08_arquitectura_propuesta.md` §Spike técnico pendiente (Excel), §Variables de entorno
  - `knowledge-base/10_preguntas_abiertas.md` IN-08
  - `knowledge-base/09_decisiones_y_supuestos.md` DD-02
  - `knowledge-base/02_descripcion_general.md` §Integraciones externas
  - `knowledge-base/07_flujos_principales.md` Flujo 6 (casos de error)

---

### [C-14] `exportacion-costeo`
- **Estado**: `[ ]` pendiente
- **Scope**: Variante económica de `exportOp`
  - Función pura `exportOp(opId, { incluirMargenes })` con MAP entidades → celdas; con `incluirMargenes: true` construye el modelo de `MASTER COSTEO NUEVO.xlsx`: cliente, OP, bloques `INSUMOS / MP / TERCEROS` con `UN / COST. UNIT. / COSTO TOTAL`, horas vendidas y reales, valor hora y comparativa de márgenes
  - Adaptador `backend/src/features/exportacion/excel`: carga la plantilla desde `EXCEL_TEMPLATES_DIR`, preserva estilos, combinaciones y fórmulas, devuelve `Buffer`; `Content-Disposition: COSTEO_[NroOP]_[Cliente].xlsx`
  - Endpoint `GET /api/ops/:id/export?variante=costeo`; 500 operativo si falta la plantilla
  - Tests: unidad del MAP puro, contrato de modelo compartido entre variantes, round-trip con la plantilla y comparación contra un costeo real de Velco
- **Dependencias**: C-11, C-13
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` HU-20A
  - `knowledge-base/07_flujos_principales.md` Flujo 6
  - `knowledge-base/09_decisiones_y_supuestos.md` DD-02, DD-08
  - `knowledge-base/05_reglas_de_negocio.md` §Exportación
  - `knowledge-base/08_arquitectura_propuesta.md` §Plantilla + Adapter (Excel), §Spike técnico pendiente

---

### [C-15] `exportacion-op-master`
- **Estado**: `[ ]` pendiente
- **Scope**: Variante operativa de `exportOp`
  - Con `incluirMargenes: false`, el mismo modelo puro produce `A - OP-MASTER.xlsx`: datos de la orden, detalle técnico de la pieza, fechas, ruta de etapas, bloques `MATERIALES / TERCERIZADOS` con `CANTIDAD / DESCRIPCIÓN / NT N° / PO N° / REMITO / FACTURA` y horas asignadas/ejecutadas; sin rentabilidad comercial
  - Adaptador de plantilla y descarga `OP_[NroOP]_[Cliente].xlsx`; endpoint `GET /api/ops/:id/export?variante=op`
  - Vista de impresión limpia desde el navegador (`window.print()`), sin montos; un archivo por OP, nunca workbook con hoja resumen
  - Tests: ausencia de columnas de margen en la salida, mapeo completo de bloques, contenido operativo, impresión sin datos económicos
- **Dependencias**: C-14
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` HU-20B
  - `knowledge-base/05_reglas_de_negocio.md` RN-EXPORT-01, RN-EXPORT-02, RN-EXPORT-04, RN-EXPORT-06
  - `knowledge-base/07_flujos_principales.md` Flujo 6
  - `knowledge-base/02_descripcion_general.md` §API REST (resumen)
  - `knowledge-base/09_decisiones_y_supuestos.md` DD-08

---

### [C-16] `descargas-y-impresion-ui`
- **Estado**: `[ ]` pendiente
- **Scope**: Superficie de descarga e impresión
  - Botones *Costeo* y *OP* en tarjeta y detalle; el nombre del archivo lo define `Content-Disposition`, sin exponer rutas del servidor
  - Vista de impresión/PDF de la OP con estilos de impresión y sin importes, accesible desde el detalle
  - Errores operativos (plantilla ausente, UNC inaccesible) con mensaje accionable y sin reintentos infinitos
  - Tests de componente: dos descargas independientes, nombre de archivo, variante operativa sin márgenes, manejo del error 500
- **Dependencias**: C-15
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` HU-20A, HU-20B
  - `knowledge-base/07_flujos_principales.md` Flujo 6
  - `knowledge-base/08_arquitectura_propuesta.md` §Seguridad, §Estrategia de testing
  - `knowledge-base/03_actores_y_roles.md` §Rutas públicas
  - `knowledge-base/05_reglas_de_negocio.md` RN-EXPORT-01, RN-EXPORT-06

---

**Tabla resumen**

| ID | Change | Fase | Governance | Dependencias | Historias |
|---|---|---|---|---|---|
| C-01 | `velco-mvp-foundation` | 0 — Fundación | CRITICO | ninguna | DD-01..DD-10 |
| C-02 | `core-order-models` | 1 — Tablero | CRITICO | C-01 | base de HU-05/09 |
| C-03 | `estado-y-avance-domain` | 1 — Tablero | MEDIO | C-02 | HU-05, HU-06, HU-07 |
| C-04 | `tablero-read-api` | 1 — Tablero | MEDIO | C-03 | HU-05, HU-06, HU-09 |
| C-05 | `tablero-visual` | 1 — Tablero | BAJO | C-04 | HU-05, HU-06, HU-07, HU-09 |
| C-06 | `ordenes-y-linea-base-api` | 2 — OP y horas | MEDIO | C-05 | HU-01, HU-02, HU-04 |
| C-07 | `ordenes-form` | 2 — OP y horas | BAJO | C-06 | HU-01, HU-02, HU-04 |
| C-08 | `horas-reales-api` | 2 — OP y horas | MEDIO | C-06 | HU-10, HU-13 |
| C-09 | `horas-reales-ui` | 2 — OP y horas | BAJO | C-08, C-05 | HU-10, HU-13 |
| C-10 | `configuracion-global` | 3 — Analítica | MEDIO | C-09 | HU-18 |
| C-11 | `desvios-y-margen-domain` | 3 — Analítica | MEDIO | C-08, C-03 | HU-14, HU-15, HU-16 |
| C-12 | `analitica-de-rentabilidad-ui` | 3 — Analítica | BAJO | C-11, C-10, C-05 | HU-14, HU-15, HU-16 |
| C-13 | `excel-template-spike` | 4 — Exportación | MEDIO | C-01 | IN-08 |
| C-14 | `exportacion-costeo` | 4 — Exportación | MEDIO | C-11, C-13 | HU-20A |
| C-15 | `exportacion-op-master` | 4 — Exportación | MEDIO | C-14 | HU-20B |
| C-16 | `descargas-y-impresion-ui` | 4 — Exportación | BAJO | C-15 | HU-20A, HU-20B |

**Primer change recomendado**: `C-01` (`velco-mvp-foundation`). Para arrancar: `/opsx:propose velco-mvp-foundation`.
