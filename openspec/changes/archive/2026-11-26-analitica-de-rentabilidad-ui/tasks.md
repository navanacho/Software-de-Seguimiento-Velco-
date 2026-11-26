## 1. Contrato DTO y espejos (dominio → API → cliente)

- [x] 1.1 RED: agregar a `packages/domain/src/ordenes/tarjeta.test.ts` casos fallidos para `porcentajeConsumo` y `alertaDesvio` en `construirTarjetaOrden` (32.00/40.00 → `"80.00"`/`true`; vendidas `"0.00"` con reales positivas → `null`/`true`) y ejecutar `npm test -w @velco/domain` confirmando el fallo.
- [x] 1.2 GREEN: extender `TarjetaOrdenDTO` y `construirTarjetaOrden` con ambos campos calculados por `calcularConsumoHoras` y `evaluarAlertaDesvio`, sin columnas ni `any`, y ejecutar el mismo test hasta verde.
- [x] 1.3 TRIANGULATE: agregar casos límite del umbral (`95.00` con avance `80` → `false`; `96.00` → `true`) y ejecutar `npm test -w @velco/domain` otra vez.
- [x] 1.4 RED: escribir tests fallidos en `frontend/src/shared/domain-client/esquemas.test.ts` y `backend/src/features/ordenes/http/esquemas.test.ts` (nuevo) para que el espejo acepte los dos campos nuevos y rechace un cuerpo que los omita; ejecutar `npm test -w @velco/frontend` y `npm test -w @velco/backend`.
- [x] 1.5 GREEN: actualizar `frontend/src/shared/domain-client/tipos.ts`, `frontend/src/shared/domain-client/esquemas.ts` y `backend/src/features/ordenes/http/esquemas.ts`; quitar las declaraciones duplicadas de `porcentajeConsumo` y `alertaDesvio` en `packages/domain/src/ordenes/detalle.ts` y del tipo frontend del detalle; ejecutar los tests de espejo hasta verde.
- [x] 1.6 TRIANGULATE: agregar el caso de campo ausente rechazado por Zod en backend y frontend, y verificar que `DetalleOpDTO` hereda los campos de `TarjetaOrdenDTO` sin redeclararlos.
- [x] 1.7 REFACTOR: ejecutar `npm run typecheck` y confirmar que no aparece `any`, ni imports de adaptadores en `packages/domain/`, ni columnas nuevas en Prisma.

## 2. Termómetro y alerta en la tarjeta del tablero

- [x] 2.1 RED: agregar a `frontend/src/features/tablero/components/TarjetaOrden.derivados.test.tsx` casos fallidos para `32.00 / 40.00 → 80%`, `porcentajeConsumo: null` → `—` y badge `Alerta de desvío de horas` con `role="status"`; ejecutar `npm test -w @velco/frontend`.
- [x] 2.2 GREEN: modificar `TarjetaOrden.tsx` y su CSS Module para leer `porcentajeConsumo` y `alertaDesvio` del DTO y renderizar el termómetro y el badge sin cálculos; ejecutar el test hasta verde.
- [x] 2.3 TRIANGULATE: agregar casos con `alertaDesvio: false` (sin badge) y con consumo nulo (sin `NaN`, `Infinity` ni `0.00%`); ejecutar el test otra vez.
- [x] 2.4 REFACTOR: verificar que `frontend/src/features/tablero/` no importa `calcularConsumoHoras`, `evaluarAlertaDesvio` ni el umbral 15, actualizar `frontend/test/tablero/fixtures.ts` y ejecutar `npm run typecheck -w @velco/frontend`.
- [x] 2.5 RED: agregar a `TarjetaOrden.derivados.test.tsx` casos fallidos para el ancho animado del termómetro desde `porcentajeConsumo` (`"80.00"` → `80%`, `null` → `0%`, `"120.00"` → `100%` con texto `120%`) y ejecutar el archivo confirmando el fallo.
- [x] 2.6 GREEN: aplicar un `style` inline con `width` y `transition: 'width 600ms ease-in-out'` al `div` `data-testid="termometro-consumo"` en `TarjetaOrden.tsx`, parseando la cadena del DTO sólo para presentación sin tocar `formatoDecimal.ts` ni el dominio; ejecutar el test hasta verde.
- [x] 2.7 TRIANGULATE: verificar con `rerender` que el ancho pasa de `80%` a `95.01%` y que `barra-horas` sigue sin animación; ejecutar el archivo otra vez.
- [x] 2.8 REFACTOR: extraer una función local pura de presentación para el ancho, ejecutar tests y `npm run typecheck`, confirmando que no se importan cálculos del dominio ni se modifica `formatoDecimal.ts`.

## 3. Formato decimal de solo presentación

- [x] 3.1 RED: crear `frontend/src/shared/domain-client/formatoDecimal.test.ts` con casos fallidos para `formatearImporte("12.3450") → "12.35"`, `formatearImporte("-33.7500") → "-33.75"`, `formatearPorcentaje("80.00") → "80%"` y `formatearPorcentaje(null) → "—"`; ejecutar `npm test -w @velco/frontend`.
- [x] 3.2 GREEN: crear `frontend/src/shared/domain-client/formatoDecimal.ts` con manipulación de cadenas exactas, redondeo hacia arriba con acarreo y signo conservado; ejecutar el test hasta verde.
- [x] 3.3 TRIANGULATE: agregar casos de acarreo (`"9.999" → "10.00"`) y de límite (`"0.005" → "0.01"`); ejecutar el test otra vez.
- [x] 3.4 REFACTOR: confirmar que el módulo no usa `Number`, `parseFloat`, `toFixed` ni `Math`, y ejecutar `npm run typecheck -w @velco/frontend`.

## 4. Pestaña de análisis en el detalle de la OP

- [x] 4.1 RED: agregar a `frontend/src/features/ordenes/DetalleOpPage.test.tsx` casos fallidos para la presencia de las pestañas *Detalle* y *Análisis de Rentabilidad*, selección por defecto de *Detalle* y aparición del panel analítico al seleccionar la segunda; ejecutar `npm test -w @velco/frontend`.
- [x] 4.2 GREEN: modificar `DetalleOpPage.tsx` con un `tablist` y estado local de UI, delegando el panel a un componente contenedor `AnalisisRentabilidad`, sin nueva query; ejecutar el test hasta verde.
- [x] 4.3 TRIANGULATE: agregar caso que verifique que el cambio de pestaña no dispara otra llamada a `consultarOp` ni calcula derivados en React; ejecutar el test otra vez.
- [x] 4.4 REFACTOR: extraer los componentes presentacionales a `frontend/src/features/ordenes/components/` en PascalCase con CSS Modules, y ejecutar `npm run typecheck -w @velco/frontend`.

## 5. Tabla comparativa por etapa

- [x] 5.1 RED: crear `frontend/src/features/ordenes/components/TablaComparativaEtapas.test.tsx` con casos fallidos para tres etapas más la fila `Sin etapa`, `porcentajeConsumo: null` → `—` y badge de alerta sólo en filas con `alertaDesvio: true`; ejecutar `npm test -w @velco/frontend`.
- [x] 5.2 GREEN: crear `TablaComparativaEtapas.tsx` y su CSS Module leyendo `comparativaPorEtapa` tal como viene del DTO, con estilo distintivo para `etapaId: null`; ejecutar el test hasta verde.
- [x] 5.3 TRIANGULATE: agregar caso que verifique el orden del arreglo y que la fila `Sin etapa` no se fusiona con otra etapa; ejecutar el test otra vez.
- [x] 5.4 REFACTOR: ejecutar `npm run typecheck -w @velco/frontend` y revisar que la tabla no importa funciones de `packages/domain/src/horas/`.

## 6. Resumen de costos, margen y advertencia de tasa global

- [x] 6.1 RED: crear `frontend/src/features/ordenes/components/ResumenCostosMargen.test.tsx` con casos fallidos para `montoVendido: "1000.00"`, `costoMaterialesCotizado: "200.00"`, `costoMaterialesReal: "240.00"`, `margenReal: "160.00"`, margen negativo `-33.75`, advertencia con `tasaGlobalNoConfigurada: true` y ausencia de advertencia con `false`; ejecutar `npm test -w @velco/frontend`.
- [x] 6.2 GREEN: crear `ResumenCostosMargen.tsx` y su CSS Module usando el formateador de presentación y `role="status"` para la advertencia, sin calcular ni sustituir importes; ejecutar el test hasta verde.
- [x] 6.3 TRIANGULATE: agregar caso con `tasaGlobalNoConfigurada: true` y `margenReal: "760.00"` para confirmar que el importe se muestra igual junto a la advertencia; ejecutar el test otra vez.
- [x] 6.4 REFACTOR: ejecutar `npm run typecheck -w @velco/frontend` y revisar que no se use el costo cotizado en lugar del real.

## 7. Integración, evidencia y cierre

- [x] 7.1 Actualizar `frontend/test/ordenes/fixtures.ts` con `comparativaPorEtapa`, agregados de materiales, `margenReal` y `tasaGlobalNoConfigurada`, y ejecutar `npm test -w @velco/frontend` completo.
- [x] 7.2 Ejecutar `npm run verify` (typecheck y tests de los tres workspaces) y registrar la salida exacta en el progreso del apply.
- [x] 7.3 Ejecutar `openspec validate analitica-de-rentabilidad-ui --strict` y corregir cualquier hallazgo de artefactos antes de cerrar el apply.
- [x] 7.4 REFACTOR final: verificar que no se tocaron Prisma, migraciones, endpoints de configuración, auth/PIN/RBAC, exportación ni dashboard, y que `packages/domain/` sigue compilando sin adaptadores (R2, R3, R5, R6).
