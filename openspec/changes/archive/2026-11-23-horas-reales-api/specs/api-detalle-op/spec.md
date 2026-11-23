## MODIFIED Requirements

### Requirement: Colecciones de horas y materiales en el contrato de detalle

El `DetalleOpDTO` DEBE (SHALL) exponer las colecciones `horas` y `materiales` que HU-14/15/16 consumen. A partir de C-06, `materiales` devuelve los ítems reales de `materiales_orden`; a partir de C-08, `horas` DEBE (SHALL) devolver los partes reales de `registros_horas` como `ParteHoraDTO[]`, en lugar del arreglo vacío tipado que C-04 y C-06 documentaron como pendiente. Los derivados `horasRealesTotales`, `desvioHoras`, `porcentajeConsumo` y `alertaDesvio` DEBEN (SHALL) viajar como campos hermanos de `horas`, calculados en dominio (P-2, confirmado el 2026-11-22, R3). El backend NO DEBE (SHALL NOT) inventar valores ni persistir agregados para completarlas (OQ-3, R3).

#### Scenario: Colecciones completas después de C-08

- **WHEN** se inspecciona el detalle de una OP con etapas, materiales y partes de horas cargados
- **THEN** `materiales` contiene los ítems reales y `horas` contiene los partes reales, sin valores de ejemplo ni marcadores de "pendiente"

#### Scenario: Forma del contrato de horas

- **WHEN** se inspecciona el detalle de una OP después de C-08
- **THEN** `horas` es un arreglo de `ParteHoraDTO` y los cuatro derivados viajan como campos hermanos, sin envolverlos en un objeto `{ partes, totales }` (P-2)

#### Scenario: Totales calculados, nunca escritos

- **WHEN** se construye el detalle con partes imputados
- **THEN** los derivados de horas se calculan con las funciones puras de dominio y no se escriben en base de datos (R3)

#### Scenario: Sin datos inventados

- **WHEN** una OP no tiene partes ni materiales
- **THEN** ambas colecciones son arreglos vacíos y el total de horas reales es cero, sin rellenarlas con datos ficticios

### Requirement: Detalle con plano y materiales reales a partir de C-06

A partir de C-06, `GET /api/ops/:id` DEBE (SHALL) devolver `codigoPlano: string | null` heredado de `TarjetaOrdenDTO` y `materiales` con los ítems reales de `materiales_orden`, reemplazando el arreglo vacío provisional que C-04 documentó como pendiente de este change. A partir de C-08, el campo `horas` DEBE (SHALL) contener los partes reales de `registros_horas` como `ParteHoraDTO[]`, cada uno con `observacion` opcional (`string | null`, P-1), reemplazando el arreglo vacío tipado que C-06 mantuvo hasta este cambio, sin datos inventados ni agregados persistidos (DD-11, DD-05, R3).

#### Scenario: Detalle con plano y materiales

- **WHEN** se consulta el detalle de una OP con `codigo_plano = 'PL-2026-045'` y dos materiales
- **THEN** la respuesta incluye `codigoPlano: 'PL-2026-045'` y `materiales` con esos dos ítems, con descripción, tipo, cantidades y costos

#### Scenario: Detalle sin plano ni materiales

- **WHEN** se consulta el detalle de una OP sin plano y sin materiales
- **THEN** `codigoPlano` es `null`, `materiales` es un arreglo vacío y los agregados son cero, sin valores de ejemplo

#### Scenario: Horas reales disponibles

- **WHEN** se consulta el detalle después de C-08 para una OP con partes imputados
- **THEN** `horas` contiene esos partes con `id`, `etapaId` nullable, `operario`, `fecha`, `horas` como cadena decimal, `createdAt` y `observacion` como texto o `null`, además de los cuatro derivados hermanos calculados en dominio, y Swagger ya no indica que se completará en C-08 (P-1, P-2)

#### Scenario: Agregados derivados en el detalle

- **WHEN** se inspeccionan los costos del detalle
- **THEN** `costo_materiales_cotizado` y `costo_materiales_real` son calculados en dominio desde los materiales, no leídos de columnas de `ordenes_trabajo` (R3)

## ADDED Requirements

### Requirement: Contrato Zod del detalle con horas reales

`DetalleOpSchema` DEBE (SHALL) tipar `horas` con un arreglo de esquemas de parte (`ParteHoraSchema`) en lugar de `z.array(z.never())`, manteniendo `z.infer`/`z.toJSONSchema` y la generación de JSON Schema para Swagger. `ParteHoraSchema` DEBE (SHALL) incluir `observacion` opcional (P-1) y `DetalleOpSchema` DEBE (SHALL) exponer `horasRealesTotales`, `desvioHoras`, `porcentajeConsumo` y `alertaDesvio` como campos hermanos calculados en dominio (P-2). El esquema NO DEBE (SHALL NOT) aceptar campos derivados editables en las peticiones, y el handler NO DEBE (SHALL NOT) calcular totales ni desvíos al construir la respuesta (R3, R9, RN-GLOBAL-02).

#### Scenario: Validación de una respuesta real

- **WHEN** se valida con `DetalleOpSchema` una respuesta de `GET /api/ops/:id` que contiene partes de horas
- **THEN** el esquema acepta cada parte con sus campos tipados y expone el JSON Schema correspondiente en Swagger

#### Scenario: Parte con observacion y derivados hermanos

- **WHEN** se valida con `DetalleOpSchema` una respuesta con un parte que tiene `observacion: 'Revisar tornillería'`
- **THEN** el esquema acepta el texto y los cuatro derivados hermanos como campos calculados, sin aceptarlos como entrada (P-1, P-2)

#### Scenario: Sin descripción pendiente de C-08

- **WHEN** se inspecciona la documentación Swagger generada
- **THEN** el campo `horas` ya no se documenta como arreglo vacío pendiente de C-08

#### Scenario: Derivados no editables

- **WHEN** se inspeccionan los esquemas de request del detalle y de horas
- **THEN** ninguno acepta `horasTotales`, `desvio`, `consumo` ni `alerta` como campos de entrada

#### Scenario: Tipado estricto

- **WHEN** se ejecuta el typecheck del backend
- **THEN** `readonly never[]` desaparece de `DetalleOpDTO` y no aparece `any` en los esquemas nuevos (R9)
