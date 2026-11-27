# costos-y-margen-real Specification

## Purpose
TBD - created by archiving change desvios-y-margen-domain. Update Purpose after archive.
## Requirements
### Requirement: Costo material real con fallback por ítem

`packages/domain/src/margen/` DEBE (SHALL) exponer `costoMaterialReal`, una función pura que para cada ítem de `materiales_orden` calcule `cantidad × COALESCE(costo_unitario_real, costo_unitario_cotizado)` y devuelva la suma exacta de todos los ítems. El agregado NO DEBE (SHALL NOT) leerse de ninguna columna persistida ni escribirse en PostgreSQL (RN-MARGEN-02, DD-05, R3).

#### Scenario: Ítem con costo real y ítem sin costo real

- **WHEN** un ítem tiene cantidad `2.0000`, costo real `10.50` y cotizado `9.00`, y otro tiene cantidad `3.0000`, costo real `null` y cotizado `4.25`
- **THEN** el costo material real es `33.75`, usando `10.50` para el primero y `4.25` para el segundo por `COALESCE` por ítem (RN-MARGEN-02)

#### Scenario: Todos los ítems sin costo real

- **WHEN** ningún ítem tiene `costo_unitario_real`
- **THEN** el costo material real equivale al costo material cotizado calculado con los mismos importes cotizados

#### Scenario: Sin materiales

- **WHEN** la OP no tiene materiales cargados
- **THEN** el costo material real y el cotizado son `0.00`, sin `null` ni excepciones

#### Scenario: Sin agregados persistidos

- **WHEN** se inspecciona el esquema Prisma y las migraciones
- **THEN** no existen columnas de costo material real ni cotizado en `ordenes_trabajo` (R3, DD-05)

### Requirement: Costo material cotizado como agregado derivado

El dominio DEBE (SHALL) calcular `costoMaterialesCotizado` como `Σ (cantidad × costo_unitario_cotizado)` sobre los mismos ítems, con el mismo tipo decimal exacto que el costo real y sin redondeo comercial intermedio (RN-MARGEN-03, RN-MARGEN-05).

#### Scenario: Cotizado distinto del real

- **WHEN** los mismos ítems del escenario anterior se evalúan solo con costos cotizados
- **THEN** el costo cotizado es `30.75`, distinto del real `33.75`, y ambos viajan como cadenas decimales exactas

#### Scenario: Cantidad con cuatro decimales

- **WHEN** un ítem tiene cantidad `1.2345` y costo cotizado `10.00`
- **THEN** el producto es `12.3450` exacto, sin conversión a coma flotante ni redondeo a dos decimales en el dominio (SU-02, RN-MARGEN-05)

### Requirement: Margen real con tasa global inyectada

`packages/domain/src/margen/` DEBE (SHALL) exponer `margenReal`, una función pura que reciba `montoVendido`, `horasRealesTotales`, `costoMaterialesReal` y `valorHoraEstandar` como cadena decimal exacta, y devuelva `montoVendido - (horasRealesTotales × valorHoraEstandar) - costoMaterialesReal`. La tasa DEBE (SHALL) inyectarse desde `ContextoTarjeta.valorHoraEstandar`, sin leer PostgreSQL, sin importar adaptadores y sin guardar instantáneas ni recalcular históricos en base de datos (RN-MARGEN-01, RN-MARGEN-04, DD-04, IN-02, R2, R3).

#### Scenario: Margen positivo con tasa configurada

- **WHEN** el monto vendido es `1000.00`, las horas reales `40.00`, la tasa `12.50` y el costo material real `100.00`
- **THEN** el margen real es `400.00` (`1000.00 - 500.00 - 100.00`), como cadena decimal exacta

#### Scenario: Margen negativo

- **WHEN** el monto vendido es `500.00`, las horas reales `40.00`, la tasa `12.50` y el costo material real `33.75`
- **THEN** el margen real es `-33.75`, sin lanzar excepciones ni convertirlo en cero

#### Scenario: Tasa global cero

- **WHEN** `valorHoraEstandar` es `0.00` con horas reales imputadas
- **THEN** el margen real es `montoVendido - costoMaterialesReal`, no es `null` y `tasaGlobalNoConfigurada` devuelve `true` para que C-12 muestre la advertencia del Flujo 5 (RN-CONFIG-01)

#### Scenario: Tasa global vigente inyectada

- **WHEN** se guarda `valorHoraEstandar: "2000.00"` y se calcula el margen de una OP con la tasa recibida del contexto vigente
- **THEN** el resultado usa exactamente `2000.00` sin consultar la fila de configuración desde el dominio ni persistir copia alguna (DD-04, IN-02)

#### Scenario: Tasa por etapa diferida

- **WHEN** una etapa expone un costo unitario propio en la plantilla oficial
- **THEN** C-11 lo ignora y aplica la única tasa global inyectada; la evolución a tarifas por etapa o categoría permanece diferida a Fase 2 (DD-04, IN-02)

### Requirement: Aritmética decimal exacta sin redondeo comercial en el dominio

Todas las funciones de esta capability DEBEN (SHALL) usar el tipo `Decimal` de `packages/domain/src/decimal/` y operaciones exactas sobre `bigint`; NO DEBEN (SHALL NOT) usar `number`, `parseFloat`, `toNumber`, `Math.round` ni `toFixed`. El redondeo a dos decimales DEBE (SHALL) quedar exclusivamente en la presentación (C-12) y en la exportación (C-14/C-15) (RN-MARGEN-05, R9).

#### Scenario: Producto exacto sin redondeo

- **WHEN** se multiplican horas `3.25` por tasa `10.10`
- **THEN** el resultado es `32.8250` exacto en el dominio y el redondeo a importes se aplica solo al mostrar o exportar

#### Scenario: Tipo estricto sin `any`

- **WHEN** se ejecuta el typecheck de `packages/domain`
- **THEN** no hay errores ni apariciones de `any` en las firmas de costos ni de margen (R9)

### Requirement: Redondeo comercial exclusivo en la exportación de costeo

Los valores exactos producidos por `costoMaterialReal`, `costoMaterialesCotizado` y `margenReal` DEBEN (SHALL) viajar sin redondeo hasta el MAP de exportación, donde se convierten a cadenas de escala 2 con la regla comercial acordada antes de escribir la celda de la hoja `1`. La conversión DEBE (SHALL) usar operaciones exactas sobre `bigint` del módulo decimal y NO DEBE (SHALL NOT) modificar el modelo ni persistir el valor redondeado (RN-MARGEN-05, R3, R9). La comparativa de márgenes vive en `GENERAL` y Velco la completa MANUALMENTE fuera del alcance automatizado; la exportación automática NO DEBE (SHALL NOT) escribir márgenes en `xl/worksheets/sheet2.xml`.

#### Scenario: Producto exacto redondeado solo al exportar

- **WHEN** el dominio produce `32.8250` como costo de horas y el MAP lo convierte para una celda de importe
- **THEN** el modelo sigue conteniendo `32.8250` y la celda recibe `32.83` con escala 2

#### Scenario: Margen negativo conservado en el modelo

- **WHEN** el margen real es `-33.75`
- **THEN** el modelo y la comparativa conservan `-33.75`, sin convertirlo en cero ni perder el signo, y la exportación automatizada no escribe margen en la hoja `1`; `GENERAL` se completa manualmente

#### Scenario: Sin derivados persistidos

- **WHEN** se inspeccionan el esquema Prisma y las migraciones después del change
- **THEN** no existen columnas de importes redondeados, costos ni márgenes calculados en `ordenes_trabajo`

