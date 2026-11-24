## ADDED Requirements

### Requirement: Listado editable de partes de horas en detalle

La vista de detalle DEBE (SHALL) mostrar los partes de `DetalleOpDTO.horas` en una lista/tabla editable con fecha, etapa, operario, horas y observación cuando exista. Cada parte DEBE (SHALL) exponer acciones de editar y eliminar. La lista DEBE (SHALL) ordenarse por fecha ascendente y `createdAt` ascendente, reflejando el contrato del backend, sin reordenar por lógica alternativa en cliente.

#### Scenario: Listado con partes existentes

- **WHEN** el detalle trae dos partes con fechas distintas
- **THEN** la UI los muestra en orden cronológico ascendente con sus campos visibles y acciones editar/eliminar

#### Scenario: Listado vacío

- **WHEN** la OP no tiene partes
- **THEN** la UI muestra un estado vacío claro de horas, sin filas de ejemplo ni totales inventados

### Requirement: Edición de parte con recálculo visible

Al editar un parte, la SPA DEBE (SHALL) enviar `PATCH /api/ops/:id/horas/:horaId` con los campos modificados permitidos por el contrato y, tras éxito, refrescar los datos de la OP para mostrar el parte actualizado y los derivados recalculados por el dominio. La UI NO DEBE (SHALL NOT) recalcular `horasRealesTotales`, `desvioHoras`, `porcentajeConsumo` ni `alertaDesvio`.

#### Scenario: Edición exitosa

- **WHEN** el usuario cambia las horas de un parte a un valor válido y guarda
- **THEN** la petición PATCH es exitosa, la fila muestra el nuevo valor y los totales/derivados visibles se actualizan desde la respuesta refrescada del detalle

#### Scenario: Edición inválida

- **WHEN** el usuario intenta guardar horas <= 0 en edición
- **THEN** la UI bloquea el envío o muestra el error 422, y el parte original permanece visible

### Requirement: Eliminación de parte con confirmación de efecto

Al eliminar un parte, la SPA DEBE (SHALL) enviar `DELETE /api/ops/:id/horas/:horaId` y, tras éxito, refrescar el detalle. La UI DEBE (SHALL) manejar el caso de último parte dejando la lista vacía y los derivados en el estado devuelto por el backend.

#### Scenario: Eliminación exitosa

- **WHEN** el usuario confirma eliminar un parte existente
- **THEN** el parte desaparece de la lista tras refresco y los derivados visibles corresponden al DTO actualizado

#### Scenario: Falla al eliminar

- **WHEN** la API responde error al eliminar
- **THEN** la UI muestra un error accionable y mantiene el parte en la lista hasta obtener confirmación de éxito

