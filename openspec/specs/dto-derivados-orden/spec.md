# dto-derivados-orden Specification

## Purpose
TBD - created by archiving change estado-y-avance-domain. Update Purpose after archive.
## Requirements
### Requirement: DTO de salida con derivados para tarjeta

El dominio DEBE (SHALL) exponer un DTO de salida que incluya, junto a los datos de la OP, los campos derivados `avance`, `semaforo`, `diasRestantes`, `etapaAhora` y `etiquetaPlazo`, aplanados en el mismo objeto. El DTO DEBE construirse mediante una función pura que componga `calcularAvance`, `etapaAhora`, `calcularSemaforo` y `diasRestantes` con el contexto inyectado (HU-05, RN-GLOBAL-02).

#### Scenario: Construcción del DTO

- **WHEN** se construye el DTO de una OP con sus etapas y un contexto con `hoy`, `zonaHoraria` y umbrales
- **THEN** el resultado contiene avance, semáforo, días restantes, etapa `ahora` y etiqueta de plazo calculados por el dominio

#### Scenario: Datos mínimos de tarjeta

- **WHEN** se inspecciona el DTO
- **THEN** incluye número de OP, cliente, pieza y etapas con su estado, sin requerir datos de horas ni de costos

#### Scenario: Sin persistencia de derivados

- **WHEN** se construye el DTO
- **THEN** ninguno de sus campos derivados se escribe en base de datos ni se agrega como columna al esquema (R3)

### Requirement: Una sola implementación consumida por API y frontend

La API DEBE (SHALL) servir el DTO construido por el dominio sin recalcular ninguno de sus derivados, y el frontend DEBE (SHALL) limitarse a renderizarlos. NI la API NI el frontend DEBEN invocar directamente las funciones de cálculo ni comparar fechas para obtener el semáforo (RN-GLOBAL-02, C-04 y C-05 del roadmap). En C-04 esto alcanza a los tres endpoints `GET /api/ops`, `GET /api/ops/:id` y `PATCH /api/ops/:id/etapas/:etapaId`: los filtros y el recálculo posterior al PATCH se resuelven con las mismas funciones puras del dominio, nunca con lógica en los handlers ni con columnas derivadas.

#### Scenario: Consumo por la API

- **WHEN** un handler de C-04 responde con una OP
- **THEN** los derivados del cuerpo son exactamente los del DTO del dominio, sin cálculo adicional en el handler

#### Scenario: Consumo por el frontend

- **WHEN** un componente de C-05 pinta una tarjeta
- **THEN** muestra `semaforo`, `avance`, `etapaAhora` y `etiquetaPlazo` tal como vienen en el DTO, sin importar funciones de cálculo ni comparar fechas

#### Scenario: Contrato compartido

- **WHEN** backend y frontend necesitan el tipo del DTO
- **THEN** ambos lo importan desde `packages/domain` y no existe una definición duplicada de las reglas derivadas ni de los DTOs canónicos (`TarjetaOrdenDTO`, `EtapaTarjeta`, `GrupoFlujo`, `EstadoSemaforo`, `ContextoTarjeta`); un envelope de transporte puede componerse a partir de esos tipos canónicos sin redefinir sus campos derivados

#### Scenario: Filtros sobre el DTO

- **WHEN** se aplica el filtro `estado` o `etapaAhora` en el listado
- **THEN** se comparan los campos `semaforo` y `etapaAhora` del DTO del dominio, sin volver a invocar `calcularSemaforo` ni `etapaAhora` desde el adaptador HTTP

#### Scenario: Recálculo posterior al PATCH

- **WHEN** se persiste `completada` y se construye la respuesta
- **THEN** el caso de uso invoca `construirTarjetaOrden` con etapas frescas y el handler solo devuelve el resultado, sin escribir derivados en PostgreSQL (R3)

### Requirement: Envelope de respuesta del tablero y del detalle

La API DEBE (SHALL) servir las tarjetas del dominio en un envelope con `ops`, `kpis` y `flujo` para `GET /api/ops`, y un `DetalleOpDTO` que extienda `TarjetaOrdenDTO` para `GET /api/ops/:id`. Ninguno de los dos DEBE recalcular los derivados del DTO ni definir una segunda versión de las reglas derivadas o de los DTOs canónicos; un envelope de transporte puede componerse a partir de esos tipos canónicos en backend o frontend sin redefinir sus campos derivados (RN-GLOBAL-02, HU-05, HU-14/15/16).

#### Scenario: Respuesta del listado

- **WHEN** se inspecciona el cuerpo de `GET /api/ops`
- **THEN** cada elemento de `ops` es un `TarjetaOrdenDTO` importado desde `@velco/domain`, y `flujo` es el arreglo de `GrupoFlujo` producido por `agruparFlujo`

#### Scenario: Respuesta del detalle

- **WHEN** se inspecciona el cuerpo de `GET /api/ops/:id`
- **THEN** conserva todos los campos derivados de la tarjeta y agrega los datos de la OP que HU-14/15/16 necesitan, sin redefinir `semaforo`, `avance` ni `etapaAhora`

#### Scenario: Respuesta del PATCH

- **WHEN** se actualiza `completada` y se inspecciona la respuesta
- **THEN** es la misma tarjeta derivada del dominio que devolvería `GET /api/ops`, con los valores recalculados en el caso de uso

### Requirement: `codigoPlano` en el DTO canónico de tarjeta

`TarjetaOrdenDTO` DEBE (SHALL) incluir `readonly codigoPlano: string | null` y `construirTarjetaOrden` DEBE (SHALL) copiarlo desde `OrdenTrabajo.codigoPlano` sin derivarlo, normalizarlo de nuevo ni convertir `null` en texto. El campo NO DEBE (SHALL NOT) considerarse un derivado: es dato persistido y transportado para que C-07 decida cómo renderizarlo (DD-11, RN-OP-05, R2, RN-GLOBAL-02).

#### Scenario: Tarjeta con plano

- **WHEN** se construye una tarjeta desde una OP con `codigo_plano = 'PL-2026-045'`
- **THEN** el DTO contiene `codigoPlano: 'PL-2026-045'` y ningún campo adicional de presentación

#### Scenario: Tarjeta sin plano

- **WHEN** se construye una tarjeta desde una OP con `codigo_plano = NULL`
- **THEN** el DTO contiene `codigoPlano: null`, sin convertirlo en `'Sin plano'` ni en cadena vacía

#### Scenario: Derivados intactos

- **WHEN** se construye la tarjeta con el campo nuevo
- **THEN** `avance`, `semaforo`, `diasRestantes`, `etapaAhora` y `etiquetaPlazo` siguen calculados por las mismas funciones puras y no se escribe ninguno en base de datos (R3)

#### Scenario: Constructor compartido

- **WHEN** el listado, el detalle y la respuesta de `PATCH` construyen una tarjeta
- **THEN** los tres usan `construirTarjetaOrden` y por los tres viaja `codigoPlano` con el mismo valor

### Requirement: Espejo de esquemas Zod en backend y frontend

Los esquemas Zod/JSON del backend (`backend/src/features/ordenes/http/esquemas.ts`) y el esquema de transporte del frontend (`frontend/src/shared/domain-client/esquemas.ts`) DEBEN (SHALL) declarar `codigoPlano` como `string` de longitud máxima 80 o `null`, manteniendo `z.ZodType<TarjetaOrdenDTO>` en el cliente para que el compilador detecte desincronizaciones. NO DEBE (SHALL NOT) usarse `any` ni una definición duplicada del DTO canónico (R2, R9).

#### Scenario: Respuesta del listado validada

- **WHEN** `GET /api/ops` devuelve tarjetas con `codigoPlano`
- **THEN** el esquema del frontend valida el valor y la tarjeta llega intacta al componente presentacional

#### Scenario: Campo ausente

- **WHEN** una respuesta de prueba omite `codigoPlano`
- **THEN** el esquema zod rechaza el cuerpo en lugar de completarlo con un valor por defecto

#### Scenario: Typecheck estricto

- **WHEN** se ejecuta el typecheck de dominio, backend y frontend
- **THEN** no hay errores ni apariciones de `any` derivadas del campo nuevo (R9)
