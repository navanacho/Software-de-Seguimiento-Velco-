# filtros-y-estado-vacio-tablero Specification

## Purpose
TBD - created by archiving change tablero-visual. Update Purpose after archive.
## Requirements
### Requirement: Filtros y búsqueda enviados al listado

El tablero DEBE (SHALL) ofrecer filtros por cliente, estado del semáforo y etapa `ahora`, más una búsqueda por texto, y enviarlos como query string de `GET /api/ops` mediante `clienteId`, `estado`, `etapaAhora` y `buscar`. NO DEBE (SHALL NOT) filtrar localmente el arreglo `ops` (HU-09, RN-GLOBAL-02, RN-SEMAFORO-01).

#### Scenario: Filtrar por estado derivado

- **WHEN** el usuario selecciona el estado `"Atrasado"`
- **THEN** la petición incluye `estado=Atrasado` y la grilla pinta la respuesta del servidor, sin que el componente compare `semaforo`

#### Scenario: Buscar por número de OP o pieza

- **WHEN** el usuario escribe `OT-1001` en el campo de búsqueda
- **THEN** la petición incluye `buscar=OT-1001` y no se realiza ningún filtrado adicional en el cliente

#### Scenario: Filtros combinados

- **WHEN** el usuario selecciona simultáneamente un cliente y una etapa `ahora`
- **THEN** la petición incluye `clienteId` y `etapaAhora` con esos valores, y los KPIs y el flujo mostrados son los devueltos por el servidor para esa combinación

### Requirement: Opciones de filtro estables derivadas del tablero

El selector de etapas DEBE (SHALL) construirse con los valores de `flujo[].etapa`, que son estables pre-filtro porque C-04 calcula `flujo` antes de filtrar. El selector de clientes DEBE (SHALL) mantener un conjunto base estable de pares `{clienteId, clienteNombre}` capturado desde la primera carga sin filtro (o conservar visible la opción seleccionada y la base conocida), de modo que filtrar por un cliente no oculte las opciones necesarias para cambiar a otro cliente. NO DEBE (SHALL NOT) invocar endpoints no definidos en C-04, inventar un catálogo de etapas, agregar paginación ni mover esta lógica al backend (OQ-3 de `design.md`, resuelta 2026-11-21).

#### Scenario: Clientes disponibles en carga base

- **WHEN** la primera carga sin filtro contiene dos `clienteId` distintos con sus `clienteNombre`
- **THEN** el selector conserva esos dos clientes como conjunto base y no consulta ninguna ruta adicional

#### Scenario: Cambiar de cliente con un filtro activo

- **WHEN** el usuario filtró por Cliente A y la respuesta contiene solo OPs de Cliente A
- **THEN** el selector de clientes sigue ofreciendo Cliente B y Cliente C del conjunto base, y al seleccionar Cliente B la nueva consulta se envía al servidor con `clienteId` de Cliente B

#### Scenario: Etapas disponibles

- **WHEN** `flujo` contiene tres etapas activas
- **THEN** el selector de etapa `ahora` ofrece esas tres opciones y no consulta ninguna ruta adicional

### Requirement: Estado vacío con acciones sugeridas

Cuando `ops` está vacío, el tablero DEBE (SHALL) mostrar un estado vacío con al menos dos acciones sugeridas: limpiar los filtros activos y recargar el tablero (Flujo 2, HU-09, prototipo `.empty`).

#### Scenario: Sin resultados por filtros

- **WHEN** `ops` está vacío y hay filtros activos
- **THEN** se muestra el estado vacío y la acción *Limpiar filtros* reinicia la consulta sin filtros

#### Scenario: Sin órdenes cargadas

- **WHEN** `ops` está vacío y no hay filtros activos
- **THEN** se muestra el estado vacío y la acción *Recargar tablero* invalida la consulta para volver a pedir `GET /api/ops`

#### Scenario: Con resultados

- **WHEN** `ops` contiene al menos una tarjeta
- **THEN** no se muestra el estado vacío y la grilla renderiza las tarjetas recibidas
