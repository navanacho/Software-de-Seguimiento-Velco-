## ADDED Requirements

### Requirement: Caso de uso `imputarHoras` y alta de parte

El backend DEBE (SHALL) exponer `POST /api/ops/:id/horas` respaldado por el caso de uso `imputarHoras` de `backend/src/features/horas/application/`, que valida el parte con la regla pura de dominio, comprueba que la OP existe, comprueba que la etapa indicada pertenece a esa OP y persiste el parte en una transacción (HU-10, Flujo 4, R2). El cuerpo DEBE (SHALL) aceptar `observacion` como campo opcional (P-1). La respuesta DEBE (SHALL) devolver únicamente la entidad `ParteHoraDTO` del parte creado y NO DEBE (SHALL NOT) incluir totales calculados en el handler (P-5).

#### Scenario: Alta con etapa

- **WHEN** se envía `POST /api/ops/:id/horas` con `fecha`, `etapaId` de esa OP, `operario` y `horas: '2.50'`
- **THEN** se persiste un parte vinculado a la OP y a la etapa, con `created_at` generado por PostgreSQL

#### Scenario: Alta sin etapa

- **WHEN** se envía el mismo cuerpo con `etapaId: null` o sin el campo
- **THEN** se persiste el parte con `etapa_id = NULL` y sigue aportando al total de horas reales (RN-HORAS-01, RN-HORAS-05)

#### Scenario: Alta con observacion

- **WHEN** se envía `POST /api/ops/:id/horas` con `observacion: 'Revisar tornillería'`
- **THEN** se persiste el texto y el `ParteHoraDTO` devuelto lo expone tal cual (P-1)

#### Scenario: Alta sin observacion

- **WHEN** se envía `POST /api/ops/:id/horas` omitiendo `observacion`
- **THEN** el parte se persiste con `observacion = NULL` y el `ParteHoraDTO` devuelto expone `observacion: null` (P-1)

#### Scenario: Cuerpo de respuesta del alta

- **WHEN** se crea un parte correctamente
- **THEN** la respuesta contiene solo el `ParteHoraDTO` con sus campos, sin `horasRealesTotales`, `desvioHoras`, `porcentajeConsumo` ni `alertaDesvio` (P-5)

#### Scenario: OP inexistente

- **WHEN** se envía `POST /api/ops/:id/horas` con un UUID de OP que no existe
- **THEN** la respuesta es 404 con `error: "not_found"` y no se persiste ningún parte

#### Scenario: Etapa ajena a la OP

- **WHEN** se envía un `etapaId` existente que pertenece a otra OP
- **THEN** la operación se rechaza antes de persistir con 422 `validation_error` y `details[].path = ['etapaId']` (P-3)

#### Scenario: Etapa inexistente

- **WHEN** se envía un `etapaId` con formato UUID válido que no existe
- **THEN** la respuesta es 422 `validation_error` con `details[].path = ['etapaId']`, sin persistir ningún parte (P-3)

#### Scenario: Sin identidad de usuario

- **WHEN** se inspecciona el cuerpo aceptado por el endpoint
- **THEN** no acepta `usuarioId`, no consulta tabla `usuarios` ni requiere autenticación (DD-07, R5)

### Requirement: Listado de partes de una OP

El backend DEBE (SHALL) exponer `GET /api/ops/:id/horas` que devuelva los partes de la OP ordenados por `fecha` ascendente y, a igualdad de fecha, por `created_at` ascendente, con `horas` como cadena decimal exacta y `observacion` como cadena opcional (`string | null`, P-1). El endpoint DEBE (SHALL) responder 404 cuando la OP no existe y NO DEBE (SHALL NOT) consultar ni persistir agregados calculados (R3).

#### Scenario: Listado con partes

- **WHEN** se envía `GET /api/ops/:id/horas` para una OP con dos partes en fechas distintas
- **THEN** la respuesta contiene ambos partes en orden de fecha, cada `horas` es una cadena como `"2.50"` y cada parte expone `observacion` como texto o `null` (P-1)

#### Scenario: Listado vacío

- **WHEN** la OP no tiene partes
- **THEN** la respuesta contiene un arreglo vacío y calcula el total real en cero sin escribirlo en base

#### Scenario: OP inexistente

- **WHEN** se envía `GET /api/ops/:id/horas` con un UUID inexistente
- **THEN** la respuesta es 404 con `error: "not_found"`

#### Scenario: Aislamiento entre OPs

- **WHEN** dos OPs tienen partes cargados
- **THEN** cada listado devuelve únicamente los partes de su OP, según el índice `(orden_id, fecha)`

### Requirement: Corrección de un parte

El backend DEBE (SHALL) exponer `PATCH /api/ops/:id/horas/:horaId` para corregir un parte perteneciente a la OP indicada. La operación DEBE (SHALL) ser una actualización parcial: se reemplazan solo los campos presentes en el cuerpo y se conservan los ausentes; `fecha` DEBE (SHALL) ser editable; un cuerpo vacío DEBE (SHALL) rechazarse con 422 `validation_error` (P-4). `observacion` DEBE (SHALL) poder incluirse, actualizarse a `null` y conservarse si se omite (P-1). La respuesta DEBE (SHALL) devolver únicamente el `ParteHoraDTO` resultante (P-5). DEBE (SHALL) rechazarse un `horaId` inexistente o de otra OP, DEBE (SHALL) validar `horas > 0` y DEBE (SHALL) recalcular los derivados con las funciones puras del dominio (HU-13, RN-HORAS-01, RN-GLOBAL-02).

#### Scenario: Corrección de horas

- **WHEN** se corrige un parte de `"2.50"` a `"3.00"` horas
- **THEN** se persiste el nuevo valor y el total de horas reales de la OP se recalcula desde la colección fresca

#### Scenario: Corrección parcial conserva campos ausentes

- **WHEN** se envía `PATCH` solo con `horas: '3.00'` sobre un parte con `operario`, `fecha`, `etapaId` y `observacion` ya cargados
- **THEN** cambia únicamente `horas` y los demás campos conservan sus valores (P-4)

#### Scenario: Fecha editable

- **WHEN** se envía `PATCH` solo con `fecha: '2026-11-21'`
- **THEN** la fecha del parte cambia a ese valor y el resto de los campos permanece intacto (P-4)

#### Scenario: Cuerpo vacío rechazado

- **WHEN** se envía `PATCH` con un objeto JSON sin campos
- **THEN** la respuesta es 422 `validation_error` y no se modifica la fila (P-4)

#### Scenario: Correccion de observacion

- **WHEN** se envía `PATCH` con `observacion: 'Ajuste posterior'` y después con `observacion: null`
- **THEN** el `ParteHoraDTO` devuelto refleja el texto y luego `null`, sin afectar otros campos (P-1)

#### Scenario: Corrección sin etapa

- **WHEN** se corrige un parte que tiene `etapa_id = NULL`
- **THEN** el parte permanece sin etapa y su hora sigue sumando al total

#### Scenario: Hora inexistente o ajena

- **WHEN** se envía un `horaId` que no existe o pertenece a otra OP
- **THEN** la respuesta es 404 con `error: "not_found"` y no se modifica ningún parte

#### Scenario: Corrección a valor no positivo

- **WHEN** se envía `horas: '0'` o `horas: '-1.00'`
- **THEN** la respuesta es 422 y el parte conserva su valor original

### Requirement: Baja de un parte

El backend DEBE (SHALL) exponer `DELETE /api/ops/:id/horas/:horaId` que elimina únicamente el parte indicado y provoca el recálculo de los derivados de la OP (HU-13, RN-HORAS-01, R3). La respuesta DEBE (SHALL) ser `{ ok: true }`, sin entidades ni derivados en el cuerpo (P-5, como C-06 con etapas).

#### Scenario: Eliminación exitosa

- **WHEN** se elimina un parte existente de la OP
- **THEN** la fila desaparece de `registros_horas`, los demás partes permanecen, el total se recalcula por dominio y la respuesta es `{ ok: true }` (P-5)

#### Scenario: OP con un solo parte

- **WHEN** se elimina el único parte de una OP
- **THEN** el total de horas reales pasa a `"0.00"` y el desvío vuelve a igualar las horas vendidas

#### Scenario: Hora inexistente o ajena

- **WHEN** se envía un `horaId` inexistente o de otra OP
- **THEN** la respuesta es 404 y no se elimina ninguna fila

#### Scenario: Sin borrado en cascada involucrado

- **WHEN** se elimina un parte directamente
- **THEN** la OP y sus etapas quedan intactas, sin escribir derivados en ellas

### Requirement: Validación de frontera y errores HTTP

La ruta DEBE (SHALL) validar cuerpo y parámetros con esquemas `zod` 4.6.7 en la frontera, antes de invocar al caso de uso o consultar PostgreSQL. `horas <= 0` DEBE (SHALL) responder 422 con `error: "validation_error"` y `details[].path` apuntando a `horas`; los UUID inválidos, las fechas fuera del calendario y un cuerpo vacío en `PATCH` DEBEN responder 422. Una etapa inexistente o ajena DEBE (SHALL) responder 422 con `details[].path = ['etapaId']` (P-3). El cuerpo DEBE (SHALL) aceptar `observacion` opcional en `POST`/`PATCH` (P-1) y NO DEBE (SHALL NOT) aceptar derivados. Los cuerpos de éxito de `POST` y `PATCH` DEBEN (SHALL) ser un `ParteHoraDTO` y el de `DELETE` DEBE (SHALL) ser `{ ok: true }` (P-5); el cuerpo de error NO DEBE (SHALL NOT) contener derivados calculados (R9).

#### Scenario: Horas cero

- **WHEN** se envía `POST /api/ops/:id/horas` con `horas: '0'`
- **THEN** la respuesta es 422 con `error: "validation_error"` y `details[].path = ['horas']`, sin iniciar la transacción

#### Scenario: Horas negativas en edición

- **WHEN** se envía `PATCH /api/ops/:id/horas/:horaId` con `horas: '-2.00'`
- **THEN** la respuesta es 422 y no se modifica la fila

#### Scenario: UUID inválido

- **WHEN** se envía un `id` o `horaId` con formato inválido
- **THEN** la validación de frontera responde 422 sin consultar PostgreSQL

#### Scenario: Fecha inválida

- **WHEN** se envía `fecha: '2027-02-30'`
- **THEN** la respuesta es 422 aunque la cadena respete el patrón `YYYY-MM-DD`

#### Scenario: Etapa ajena con ruta de error

- **WHEN** se envía `POST` o `PATCH` con un `etapaId` de otra OP
- **THEN** la respuesta es 422 con `error: "validation_error"` y `details[].path = ['etapaId']` (P-3)

#### Scenario: Observacion opcional en la frontera

- **WHEN** se envía `POST` o `PATCH` con `observacion` como cadena de texto, con `null` o sin el campo
- **THEN** el esquema acepta las tres formas y el `ParteHoraDTO` resultante expone `observacion` como texto o `null` (P-1)

#### Scenario: Campos derivados rechazados

- **WHEN** se envían `horasTotales`, `desvio`, `consumo`, `alerta`, `avance` o `semaforo` en el cuerpo
- **THEN** el esquema `.strict()` rechaza la petición con 422 porque los derivados no son editables (R3)

### Requirement: Cobertura de integración y trazabilidad RN

Los tests de estos endpoints DEBEN (SHALL) ejecutarse contra PostgreSQL 18.7 real con `@testcontainers/postgresql` 12.2.2, cubriendo alta con y sin etapa, edición, eliminación, recálculo y rechazo de horas no positivas. Cada test DEBE (SHALL) nombrar la regla `RN-XX-NN` que cubre y seguir RED → GREEN → TRIANGULATE (mínimo dos casos) → REFACTOR (R1, R10, RN-GLOBAL-04).

#### Scenario: Contenedor real

- **WHEN** se ejecuta la suite de integración de horas
- **THEN** se levanta `postgres:18.7` mediante `crearContenedorPostgres()` y no se usa un mock de base

#### Scenario: Casos obligatorios cubiertos

- **WHEN** se inspeccionan los títulos de los tests
- **THEN** aparecen explícitamente parte con etapa, parte sin etapa, edición, eliminación, recálculo y rechazo de horas no positivas

#### Scenario: Trazabilidad

- **WHEN** se revisa un test de regla de horas
- **THEN** su título referencia `RN-HORAS-01`, `RN-HORAS-05` u otra regla aplicable (RN-GLOBAL-04)
