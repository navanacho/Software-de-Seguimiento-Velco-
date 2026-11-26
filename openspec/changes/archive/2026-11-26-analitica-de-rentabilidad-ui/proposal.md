## Why

C-11 dejó en el dominio las reglas puras de desvío, comparativa y margen, y C-10 la tasa global vigente, pero la UI todavía no las muestra: la tarjeta sólo expone `Horas Reales / Horas Vendidas` sin `% consumo` ni alerta, y el detalle no ofrece la pestaña *Análisis de Rentabilidad* exigida por HU-14, HU-15 y HU-16 (Flujo 5). Sin esta change, el gerente no puede detectar consumos anticipados ni conocer el margen real sin recurrir a planillas externas.

## What Changes

- Mostrar en cada tarjeta del tablero el termómetro `Horas Reales / Horas Vendidas` con `% consumo` y alerta visual cuando corresponda, leyendo los derivados del DTO sin cálculo en React (HU-14, RN-HORAS-03/04/06).
- Agregar al detalle de la OP la pestaña *Análisis de Rentabilidad* con: tabla comparativa por etapa (vendidas, reales, desvío en horas y %), incluida la fila sintética `Sin etapa`; comparación de costos materiales cotizados vs. reales; monto vendido, mano de obra con la tasa global vigente y margen neto real (HU-15, HU-16, Flujo 5).
- Mostrar una advertencia cuando `tasaGlobalNoConfigurada` sea `true` (tasa `0.00`), sin cambiar el valor del margen ni inventar una tasa (RN-CONFIG-01, DD-04, IN-02).
- Dar formato a dos decimales a los importes y porcentajes **sólo en la presentación**, mediante manipulación de cadenas decimales exactas; sin `number`, `parseFloat`, `toFixed` ni reglas de negocio en componentes (RN-MARGEN-05, R2, R9).
- Cerrar la brecha de contrato verificada: `TarjetaOrdenDTO` hoy no transporta `porcentajeConsumo` ni `alertaDesvio` (sólo `DetalleOpDTO` los tiene). Se agregan ambos campos al constructor puro del dominio y a los espejos Zod de backend y frontend, reutilizando `calcularConsumoHoras` y `evaluarAlertaDesvio`; sin columnas nuevas ni cálculo en React (R3, RN-GLOBAL-02). Se documenta en `design.md` como desvío respecto de C-11.
- **BREAKING**: sin cambios breaking en endpoints, firmas de funciones del dominio ni esquema de base de datos; se amplía el contrato interno de `TarjetaOrdenDTO` con dos campos derivados y se actualizan sus espejos Zod/tipos y fixtures.

## Capabilities

### New Capabilities

- `analitica-rentabilidad-ui`: pestaña de análisis en el detalle de la OP; tabla comparativa por etapa, costos cotizados vs. reales, margen neto, advertencia de tasa global no configurada y formato decimal de presentación.

### Modified Capabilities

- `tablero-grilla-tarjetas`: termómetro con `% consumo` y alerta visual en la tarjeta, alimentado por `TarjetaOrdenDTO` y sin cálculo local.
- `detalle-op-ui`: levanta la exclusión explícita de analítica de rentabilidad y define la pestaña como parte del detalle, preservando el patrón contenedor/presentacional y el manejo de errores.
- `dto-derivados-orden`: extiende `TarjetaOrdenDTO` con `porcentajeConsumo: string | null` y `alertaDesvio: boolean`, calculados en dominio y transportados por API y espejos Zod, sin persistencia.

## Impact

- `packages/domain/src/ordenes/tarjeta.ts` (y eventualmente `detalle.ts` para reutilizar los derivados ya calculados): dos campos nuevos derivados en la tarjeta, con las reglas canónicas de `packages/domain/src/horas/`.
- `backend/src/features/ordenes/http/esquemas.ts`: espejo JSON/Zod de `TarjetaOrdenDTO`; sin cambios en handlers ni en casos de uso, porque las respuestas se construyen vía `construirTarjetaOrden`/`construirDetalleOp`.
- `frontend/src/shared/domain-client/{esquemas.ts,tipos.ts}` y `frontend/test/{tablero,ordenes}/fixtures.ts`: espejo Zod, tipos y fixtures actualizados.
- `frontend/src/features/tablero/components/TarjetaOrden.tsx` y su `*.module.css`: termómetro y badge de alerta.
- `frontend/src/features/ordenes/DetalleOpPage.tsx` y nuevos componentes presentacionales en `frontend/src/features/ordenes/components/` (PascalCase) para la pestaña y la tabla.
- Utilidad de formato decimal de solo presentación en `frontend/src/shared/domain-client/`.
- Tests Vitest 5.1.1 + @testing-library/react 16.3.3 en jsdom: componentes y espejos, con al menos dos casos por comportamiento (R1).
- Sin PostgreSQL, sin migraciones, sin auth/PIN/RBAC (R5), sin exportación (C-14/C-16) y sin dashboard (C-17/C-18). IN-02 permanece diferida: se usa la tasa global inyectada y se advierte cuando es cero.
