# avance-y-flujo-etapas Specification

## Purpose
TBD - created by archiving change estado-y-avance-domain. Update Purpose after archive.
## Requirements
### Requirement: Avance derivado del checklist de etapas

El dominio DEBE (SHALL) calcular `porcentaje_avance` como `Math.round(100 * etapas_completadas / total_etapas)` a partir de `EtapaOrden.completada`, sin persistirlo ni permitir edición manual. Con cero etapas el avance DEBE ser `0`; con todas las etapas completadas DEBE ser `100`. El cálculo DEBE ser una función pura que no lance excepciones por datos incompletos (RN-AVANCE-01, RN-AVANCE-02, RN-GLOBAL-03, DD-03).

#### Scenario: Avance parcial

- **WHEN** una OP tiene 5 etapas y 2 están completadas
- **THEN** `calcularAvance` devuelve `40`

#### Scenario: Redondeo a entero

- **WHEN** una OP tiene 3 etapas y 1 está completada
- **THEN** `calcularAvance` devuelve `33` según redondeo a entero, nunca un valor decimal ni `33.333...`

#### Scenario: OP sin etapas

- **WHEN** una OP tiene una lista vacía de etapas
- **THEN** `calcularAvance` devuelve `0` y no se lanza ninguna excepción

#### Scenario: Todas las etapas completadas

- **WHEN** todas las etapas de una OP están completadas
- **THEN** `calcularAvance` devuelve `100` sin que exista un valor almacenado ni un slider que lo modifique

### Requirement: Etapa actual "ahora" determinista

El dominio DEBE (SHALL) resolver la etapa `ahora` como la primera etapa con `completada = false` ordenada por `orden_secuencia`, con independencia del orden físico del arreglo recibido. Cuando no quedan etapas pendientes, el estado DEBE ser `Todo listo` (RN-AHORA-01).

#### Scenario: Primera pendiente por secuencia

- **WHEN** las etapas tienen secuencias 1, 2 y 3 y la secuencia 1 está completada
- **THEN** `etapaAhora` devuelve la etapa de secuencia 2

#### Scenario: Arreglo desordenado

- **WHEN** el arreglo de etapas llega con las secuencias 3, 1 y 2 y solo la 1 está completada
- **THEN** `etapaAhora` devuelve la etapa de secuencia 2, no la primera del arreglo

#### Scenario: Sin pendientes

- **WHEN** todas las etapas están completadas
- **THEN** `etapaAhora` devuelve `Todo listo` y ninguna etapa recibe el badge `ahora`

### Requirement: Conteo de flujo por etapa activa

El dominio DEBE (SHALL) agrupar las órdenes activas por el nombre de su etapa `ahora` y devolver un arreglo ordenado de `{ etapa, cantidad }`. NO DEBEN contarse las OPs terminadas ni las que no tienen etapas, y el orden del resultado DEBE ser estable entre ejecuciones (RN-FLujo-01, HU-06).

#### Scenario: Agrupar dos OPs en la misma etapa

- **WHEN** dos OPs activas tienen como etapa `ahora` `Soldadura` y una tiene `Pintura`
- **THEN** el agrupamiento contiene `{ etapa: "Soldadura", cantidad: 2 }` y `{ etapa: "Pintura", cantidad: 1 }`

#### Scenario: Excluir OP terminada

- **WHEN** una OP tiene el 100% de avance y su etapa `ahora` sería `Todo listo`
- **THEN** esa OP no aparece en ningún grupo del flujo

#### Scenario: Excluir OP sin etapas

- **WHEN** una OP no tiene etapas
- **THEN** esa OP no aparece en ningún grupo del flujo y no se crea un grupo `Todo listo`

#### Scenario: Orden estable

- **WHEN** se invoca dos veces `agruparFlujo` con las mismas OPs en distinto orden de entrada
- **THEN** ambos resultados tienen el mismo orden de etapas

