## ADDED Requirements

### Requirement: Rutas de alta y edición de OP

La SPA DEBE (SHALL) exponer `/ops/nueva` y `/ops/:id/editar` sin autenticación, renderizando un formulario de OP en modo alta o edición según la ruta (CHANGES.md §C-07, HU-01, R5, `03_actores_y_roles.md` §Rutas públicas). En edición, el formulario DEBE cargar la OP desde `GET /api/ops/:id` y NO DEBE (SHALL NOT) crear una OP nueva al guardar.

#### Scenario: Abrir el alta desde el tablero

- **WHEN** el usuario navega a `/ops/nueva`
- **THEN** se muestra el formulario vacío con el campo de plano con placeholder `Opcional — Ej: PL-2026-045` y sin datos de ninguna OP previa

#### Scenario: Abrir la edición de una OP existente

- **WHEN** el usuario navega a `/ops/:id/editar` con un UUID existente
- **THEN** el formulario se precarga con la cabecera, el plano, las etapas y los materiales devueltos por `GET /api/ops/:id`

#### Scenario: Sin autenticación

- **WHEN** se inspeccionan las rutas nuevas y sus peticiones
- **THEN** no hay login, PIN, token ni cabecera de usuario, y las rutas son accesibles como el resto del MVP (R5)

### Requirement: Campos del formulario y contrato de escritura de C-06

El formulario DEBE (SHALL) permitir cargar `numeroOp`, `codigoPlano`, cliente, `descripcionPieza`, `fechaEntrega`, `montoVendido`, `observaciones`, horas vendidas por etapa y materiales por tipo, y enviarlos con los nombres y formatos exactos de `BodyCreateOpSchema` / `BodyUpdateOpSchema` de C-06 (HU-01, HU-02, RN-MARGEN-05, R9). `montoVendido`, `horasVendidas` y los costos de materiales DEBEN viajar como cadenas decimales, nunca como números de coma flotante. El formulario NO DEBE (SHALL NOT) enviar `fechaIngreso`, `avance`, `semaforo`, totales ni agregados de costos (R3).

#### Scenario: Alta con línea base completa

- **WHEN** el usuario completa N° OP, cliente, pieza, entrega, monto, una etapa con horas y un material `MP`
- **THEN** se envía `POST /api/ops` con `numeroOp`, `clienteNombre`, `descripcionPieza`, `fechaEntrega` en `YYYY-MM-DD`, `montoVendido` como string, `etapas` con `horasVendidas` como string y `materiales` con `tipo`, `cantidad` y costos como strings

#### Scenario: Edición de cabecera

- **WHEN** el usuario guarda una OP existente
- **THEN** se envía `PUT /api/ops/:id` únicamente con los campos aceptados por `BodyUpdateOpSchema`, sin `etapas`, `materiales` ni derivados

#### Scenario: Fecha de ingreso informativa

- **WHEN** se inspecciona el formulario
- **THEN** `fechaIngreso` se muestra como dato informativo del sistema y no existe un campo editable ni una clave con ese nombre en el payload

### Requirement: Cliente existente o alta inline

El formulario DEBE (SHALL) ofrecer un selector de clientes ya conocidos y la opción de dar de alta uno nuevo inline mediante `POST /api/clientes` con `{ nombre }`, usando el `id` y `nombre` devueltos (HU-01, RN-OP-04, DD-06). El alta de OP DEBE enviar `clienteNombre`, no `clienteId`, conforme al contrato de C-06.

#### Scenario: Seleccionar cliente existente

- **WHEN** el usuario elige un cliente del selector
- **THEN** el payload de la OP incluye ese `clienteNombre` y no se llama a `POST /api/clientes`

#### Scenario: Alta inline de cliente

- **WHEN** el usuario elige *Nuevo cliente*, ingresa un nombre válido y lo confirma
- **THEN** se envía `POST /api/clientes`, el nuevo cliente queda seleccionado y el payload de la OP usa su `nombre`

#### Scenario: Cliente inline ya existente

- **WHEN** `POST /api/clientes` responde 200 con un cliente existente
- **THEN** el formulario reutiliza ese cliente sin crear un duplicado ni borrar el existente (DD-06)

### Requirement: Errores de validación y conflictos resaltados por campo

El formulario DEBE (SHALL) interpretar las respuestas 422 y 409 de C-06 y resaltar el campo correspondiente, conservando lo escrito (HU-01 CA, RN-OP-01/06, DU-4 de C-06). Para `codigo_plano_duplicado` DEBE mostrar el `message` del servidor —por ejemplo `El ID de plano PL-2026-045 ya está asignado a la OP 1871.`— y un enlace a `/ops/${opExistente.id}` (RN-OP-06). Para `numero_op_duplicado` DEBE resaltar `numeroOp` sin ofrecer enlace, porque ese cuerpo no incluye `opExistente` (DU-4). Para `validation_error` DEBE usar `details[].path` para asociar cada mensaje al campo.

#### Scenario: Plano duplicado con acceso a la OP existente

- **WHEN** `POST /api/ops` responde 409 con `error: 'codigo_plano_duplicado'`, `codigoPlano: 'PL-2026-045'`, `message: 'El ID de plano PL-2026-045 ya está asignado a la OP 1871.'` y `opExistente: { id: '<uuid>', numeroOp: '1871' }`
- **THEN** se muestra ese mensaje literal sobre el campo de plano, se resalta ese campo y existe un enlace *Ver OP 1871* que navega a `/ops/<uuid>`

#### Scenario: Número de OP duplicado

- **WHEN** el guardado responde 409 con `error: 'numero_op_duplicado'` y `numeroOp`
- **THEN** se resalta `numeroOp`, se muestra el mensaje del servidor y no se ofrece enlace a ninguna OP

#### Scenario: Errores de forma por campo

- **WHEN** el guardado responde 422 con `details` que incluyen `path: 'numeroOp'` y `path: 'clienteNombre'`
- **THEN** ambos campos muestran su mensaje asociado y el formulario permanece con los valores ingresados

#### Scenario: Validación local de `numero_op`

- **WHEN** el usuario deja `numeroOp` vacío o intenta guardar sin él
- **THEN** el formulario marca el campo como obligatorio y NO envía la petición de escritura

### Requirement: Retorno al tablero con la tarjeta creada

Tras una respuesta exitosa de `POST /api/ops` o `PUT /api/ops/:id`, el formulario DEBE (SHALL) invalidar las consultas del tablero y navegar a `/`, de modo que la tarjeta creada o actualizada se renderice con el DTO servido por el backend (Flujo 1, HU-01, RN-GLOBAL-02). El frontend NO DEBE (SHALL NOT) construir ni insertar la tarjeta a partir de los valores del formulario.

#### Scenario: Guardar una OP nueva

- **WHEN** `POST /api/ops` responde con éxito
- **THEN** se invalida la query `['tablero']`, se navega a `/` y la grilla muestra la tarjeta de la OP recién creada con su badge de plano

#### Scenario: Guardar una edición

- **WHEN** `PUT /api/ops/:id` responde con éxito
- **THEN** se invalida la query `['tablero']`, se navega a `/` y la tarjeta de esa OP refleja los datos actualizados

#### Scenario: Fallo al guardar

- **WHEN** cualquier escritura responde con error
- **THEN** no se navega, no se invalida la grilla y el formulario conserva los datos y el error por campo

### Requirement: Sin reglas de negocio en la UI del formulario

Los componentes del formulario NO DEBEN (SHALL NOT) calcular semáforo, avance, totales de horas, costos ni normalizar `codigo_plano`; DEBEN limitarse a recolectar datos, validar su forma y mostrar lo que devuelve el servidor (RN-GLOBAL-02, RN-OP-06, R2, R3).

#### Scenario: Derivados ausentes en el formulario

- **WHEN** se inspeccionan los componentes y hooks del slice `ordenes`
- **THEN** no hay imports de `calcularSemaforo`, `construirTarjetaOrden`, `normalizarCodigoPlano` ni comparaciones de fechas para estado

#### Scenario: Totales no editables

- **WHEN** se renderiza el formulario con etapas y materiales
- **THEN** no existe ningún control para cargar `avance`, `horasTotales`, costos agregados ni margen
