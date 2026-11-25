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

