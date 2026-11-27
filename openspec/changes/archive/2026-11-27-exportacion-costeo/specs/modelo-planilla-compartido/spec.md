## ADDED Requirements

### Requirement: Contrato de MAP único para las dos variantes de exportación

El MAP de C-14 DEBE (SHALL) consumir únicamente claves semánticas del `ModeloPlanilla` de `packages/domain/src/exportacion/` y NO DEBE (SHALL NOT) introducir un segundo constructor, un segundo cálculo de derivados ni una rama de negocio en el adaptador. La variante de costeo y la futura variante operativa de C-15 DEBEN (SHALL) derivar del mismo `construirModeloPlanilla` y solo traducir, cada una, las claves a su plantilla oficial (RN-GLOBAL-02, RN-EXPORT-05/06, DD-08).

#### Scenario: Mismo modelo, dos adaptadores

- **WHEN** se construyen las entradas de `exportCosteo` y de la futura `exportOpSinMargenes` con la misma OP
- **THEN** ambas consumen `construirModeloPlanilla` y no existe una segunda implementación del MAP semántico en los adaptadores

#### Scenario: Variante operativa sin rentabilidad

- **WHEN** se construye el modelo con `incluirMargenes: false` para el contrato compartido
- **THEN** el resultado no contiene `margen`, costos ni importes de rentabilidad, aunque C-14 no implemente su adaptador (RN-EXPORT-04)

#### Scenario: Sin literales de celda en el modelo

- **WHEN** se inspecciona el modelo consumido por el MAP
- **THEN** no aparecen `O7`, `O7:R8`, `J7:N8` ni otras referencias de celda; el MAP de plano queda reservado a C-15 (DD-11)

### Requirement: Datos semánticos `tipo` y `unidad` para los tres bloques de materiales

`MaterialModeloPlanilla` y `EntradaModeloPlanilla` DEBEN (SHALL) transportar `tipo` y `unidad` como datos semánticos ya existentes en `MaterialOrden` y en `materiales_orden`, sin migración de esquema. `tipo` DEBE (SHALL) identificar uno de `INSUMOS`/`MP`/`TERCERIZADOS` y `unidad` DEBE (SHALL) conservar el texto de unidad o `null`; `mapearModeloACeldas` DEBE (SHALL) usarlos para resolver el bloque y la clave `UN`, sin literales de celda en el dominio (R2, R6, R9). Los tres tipos comparten el único bloque `B38:R59` de la hoja `1`: el MAP DEBE (SHALL) anteponer `[MP]` / `[INSUMOS]` / `[TERCERIZADOS]` a la descripción, con un material por fila y sin inserciones estructurales. `TOTAL horas` DEBE (SHALL) recibir solo `horasReales`; `horasVendidas` DEBE (SHALL) permanecer en el modelo semántico y en la comparativa, sin escritura en la hoja de costeo.

#### Scenario: Tres bloques con tipo y unidad

- **WHEN** el modelo contiene materiales de `INSUMOS`, `MP` y `TERCERIZADOS` con unidad declarada
- **THEN** el MAP conserva `tipo` y `unidad` como datos semánticos, antepone `[MP]` / `[INSUMOS]` / `[TERCERIZADOS]` a la descripción en `B38:R59`, un material por fila, y traduce `unidad` a la clave `UN` justificada en `inventario-celdas.md`

#### Scenario: Unidad nula

- **WHEN** un material tiene `unidad: null`
- **THEN** el MAP no inventa una unidad ni altera la cantidad o el costo del material

#### Scenario: Dominio sin direcciones de celda

- **WHEN** se inspecciona el modelo compartido y el paquete `packages/domain/`
- **THEN** `tipo` y `unidad` aparecen como datos semánticos y no como referencias de celda ni literales del adaptador

### Requirement: Frontera de exportación para decimales exactos

La conversión del modelo a valores de celda DEBE (SHALL) realizarse solo en el adaptador, usando operaciones exactas sobre `bigint` del módulo `packages/domain/src/decimal/` y una única regla de redondeo comercial a escala 2 para importes; las cantidades de materiales DEBEN (SHALL) conservar hasta escala 4. El sistema NO DEBE (SHALL NOT) usar `number`, `parseFloat`, `toNumber`, `Math.round` ni `toFixed` en esta conversión ni redondear dentro del dominio (RN-MARGEN-05, SU-02, R9).

#### Scenario: Importe con más de dos decimales

- **WHEN** el modelo contiene un importe exacto con más de dos decimales
- **THEN** la celda de exportación recibe una cadena redondeada a dos decimales con la regla acordada, sin modificar el valor del modelo

#### Scenario: Cantidad con cuatro decimales

- **WHEN** un material tiene cantidad `1.2345`
- **THEN** el MAP conserva los cuatro decimales en la celda de cantidad y no los convierte a coma flotante

#### Scenario: Tipado estricto

- **WHEN** se ejecuta el typecheck del dominio y del adaptador de exportación
- **THEN** no hay errores ni apariciones de `any` en las firmas del modelo ni del MAP
