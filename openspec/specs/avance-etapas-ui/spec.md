# avance-etapas-ui Specification

## Purpose
TBD - created by archiving change tablero-visual. Update Purpose after archive.
## Requirements
### Requirement: Alternar completada con actualización optimista

El checkbox de cada etapa DEBE (SHALL) invertir optimistamente el campo `completada` en la caché y enviar `PATCH /api/ops/:id/etapas/:etapaId` con un body `{ completada: boolean }`. La tarjeta DEBE (SHALL) repintarse con el `TarjetaOrdenDTO` devuelto por el servidor, sin calcular derivados en el cliente (HU-07, Flujo 3, RN-AVANCE-01, RN-AVANCE-02, RN-GLOBAL-02).

#### Scenario: Tildar una etapa

- **WHEN** el usuario tilda el checkbox de una etapa pendiente
- **THEN** el checkbox cambia de estado de inmediato en la UI y se envía el `PATCH` con el `id` de esa etapa y `completada: true`

#### Scenario: Respuesta autoritativa del PATCH

- **WHEN** el `PATCH` responde con la tarjeta recalculada
- **THEN** `avance`, `semaforo`, `etapaAhora` y `etiquetaPlazo` se reemplazan por los valores del DTO recibido y no se derivan localmente

#### Scenario: Desmarcar una etapa de una OP terminada

- **WHEN** el usuario desmarca una etapa de una tarjeta con `semaforo` `"Terminado"`
- **THEN** se envía `completada: false` y la tarjeta vuelve a estado activo con la etapa `ahora` que indica el DTO devuelto

### Requirement: Rollback y reconciliación ante el resultado de la mutación

La mutación DEBE (SHALL) restaurar el estado previo de todas las consultas del tablero afectadas si el `PATCH` falla, mostrar un aviso de error e invalidar las consultas al finalizar. Durante la fase optimista NO DEBE (SHALL NOT) recalcular `avance`, `semaforo`, `etapaAhora` ni `etiquetaPlazo` (Flujo 3, R1, RN-GLOBAL-02).

#### Scenario: Error del servidor

- **WHEN** el `PATCH` responde con error o la red falla
- **THEN** la etapa vuelve a su valor de `completada` anterior, se restaura el resto de la tarjeta y se muestra un mensaje de error al usuario

#### Scenario: Múltiples consultas en caché

- **WHEN** existen en caché consultas del tablero con distintos filtros que contienen la misma OP
- **THEN** el rollback restaura el estado anterior en todas ellas

#### Scenario: Éxito y reconciliación

- **WHEN** el `PATCH` termina con éxito
- **THEN** los KPIs y la tira de flujo se recalculan en el servidor y la UI invalida la consulta del tablero para reflejarlos
