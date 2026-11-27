## ADDED Requirements

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
