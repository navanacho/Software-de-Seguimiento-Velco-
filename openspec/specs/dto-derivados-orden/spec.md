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
- **THEN** incluye número de OP, cliente, pieza y etapas con su estado, además de los derivados de fecha/avance y los totales de horas definidos en su propio requirement, sin requerir datos de costos

#### Scenario: Sin persistencia de derivados

- **WHEN** se construye el DTO
- **THEN** ninguno de sus campos derivados se escribe en base de datos ni se agrega como columna al esquema (R3)

### Requirement: Una sola implementación consumida por API y frontend

La API DEBE (SHALL) servir el DTO construido por el dominio sin recalcular ninguno de sus derivados, y el frontend DEBE (SHALL) limitarse a renderizarlos. NI la API NI el frontend DEBEN invocar directamente las funciones de cálculo ni comparar fechas para obtener el semáforo (RN-GLOBAL-02, C-04 y C-05 del roadmap). En C-04 esto alcanza a los tres endpoints `GET /api/ops`, `GET /api/ops/:id` y `PATCH /api/ops/:id/etapas/:etapaId`: los filtros y el recálculo posterior al PATCH se resuelven con las mismas funciones puras del dominio, nunca con lógica en los handlers ni con columnas derivadas. A partir de C-09, `horasVendidasTotales` y `horasRealesTotales` en `TarjetaOrdenDTO` siguen la misma regla: calculados en dominio, transportados por API, renderizados por frontend sin sumar ni recalcular.

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

#### Scenario: Totales de horas en tarjeta sin cálculo en React

- **WHEN** el tablero renderiza la barra `Horas Reales / Horas Vendidas`
- **THEN** usa `horasRealesTotales` y `horasVendidasTotales` del `TarjetaOrdenDTO` sin importar funciones de horas ni sumar partes/etapas en el componente

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

### Requirement: Totales de horas en TarjetaOrdenDTO

`TarjetaOrdenDTO` DEBE (SHALL) incluir `horasVendidasTotales` y `horasRealesTotales` como cadenas decimales exactas, calculadas en `packages/domain` mediante las funciones puras canónicas (`calcularHorasVendidasTotales`, `calcularHorasRealesTotales`) al construir la tarjeta. Estos campos DEBEN (SHALL) estar presentes en `GET /api/ops` y en toda construcción de `TarjetaOrdenDTO`, para que C-09 pueda renderizar la barra de horas en tarjeta sin cálculo en React (RN-GLOBAL-02, R3). Esta decisión enmienda explícitamente P-6=B de C-08 mediante delta spec de C-09, confirmada por el usuario el 2026-11-24 (OQ-1=A).

#### Scenario: Tarjeta con horas reales

- **WHEN** se construye una tarjeta para una OP con horas vendidas 40.00 y partes que suman 32.00 horas reales
- **THEN** el DTO incluye `horasVendidasTotales: "40.00"` y `horasRealesTotales: "32.00"`

#### Scenario: Tarjeta sin partes

- **WHEN** se construye una tarjeta para una OP sin registros de horas
- **THEN** `horasRealesTotales` es `"0.00"` y `horasVendidasTotales` refleja la suma de horas vendidas por etapas

#### Scenario: Sin persistencia de totales

- **WHEN** se inspecciona el esquema Prisma y la migración
- **THEN** no existen columnas persistidas para `horasVendidasTotales` ni `horasRealesTotales` (R3)

### Requirement: Derivados de horas reales con una sola implementación en el DTO

Los derivados de horas reales (`horasRealesTotales`, `desvioHoras`, `porcentajeConsumo` y `alertaDesvio`) DEBEN (SHALL) construirse mediante las funciones puras de `packages/domain/src/horas/` y viajar en el DTO que consume la API y el frontend, sin recálculo en handlers ni en componentes React (RN-HORAS-01..04, RN-GLOBAL-02, R3). Estos derivados DEBEN (SHALL) viajar en `DetalleOpDTO` como campos hermanos de `horas` (P-2, confirmado el 2026-11-22). En C-08, `TarjetaOrdenDTO` y `GET /api/ops` (`api-listado-ops`) no se modificaron (P-6=B); C-09 enmienda esa decisión mediante OQ-1=A y agrega `horasVendidasTotales` y `horasRealesTotales` calculados en dominio a la tarjeta y al listado, conforme al requirement `Totales de horas en TarjetaOrdenDTO`.

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

### Requirement: Derivados de comparativa, costos y margen en el detalle canónico

El dominio DEBE (SHALL) ampliar `DetalleOpDTO` —construido por la misma función pura que produce la tarjeta— con los campos derivados `comparativaPorEtapa`, `costoMaterialesCotizado`, `costoMaterialesReal`, `margenReal` y `tasaGlobalNoConfigurada`. Estos campos DEBEN (SHALL) calcularse con las reglas puras de `packages/domain/src/horas/` y `packages/domain/src/margen/`, usando la tasa global vigente inyectada en `ContextoTarjeta.valorHoraEstandar` (HU-14/15/16, Flujo 5, RN-GLOBAL-02, DD-04, IN-02).

#### Scenario: Detalle con rentabilidad calculada

- **WHEN** se construye el detalle de una OP con etapas, partes, materiales y un contexto con tasa `12.50`
- **THEN** el DTO contiene la comparativa por etapa, ambos agregados de materiales y el margen real calculado en dominio, sin que el handler ni React los calculen

#### Scenario: Detalle con tasa no configurada

- **WHEN** la tasa inyectada es `0.00`
- **THEN** `margenReal` contiene `montoVendido - costoMaterialesReal` y `tasaGlobalNoConfigurada` es `true`, sin lanzar ni devolver `null` (Flujo 5, RN-CONFIG-01)

#### Scenario: División por cero transportada

- **WHEN** una OP tiene horas vendidas `0.00` con partes imputados
- **THEN** el porcentaje de consumo de la tarjeta y de cada fila de la comparativa viaja como `null` y la alerta se calcula con `reales > vendidas` (RN-HORAS-06)

#### Scenario: Sin persistencia de los campos nuevos

- **WHEN** se inspeccionan `schema.prisma`, las migraciones y la respuesta del detalle
- **THEN** ninguno de los campos nuevos se escribe en PostgreSQL ni aparece como columna (R3)

### Requirement: Transporte de los derivados sin duplicación de reglas

La API DEBE (SHALL) servir los campos nuevos tal como los produce el dominio, sin invocar fórmulas en los handlers ni reordenar la comparativa. El espejo Zod del frontend DEBE (SHALL) declararlos con los mismos tipos —cadenas decimales exactas, `null` donde corresponda y el arreglo de comparativa— manteniendo `z.ZodType<DetalleOpDTO>` sin `any` (RN-GLOBAL-02, R2, R9). La representación visual, las alertas y el formato a dos decimales corresponden a C-12; este change no las implementa.

#### Scenario: Consumo por la API

- **WHEN** un handler responde `GET /api/ops/:id`
- **THEN** los campos de rentabilidad son exactamente los del DTO del dominio y no hay cálculo adicional en el adaptador HTTP

#### Scenario: Consumo por el espejo del cliente

- **WHEN** el frontend valida una respuesta con comparativa y margen
- **THEN** el esquema Zod los acepta sin completarlos con valores por defecto y sin definir una segunda versión de las reglas

#### Scenario: Sin cálculo en React

- **WHEN** un componente posterior (C-12) renderiza el detalle
- **THEN** muestra los valores del DTO y no importa funciones de horas ni de margen ni compara importes por su cuenta

#### Scenario: Contrato compartido

- **WHEN** backend y frontend necesitan los tipos nuevos
- **THEN** ambos los importan desde `packages/domain` o los espejan con `z.infer`, sin definiciones duplicadas ni `any` (R9)

