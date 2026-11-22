## ADDED Requirements

### Requirement: Ruta de detalle mínima sobre el contrato existente

La SPA DEBE (SHALL) registrar la ruta `/ops/:id` y cargar la vista con `GET /api/ops/:id`, validando la respuesta con el esquema Zod de detalle del frontend antes de renderizar (CHANGES.md §C-07, `03_actores_y_roles.md` §Rutas públicas, HU-01). La vista NO DEBE (SHALL NOT) inventar datos ni adelantar migraciones o endpoints.

#### Scenario: Detalle de OP existente

- **WHEN** el usuario navega a `/ops/<uuid-existente>`
- **THEN** se muestra la cabecera de la OP, su badge de plano, sus etapas con `horasVendidas` y sus materiales, tal como los devuelve el detalle

#### Scenario: OP inexistente

- **WHEN** `GET /api/ops/:id` responde 404 con `error: 'not_found'`
- **THEN** la vista muestra un estado de error claro y NO renderiza datos de ejemplo

#### Scenario: Sin derivados calculados en la vista

- **WHEN** se renderiza el detalle
- **THEN** `semaforo`, `avance`, `diasRestantes` y `etapaAhora` se muestran como vienen del DTO, sin comparaciones de fechas en React (RN-GLOBAL-02)

### Requirement: Acceso a la edición desde el detalle

El detalle DEBE (SHALL) ofrecer una acción *Editar* que navegue a `/ops/:id/editar` para la misma OP, y la tarjeta del tablero DEBE ofrecer acceso a `/ops/:id` para llegar al detalle (Flujo 1, D7 del design).

#### Scenario: Editar desde el detalle

- **WHEN** el usuario pulsa *Editar* en `/ops/<uuid>`
- **THEN** la SPA navega a `/ops/<uuid>/editar` y el formulario carga esa misma OP

#### Scenario: Ver detalle desde la tarjeta

- **WHEN** el usuario pulsa *Ver detalle* en una tarjeta
- **THEN** la SPA navega a `/ops/<id-de-la-tarjeta>` y el badge de plano coincide con el de la tarjeta

### Requirement: Alcance deliberado del detalle

La vista NO DEBE (SHALL NOT) mostrar analítica de rentabilidad, horas reales, exportación ni controles de edición de etapas o materiales: esas capacidades pertenecen a C-09, C-11, C-15 y al propio formulario de C-07 (D7 del design, DU-2 de C-06).

#### Scenario: Horas reales pendientes

- **WHEN** el detalle trae `horas: []` porque C-08 no está implementado
- **THEN** la vista no muestra un termómetro de horas reales ni inventa valores

#### Scenario: Materiales de solo lectura

- **WHEN** se inspecciona la sección de materiales del detalle
- **THEN** no hay botones de editar ni borrar, coherentes con la ausencia de `PUT`/`DELETE` en C-06
