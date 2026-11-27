# modelo-planilla-compartido Specification

## Purpose
TBD - created by archiving change desvios-y-margen-domain. Update Purpose after archive.
## Requirements
### Requirement: Modelo de planilla puro compartido por ambas variantes de exportOp

`packages/domain/src/exportacion/` DEBE (SHALL) exponer `construirModeloPlanilla`, una función pura que produzca un único modelo de datos a partir de la OP, sus derivados y la tasa global inyectada, y cuyo resultado sea una unión discriminada por `incluirMargenes`: `{ variante: 'costeo', ... }` cuando es `true` y `{ variante: 'operativa', ... }` cuando es `false`. Ambos adaptadores de exportación DEBEN (SHALL) consumir el mismo modelo; la variante operativa NO DEBE (SHALL NOT) contener `margen`, costos ni ningún otro dato de rentabilidad comercial (RN-EXPORT-05, RN-EXPORT-06, RN-EXPORT-04, DD-08).

#### Scenario: Variante de costeo

- **WHEN** se construye el modelo con `incluirMargenes: true`
- **THEN** el resultado tiene `variante: 'costeo'` e incluye cliente, número de OP, materiales, horas vendidas y reales, valor hora, comparativa de costos cotizados vs. reales y margen real

#### Scenario: Variante operativa

- **WHEN** se construye el mismo modelo con `incluirMargenes: false`
- **THEN** el resultado tiene `variante: 'operativa'`, conserva datos operativos y de horas, y no contiene `margen`, costos ni importes de rentabilidad (RN-EXPORT-04, HU-20B)

#### Scenario: Un solo modelo para dos adaptadores

- **WHEN** se comparan las entradas de `exportCosteo` y `exportOpSinMargenes`
- **THEN** ambas derivan del mismo constructor del dominio y no existe un segundo MAP de entidades a celdas en los adaptadores (RN-GLOBAL-02)

#### Scenario: Derivados ya calculados

- **WHEN** se construye el modelo
- **THEN** todos sus valores numéricos provienen de las funciones puras de horas y margen de `packages/domain`, sin sumar ni comparar por su cuenta en el constructor

### Requirement: Claves semánticas sin acceso a archivos ni a librerías de Excel

El modelo DEBE (SHALL) expresar sus datos mediante claves semánticas (`cliente`, `numeroOp`, `materiales`, `horasVendidas`, `horasReales`, `valorHora`, `comparativa`) y NO DEBE (SHALL NOT) contener `Buffer`, rutas de archivo, acceso a `fs`, literales de celdas ni importaciones de `exceljs`, Fastify, Prisma o React (R2, R6, DD-02, DD-08). El mapeo a rangos concretos de las plantillas oficiales queda en C-14/C-15, después de cerrar C-13/IN-08.

#### Scenario: Modelo sin efectos de filesystem

- **WHEN** se ejecuta `construirModeloPlanilla` en un entorno sin plantillas `.xlsx` ni variable `EXCEL_TEMPLATES_DIR`
- **THEN** el modelo se construye igual, sin leer ni crear archivos y sin generar un workbook improvisado (RN-EXPORT-02)

#### Scenario: Sin rangos de celda hardcodeados

- **WHEN** se inspecciona el modelo
- **THEN** no aparece `O7:R8`, `J7:N8` ni otra referencia literal de celda; el `ID Plano` viaja como dato semántico y su mapeo se resuelve en C-15 tras C-13 (DD-11)

#### Scenario: Compilación aislada del dominio

- **WHEN** se eliminan todos los adaptadores `backend/src/features/*/{http,prisma,excel}` y se compila `packages/domain`
- **THEN** la compilación finaliza correctamente y el modelo sigue disponible desde el barrel del paquete (R2)

#### Scenario: Decimales exactos en el modelo

- **WHEN** se inspeccionan los importes del modelo
- **THEN** todos son cadenas decimales exactas y no hay `number`, `parseFloat` ni redondeo a dos decimales dentro del dominio (RN-MARGEN-05, R9)

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

