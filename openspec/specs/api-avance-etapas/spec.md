# api-avance-etapas Specification

## Purpose
TBD - created by archiving change tablero-read-api. Update Purpose after archive.
## Requirements
### Requirement: Alternar completada de una etapa con recálculo derivado

El backend DEBE (SHALL) exponer `PATCH /api/ops/:id/etapas/:etapaId` con body `{ completada: boolean }` que persista únicamente ese campo en `etapas_orden` y devuelva la tarjeta recalculada con `construirTarjetaOrden`. Marcar la última pendiente DEBE producir avance 100, `etapaAhora = 'Todo listo'` y semáforo `Terminado`; desmarcar una etapa de una OP terminada DEBE reactivarla y recalcular su etapa `ahora` (HU-07, Flujo 3, RN-AVANCE-01/02, RN-AHORA-01, RN-SEMAFORO-01).

#### Scenario: Marcar etapa intermedia

- **WHEN** se envía `PATCH ...` con `completada: true` sobre la segunda de tres etapas
- **THEN** solo cambia esa etapa, el avance pasa a 67 y `etapaAhora` pasa a la tercera etapa

#### Scenario: Completar la última etapa

- **WHEN** se marca `completada: true` sobre la única etapa pendiente
- **THEN** la respuesta tiene avance 100, `etapaAhora = "Todo listo"` y `semaforo = "Terminado"`, aunque la fecha de entrega esté vencida

#### Scenario: Desmarcar reactiva la OP

- **WHEN** se envía `completada: false` sobre una etapa de una OP terminada
- **THEN** el avance baja de 100, el semáforo deja de ser `Terminado` y `etapaAhora` vuelve a ser el nombre de esa etapa

#### Scenario: Sin derivados persistidos

- **WHEN** se ejecuta el PATCH y se inspeccionan las columnas de `ordenes_trabajo` y `etapas_orden`
- **THEN** solo cambió `completada`; no existe columna ni escritura de avance, semáforo, días restantes ni etapa `ahora` (R3)

### Requirement: Etapa ajena a la OP e input inválido

El caso de uso DEBE (SHALL) responder 404 cuando la etapa no existe o cuando `etapa.ordenId` difiere del `id` de la ruta. La validación de frontera DEBE responder 422 para UUIDs mal formados, body ausente, `completada` no booleano o campos adicionales; ninguna de estas situaciones DEBE modificar la base de datos (Flujo 3, R5 no aplica: no hay auth en el MVP).

#### Scenario: Etapa de otra OP

- **WHEN** se envía el UUID de una etapa que pertenece a otra orden en `PATCH /api/ops/:id/etapas/:etapaId`
- **THEN** la respuesta es 404 con `error: "not_found"` y la etapa ajena conserva su valor de `completada`

#### Scenario: Etapa inexistente

- **WHEN** se envía un UUID de etapa que no existe
- **THEN** la respuesta es 404 sin lanzar una excepción de servidor

#### Scenario: Body inválido

- **WHEN** se envía `{}` o `{ completada: "si", extra: 1 }`
- **THEN** la validación responde 422 y no se ejecuta ninguna escritura

#### Scenario: OP inexistente

- **WHEN** se envía un UUID de OP que no existe con una etapa cualquiera
- **THEN** la respuesta es 404 antes de buscar la etapa

