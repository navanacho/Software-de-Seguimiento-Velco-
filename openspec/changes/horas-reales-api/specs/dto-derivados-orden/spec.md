## ADDED Requirements

### Requirement: Derivados de horas reales con una sola implementación en el DTO

Los derivados de horas reales (`horasRealesTotales`, `desvioHoras`, `porcentajeConsumo` y `alertaDesvio`) DEBEN (SHALL) construirse mediante las funciones puras de `packages/domain/src/horas/` y viajar en el DTO que consume la API y el frontend, sin recálculo en handlers ni en componentes React (RN-HORAS-01..04, RN-GLOBAL-02, R3). Estos derivados DEBEN (SHALL) viajar en `DetalleOpDTO` como campos hermanos de `horas` (P-2, confirmado el 2026-11-22). `TarjetaOrdenDTO` y `GET /api/ops` (`api-listado-ops`) NO DEBEN (SHALL NOT) modificarse en C-08 (P-6); C-09 obtendrá los totales del detalle o de `GET /api/ops/:id/horas`.

#### Scenario: Construcción del derivado en dominio

- **WHEN** se construye el detalle de una OP con partes imputados y horas vendidas por etapa
- **THEN** los derivados de horas son exactamente los devueltos por las funciones puras de dominio, sin cálculo adicional en `obtenerOp` ni en el handler

#### Scenario: Derivados hermanos en el detalle

- **WHEN** se inspecciona `DetalleOpDTO` después de C-08
- **THEN** expone `horas` como arreglo de partes y los cuatro derivados como campos hermanos, sin objeto `{ partes, totales }` (P-2)

#### Scenario: Listado de OP intacto

- **WHEN** se comparan `TarjetaOrdenDTO`, `GET /api/ops` y su spec `api-listado-ops` antes y después de C-08
- **THEN** permanecen sin cambios: no se agrega `horasRealesTotales` ni ningún otro campo de horas (P-6)

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
