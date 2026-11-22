## ADDED Requirements

### Requirement: Badge de plano en la tarjeta del tablero

La tarjeta DEBE (SHALL) mostrar `Plano: <codigo>` cuando `codigoPlano` es distinto de `null` y `Sin plano` cuando es `null`, usando el valor transportado por `TarjetaOrdenDTO` sin normalizarlo, formatearlo ni convertirlo en texto (HU-05, HU-09, RN-OP-05/06, DD-11). El badge NO DEBE (SHALL NOT) modificarse por el hecho de existan múltiples OP sin plano (RN-OP-05).

#### Scenario: Tarjeta con plano

- **WHEN** una tarjeta del listado trae `codigoPlano: 'PL-2026-045'`
- **THEN** la tarjeta muestra el texto `Plano: PL-2026-045`

#### Scenario: Tarjeta sin plano

- **WHEN** una tarjeta del listado trae `codigoPlano: null`
- **THEN** la tarjeta muestra `Sin plano` y no muestra `Plano: null`, `Plano: ` ni una cadena vacía

#### Scenario: Muchas tarjetas sin plano

- **WHEN** tres tarjetas del tablero traen `codigoPlano: null`
- **THEN** las tres muestran `Sin plano` y se renderizan sin error de unicidad ni de formato

### Requirement: Badge de plano en el detalle de la OP

La vista de detalle DEBE (SHALL) mostrar el mismo badge a partir de `DetalleOpDTO.codigoPlano`, aplicando idéntica regla de presentación que la tarjeta (HU-01, HU-09, DD-11, D7 del design).

#### Scenario: Detalle con plano

- **WHEN** `GET /api/ops/:id` devuelve `codigoPlano: 'PL-2026-045'`
- **THEN** el detalle muestra `Plano: PL-2026-045`

#### Scenario: Detalle sin plano

- **WHEN** `GET /api/ops/:id` devuelve `codigoPlano: null`
- **THEN** el detalle muestra `Sin plano`

### Requirement: Presentación sin lógica ni campos nuevos en el DTO

El badge DEBE (SHALL) construirse solo con una comparación contra `null` en el componente, sin invocar funciones de normalización del dominio ni agregar campos derivados al DTO (RN-GLOBAL-02, R2, R3, spec `dto-derivados-orden`).

#### Scenario: Sin normalización en React

- **WHEN** se inspeccionan los componentes que renderizan el badge
- **THEN** no aparecen `trim()`, `toUpperCase()` ni llamadas a `normalizarCodigoPlano`, y el valor se lee directamente del DTO

#### Scenario: Sin derivado de presentación

- **WHEN** se inspeccionan los esquemas Zod del frontend y los tipos de `@velco/domain`
- **THEN** no existe un campo `planoVisible`, `textoPlano` ni equivalente; solo `codigoPlano: string | null`
