## MODIFIED Requirements

### Requirement: Endpoint de listado de OPs con filtros sobre derivados

El backend DEBE (SHALL) exponer `GET /api/ops` que devuelva las tarjetas del tablero construidas por `construirTarjetaOrden`, aplicando los filtros opcionales `fechaDesde`, `fechaHasta`, `estado`, `clienteId`, `etapaAhora`, `buscar` y `conPlano` sobre los valores derivados y los datos de la OP. El filtro `estado` DEBE compararse con `TarjetaOrdenDTO.semaforo`, el filtro `etapaAhora` con `TarjetaOrdenDTO.etapaAhora` y `conPlano` con la presencia de `TarjetaOrdenDTO.codigoPlano`. El predicado de `buscar` DEBE cubrir `numero_op`, `codigo_plano`, el nombre del cliente y `descripcion_pieza` sin distinguir mayúsculas; `fechaDesde`/`fechaHasta` DEBEN seguir filtrando `fecha_entrega` (fecha comprometida). NO DEBEN consultarse ni persistirse estados derivados en PostgreSQL (HU-05, HU-09, DD-11, DD-12, RN-GLOBAL-02, RN-EXPORT-07, R3).

#### Scenario: Listado sin filtros

- **WHEN** se envía `GET /api/ops` sin query string
- **THEN** la respuesta tiene código 200 y contiene una tarjeta por OP con `avance`, `semaforo`, `diasRestantes`, `etapaAhora`, `etiquetaPlazo` y `codigoPlano` calculados o transportados por el dominio

#### Scenario: Filtro por semáforo derivado

- **WHEN** se envía `GET /api/ops?estado=Terminado` y existe una OP con avance 100 cuya fecha de entrega ya venció
- **THEN** esa OP aparece en el resultado porque el dominio le asignó `Terminado`, sin que la fecha haya sido comparada en el handler

#### Scenario: Filtro por etapa actual derivada

- **WHEN** se envía `GET /api/ops?etapaAhora=Soldadura`
- **THEN** solo se devuelven las OPs cuya primera etapa pendiente, resuelta por `etapaAhora`, se llama `Soldadura`

#### Scenario: Filtro por cliente y búsqueda ampliada

- **WHEN** se envía `clienteId` junto con `buscar=OT-1001`
- **THEN** se devuelven solo las OPs de ese cliente cuyo `numero_op`, `codigo_plano`, `cliente` o `descripcion_pieza` contiene `OT-1001` sin distinguir mayúsculas

#### Scenario: Búsqueda por código de plano

- **WHEN** se envía `buscar=PL-2026-045`
- **THEN** se devuelve la OP con ese `codigo_plano` normalizado, aunque ni su número ni su pieza contengan el texto

#### Scenario: Filtro rápido por presencia de plano

- **WHEN** se envía `GET /api/ops?conPlano=false`
- **THEN** todas las tarjetas devueltas tienen `codigoPlano: null` y los KPIs se calculan sobre ese subconjunto

#### Scenario: Sin resultados

- **WHEN** ninguna OP satisface los filtros
- **THEN** la respuesta tiene código 200 con `ops` vacío y KPIs en cero, sin error de servidor

### Requirement: Validación de frontera del listado

La ruta DEBE (SHALL) validar query string con esquemas Fastify generados desde `zod` antes de invocar al caso de uso: fechas en formato `YYYY-MM-DD` con calendario válido, `fechaDesde <= fechaHasta`, `estado` restringido a los cuatro valores de `EstadoSemaforo`, `clienteId` con formato UUID, `etapaAhora`/`buscar` con longitud entre 1 y 100 y `conPlano` restringido a los literales booleanos `"true"`/`"false"` (contrato confirmado DU-1 de `design.md`), sin aceptar `estadoPlano` ni dos flags separados. Los errores de validación DEBEN responderse con HTTP 422 y NO DEBEN ejecutar reglas de negocio ni consultar la base de datos (regla de oro, R9).

#### Scenario: Rango de fechas invertido

- **WHEN** se envía `fechaDesde=2027-03-10` y `fechaHasta=2027-03-01`
- **THEN** la respuesta es 422 con `error: "validation_error"` y el caso de uso no se ejecuta

#### Scenario: Fecha calendaria inválida

- **WHEN** se envía `fechaDesde=2027-02-30`
- **THEN** la respuesta es 422 aunque la cadena respete el patrón `YYYY-MM-DD`

#### Scenario: Estado desconocido

- **WHEN** se envía `estado=EnPlazo`
- **THEN** la respuesta es 422 y se documentan en Swagger los cuatro literales válidos, incluidos `En riesgo` y `En plazo`

#### Scenario: Valor inválido para el filtro de plano

- **WHEN** se envía `conPlano=quizas`
- **THEN** la respuesta es 422 con `error: "validation_error"` y no se consulta PostgreSQL

#### Scenario: Filtro alternativo no admitido

- **WHEN** se envía `estadoPlano=con` o dos flags separados en lugar de `conPlano`
- **THEN** la respuesta es 422 con `error: "validation_error"`, sin consultar PostgreSQL ni aplicar filtro de plano (DU-1)

## ADDED Requirements

### Requirement: Semántica de fecha comprometida y flujo pre-filtro invariantes

La ampliación de búsqueda y del filtro de plano NO DEBE (SHALL NOT) cambiar el significado de `fechaDesde`/`fechaHasta` (que filtran `fecha_entrega`), el orden estable por `fecha_entrega` y `numero_op`, ni el cálculo de `flujo` sobre el conjunto completo de OPs activas previo al filtrado (DD-12, RN-FLujo-01, RN-DASH-02).

#### Scenario: Rango con búsqueda por plano

- **WHEN** se envían `fechaDesde`, `fechaHasta` y `buscar=PL-2026-045`
- **THEN** el rango se compara con `fecha_entrega` y la búsqueda con el texto ampliado, sin usar fechas de imputación

#### Scenario: Flujo estable al filtrar por plano

- **WHEN** se envía `conPlano=true`
- **THEN** `flujo` sigue calculado sobre todas las OPs activas previo al filtro, igual que en C-04 y C-05

#### Scenario: Orden estable

- **WHEN** se consulta dos veces con el mismo filtro de plano y las OPs se insertan en distinto orden
- **THEN** `ops` conserva el orden por `fecha_entrega` ascendente y luego `numero_op` ascendente
