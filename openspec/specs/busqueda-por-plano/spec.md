# busqueda-por-plano Specification

## Purpose
TBD - created by archiving change ordenes-y-linea-base-api. Update Purpose after archive.
## Requirements
### Requirement: Predicado global ampliado en `listOps`

`GET /api/ops` DEBE (SHALL) ampliar el predicado del query param existente `buscar` para que, sin distinguir mayúsculas, busque en `numero_op`, `codigo_plano`, el nombre del cliente y `descripcion_pieza`. La extensión DEBE (SHALL) realizarse en el caso de uso `listarOps` sobre los datos derivados por el dominio, sin mover la búsqueda al handler ni al frontend (HU-09, DD-11, RN-EXPORT-07, RN-GLOBAL-02).

#### Scenario: Búsqueda por código de plano

- **WHEN** se envía `GET /api/ops?buscar=pl-2026-045` y una OP tiene `codigo_plano = 'PL-2026-045'`
- **THEN** esa OP se devuelve aunque su `numero_op` y su pieza no contengan el texto

#### Scenario: Búsqueda por cliente normalizado

- **WHEN** se envía `buscar=agro` y el nombre del cliente es `Agroindustria Cuyo`
- **THEN** se devuelven las OPs de ese cliente, sin agregar un query param nuevo para cliente por texto

#### Scenario: Búsqueda combinada por campo

- **WHEN** se envía `buscar=1871` y una OP tiene `numero_op = '1871'`
- **THEN** se devuelve esa OP y la comparación sigue sin distinguir mayúsculas

#### Scenario: Plano nulo no genera falsos positivos

- **WHEN** se envía `buscar=PL-` y una OP tiene `codigo_plano = null`
- **THEN** esa OP no se devuelve por el campo de plano, aunque pueda coincidir por otro campo

### Requirement: Filtro rápido con plano / sin plano

`GET /api/ops` DEBE (SHALL) aceptar el parámetro opcional `conPlano` con valores booleanos `true`/`false` (contrato confirmado como DU-1 en `design.md`): `true` devuelve solo OPs con `codigoPlano !== null`, `false` solo OPs con `codigoPlano === null` y su ausencia no filtra. El filtro DEBE (SHALL) validarse en la frontera con Zod y aplicarse en `listOps` antes de calcular KPIs, conservando `flujo` pre-filtro. NO DEBE (SHALL NOT) aceptarse `estadoPlano` ni dos flags separados para la misma distinción (HU-09, RN-OP-05, R10).

#### Scenario: Solo OPs con plano

- **WHEN** se envía `GET /api/ops?conPlano=true`
- **THEN** todas las tarjetas devueltas tienen `codigoPlano` no nulo y `kpis.total` coincide con ese subconjunto

#### Scenario: Solo OPs sin plano

- **WHEN** se envía `GET /api/ops?conPlano=false`
- **THEN** todas las tarjetas devueltas tienen `codigoPlano: null`

#### Scenario: Sin filtro de plano

- **WHEN** se omite `conPlano`
- **THEN** se devuelven OPs con y sin plano y el comportamiento es idéntico al de C-05 excepto por los campos nuevos

#### Scenario: Valor inválido

- **WHEN** se envía `conPlano=quizas`
- **THEN** la respuesta es 422 con `error: 'validation_error'` y el caso de uso no se ejecuta

#### Scenario: Parámetros alternativos rechazados

- **WHEN** se envía `estadoPlano=con` o dos flags separados en lugar de `conPlano`
- **THEN** la validación de frontera rechaza la request con 422 y `error: 'validation_error'`, sin aplicar ningún filtro de plano (DU-1)

#### Scenario: Filtro combinado con búsqueda

- **WHEN** se envían `conPlano=true` y `buscar=PL-2026`
- **THEN** se aplican ambos predicados con AND sobre las mismas filas derivadas

### Requirement: Búsqueda sin cambios de semántica de fecha ni de UI

La ampliación NO DEBE (SHALL NOT) alterar el significado de `fechaDesde`/`fechaHasta`, que filtran `fecha_entrega` (fecha comprometida), ni el orden estable por `fecha_entrega` y `numero_op`. El frontend NO DEBE (SHALL NOT) incorporar un input nuevo en C-06: el campo genérico de búsqueda existente ya envía `buscar` (HU-09, DD-12, RN-DASH-02).

#### Scenario: Rango de fechas comprometidas

- **WHEN** se envía `fechaDesde` y `fechaHasta` junto con `buscar=PL-2026-045`
- **THEN** el rango sigue comparándose con `fecha_entrega` y la búsqueda con el texto ampliado

#### Scenario: Orden estable

- **WHEN** se consulta dos veces con el mismo filtro de plano y se insertan OPs en distinto orden
- **THEN** el orden de `ops` sigue siendo `fechaEntrega` ascendente y luego `numeroOp` ascendente

#### Scenario: Sin input nuevo en el frontend

- **WHEN** se inspecciona `frontend/src/features/tablero/` después de C-06
- **THEN** no hay un control nuevo de filtro de plano; el cambio se limita al espejo de esquemas en `shared/domain-client/`
