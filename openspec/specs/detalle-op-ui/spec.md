# detalle-op-ui Specification

## Purpose
TBD - created by archiving change ordenes-form. Update Purpose after archive.
## Requirements
### Requirement: Ruta de detalle mínima sobre el contrato existente

La SPA DEBE (SHALL) registrar la ruta `/ops/:id` y cargar la vista con `GET /api/ops/:id`, validando la respuesta con el esquema Zod de detalle del frontend antes de renderizar (CHANGES.md §C-07, `03_actores_y_roles.md` §Rutas públicas, HU-01). La vista DEBE (SHALL) mostrar la cabecera, badge, estado, etapas, materiales y la sección de horas reales (partes y derivados) tal como los devuelve el DTO. La vista NO DEBE (SHALL NOT) inventar datos ni adelantar migraciones o endpoints.

#### Scenario: Detalle de OP existente

- **WHEN** el usuario navega a `/ops/<uuid-existente>`
- **THEN** se muestra la cabecera de la OP, su badge de plano, sus etapas con `horasVendidas`, sus materiales y la sección de horas con partes/derivados provistos por el DTO

#### Scenario: OP inexistente

- **WHEN** `GET /api/ops/:id` responde 404 con `error: 'not_found'`
- **THEN** la vista muestra un estado de error claro y NO renderiza datos de ejemplo

#### Scenario: Sin derivados calculados en la vista

- **WHEN** se renderiza el detalle
- **THEN** `semaforo`, `avance`, `diasRestantes`, `etapaAhora`, `horasRealesTotales`, `desvioHoras`, `porcentajeConsumo` y `alertaDesvio` se muestran como vienen del DTO, sin comparaciones de fechas ni cálculos de negocio en React (RN-GLOBAL-02)

### Requirement: Acceso a la edición desde el detalle

El detalle DEBE (SHALL) ofrecer una acción *Editar* que navegue a `/ops/:id/editar` para la misma OP, y la tarjeta del tablero DEBE ofrecer acceso a `/ops/:id` para llegar al detalle (Flujo 1, D7 del design). La acción de cargar horas desde tarjeta PUEDE (MAY) navegar al detalle con intención de apertura del modal de carga.

#### Scenario: Editar desde el detalle

- **WHEN** el usuario pulsa *Editar* en `/ops/<uuid>`
- **THEN** la SPA navega a `/ops/<uuid>/editar` y el formulario carga esa misma OP

#### Scenario: Ver detalle desde la tarjeta

- **WHEN** el usuario pulsa *Ver detalle* en una tarjeta
- **THEN** la SPA navega a `/ops/<id-de-la-tarjeta>` y el badge de plano coincide con el de la tarjeta

### Requirement: Alcance deliberado del detalle

La vista NO DEBE (SHALL NOT) mostrar analítica de rentabilidad, exportación ni controles de edición de etapas o materiales: esas capacidades pertenecen a C-11/C-12, C-15 y al formulario de C-07. La vista SÍ DEBE (SHALL) incluir la gestión de horas reales (carga, edición, eliminación) definida por C-09.

#### Scenario: Horas reales disponibles

- **WHEN** el detalle trae `horas` con partes y derivados
- **THEN** la vista muestra la sección de horas reales con listado y acciones de carga/edición/eliminación, sin inventar valores

#### Scenario: Materiales de solo lectura

- **WHEN** se inspecciona la sección de materiales del detalle
- **THEN** no hay botones de editar ni borrar, coherentes con la ausencia de `PUT`/`DELETE` en C-06
