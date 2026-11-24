# configuracion-global-api Specification

## Purpose
TBD - created by archiving change configuracion-global. Update Purpose after archive.
## Requirements
### Requirement: Singleton de configuración consultable y actualizable

La API DEBE (SHALL) exponer `GET /api/configuracion` y `PUT /api/configuracion` sobre la única fila `configuracion.id = 1`. `GET` DEBE (SHALL) responder con `id: 1`, `valorHoraEstandar`, `diasAlertaRiesgo`, `porcentajeAvanceRiesgo` y `etapasDefault`. `PUT` DEBE (SHALL) aceptar el cuerpo **sin `id`** —`valorHoraEstandar`, `diasAlertaRiesgo`, `porcentajeAvanceRiesgo` y `etapasDefault`—, aplicar el reemplazo sobre la fila `id = 1` y NO DEBE (SHALL NOT) crear filas adicionales ni exponer operaciones de alta o baja del singleton; un cuerpo con `id` extra se rechaza con `422` por `.strict()`. La respuesta del `GET` sí incluye `id` fijo 1 (HU-18, RN-CONFIG-01/03, Flujo 7).

#### Scenario: Lectura de la fila sembrada

- **WHEN** se llama `GET /api/configuracion` sobre una base con la semilla de C-01
- **THEN** la respuesta devuelve `id: 1`, `valorHoraEstandar: "0.00"`, `diasAlertaRiesgo: 3`, `porcentajeAvanceRiesgo: 80` y las cinco etapas canónicas

#### Scenario: Actualización y relectura

- **WHEN** se envía `PUT /api/configuracion` sin `id` en el cuerpo, con `valorHoraEstandar: "1250.50"`, `diasAlertaRiesgo: 5`, `porcentajeAvanceRiesgo: 60` y una plantilla propia
- **THEN** el `GET` posterior devuelve `id: 1` y exactamente esos valores normalizados

#### Scenario: Singleton sin duplicados

- **WHEN** se actualiza la configuración varias veces y se consulta la tabla en PostgreSQL real
- **THEN** existe una única fila con `id = 1` y ninguna operación HTTP crea otra

#### Scenario: Cuerpo con id rechazado

- **WHEN** se envía `PUT /api/configuracion` con `id: 1` además de los parámetros válidos
- **THEN** la API responde `422` con un error asociado a `id` y no modifica la fila

### Requirement: Validación de rangos en la frontera HTTP

La API DEBE (SHALL) rechazar con `422` y errores por campo cualquier valor de `valorHoraEstandar` menor que cero, `diasAlertaRiesgo` menor que cero, `porcentajeAvanceRiesgo` fuera de `[0, 100]`, tipo distinto del declarado o cadena decimal con más de dos decimales. Los límites `0` y `100` DEBEN (SHALL) aceptarse (Flujo 7, RN-CONFIG-02, RN-MARGEN-05, R9).

#### Scenario: Valor hora negativo

- **WHEN** se envía `valorHoraEstandar: "-1.00"`
- **THEN** la API responde `422` con un error asociado a `valorHoraEstandar` y no modifica la fila

#### Scenario: Porcentaje fuera de rango

- **WHEN** se envía `porcentajeAvanceRiesgo: 101`
- **THEN** la API responde `422` con un error asociado a `porcentajeAvanceRiesgo` y no modifica la fila

#### Scenario: Límites aceptados

- **WHEN** se envían `diasAlertaRiesgo: 0`, `porcentajeAvanceRiesgo: 100` y `valorHoraEstandar: "0.00"`
- **THEN** la API responde `200` y persiste esos valores

#### Scenario: Tipo incorrecto

- **WHEN** se envía `diasAlertaRiesgo: "tres"` o `valorHoraEstandar: 12.5` como número JSON
- **THEN** la API responde `422` sin invocar la escritura en PostgreSQL

### Requirement: Plantilla de etapas editable y validada

`etapasDefault` DEBE (SHALL) aceptar una colección de al menos un nombre de texto libre, con `trim()` no vacío, longitud máxima de 100 caracteres y unicidad sin distinguir mayúsculas. La API DEBE (SHALL) normalizar los nombres con `trim()` antes de persistir y NO DEBE (SHALL NOT) limitarlos a los cinco nombres canónicos, que permanecen como semilla y fallback (HU-18, RN-ETAPA-02/03, RN-CONFIG-02).

#### Scenario: Plantilla no canónica persistida

- **WHEN** se envía `etapasDefault: ["Corte", "Plegado", "Control", "Entrega"]`
- **THEN** la API responde `200` y el `GET` devuelve esa plantilla en el mismo orden

#### Scenario: Nombres duplicados por mayúsculas

- **WHEN** se envía `etapasDefault: ["Corte", "CORTE"]`
- **THEN** la API responde `422` con un error asociado a `etapasDefault`

#### Scenario: Plantilla vacía o nombre vacío

- **WHEN** se envía `etapasDefault: []` o `["Corte", "  "]`
- **THEN** la API responde `422` y no modifica la fila

### Requirement: Decimal exacto en la frontera de configuración

Los importes de configuración DEBEN (SHALL) viajar en HTTP como cadenas decimales de hasta dos decimales; el adaptador DEBE (SHALL) convertirlas desde y hacia `Prisma.Decimal` sin `number`, `parseFloat`, `toNumber()` ni coma flotante (RN-MARGEN-05, R9).

#### Scenario: Escritura con dos decimales

- **WHEN** se envía `valorHoraEstandar: "1250.50"`
- **THEN** la columna `valor_hora_estandar` almacena `1250.50` en `NUMERIC(12,2)` y la lectura devuelve `"1250.50"`

#### Scenario: Exceso de decimales

- **WHEN** se envía `valorHoraEstandar: "12.345"`
- **THEN** la API responde `422` antes de escribir en PostgreSQL
