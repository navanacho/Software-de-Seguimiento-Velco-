# Decisiones y Supuestos

Las decisiones 1–10 provienen de la conversación de fundación y **no figuran en los documentos fuente**. Son la fuente de verdad para stack, esquema, auth y exportación. Las decisiones 11–13 se registran por adopción explícita de los documentos vigentes (`Docs/definici_n_del_mvp_velco.md`, `Docs/historias_de_usuario_velco.md` y `Docs/design_system_velco.md`).

## Decisiones documentadas

### DD-01 — Stack tecnológico (Opción B)

**Decisión:** React (Vite) + TypeScript + Fastify + PostgreSQL + Prisma + `exceljs`; arquitectura hexagonal; Vitest para TDD estricto.

**Contexto:** el plan de sprints del MVP proponía "Node/Express o Next.js", PostgreSQL/SQLite y `exceljs` u `openpyxl`. Había que elegir un stack único antes de crear el proyecto.

**Alternativas consideradas:**
- Next.js + SQLite.
- Python + openpyxl para el motor Excel.
- Node/Express en lugar de Fastify.

**Justificación:** Next.js mezcla dominio con server actions y dificulta el TDD; SQLite no soporta los tipos del SQL propuesto (`UUID`, `gen_random_uuid()`, `JSONB`, `TIMESTAMPTZ`); Python/openpyxl rompería la unidad de lenguaje. Fastify es más liviano que Express y encaja con HTTP + JSON simple.

**Trade-offs aceptados:** no hay SSR ni server actions; se construye un SPA más una API separada, con dos proyectos que mantener. Se resigna la simplicidad de un único framework full-stack a cambio de dominio testeable.

### DD-02 — Estrategia Excel: parche OOXML quirúrgico sobre plantillas existentes

**Decisión:** copiar `MASTER COSTEO NUEVO.xlsx` y `A - OP-MASTER.xlsx` y parchear solo el OOXML de las celdas gobernadas: sustituir el par `<f>…</f><v>…</v>` por `<v>` con datos de BD en 12 celdas maestras (OP, hoja `1640`, `D10`/`D11`; costeo, hojas `1`..`5`, `C6`/`C7`) y escribir `ID Plano: <codigoPlano>` o `ID Plano: S/P` en `O7` de la hoja `1640`. `exceljs` 4.4.0 queda solo para lectura y verificación. Toda otra pieza OOXML se conserva byte-a-byte y el contenedor ZIP se recomprime. **No** generar los archivos desde cero.

**Contexto:** Velco tiene continuidad contable y operativa apoyada en esas dos planillas; regenerarlas desde cero rompería fórmulas y disposición visual. El OOXML real muestra un enlace de 577.125 bytes en `A - OP-MASTER.xlsx` (`/COMERCIAL/FG48%20-%20FACTURACION%20REGISTRO.xlsx`) y uno de 994 bytes en `MASTER COSTEO NUEVO.xlsx`. La UNC documentada es una referencia histórica sin uso en runtime.

**Alternativas consideradas:**
- Generar `.xlsx` nuevos con estilos recreados.
- Guardar y reabrir con `exceljs` (round-trip de `exceljs`, alternativa descartada).
- Exportar CSV o reemplazar las planillas por reportes HTML/PDF.
- Eliminar `externalLinks/*` o seguir consumiendo las fórmulas `[1]`.

**Justificación:** la continuidad documental es uno de los tres principios del producto (Docs: principios 3, HU-20A/B CA). El round-trip de `exceljs` conservó celdas, estilos y combinaciones (0 diferencias en 1.366 y 23.013 celdas), pero perdió `externalLinks`, `calcChain` y `printerSettings1.bin` y corrompió `_xlnm.Print_Area` de `'1640'!$A:$S` a `$ANaN:$SNaN`; tamaños OP 136.961 → 21.288 B (−84,5 %) y costeo 273.751 → 311.479 B (+13,8 %).

**Trade-offs aceptados:** dependencia de archivos binarios como activos del servidor; `externalLinks/*` se conserva como metadata histórica sin usarla como fuente y las 12 fórmulas `[1]` se neutralizan con valores estáticos de BD; `EXCEL_UNC_BASE` se documenta como referencia histórica sin uso en runtime y `absPath` se conserva byte-idéntico; IN-08 queda RESUELTA condicionada al ADR de C-13 y a la firma de la checklist humana, sin crear DD-14.

### DD-03 — Avance derivado de etapas (muere el slider)

**Decisión:** `porcentaje_avance` NO es una columna de `ordenes_trabajo` ni un control editable. Se deriva de `etapas_orden.completada`: `100 * completadas / total`. Todas tildadas ⇒ 100%. Se elimina el slider del prototipo.

**Contexto:** `Docs/definici_n_del_mvp_velco.md` incluía `porcentaje_avance` como columna y `tablero-taller-v2.html` tiene un `<input type="range">`; HU-07 dice que tildar etapas actualiza el progreso. Dos fuentes de verdad producirían estados contradictorios (por ejemplo, slider 100% con etapas pendientes).

**Alternativas consideradas:**
- Mantener la columna y sincronizarla con el checklist en cada cambio.
- Avance ponderado por horas: alternativa sin respaldo en `Docs/historias_de_usuario_velco.md` HU-07/HU-08 ni en `Docs/definici_n_del_mvp_velco.md`; no incluida en el MVP.

**Justificación:** el checklist es la señal operativa real; un valor manual agrega fricción y permite inconsistencias. La ponderación por horas queda fuera del MVP.

**Trade-offs aceptados:** el avance trata todas las etapas por igual (no por peso ni por horas), por lo que una etapa larga y una corta valen lo mismo; se documenta como limitación conciente.

### DD-04 — Tasa de hora global, corrección diferida

**Decisión:** usar `configuracion.valor_hora_estandar` como tasa única para calcular mano de obra real en todo el MVP. Documentar como **corrección diferida** la evolución a tasa por etapa/categoría.

**Contexto:** `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` expone `COST. UNIT.` por operación, mientras `Docs/definici_n_del_mvp_velco.md` §3 prevé solo `valor_hora_estandar` como valor global y §2.C calcula la mano de obra con esa tasa. `Docs/historias_de_usuario_velco.md` HU-16 confirma el cálculo con el valor hora configurado; no define tarifas por etapa ni categoría.

**Alternativas consideradas:**
- `valor_hora` por `etapas_orden`.
- Tabla de categorías/tarifas con vigencia por fecha.

**Justificación:** reduce el MVP a una sola configuración y evita diseñar una tabla de tarifas sin que Velco haya definido las categorías.

**Trade-offs aceptados:** el margen por etapa usa la misma tasa, por lo que puede desviarse de la planilla oficial en operaciones con costo unitario propio; la corrección implicará migración de esquema y recálculo histórico.

### DD-05 — Materiales normalizados, sin JSONB

**Decisión:** crear `materiales_orden` con `{tipo ENUM('MP','INSUMOS','TERCERIZADOS'), descripcion, cantidad, unidad, costo_unitario_cotizado, costo_unitario_real NULL, nro_remito, nro_factura, nt, po}`. Los agregados `costo_materiales_cotizado` y `costo_materiales_real` NO son columnas; se derivan por sumatoria. Se descarta guardar el detalle en JSONB.

**Contexto:** el SQL original guardaba dos agregados en `ordenes_trabajo`, pero las plantillas tienen detalle por ítem con remito, factura, NT y PO, necesario para trazabilidad y exportación.

**Alternativas consideradas:**
- Columna JSONB con el detalle.
- Agregados escalares sin detalle.
- Tabla de materiales maestros global + tabla de relación.

**Justificación:** normalizar permite consultar, filtrar y exportar cada ítem; los agregados derivados evitan desincronización. La tabla maestra global se posterga porque no hay catálogo confirmado.

**Trade-offs aceptados:** más filas y un `ENUM` a migrar si aparecen nuevos tipos; `costo_unitario_real NULL` obliga a usar `COALESCE` en cada cálculo.

### DD-06 — Clientes como entidad propia; operario sigue libre

**Decisión:** extraer `clientes` como tabla con `id` y `nombre` único, y reemplazar `ordenes_trabajo.cliente VARCHAR(150)` por `cliente_id FK`. `registros_horas.operario` permanece `VARCHAR(100)` libre con `usuario_id` nullable para el futuro.

**Contexto:** el mismo cliente aparece en muchas OP y en los filtros HU-09; el documento no define una entidad de clientes.

**Alternativas consideradas:**
- Mantener `VARCHAR` libre en la OP.
- Normalizar también operarios desde ya.

**Justificación:** evita duplicados e inconsistencias de nombres en filtros y exportaciones. Los operarios no tienen identidad de usuario en el MVP (DD-07).

**Trade-offs aceptados:** hay que dar de alta el cliente antes de la OP; no se valida razón social, CUIT ni dirección.

### DD-07 — Auth diferida a Fase 2 (dominio CRITICAL)

**Decisión:** el MVP lo usa **una sola persona** (el gerente general) probando todas las funcionalidades y viendo **todos los montos**. No hay tabla `usuarios`, login ni mecanismo de autenticación. "Ocultar montos en planta" se documenta como **Fase 2 según HU-19**, deliberadamente fuera de alcance, no como olvido. El requisito vigente es `Docs/historias_de_usuario_velco.md` HU-19: `Admin/Oficina` ve costos y márgenes; `Taller` ve el tablero, avanza etapas y carga horas sin ver montos en pesos. Cualquier auth/PIN/RBAC requiere aprobación humana explícita (R5); los documentos vigentes no definen PIN ni otro mecanismo concreto.

**Contexto:** HU-19 está listada como Fase 2 en `Docs/definici_n_del_mvp_velco.md` §1 y detallada en `Docs/historias_de_usuario_velco.md` HU-19. Agregar auth al MVP triplicaría el alcance y mezclaría seguridad con la validación del modelo de negocio.

**Alternativas consideradas:**
- Definir un PIN simple para el MVP: descartado; R5 prohíbe auth/PIN/RBAC sin aprobación humana y no hay respaldo documental.
- Login completo desde el día uno.
- Solo ocultar columnas de dinero por CSS sin autenticación.

**Justificación:** el objetivo del MVP es validar tablero, horas y costos con un único usuario. La variante de exportación con `incluirMargenes: false` cubre la necesidad operativa inmediata sin inventar identidades.

**Trade-offs aceptados:** cualquier persona con acceso a la app ve montos; no hay auditoría de quién modificó cada parte de horas; se asume despliegue en intranet. El diseño de Fase 2 debe aprobarse antes de codificar.

### DD-08 — Exportación por OP con plantillas oficiales

**Decisión:** la exportación se resuelve por OP con las plantillas reales `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` (HU-20A) y `Docs/FichasExcel/A - OP-MASTER.xlsx` (HU-20B). `exportOp(opId, { incluirMargenes })` es una **función pura**; los adaptadores `exportCosteo` y `exportOpSinMargenes` rellenan las plantillas oficiales. `listOps({ fechaDesde, fechaHasta, estado })` ya existe por HU-09. El parámetro `incluirMargenes` cubre la distinción entre uso administrativo y uso en planta (HU-20B CA).

**Contexto:** `Docs/definici_n_del_mvp_velco.md` §2.D define dos exportaciones independientes a partir de las plantillas oficiales; HU-20A y HU-20B exigen un archivo por OP. Los documentos vigentes no piden consolidado alguno.

**Alternativas consideradas:**
- Exportación consolidada en ZIP: sin respaldo en documentación vigente; no incluida en MVP; requiere confirmación futura.
- Workbook con hoja resumen y hojas por OP: sin respaldo en documentación vigente; no incluida en MVP; requiere confirmación futura.
- Un único archivo por rango de fechas sin desglose por OP.

**Justificación:** mantiene la continuidad documental (un archivo = una OP = un formato oficial) y evita diseñar un consolidado que nadie pidió.

**Trade-offs aceptados:** exportar muchas OPs requiere N descargas. La firma de `exportOp` queda congelada desde el inicio para no romper extensiones futuras.

### DD-09 — Skills instaladas y disponibles

**Decisión:** usar como apoyo las skills `prisma-postgres`, `prisma-orm-setup`, `domain-modeling`, `vercel-react-best-practices` y `vitest` en `~\.agents\skills\`. Previamente ya estaban `postgresql-database-engineering` y `docker-compose-orchestration`.

**Contexto:** la fundación del proyecto define qué herramientas de conocimiento se usan para modelar dominio, configurar Prisma/PostgreSQL, seguir buenas prácticas React y escribir tests.

**Alternativas consideradas:**
- No usar skills y confiar solo en documentación general.
- Instalar skills adicionales sin necesidad.

**Justificación:** alinean la implementación con el stack elegido y con el enfoque de TDD estricto y arquitectura hexagonal.

**Trade-offs aceptados:** dependencia de que las skills estén actualizadas; `vercel-react-best-practices` debe usarse con criterio porque el deployment no es Vercel.

### DD-10 — Fundación del proyecto (OpenSpec antes que código)

**Decisión:** `openspec init` ya ejecutado. El orden de fundación es KB → `CHANGES.md` → `AGENTS.md` → change `velco-mvp-foundation`. Esta KB es el primer artefacto; el estado del orquestador se actualiza solo en la sección `kb`.

**Contexto:** el proyecto necesita trazabilidad entre requisitos, roadmap, reglas para agentes y cambios implementables antes de escribir código de aplicación.

**Alternativas consideradas:**
- Arrancar a programar el Sprint 1 sin documentación ni specs.
- Crear `AGENTS.md` antes que la KB.

**Justificación:** el flujo SDD/OpenSpec exige que las decisiones y el dominio estén documentados para que los cambios subsiguientes sean verificables.

**Trade-offs aceptados:** hay trabajo inicial de documentación antes de ver la primera pantalla; el alcance de esta tarea es **solo Markdown**, sin código de aplicación.

### DD-11 — ID de plano opcional, único y normalizado

**Decisión:** `codigo_plano VARCHAR(80) NULL` se agrega de forma aditiva en la migración 002 (sin renumerar migraciones). La frontera HTTP aplica `trim()` + `toUpperCase()` y convierte vacío en `NULL`; la BD prohibe `''` con `CHECK` y garantiza unicidad con índice parcial `WHERE codigo_plano IS NOT NULL`. Duplicado ⇒ 409 `codigo_plano_duplicado` con `codigoPlano` y `opExistente`, más fallback P2002 por carrera. La búsqueda global cubre OP, plano, cliente y pieza. En OP-MASTER se mapea a la celda maestra `O7` del merge `O7:R8` como `ID Plano: <codigoPlano>` o `ID Plano: S/P` con `inlineStr`, nunca a `J7:N8` (`PC N°:`).

**Contexto:** los documentos vigentes incorporan el ID de plano a HU-01, HU-05, HU-09 y HU-20B; el diseño anterior no lo contemplaba.

**Alternativas consideradas:** columna obligatoria; índice único total con `NULL` duplicados; usar `J7:N8`; generar el Excel sin validar la plantilla.

**Justificación:** los trabajos sin plano deben poder repetirse; la normalización evita duplicados por formato; el mapeo respeta la plantilla oficial.

**Trade-offs aceptados:** el rango `O7:R8` quedó confirmado sobre la plantilla real (`O7` vacía con `s="73"`, `J7:N8` = `PC N°: `); la etiqueta `ID Plano:` y el literal `S/P` se generan como dato en `O7` con `inlineStr`, sin modificar `sharedStrings.xml` ni agregar prefijo `PL-`. La UNC histórica no es requerida para la exportación; el mapeo de `C-15` depende del ADR y de la compuerta humana de C-13.

### DD-12 — Dashboard general en el MVP con filtro de fecha comprometida

**Decisión:** HU-21 (`/dashboard`) entra en el MVP con KPIs, promedios por etapa y tabla ordenable de desvíos. El filtro de período usa `fecha_entrega` y se rotula `Fecha comprometida`: significa entregas prometidas en el rango, no trabajo ejecutado en ese rango. Se registra en C-17 (datos/API) y C-18 (UI/tokens), dependientes de C-08 y C-11.

**Contexto:** `Docs/definici_n_del_mvp_velco.md` §2.C y `Docs/historias_de_usuario_velco.md` HU-21 lo incluyen; la KB y el roadmap lo tenían como HU-17 diferido a Fase 2.

**Alternativas consideradas:** mantenerlo en Fase 2; filtrar por fecha de imputación; calcular los KPIs en React.

**Justificación:** el contrato vigente de `listOps` ya filtra por `fecha_entrega`; cambiar la semántica rompería la API existente y los derivados tienen una sola implementación en dominio.

**Trade-offs aceptados:** el dashboard no incluye tendencias históricas ni curvas por cliente (HU-17 sigue en Fase 2); C-17/C-18 se registran en el roadmap pero no se proponen hasta completar C-08/C-11.

### DD-13 — Mapeo del design system a CSS Modules

**Decisión:** los tokens viven en `frontend/src/global.css` (`:root`), se consumen con `var(--token)` en `*.module.css`, y las primitivas compartidas van en `frontend/src/shared/ui/` con `clsx` para estados. Las clases del prototipo (`.wrap`, `.card`, `.kpis`, `.st`) no se usan como utilidades por el hash local de CSS Modules.

**Contexto:** `Docs/design_system_velco.md` define la estética industrial del MVP; el prototipo HTML usa clases globales que no sobreviven al alcance local de Vite.

**Alternativas consideradas:** copiar el CSS del prototipo globalmente; usar nombres globales con `:global()`; tokenizar en JS.

**Justificación:** mantiene el contraste y la jerarquía visual sin acoplarse al prototipo ni duplicar valores hexadecimales.

**Trade-offs aceptados:** el selector de tema es Fase 2 (HU-08) y `/configuracion` pertenece a C-10; C-18 solo entrega los tokens base y la UI del dashboard.

## Supuestos inferidos

### SU-01 — Despliegue interno, sin exposición pública

**Supuesto:** la app se usa dentro de la red de Velco; no es multi-tenant ni SaaS.

**Origen:** decisión DD-07 y perfil de usuario único del MVP.

**Riesgo si es falso:** la falta de autenticación sería inaceptable.

**Cómo validar:** confirmar con el gerente el lugar físico y la red donde se usará el tablero.

### SU-02 — Moneda y redondeo

**Supuesto:** los importes están en pesos argentinos (ARS), con dos decimales; las horas con dos decimales y cantidades de materiales con hasta cuatro.

**Origen:**.columnas `NUMERIC(12,2)` / `NUMERIC(14,2)` del SQL y convención contable local.

**Riesgo si es falso:** exportaciones con redondeos distintos a los de la planilla oficial.

**Cómo validar:** comparar un costeo real exportado con la planilla firmada por contaduría.

### SU-03 — Etapas por defecto aplicables a toda OP nueva

**Supuesto:** la plantilla Corte → Soldadura → Mecanizado → Pintura → Entrega es un punto de partida razonable y se edita por OP (HU-04).

**Origen:** `configuracion.etapas_default` y Docs HU-04.

**Riesgo si es falso:** el jefe de taller tiene que borrar demasiadas etapas cada vez.

**Cómo validar:** observar la carga de las primeras cinco OPs reales.

### SU-04 — Costo real por ítem con fallback a cotizado

**Supuesto:** si un material no tiene `costo_unitario_real`, se usa su `costo_unitario_cotizado` para el cálculo del margen.

**Origen:** decisión DD-05 y disponibilidad de ambos campos en la plantilla.

**Riesgo si es falso:** el margen real puede sobreestimar utilidad cuando faltan facturas cargadas.

**Cómo validar:** revisar una OP terminada con facturas pendientes contra la planilla de costeo oficial.

### SU-05 — Zona horaria para comparar fechas

**Supuesto:** las fechas de entrega se comparan a medianoche de la hora local de Velco (probable `America/Argentina/Mendoza`, dado el contenido de los datos de ejemplo: Agroindustria Cuyo, Bodega Los Andes).

**Origen:** `DATE` + `TIMESTAMPTZ` en el SQL, nombres de clientes del prototipo.

**Riesgo si es falso:** el semáforo cambia de color un día antes o después.

**Cómo validar:** confirmar la zona horaria con el gerente y fijar `TZ` en el entorno.

### SU-06 — Un archivo por OP como unidad de exportación

**Supuesto:** el nombre `COSTEO_[NroOP]_[Cliente].xlsx` / `OP_[NroOP]_[Cliente].xlsx` es suficiente para identificar la salida; no se requiere versión ni fecha en el nombre.

**Origen:** HU-20A/B CA y DD-08.

**Riesgo si es falso:** se sobrescriben exportaciones al repetir la descarga.

**Cómo validar:** consultar cómo nombran actualmente los archivos digitalizados en la ruta UNC.

## Fuentes

- Conversación de fundación (decisiones 1–10; no presentes en `Docs/`).
- `Docs/definici_n_del_mvp_velco.md`, `Docs/historias_de_usuario_velco.md`, `Docs/design_system_velco.md`, `Docs/tablero-taller-v2.html`, `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` y `Docs/FichasExcel/A - OP-MASTER.xlsx`.
- `Docs/MVP.md` y `Docs/HistoriasDeUsuario.md` no son fuente: borrado deliberado por obsoletos (IN-09).
