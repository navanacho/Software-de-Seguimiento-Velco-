## ADDED Requirements

### Requirement: Detalle de OP con derivados del dominio

El backend DEBE (SHALL) exponer `GET /api/ops/:id` que devuelva un `DetalleOpDTO` construido a partir de `TarjetaOrdenDTO`, incorporando `fechaIngreso`, `fechaEntrega`, `montoVendido` y `observaciones` además de las etapas y los derivados ya calculados. El handler NO DEBE calcular avance, semáforo, días restantes ni etapa `ahora`; DEBE delegar en el caso de uso que compone las funciones puras de C-03 (HU-14/15/16, RN-GLOBAL-02).

#### Scenario: Detalle de una OP existente

- **WHEN** se envía `GET /api/ops/:id` con un identificador UUID existente
- **THEN** la respuesta tiene código 200 y expone etapas ordenadas por `ordenSecuencia` junto con `avance`, `semaforo`, `diasRestantes`, `etapaAhora` y `etiquetaPlazo` idénticos a los del dominio

#### Scenario: Horas vendidas por etapa disponibles

- **WHEN** se inspeccionan las etapas del detalle
- **THEN** cada etapa conserva su `horasVendidas` como cadena decimal exacta proveniente del dominio, sin derivados de horas reales ni de costos

#### Scenario: OP inexistente

- **WHEN** se envía `GET /api/ops/:id` con un UUID que no existe
- **THEN** la respuesta es 404 con `error: "not_found"` y sin derivados calculados

#### Scenario: Identificador inválido

- **WHEN** se envía `GET /api/ops/no-es-un-uuid`
- **THEN** la validación de frontera responde 422 antes de consultar el repositorio

### Requirement: Colecciones de horas y materiales en el contrato de detalle

El `DetalleOpDTO` DEBE (SHALL) reservar los campos `horas` y `materiales` para las colecciones que HU-14/15/16 consumirán, pero en este change DEBEN devolverse como arreglos vacíos tipados porque las tablas `registros_horas` y `materiales_orden` se crean en C-08 y C-06, posteriores en el roadmap. El backend NO DEBE inventar valores, adelantar migraciones ni persistir agregados para completarlos (OQ-3, R3).

#### Scenario: Colecciones pendientes de cambios futuros

- **WHEN** se inspecciona el detalle de una OP con etapas cargadas
- **THEN** `horas` y `materiales` son arreglos vacíos y la documentación Swagger indica que se completarán en C-08 y C-06

#### Scenario: Sin datos derivados de horas reales

- **WHEN** se construye el detalle
- **THEN** no se calculan totales, desvíos, consumos, costos ni márgenes, y no se escriben en base de datos
