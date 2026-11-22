## ADDED Requirements

### Requirement: Alta transaccional de OP con cliente, etapas y materiales

`POST /api/ops` DEBE (SHALL) ejecutar en una sola transacción de PostgreSQL real: resolución o alta del cliente, inserción de la OP con su `codigo_plano` normalizado, inserción de las etapas desde `configuracion.etapas_default` y inserción de los materiales del payload. Si cualquier paso falla, NO DEBE (SHALL NOT) persistirse ninguna fila (HU-01, HU-02, HU-04, RN-ETAPA-02, R10).

#### Scenario: Alta completa

- **WHEN** se envía una OP con cliente existente, plano, etapas no provistas y dos materiales
- **THEN** se crean la OP, las cinco etapas por defecto con secuencia 1..5 y los dos materiales, y la respuesta incluye la OP creada con `codigoPlano` y las etapas

#### Scenario: Cliente reutilizado

- **WHEN** el nombre del cliente ya existe en `clientes`
- **THEN** la OP se asocia a ese `cliente_id` y NO se crea un cliente duplicado ni se borra el existente (DD-06)

#### Scenario: Cliente vacío

- **WHEN** se envía un nombre de cliente vacío o solo espacios
- **THEN** la respuesta es 422 con `error: 'validation_error'` y la transacción no se inicia

#### Scenario: Fallo parcial

- **WHEN** la inserción de materiales falla por un tipo inválido después de haber insertado la OP y las etapas
- **THEN** la transacción se revierte y no quedan OP ni etapas huérfanas en la base

### Requirement: Edición de OP y alta independiente de cliente

El backend DEBE (SHALL) exponer `PUT /api/ops/:id` para editar cabecera, plano y colecciones de la OP, y `POST /api/clientes` para dar de alta un cliente sin crear una OP. `PUT` DEBE (SHALL) responder 404 si la OP no existe y 409 con el cuerpo `{ error: 'numero_op_duplicado', message, numeroOp }` si el `numero_op` ya pertenece a otra OP, sin incluir `opExistente` (DU-4). Ningún endpoint DEBE (SHALL NOT) aceptar campos derivados como `avance`, `semaforo`, `horas` ni costos agregados (RN-OP-01, RN-OP-02, R3).

#### Scenario: Editar cabecera y plano

- **WHEN** se envía `PUT /api/ops/:id` con un nuevo `codigo_plano` libre
- **THEN** la OP se actualiza y la respuesta devuelve el `codigoPlano` normalizado sin modificar derivados

#### Scenario: Número de OP duplicado

- **WHEN** se envía `PUT /api/ops/:id` con el `numero_op` de otra OP
- **THEN** la respuesta es 409 con el cuerpo exacto `{ error: 'numero_op_duplicado', message, numeroOp }`, sin `opExistente`, y la OP editada conserva su número original (DU-4)

#### Scenario: OP inexistente

- **WHEN** se envía `PUT /api/ops/:id` con un UUID que no existe
- **THEN** la respuesta es 404 con `error: 'not_found'`

#### Scenario: Alta de cliente válida

- **WHEN** se envía `POST /api/clientes` con un nombre no vacío y único
- **THEN** se crea el cliente y se devuelve su `id` y `nombre` sin crear ninguna OP

#### Scenario: Derivados no editables

- **WHEN** se inspeccionan los esquemas Zod de request de `POST /api/ops` y `PUT /api/ops/:id`
- **THEN** no aceptan `avance`, `semaforo`, `diasRestantes`, `etapaAhora`, `horasTotales` ni agregados de costos

### Requirement: Gestión de etapas por OP con nombres únicos y reorden no destructivo

El backend DEBE (SHALL) exponer `POST /api/ops/:id/etapas`, `PATCH /api/ops/:id/etapas/:etapaId/orden` y `DELETE /api/ops/:id/etapas/:etapaId`, conservando `PATCH /api/ops/:id/etapas/:etapaId` de C-04 para `completada`. El nombre de etapa es texto libre, pero DEBE (SHALL) ser único dentro de la OP sin distinguir mayúsculas: es la validación que C-05 dejó pendiente para sostener el badge `ahora` por nombre, y DEBE (SHALL) aplicarse en el alta, incluida la precarga desde `etapas_default`. El reorden DEBE (SHALL) actualizar solo `orden_secuencia` de forma contigua, conservando `id`, `nombre`, `completada` y `horas_vendidas`. NO DEBE (SHALL NOT) exponerse un endpoint para renombrar etapas en C-06 (DU-3; HU-04, RN-ETAPA-01/02/03, RN-AHORA-01, R3).

#### Scenario: Alta de etapa con nombre único

- **WHEN** se agrega una etapa llamada `Plegado` a una OP que no la tiene
- **THEN** se crea con la siguiente secuencia libre y el nombre se canonicaliza solo para comparar, sin alterarse en almacenamiento

#### Scenario: Nombre duplicado en la OP

- **WHEN** se intenta agregar `soldadura` a una OP que ya tiene `Soldadura`
- **THEN** la respuesta es 422 con un mensaje que identifica el nombre duplicado y no se inserta la etapa

#### Scenario: Nombres iguales en OPs distintas

- **WHEN** dos OPs distintas tienen una etapa `Corte`
- **THEN** ambas se aceptan porque la unicidad es por OP

#### Scenario: Unicidad aplicada a la precarga de etapas por defecto

- **WHEN** se crea una OP con `etapas_default` que repite un nombre solo por mayúsculas
- **THEN** la validación rechaza la transacción antes de insertar la OP y no se persiste ninguna etapa duplicada

#### Scenario: Sin renombrar etapas

- **WHEN** se inspeccionan los endpoints disponibles después de C-06
- **THEN** no existe operación para renombrar una etapa; solo alta, baja, reorden y el `PATCH` de `completada` heredado de C-04 (DU-3)

#### Scenario: Reorden sin pérdida de horas vendidas

- **WHEN** se reordena una etapa con `horas_vendidas = 7.50` de la secuencia 2 a la 4
- **THEN** las secuencias quedan contiguas y la etapa conserva su id, nombre, `completada` y `horas_vendidas` igual a `7.50`

#### Scenario: Baja de etapa

- **WHEN** se elimina una etapa de la OP
- **THEN** solo desaparece esa fila y las secuencias restantes se normalizan sin renombrar etapas ni escribir avance

#### Scenario: Etapa inexistente

- **WHEN** se intenta reordenar o borrar un `etapaId` que no pertenece a la OP indicada
- **THEN** la respuesta es 404 y no se modifica ninguna etapa

### Requirement: Derivados de línea base calculados en dominio

El sistema DEBE (SHALL) calcular `horas_vendidas_totales` como suma de `etapas_orden.horas_vendidas` y los agregados de materiales con las reglas de dominio, devolviendo los resultados en la respuesta sin persistirlos en columnas de `ordenes_trabajo` (RN-HORAS-01, RN-MARGEN-02/03, RN-GLOBAL-02, R3).

#### Scenario: Totales después de gestionar etapas

- **WHEN** una OP tiene etapas con 4, 6 y 0 horas vendidas y se elimina la de 6
- **THEN** el total de horas vendidas devuelto es 4 recalculado por dominio, sin columna almacenada

#### Scenario: Agregados de materiales

- **WHEN** una OP tiene materiales con costos cotizados y reales parcialmente nulos
- **THEN** el agregado cotizado usa todos los cotizados y el real aplica `COALESCE(costo_unitario_real, costo_unitario_cotizado)` por ítem

#### Scenario: Sin derivados en el esquema

- **WHEN** se inspeccionan `schema.prisma` y la migración 002
- **THEN** no hay columnas de avance, total de horas, costos agregados, margen ni semáforo
