## MODIFIED Requirements

### Requirement: Derivados de horas reales con una sola implementación en el DTO

Los derivados de horas reales (`horasRealesTotales`, `desvioHoras`, `porcentajeConsumo` y `alertaDesvio`) DEBEN (SHALL) construirse mediante las funciones puras de `packages/domain/src/horas/` y viajar en el DTO que consume la API y el frontend, sin recálculo en handlers ni en componentes React (RN-HORAS-01..04, RN-GLOBAL-02, R3). Estos derivados DEBEN (SHALL) viajar en `DetalleOpDTO` como campos hermanos de `horas` (P-2, confirmado el 2026-11-22). En C-08, `TarjetaOrdenDTO` y `GET /api/ops` (`api-listado-ops`) no se modificaron (P-6=B); C-09 enmienda esa decisión mediante OQ-1=A y agrega `horasVendidasTotales` y `horasRealesTotales` calculados en dominio a la tarjeta y al listado, conforme al requirement `Totales de horas en TarjetaOrdenDTO`. C-12 enmienda P-6 una vez más y agrega `porcentajeConsumo` y `alertaDesvio` a `TarjetaOrdenDTO`: `construirTarjetaOrden` DEBE (SHALL) calcularlos con `calcularConsumoHoras` y `evaluarAlertaDesvio`, y `construirDetalleOp` DEBE (SHALL) heredarlos de la tarjeta eliminando sus declaraciones duplicadas, conservando una sola definición canónica (RN-GLOBAL-02, R2, R9).

#### Scenario: Construcción del derivado en dominio

- **WHEN** se construye el detalle de una OP con partes imputados y horas vendidas por etapa
- **THEN** los derivados de horas son exactamente los devueltos por las funciones puras de dominio, sin cálculo adicional en `obtenerOp` ni en el handler

#### Scenario: Derivados hermanos en el detalle

- **WHEN** se inspecciona `DetalleOpDTO` después de C-08
- **THEN** expone `horas` como arreglo de partes y los cuatro derivados como campos hermanos, sin objeto `{ partes, totales }` (P-2)

#### Scenario: Listado de OP con totales de horas calculados

- **WHEN** se comparan `TarjetaOrdenDTO`, `GET /api/ops` y su spec `api-listado-ops` antes y después de C-09
- **THEN** C-08 permanece sin cambios y C-09 agrega únicamente `horasVendidasTotales` y `horasRealesTotales`, calculados en `packages/domain`, transportados por la API y renderizados por el frontend sin columnas persistidas ni cálculo en React (P-6 enmendado por OQ-1=A, R3)

#### Scenario: Recálculo homogéneo en el caso de uso

- **WHEN** se da de alta, se edita o se elimina un parte
- **THEN** los derivados se reconstruyen con las mismas funciones que usa la lectura del detalle, sin una segunda rama de cálculo

#### Scenario: Consumo sin recalcular en React

- **WHEN** un componente de C-09 renderiza horas vendidas y reales
- **THEN** muestra los valores del DTO y no invoca funciones de cálculo de horas ni compara totales por su cuenta

#### Scenario: División por cero transportada como null

- **WHEN** una OP tiene `horasVendidasTotales = "0.00"` y partes imputados
- **THEN** `porcentajeConsumo` viaja como `null` y `alertaDesvio` se calcula con la regla de `reales > vendidas` (RN-HORAS-06)

#### Scenario: Sin persistencia ni duplicación de reglas

- **WHEN** se inspeccionan `schema.prisma`, la migración 003, los adaptadores HTTP/Prisma y el frontend
- **THEN** no hay columnas de derivados de horas, no hay una segunda definición de las fórmulas y el único módulo que las define es `packages/domain/src/horas/` (R2, R3, RN-GLOBAL-02)

#### Scenario: Contrato compartido sin `any`

- **WHEN** backend y frontend necesitan el tipo de los derivados de horas
- **THEN** lo importan desde `packages/domain` o lo espejan con `z.infer`, sin `any` ni definiciones duplicadas (R9)

#### Scenario: Consumo y alerta también en la tarjeta

- **WHEN** se construye una tarjeta con horas vendidas `40.00`, reales `32.00` y avance `50`
- **THEN** `TarjetaOrdenDTO` incluye `porcentajeConsumo: "80.00"` y `alertaDesvio: true` calculados por `construirTarjetaOrden`, y ambos viajan en `GET /api/ops` sin cálculo en el handler ni en React

#### Scenario: Detalle sin declaraciones duplicadas

- **WHEN** se inspeccionan `DetalleOpDTO` y el espejo `frontend/src/shared/domain-client/tipos.ts`
- **THEN** `porcentajeConsumo` y `alertaDesvio` se heredan de `TarjetaOrdenDTO` y no se redeclaran en el detalle, manteniendo una sola definición del contrato

#### Scenario: Umbral gobernado por el dominio

- **WHEN** la UI recibe `alertaDesvio` en una tarjeta o en una fila de comparativa
- **THEN** muestra el estado recibido sin importar `UMBRAL_DESVIO_PORCENTAJE`, sin escribir `15` en componentes ni comparar porcentajes por su cuenta (RN-HORAS-04)
