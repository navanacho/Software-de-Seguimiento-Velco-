## ADDED Requirements

### Requirement: Acceso a la alta de OP desde el tablero

El tablero DEBE (SHALL) ofrecer una acción *Nueva OP* visible en su barra de acciones que navegue a `/ops/nueva`, sin alterar filtros ni la query de `GET /api/ops` (CHANGES.md §C-07, Flujo 1, R5).

#### Scenario: Navegar al formulario desde el tablero

- **WHEN** el usuario pulsa *Nueva OP* en el tablero
- **THEN** la SPA navega a `/ops/nueva` y los filtros activos del tablero permanecen sin cambios

#### Scenario: Sin autenticación ni permisos

- **WHEN** se inspecciona la acción
- **THEN** no depende de roles, login ni PIN y está disponible para el único usuario del MVP (R5)

## MODIFIED Requirements

### Requirement: Estado vacío con acciones sugeridas

Cuando `ops` está vacío, el tablero DEBE (SHALL) mostrar un estado vacío con al menos tres acciones sugeridas: *Nueva OP*, limpiar los filtros activos y recargar el tablero (Flujo 1, Flujo 2, HU-09, prototipo `.empty`). La acción *Nueva OP* DEBE navegar a `/ops/nueva`; las otras dos conservan su comportamiento de C-05.

#### Scenario: Sin resultados por filtros

- **WHEN** `ops` está vacío y hay filtros activos
- **THEN** se muestra el estado vacío con *Nueva OP* y *Limpiar filtros*, y esta última reinicia la consulta sin filtros

#### Scenario: Sin órdenes cargadas

- **WHEN** `ops` está vacío y no hay filtros activos
- **THEN** se muestra el estado vacío con *Nueva OP* y *Recargar tablero*, y esta última invalida la consulta para volver a pedir `GET /api/ops`

#### Scenario: Alta desde el estado vacío

- **WHEN** `ops` está vacío y el usuario pulsa *Nueva OP*
- **THEN** la SPA navega a `/ops/nueva` sin enviar ninguna petición adicional al listado

#### Scenario: Con resultados

- **WHEN** `ops` contiene al menos una tarjeta
- **THEN** no se muestra el estado vacío y la grilla renderiza las tarjetas recibidas
