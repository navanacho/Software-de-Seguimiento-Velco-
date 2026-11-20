# dto-derivados-orden Specification

## Purpose
TBD - created by archiving change estado-y-avance-domain. Update Purpose after archive.
## Requirements
### Requirement: DTO de salida con derivados para tarjeta

El dominio DEBE (SHALL) exponer un DTO de salida que incluya, junto a los datos de la OP, los campos derivados `avance`, `semaforo`, `diasRestantes`, `etapaAhora` y `etiquetaPlazo`, aplanados en el mismo objeto. El DTO DEBE construirse mediante una función pura que componga `calcularAvance`, `etapaAhora`, `calcularSemaforo` y `diasRestantes` con el contexto inyectado (HU-05, RN-GLOBAL-02).

#### Scenario: Construcción del DTO

- **WHEN** se construye el DTO de una OP con sus etapas y un contexto con `hoy`, `zonaHoraria` y umbrales
- **THEN** el resultado contiene avance, semáforo, días restantes, etapa `ahora` y etiqueta de plazo calculados por el dominio

#### Scenario: Datos mínimos de tarjeta

- **WHEN** se inspecciona el DTO
- **THEN** incluye número de OP, cliente, pieza y etapas con su estado, sin requerir datos de horas ni de costos

#### Scenario: Sin persistencia de derivados

- **WHEN** se construye el DTO
- **THEN** ninguno de sus campos derivados se escribe en base de datos ni se agrega como columna al esquema (R3)

### Requirement: Una sola implementación consumida por API y frontend

La API DEBE (SHALL) servir el DTO construido por el dominio sin recalcular ninguno de sus derivados, y el frontend DEBE (SHALL) limitarse a renderizarlos. NI la API NI el frontend DEBEN invocar directamente las funciones de cálculo ni comparar fechas para obtener el semáforo (RN-GLOBAL-02, C-04 y C-05 del roadmap).

#### Scenario: Consumo por la API

- **WHEN** un handler de C-04 responde con una OP
- **THEN** los derivados del cuerpo son exactamente los del DTO del dominio, sin cálculo adicional en el handler

#### Scenario: Consumo por el frontend

- **WHEN** un componente de C-05 pinta una tarjeta
- **THEN** muestra `semaforo`, `avance`, `etapaAhora` y `etiquetaPlazo` tal como vienen en el DTO, sin importar funciones de cálculo ni comparar fechas

#### Scenario: Contrato compartido

- **WHEN** backend y frontend necesitan el tipo del DTO
- **THEN** ambos lo importan desde `packages/domain` y no existe una definición duplicada en ninguno de los dos proyectos

