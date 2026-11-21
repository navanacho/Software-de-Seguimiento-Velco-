# api-listado-ops Specification

## Purpose
TBD - created by archiving change tablero-read-api. Update Purpose after archive.
## Requirements
### Requirement: Endpoint de listado de OPs con filtros sobre derivados

El backend DEBE (SHALL) exponer `GET /api/ops` que devuelva las tarjetas del tablero construidas por `construirTarjetaOrden`, aplicando los filtros opcionales `fechaDesde`, `fechaHasta`, `estado`, `clienteId`, `etapaAhora` y `buscar` sobre los valores derivados por el dominio. El filtro `estado` DEBE compararse con `TarjetaOrdenDTO.semaforo` y el filtro `etapaAhora` con `TarjetaOrdenDTO.etapaAhora`; NO DEBEN consultarse ni persistirse estados derivados en PostgreSQL (HU-05, HU-09, RN-GLOBAL-02, R3).

#### Scenario: Listado sin filtros

- **WHEN** se envía `GET /api/ops` sin query string
- **THEN** la respuesta tiene código 200 y contiene una tarjeta por OP con `avance`, `semaforo`, `diasRestantes`, `etapaAhora` y `etiquetaPlazo` calculados por el dominio

#### Scenario: Filtro por semáforo derivado

- **WHEN** se envía `GET /api/ops?estado=Terminado` y existe una OP con avance 100 cuya fecha de entrega ya venció
- **THEN** esa OP aparece en el resultado porque el dominio le asignó `Terminado`, sin que la fecha haya sido comparada en el handler

#### Scenario: Filtro por etapa actual derivada

- **WHEN** se envía `GET /api/ops?etapaAhora=Soldadura`
- **THEN** solo se devuelven las OPs cuya primera etapa pendiente, resuelta por `etapaAhora`, se llama `Soldadura`

#### Scenario: Filtro por cliente y búsqueda

- **WHEN** se envía `clienteId` junto con `buscar=OT-1001`
- **THEN** se devuelven solo las OPs de ese cliente cuyo `numeroOp` o `descripcionPieza` contiene `OT-1001` sin distinguir mayúsculas

#### Scenario: Sin resultados

- **WHEN** ninguna OP satisface los filtros
- **THEN** la respuesta tiene código 200 con `ops` vacío y KPIs en cero, sin error de servidor

### Requirement: Validación de frontera del listado

La ruta DEBE (SHALL) validar query string con esquemas Fastify generados desde `zod` antes de invocar al caso de uso: fechas en formato `YYYY-MM-DD` con calendario válido, `fechaDesde <= fechaHasta`, `estado` restringido a los cuatro valores de `EstadoSemaforo`, `clienteId` con formato UUID y `etapaAhora`/`buscar` con longitud entre 1 y 100. Los errores de validación DEBEN responderse con HTTP 422 y NO DEBEN ejecutar reglas de negocio ni consultar la base de datos (regla de oro, R9).

#### Scenario: Rango de fechas invertido

- **WHEN** se envía `fechaDesde=2027-03-10` y `fechaHasta=2027-03-01`
- **THEN** la respuesta es 422 con `error: "validation_error"` y el caso de uso no se ejecuta

#### Scenario: Fecha calendaria inválida

- **WHEN** se envía `fechaDesde=2027-02-30`
- **THEN** la respuesta es 422 aunque la cadena respete el patrón `YYYY-MM-DD`

#### Scenario: Estado desconocido

- **WHEN** se envía `estado=EnPlazo`
- **THEN** la respuesta es 422 y se documentan en Swagger los cuatro literales válidos, incluidos `En riesgo` y `En plazo`

### Requirement: KPIs y conteos de flujo en la respuesta del listado

La respuesta DEBE (SHALL) incluir `kpis` con el total de tarjetas y el conteo por cada uno de los cuatro estados del semáforo, y `flujo` con el resultado de `agruparFlujo` sobre el conjunto completo de OPs activas previo al filtrado. Las OPs terminadas NO DEBEN contarse en `flujo` (HU-06, RN-FLujo-01).

#### Scenario: Conteo por estado

- **WHEN** el tablero tiene dos OPs `En plazo`, una `Atrasado` y una `Terminado`
- **THEN** `kpis.total` es 4 y `kpis.porEstado` contiene esos valores con `En riesgo` en cero

#### Scenario: OP terminada excluida del flujo

- **WHEN** una OP del tablero tiene avance 100 y todas sus etapas completadas
- **THEN** esa OP no aporta ningún grupo a `flujo`, aunque siga presente en `ops` y en `kpis`

#### Scenario: Orden estable del flujo

- **WHEN** se consulta dos veces el listado con inserciones en distinto orden
- **THEN** la secuencia de grupos de `flujo` es la misma en ambas respuestas

