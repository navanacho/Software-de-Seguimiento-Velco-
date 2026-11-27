# exportacion-costeo-op Specification

## Purpose
TBD - created by archiving change exportacion-costeo. Update Purpose after archive.
## Requirements
### Requirement: Caso de uso `exportOp` con variante de costeo

El backend DEBE (SHALL) exponer el caso de uso `exportOp(opId, { incluirMargenes })` que carga la OP, sus etapas, horas, materiales, cliente y tasa global vigente mediante los puertos existentes y construye el modelo de costeo exclusivamente con `construirModeloPlanilla` del dominio. Con `incluirMargenes: true`, el resultado DEBE (SHALL) contener cliente, número de OP, bloques `INSUMOS`/`MP`/`TERCERIZADOS` con `UN`/`COST. UNIT.`/`COSTO TOTAL`, `horasReales` y `horasVendidas` como datos semánticos, valor hora y comparativa de márgenes. Cada material DEBE (SHALL) conservar su `tipo` y su `unidad`, ya presentes en `MaterialOrden`, como datos semánticos para el bloque y la columna `UN`. El caso de uso NO DEBE (SHALL NOT) calcular derivados propios ni persistirlos (RN-EXPORT-03/05, RN-MARGEN-05, R3, DD-08).

#### Scenario: Variante de costeo con datos cargados

- **WHEN** se invoca `exportOp` con `incluirMargenes: true` para una OP con etapas, horas y materiales reales
- **THEN** el modelo devuelto tiene `variante: 'costeo'` y todos sus importes y horas provienen de las funciones puras de `packages/domain`, sin agregados escritos en PostgreSQL

#### Scenario: OP inexistente

- **WHEN** se invoca `exportOp` con un `opId` que no existe
- **THEN** el caso de uso devuelve `null` sin construir modelo ni leer plantilla, y el endpoint responde 404

#### Scenario: Sin tasa global configurada

- **WHEN** la tasa global inyectada es `0.00`
- **THEN** el margen del modelo sigue siendo un `Decimal` exacto calculado por el dominio y la exportación no inventa una tarifa por etapa (DD-04, IN-02)

### Requirement: MAP puro de entidades a celdas en el adaptador de costeo

`backend/src/features/exportacion/excel/` DEBE (SHALL) exponer `mapearModeloACeldas`, una función pura que traduce las claves semánticas del modelo a un `Record` de celdas gobernadas de `MASTER COSTEO NUEVO.xlsx`, convirtiendo importes a cadenas decimales de escala 2 y conservando cantidades hasta escala 4. El MAP DEBE (SHALL) escribir solo en `xl/worksheets/sheet2.xml` (hoja `1`): `C7:R7` transporta `numeroOp` aunque la etiqueta impresa diga `Descripción:`; `TOTAL horas` recibe exclusivamente `horasReales`, deducido de `P13=SUM(I13:O13)*H13` y `R13=Q13*P13`; `horasVendidas` permanece en el modelo semántico y en la comparativa y NO DEBE (SHALL NOT) escribirse en la hoja de costeo. Los tres tipos comparten el bloque único `B38:R59`: el MAP DEBE (SHALL) anteponer `[MP]` / `[INSUMOS]` / `[TERCERIZADOS]` a la descripción, un material por fila, sin inserciones estructurales; `tipo` y `unidad` viajan semánticamente y `unidad` alimenta `UN`. Las hojas `2`..`5` y `GENERAL` NO DEBEN (SHALL NOT) modificarse y su llenado por Velco es un paso MANUAL documentado, no un fallo CRITICAL de la compuerta automática. La función NO DEBE (SHALL NOT) leer archivos, importar Fastify, Prisma o React, escribir en base de datos ni devolver un `Buffer`; las referencias de celda NO DEBEN (SHALL NOT) aparecer en `packages/domain/` (R2, R6, R9, RN-MARGEN-05).

#### Scenario: MAP determinista

- **WHEN** se llama dos veces `mapearModeloACeldas` con el mismo modelo
- **THEN** ambos resultados son iguales y no contienen rutas de archivo, `Buffer` ni referencias a `EXCEL_TEMPLATES_DIR`

#### Scenario: Bloques económicos completos en la hoja 1

- **WHEN** se inspecciona el resultado del MAP para una OP con materiales de los tres tipos
- **THEN** constan cliente, `numeroOp` en `C7:R7`, descripciones con `[MP]` / `[INSUMOS]` / `[TERCERIZADOS]` en `B38:R59` con `tipo` y `unidad`, `UN`/`COST. UNIT.`/`COSTO TOTAL`, `horasReales` en `TOTAL horas`, `horasVendidas` solo en modelo/comparativa, valor hora y comparativa de márgenes, cada uno asociado a una celda declarada de `xl/worksheets/sheet2.xml`

#### Scenario: Hojas no automatizadas

- **WHEN** se solicita la exportación con las hojas `2`..`5` o `GENERAL` sin completar
- **THEN** el MAP no escribe en esas piezas, Velco las completa manualmente después de la descarga y la compuerta automática no declara un fallo CRITICAL por ese motivo

#### Scenario: Aislamiento del dominio

- **WHEN** se eliminan todos los adaptadores `backend/src/features/*/{http,prisma,excel}` y se compila `packages/domain`
- **THEN** la compilación finaliza correctamente y el modelo semántico sigue disponible sin referencias a celdas ni a `exceljs`

### Requirement: Descarga y endpoint de la variante de costeo

El backend DEBE (SHALL) exponer `GET /api/ops/:id/export?variante=costeo`, validar `params` y `querystring` con Zod, responder 200 con el `.xlsx` y fijar `Content-Disposition: COSTEO_[NroOP]_[Cliente].xlsx` con el nombre saneado del cliente. La respuesta NO DEBE (SHALL NOT) incluir rutas del servidor ni la UNC histórica (RN-EXPORT-01, Flujo 6, R5).

#### Scenario: Descarga correcta

- **WHEN** se solicita la variante `costeo` para una OP existente con la plantilla disponible
- **THEN** la respuesta es 200, el cuerpo es un `Buffer` de `.xlsx` y `Content-Disposition` usa el prefijo `COSTEO_` con el número de OP y el cliente saneados

#### Scenario: Variante inválida

- **WHEN** se solicita `GET /api/ops/:id/export?variante=op` en este change
- **THEN** la validación responde 422 y no se genera ningún archivo; la variante operativa pertenece a C-15

#### Scenario: Sin autenticación

- **WHEN** se inspecciona la ruta y el esquema de la API
- **THEN** no hay middleware de auth, PIN ni RBAC y la ruta es accesible al único usuario del MVP (R5)

