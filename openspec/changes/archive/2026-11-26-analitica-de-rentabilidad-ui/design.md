## Context

C-01…C-11 dejaron un dominio puro (`packages/domain`) con las reglas de horas, desvíos, costos y margen; un DTO canónico (`TarjetaOrdenDTO`, `DetalleOpDTO`) construido por funciones puras; la tasa global vigente inyectada desde `ContextoTarjeta.valorHoraEstandar` (C-10) y espejos Zod en backend y frontend. La UI actual sólo muestra `Horas Reales / Horas Vendidas` en `TarjetaOrden.tsx:33-36` y derivados de horas en `SeccionHoras.tsx:46-64`, pero no `% consumo`, alerta en tarjeta ni pestaña de rentabilidad.

**Contratos verificados en el código real (no inventados):**

| Contrato | Ubicación real | Forma exacta |
|---|---|---|
| `calcularConsumoHoras` | `packages/domain/src/horas/reglas.ts:94-100` | `(horasReales: string, horasVendidas: string) => string \| null`; porcentaje con **2 decimales** como cadena; `null` si vendidas `0.00` |
| `evaluarAlertaDesvio` | `packages/domain/src/horas/reglas.ts:109-117` | `({ consumo: string \| null, avance: number, horasReales: string, horasVendidas: string }) => boolean`; `reales > vendidas` **o** `consumo > avance + 15` (comparación estricta) |
| `UMBRAL_DESVIO_PORCENTAJE` | `packages/domain/src/horas/umbral.ts:1` | `15`, exportado como documentación; `evaluarAlertaDesvio` usa el literal `15` (ver `verify-report.md` de C-11). La UI NO DEBE importarlo ni duplicarlo |
| `comparativaPorEtapa` | `packages/domain/src/horas/comparativa.ts:62-79` | `({ etapas, partes, avance }) => FilaComparativaPorEtapa[]`; fila sintética final `etapaId: null`, `nombreEtapa: 'Sin etapa'` **sólo si hay partes sin etapa** |
| `FilaComparativaPorEtapa` | `packages/domain/src/horas/comparativa.ts:26-34` | `etapaId`, `nombreEtapa`, `horasVendidas`, `horasReales`, `desvioHoras`, `porcentajeConsumo: string \| null`, `alertaDesvio: boolean` |
| `costoMaterialReal` / `costoMaterialesCotizado` / `margenReal` / `tasaGlobalNoConfigurada` | `packages/domain/src/margen/reglas.ts:14-35` | cadenas decimales exactas; `tasaGlobalNoConfigurada('0.00') === true` |
| `Decimal` | `packages/domain/src/decimal/operaciones.ts:1-5` | `type Decimal = string`; escala 2 para importes, hasta 4 para productos/cantidades |
| `TarjetaOrdenDTO` | `packages/domain/src/ordenes/tarjeta.ts:25-40` | **no tiene** `porcentajeConsumo` ni `alertaDesvio` |
| `DetalleOpDTO` | `packages/domain/src/ordenes/detalle.ts:17-33` | sí tiene `desvioHoras`, `porcentajeConsumo`, `alertaDesvio`, `comparativaPorEtapa`, `costoMaterialesCotizado`, `costoMaterialesReal`, `margenReal`, `tasaGlobalNoConfigurada` |
| Espejo Zod | `frontend/src/shared/domain-client/esquemas.ts:168-195`, `backend/src/features/ordenes/http/esquemas.ts:111-137` | `z.ZodType<DetalleOpDTO>` y `DetalleOpJSONSchema` ya transportan los derivados de C-11 |
| Tests frontend | `frontend/vite.config.ts`, `frontend/package.json` | Vitest 5.1.1, `jsdom`, `@testing-library/react`, `css: true`, `fileParallelism: false`; comandos `npm test -w @velco/frontend` y `npm run typecheck -w @velco/frontend` |

Los cinco delta specs archivados de C-11 (`openspec/changes/archive/2026-11-25-desvios-y-margen-domain/specs/`) confirman los mismos nombres y escalas; el spec `dto-derivados-orden` delega explícitamente a C-12 «la representación visual, las alertas y el formato a dos decimales». El spec `configuracion-en-lectura-op` de C-10 prohíbe calcular margen en React y exige mostrar los derivados tal como llegan.

## Goals / Non-Goals

**Goals:**
- Cumplir HU-14 (termómetro con `% consumo` y alerta en tarjeta), HU-15 (tabla por etapa, incluidas horas sin etapa) y HU-16 (cotizado vs. real y margen neto) con el Flujo 5.
- Mostrar los derivados exactamente como los produce el dominio, sin reimplementar reglas ni persistir valores.
- Advertir cuando la tasa global sea `0.00`, conservando el margen calculado por el dominio.
- Aplicar redondeo a 2 decimales **sólo al mostrar**, sin conversión a coma flotante.
- Mantener el patrón contenedor/presentacional y componentes PascalCase con CSS Modules.

**Non-Goals:**
- No crear endpoints, migraciones ni columnas derivadas (R3).
- No modificar cálculos de horas/margen ni el umbral 15 (C-08/C-11; RN-HORAS-04).
- No implementar tarifas por etapa/categoría (IN-02, DD-04, RN-MARGEN-04), auth/PIN/RBAC (R5), exportación (C-14/C-16) ni dashboard (C-17/C-18).
- No introducir dependencias nuevas ni cambiar versiones fijadas en C-01.

## Decisions

1. **Extender `TarjetaOrdenDTO` en el dominio para el termómetro, en lugar de calcular en React.** `construirTarjetaOrden` (`packages/domain/src/ordenes/tarjeta.ts:42-73`) ya recibe etapas y partes de horas y ya calcula `horasVendidasTotales`/`horasRealesTotales`; se agregan `porcentajeConsumo: string | null` y `alertaDesvio: boolean` invocando `calcularConsumoHoras` y `evaluarAlertaDesvio` con `avance` derivado, y se espejan en `backend/src/features/ordenes/http/esquemas.ts` y `frontend/src/shared/domain-client/esquemas.ts`. `DetalleOpDTO` hereda los campos: se eliminan las declaraciones duplicadas en `packages/domain/src/ordenes/detalle.ts` y `frontend/src/shared/domain-client/tipos.ts` para conservar una sola definición. *Alternativas descartadas:* (a) calcular en el componente — viola RN-GLOBAL-02/R2 y duplica el umbral; (b) pedir `GET /api/ops/:id` por tarjeta — N peticiones y acoplamiento innecesario; (c) diferir a C-17 — incumple HU-14. **Trade-off:** este change de UI toca tres capas (dominio, espejo HTTP y frontend); se acepta porque es la única forma de cumplir HU-14 sin romper la regla de oro. Es un desvío respecto del alcance puramente frontend del roadmap y debe revisarse en el apply.

2. **La UI consume booleanos y cadenas; nunca importa funciones de cálculo.** `TarjetaOrden` lee `tarjeta.porcentajeConsumo` y `tarjeta.alertaDesvio`; la pestaña lee `comparativaPorEtapa`, `costoMaterialesCotizado`, `costoMaterialesReal`, `margenReal` y `tasaGlobalNoConfigurada` del `DetalleOpDTO` validado por `consultarOp` → `EsquemaDetalleOp`. Se prohíben imports de `packages/domain/src/horas/*` o `margen/*` en `frontend/src/features/**`. *Alternativa descartada:* reutilizar las funciones puras en el cliente — duplica la ejecución y puede divergir del DTO servido.

3. **Pestaña dentro de `DetalleOpPage` con estado local de UI.** Se agrega un `tablist` con `Detalle` y `Análisis de Rentabilidad`; el estado seleccionado se guarda con `useState` en `DetalleOpPage` (sólo de presentación). La pestaña `Detalle` es la predeterminada para no romper los tests existentes de C-09; el contenido de análisis se extrae a componentes presentacionales `AnalisisRentabilidad`, `TablaComparativaEtapas` y `ResumenCostosMargen` en `frontend/src/features/ordenes/components/` (PascalCase, `*.module.css`). *Alternativa descartada:* mostrar todo en una sola sección — no cumple la CA «pestaña *Análisis de Rentabilidad* dentro del detalle» de HU-16.

4. **Formato decimal de presentación con cadenas, sin `number`.** Utilidad pura `formatearImporte(valor: string): string` (siempre 2 decimales, redondeo comercial hacia arriba en el tercer decimal con acarreo y signo conservado: `12.3450 → 12.35`, `-33.7500 → -33.75`) y `formatearPorcentaje(valor: string | null): string` (recorta ceros finales para mostrar `80%`, `95.01%`; `null → '—'`). Ambas operan sólo sobre texto, sin `Number`, `parseFloat`, `toFixed` ni `Math`. Se ubican en `frontend/src/shared/domain-client/formatoDecimal.ts` y se prueban con casos de acarreo, negativo y `null`. *Alternativa descartada:* `Intl.NumberFormat` — exige convertir la cadena exacta a `number` y reintroduce coma flotante (RN-MARGEN-05).

5. **Alerta visual y división por cero.** El badge de desvío en tarjeta y en la tabla se renderiza sólo cuando el campo `alertaDesvio` del DTO es `true`, con `role="status"` y texto `Alerta de desvío de horas`; la UI no conoce el umbral 15 ni lo compara. Con `porcentajeConsumo: null` se muestra `—` y nunca `NaN`/`Infinity`; la alerta sigue llegando calculada por `reales > vendidas` (RN-HORAS-06). *Alternativa descartada:* ocultar la fila con consumo nulo — rompe HU-15 y el spec de C-11.

6. **Advertencia de tasa global cero sin alterar el margen.** Cuando `tasaGlobalNoConfigurada` sea `true`, `ResumenCostosMargen` muestra `role="status"` con texto que indique que el valor hora estándar está en `0.00` y debe configurarse; el importe de `margenReal` se muestra igual, sin sustituirlo ni calcular uno propio. IN-02 sigue diferida (DD-04/RN-MARGEN-04). *Alternativa descartada:* mostrar `null` o una tasa por etapa — contradice el Flujo 5 y el contrato de C-11.

7. **TDD estricto sin base de datos.** Para cada comportamiento: test RED → implementación GREEN → al menos un segundo caso TRIANGULATE → REFACTOR. Tests puros del constructor de tarjeta en `packages/domain/src/ordenes/tarjeta.test.ts`; tests de componente con `render`/`screen` y los fixtures existentes (`frontend/test/tablero/fixtures.ts`, `frontend/test/ordenes/fixtures.ts`, `QueryClientProvider` + `MemoryRouter` en `DetalleOpPage.test.tsx`); tests del espejo Zod en `frontend/src/shared/domain-client/esquemas.test.ts`. No se usa PostgreSQL (R1/R10). Los fixtures de tarjeta se completan con los dos campos nuevos para mantener `z.ZodType<TarjetaOrdenDTO>` y los tests actuales.

## Risks / Trade-offs

- **[Desvío de contrato: `TarjetaOrdenDTO` no trae consumo/alerta] →** se corrige en el dominio con los mismos `calcularConsumoHoras`/`evaluarAlertaDesvio`, sin columnas ni endpoints nuevos. El spec `dto-derivados-orden` de C-11 afirma «el porcentaje de consumo de la tarjeta» en un escenario aunque el campo no existe en la tarjeta; este change lo hace explícito y lo alinea con el código. Debe aprobarse en el apply junto con el resto de decisiones.
- **[IN-02: `COST. UNIT.` por operación vs. tasa global] →** se mantiene la tasa global inyectada y se muestra la advertencia; no se inventan tarifas por etapa. Diferida a Fase 2.
- **[Umbral 15 como literal en `evaluarAlertaDesvio`] →** la UI no importa `UMBRAL_DESVIO_PORCENTAJE` ni escribe `15`; cambiar el umbral sigue siendo responsabilidad exclusiva del dominio (ver `verify-report.md` de C-11).
- **[Regresión de tests de C-05/C-09] →** pestaña `Detalle` por defecto y fixtures actualizados; se ejecuta la suite completa de `frontend` y los typechecks de los tres workspaces.
- **[Escala 4 en importes derivados] →** `multiplicar` conserva hasta 4 decimales (`12.3450`); el formateador de presentación es el único lugar donde se redondea a 2, con tests de acarreo y negativo.
- **[Governance BAJO con cambio en dominio/backend] →** alcance mínimo y sin migración; si se prefiere estrictamente «frontend-only», HU-14 no puede cumplirse sin cálculo local: alternativa a evaluar por el usuario antes del apply.
- **[Componentes con props extensas] →** se pasa el subconjunto de `DetalleOpDTO` que cada componente necesita, sin duplicar tipos ni usar `any` (R9).
- **[`actualizarCompletada.ts:34` llama a `construirTarjetaOrden` sin `horasReales`] →** la respuesta del `PATCH` ya llega hoy con `horasRealesTotales: "0.00"` (comportamiento previo a C-12). Al agregar los dos derivados, esa misma respuesta también los traerá calculados desde cero; el apply DEBE verificar que `frontend/src/shared/domain-client/actualizarEtapaRemota.ts` no reemplace una tarjeta con horas reales correctas por una respuesta con totales a cero. No se modifica ese flujo en este change sin aprobación explícita.

## Migration Plan

Sin migración de datos: no hay columnas nuevas, no se persisten derivados (R3) y no cambia el contrato de configuración. Orden de implementación: primero tests RED del espejo DTO y formateador; después el constructor de tarjeta en dominio y sus espejos; luego componentes de tablero y detalle; finalmente REFACTOR y suite completa. Rollback: revertir el commit del change; no requiere restaurar datos ni detener PostgreSQL.

## Open Questions

- **IN-02 (diferida, no se resuelve aquí):** ¿se adoptarán tarifas por etapa/categoría en Fase 2? C-12 usa la tasa global y advierte si es `0.00`.
- **Etiqueta de la fila sin etapa:** se confirma `Sin etapa`, generada por `comparativaPorEtapa` en C-11; la UI la muestra literalmente, sin renombrarla. Dado que C-11 design la dejó «a confirmar por C-12», queda registrada la confirmación.
- **Formato del porcentaje:** se elige `80%` (ceros recortados) por coincidir con el ejemplo canónico de HU-14; si se prefiere `80.00%`, el cambio es exclusivamente en `formatearPorcentaje`.
- **Duplicación de campos en `DetalleOpDTO`:** se propone eliminar las dos declaraciones redundantes tras extender `TarjetaOrdenDTO`; requiere confirmación en el apply porque toca `packages/domain/src/ordenes/detalle.ts` y `frontend/src/shared/domain-client/tipos.ts`.
