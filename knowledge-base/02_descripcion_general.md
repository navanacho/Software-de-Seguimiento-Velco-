# Descripción General

## Stack tecnológico

Stack elegido: **Opción B**. Las versiones quedan **fijadas en C-01**; no son referencias mínimas. Se fijaron el 2026-11-19.

| Capa | Tecnologías | Versión fijada |
|---|---|---|
| Presentación | React + Vite, TypeScript | React 19.3.1, Vite 8.3.8, TypeScript 7.0.2 |
| API | Fastify (Node.js) | Fastify 5.12.8, Node.js 26.13.1 (LTS activo) |
| Dominio / aplicación | TypeScript puro, sin dependencias de framework | TypeScript 7.0.2 |
| Persistencia | PostgreSQL + Prisma | PostgreSQL 18.7, Prisma 7.10.1 (cliente y CLI; no 8.0.0-rc.34 por ser RC) |
| Exportación | `exceljs` sobre plantillas `.xlsx` existentes | exceljs 4.4.0 |
| Estilos | CSS Modules (nativo de Vite) + `global.css` para reset y variables | `clsx` 2.1.1 |
| Server state | TanStack Query | @tanstack/react-query 5.108.1 |
| Routing | React Router | react-router-dom 7.18.6 |
| Tests | Vitest (TDD estricto) | Vitest 5.1.1, @testcontainers/postgresql 12.2.2, @testing-library/react 16.3.3, jsdom 31.0.1 |
| Soporte y tipos | `zod`, `@fastify/swagger`, `@types/node`, `@types/react`, `@types/react-dom` | zod 4.6.7, @fastify/swagger 9.9.5, @types/node 26.6.6, @types/react 19.3.0, @types/react-dom 19.3.0 |
| Infraestructura | PostgreSQL local/self-hosted, orquestación con Docker Compose | PostgreSQL 18.7 (PG14 está EOL desde 2026-11-12) |

Versiones fijadas (2026-11-19): Node.js 26.13.1 (LTS activo), TypeScript 7.0.2, React 19.3.1, Vite 8.3.8, Fastify 5.12.8, Prisma 7.10.1 (cliente y CLI; NO usar 8.0.0-rc.34 por ser RC), PostgreSQL 18.7 (PG14 está EOL desde 2026-11-12), exceljs 4.4.0, Vitest 5.1.1, @tanstack/react-query 5.108.1, react-router-dom 7.18.6, clsx 2.1.1, zod 4.6.7, @fastify/swagger 9.9.5, @testcontainers/postgresql 12.2.2, @testing-library/react 16.3.3, jsdom 31.0.1, @types/node 26.6.6, @types/react 19.3.0, @types/react-dom 19.3.0.

Ejecución confirmada: todo el sistema corre en **Windows** con acceso al servidor privado de la empresa. **PostgreSQL se ejecuta en Docker Desktop; Node/Fastify y el exportador corren en el host Windows**, de modo que las rutas UNC se resuelven nativamente. No se incorpora **Python** al stack: R4 se mantiene intacta (solo se permiten spikes descartables fuera del repo).

Convención de estilos: se escribe CSS real en archivos `.module.css`; las clases condicionales se componen con `clsx` o template strings, y los estilos globales (reset, tipografía, variables) viven en un único `global.css`. Los tokens de `Docs/design_system_velco.md` se definen en `:root` de `frontend/src/global.css` y se consumen con `var(--token)`; las primitivas compartidas van en `frontend/src/shared/ui/`. Las clases globales del prototipo (`.wrap`, `.card`, `.kpis`, `.st`) no son reutilizables con CSS Modules.

Descartados: **Next.js** (mezcla dominio con server actions y dificulta TDD), **SQLite** (el SQL propuesto usa UUID, `gen_random_uuid()`, JSONB y `TIMESTAMPTZ`), **Python/openpyxl** (rompería la unidad de lenguaje TypeScript), **Tailwind** (se prefiere CSS real con scope de CSS Modules, sin tooling adicional). Detalle en [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md).

## Arquitectura general

```text
Navegador (React SPA / Vite)
        |  HTTP/JSON
        v
Fastify (adaptadores REST)  --->  exceljs  --->  plantillas .xlsx del servidor
        |                                          (MASTER COSTEO NUEVO / A - OP-MASTER)
        v
Capa de aplicación (casos de uso)
        |
        v
Dominio puro (semáforo, avance, horas, márgenes, exportOp)
        ^
        |  puertos / repositorios
        v
Prisma  --->  PostgreSQL
```

Reglas de alto nivel:

- La grilla de tarjetas es la vista principal. No hay columnas por etapa; cada tarjeta contiene su propio checklist.
- El dominio no conoce React, Fastify ni Prisma. Las reglas de negocio son funciones puras y se testean con Vitest antes de conectarse a la UI o a la API.
- `porcentaje_avance`, `horas_vendidas_totales`, `horas_reales_totales`, `costo_materiales_*` y `margen_real` son **valores derivados**. No se persisten como columnas editables.
- La UI calcula o consume los derivados según la capa que corresponda; la API expone las mismas fórmulas para evitar dos implementaciones.
- El prototipo `Docs/tablero-taller-v2.html` es referencia de estética e interacción (KPIs, tira *"Dónde está cada trabajo ahora"*, grilla, checklist), **no** la arquitectura de persistencia: usaba `localStorage`/Firebase y un slider de avance que aquí se elimina.

## Integraciones externas

| Integración | Propósito | Tipo | Estado |
|---|---|---|---|
| `MASTER COSTEO NUEVO.xlsx` | Plantilla oficial para la exportación económica | Archivo local leído por `exceljs` | Requerida en MVP |
| `A - OP-MASTER.xlsx` | Plantilla oficial para la orden de producción imprimible | Archivo local leído por `exceljs` | Requerida en MVP |
| Impresión / guardado como PDF | Vista limpia de la OP desde el navegador | `window.print()` / diálogo del navegador | Requerida en MVP (HU-20B) |
| Enlace externo embebido en la plantilla de costeo (~577 KB) | Dependencia histórica de la planilla | Referencia externa dentro del `.xlsx` | **Spike abierto** |
| Ruta UNC `\\Servidor\g\OPERACIONES\ORDENES DE PROCESO\OP - DIGITALIZADA\` | Ubicación histórica de las plantillas / OP digitalizadas | Recurso de red | **Spike abierto** |
| Roles (Fase 2, HU-19; sin PIN definido en docs vigentes) | — | — | No aplica en MVP; cualquier auth requiere aprobación humana (R5) |

No hay integraciones REST, webhooks ni SDK de terceros en el MVP. El alcance es una aplicación web interna para uso de una sola persona.

## API REST (resumen)

Los paths definitivos se fijan al implementar; los nombres de operación y sus parámetros ya están definidos en el dominio.

| Recurso | Operación | Estado | Notas |
|---|---|---|---|
| Órdenes | `listOps({ fechaDesde, fechaHasta, estado })` | MVP | HU-09; filtros por cliente y etapa `ahora`; búsqueda global por N° de OP, `codigo_plano`, cliente y pieza; `fechaDesde`/`fechaHasta` filtran `fecha_entrega` (fecha comprometida) |
| Dashboard | `getDashboard({ fechaDesde, fechaHasta, estado })` | MVP (registrado en C-17) | HU-21; KPIs, promedios por etapa y tabla de desvíos; mismo criterio de fecha comprometida |
| Órdenes | `getOp(id)` | MVP | Detalle con etapas, materiales, horas y derivados |
| Órdenes | `createOp` / `updateOp` | MVP | HU-01, HU-02, HU-04 |
| Etapas | agregar, quitar, reordenar, marcar completada | MVP | HU-04, HU-07 |
| Horas | crear parte / editar / eliminar | MVP | HU-10, HU-13 |
| Materiales | alta, edición y consulta por OP | MVP | Normalizados en `materiales_orden` |
| Configuración | leer / actualizar parámetros globales | MVP | HU-18 |
| Exportación por OP | `exportCosteo`, `exportOpSinMargenes` (sobre `exportOp(opId, { incluirMargenes })`, función pura) | MVP | HU-20A/HU-20B; rellenan `MASTER COSTEO NUEVO.xlsx` y `A - OP-MASTER.xlsx`; sin consolidado |
| Roles (Fase 2, HU-19; sin PIN definido en docs vigentes) | — | Fase 2 | `Admin/Oficina` ve costos y márgenes; `Taller` sin montos. Cualquier auth requiere aprobación humana (R5) |

## Persistencia y reglas derivadas

El esquema canónico está en [04_modelo_de_datos.md](04_modelo_de_datos.md). Puntos críticos para la API:

- `ordenes_trabajo` no guarda `porcentaje_avance` ni agregados de materiales.
- El avance se deriva de `etapas_orden.completada`.
- El costo material real usa `COALESCE(costo_unitario_real, costo_unitario_cotizado)` por ítem.
- La tasa horaria es global (`configuracion.valor_hora_estandar`) por ahora.

## Fuentes

- `Docs/definici_n_del_mvp_velco.md`, `Docs/historias_de_usuario_velco.md`, `Docs/design_system_velco.md`, `Docs/tablero-taller-v2.html`, `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` y `Docs/FichasExcel/A - OP-MASTER.xlsx`.
- `Docs/MVP.md`, `Docs/HistoriasDeUsuario.md` y `Docs/Relevamiento.pdf` no son fuente (IN-09).
- Decisiones 1, 2, 4, 5, 8 y 10 de [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md).
