## ADDED Requirements

### Requirement: Totales de horas en TarjetaOrdenDTO

`TarjetaOrdenDTO` DEBE (SHALL) incluir `horasVendidasTotales` y `horasRealesTotales` como cadenas decimales exactas, calculadas en `packages/domain` mediante las funciones puras canónicas (`calcularHorasVendidasTotales`, `calcularHorasRealesTotales`) al construir la tarjeta. Estos campos DEBEN (SHALL) estar presentes en `GET /api/ops` y en toda construcción de `TarjetaOrdenDTO`, para que C-09 pueda renderizar la barra de horas en tarjeta sin cálculo en React (RN-GLOBAL-02, R3). Esta decisión enmienda explícitamente P-6=B de C-08 mediante delta spec de C-09, confirmada por el usuario el 2026-11-24 (OQ-1=A).

#### Scenario: Tarjeta con horas reales

- **WHEN** se construye una tarjeta para una OP con horas vendidas 40.00 y partes que suman 32.00 horas reales
- **THEN** el DTO incluye `horasVendidasTotales: "40.00"` y `horasRealesTotales: "32.00"`

#### Scenario: Tarjeta sin partes

- **WHEN** se construye una tarjeta para una OP sin registros de horas
- **THEN** `horasRealesTotales` es `"0.00"` y `horasVendidasTotales` refleja la suma de horas vendidas por etapas

#### Scenario: Sin persistencia de totales

- **WHEN** se inspecciona el esquema Prisma y la migración
- **THEN** no existen columnas persistidas para `horasVendidasTotales` ni `horasRealesTotales` (R3)

## MODIFIED Requirements

### Requirement: Una sola implementación consumida por API y frontend

La API DEBE (SHALL) servir el DTO construido por el dominio sin recalcular ninguno de sus derivados, y el frontend DEBE (SHALL) limitarse a renderizarlos. NI la API NI el frontend DEBEN invocar directamente las funciones de cálculo ni comparar fechas para obtener el semáforo (RN-GLOBAL-02, C-04 y C-05 del roadmap). En C-04 esto alcanza a los tres endpoints `GET /api/ops`, `GET /api/ops/:id` y `PATCH /api/ops/:id/etapas/:etapaId`: los filtros y el recálculo posterior al PATCH se resuelven con las mismas funciones puras del dominio, nunca con lógica en los handlers ni con columnas derivadas. A partir de C-09, `horasVendidasTotales` y `horasRealesTotales` en `TarjetaOrdenDTO` siguen la misma regla: calculados en dominio, transportados por API, renderizados por frontend sin sumar ni recalcular.

#### Scenario: Consumo por la API

- **WHEN** un handler de C-04 responde con una OP
- **THEN** los derivados del cuerpo son exactamente los del DTO del dominio, sin cálculo adicional en el handler

#### Scenario: Consumo por el frontend

- **WHEN** un componente de C-05 pinta una tarjeta
- **THEN** muestra `semaforo`, `avance`, `etapaAhora` y `etiquetaPlazo` tal como vienen en el DTO, sin importar funciones de cálculo ni comparar fechas

#### Scenario: Contrato compartido

- **WHEN** backend y frontend necesitan el tipo del DTO
- **THEN** ambos lo importan desde `packages/domain` y no existe una definición duplicada de las reglas derivadas ni de los DTOs canónicos (`TarjetaOrdenDTO`, `EtapaTarjeta`, `GrupoFlujo`, `EstadoSemaforo`, `ContextoTarjeta`); un envelope de transporte puede componerse a partir de esos tipos canónicos sin redefinir sus campos derivados

#### Scenario: Filtros sobre el DTO

- **WHEN** se aplica el filtro `estado` o `etapaAhora` en el listado
- **THEN** se comparan los campos `semaforo` y `etapaAhora` del DTO del dominio, sin volver a invocar `calcularSemaforo` ni `etapaAhora` desde el adaptador HTTP

#### Scenario: Recálculo posterior al PATCH

- **WHEN** se persiste `completada` y se construye la respuesta
- **THEN** el caso de uso invoca `construirTarjetaOrden` con etapas frescas y el handler solo devuelve el resultado, sin escribir derivados en PostgreSQL (R3)

#### Scenario: Totales de horas en tarjeta sin cálculo en React

- **WHEN** el tablero renderiza la barra `Horas Reales / Horas Vendidas`
- **THEN** usa `horasRealesTotales` y `horasVendidasTotales` del `TarjetaOrdenDTO` sin importar funciones de horas ni sumar partes/etapas en el componente
