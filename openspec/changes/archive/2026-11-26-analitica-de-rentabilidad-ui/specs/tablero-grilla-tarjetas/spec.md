## MODIFIED Requirements

### Requirement: Derivados renderizados tal como vienen del dominio

El frontend DEBE (SHALL) mostrar `semaforo`, `avance`, `diasRestantes`, `etiquetaPlazo`, `horasVendidasTotales`, `horasRealesTotales`, `porcentajeConsumo` y `alertaDesvio` exactamente como llegan en `TarjetaOrdenDTO`. NO DEBE (SHALL NOT) invocar `calcularSemaforo`, `diasRestantes`, `etapaAhora`, `construirTarjetaOrden`, `calcularHorasVendidasTotales`, `calcularHorasRealesTotales`, `calcularConsumoHoras`, `evaluarAlertaDesvio`, ni comparar fechas, porcentajes u horas para obtener el estado (RN-GLOBAL-02, RN-GLOBAL-04, RN-SEMAFORO-01..06, RN-HORAS-03/04/06, C-11, C-12).

#### Scenario: Semáforo en los cuatro estados

- **WHEN** el tablero recibe tarjetas con `semaforo` `Terminado`, `Atrasado`, `En riesgo` y `En plazo`
- **THEN** cada tarjeta aplica la clase visual correspondiente —gris, rojo, amarillo y verde respectivamente— sin evaluar fechas ni avances en el componente

#### Scenario: Etiqueta de plazo literal

- **WHEN** una tarjeta trae `etiquetaPlazo` `"Faltan 2 días"` y `diasRestantes` `2`
- **THEN** la tarjeta muestra ese texto y ese número sin reformularlos ni recalcularlos

#### Scenario: Barra de horas desde DTO

- **WHEN** una tarjeta trae `horasVendidasTotales: "40.00"` y `horasRealesTotales: "32.00"`
- **THEN** la tarjeta muestra `32.00 / 40.00` (o formato equivalente de solo lectura) usando esos campos del DTO, sin sumar partes ni etapas en React

#### Scenario: Sin lógica de cálculo en el feature

- **WHEN** se inspeccionan los archivos de `frontend/src/features/tablero/` y `frontend/src/shared/domain-client/`
- **THEN** no aparecen imports de funciones de cálculo del dominio ni comparaciones entre fechas u horas, y los derivados —incluidos `porcentajeConsumo` y `alertaDesvio`— se leen sólo como propiedades del DTO

#### Scenario: Termómetro con porcentaje de consumo

- **WHEN** una tarjeta trae `horasRealesTotales: "32.00"`, `horasVendidasTotales: "40.00"` y `porcentajeConsumo: "80.00"`
- **THEN** la tarjeta muestra `32.00 / 40.00 — 80%` junto a la barra de solo lectura, usando el porcentaje del DTO y sin dividir los totales en React

#### Scenario: Alerta de desvío en la tarjeta

- **WHEN** una tarjeta trae `alertaDesvio: true`
- **THEN** la tarjeta muestra un badge con texto *Alerta de desvío de horas* y `role="status"`, sin evaluar el umbral 15 en el componente

#### Scenario: Consumo nulo sin artefactos numéricos

- **WHEN** una tarjeta trae `porcentajeConsumo: null` porque `horasVendidasTotales` es `"0.00"`
- **THEN** el termómetro muestra `—` en lugar del porcentaje y NO aparece `NaN`, `Infinity` ni `0.00%`; el badge depende únicamente de `alertaDesvio`
