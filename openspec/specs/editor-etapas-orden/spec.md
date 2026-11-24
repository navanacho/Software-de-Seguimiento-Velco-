# editor-etapas-orden Specification

## Purpose
TBD - created by archiving change ordenes-form. Update Purpose after archive.
## Requirements
### Requirement: Precarga de etapas por defecto en alta

Al abrir `/ops/nueva`, el editor DEBE (SHALL) precargar los nombres de `GET /api/configuracion` (`etapasDefault`) en el orden devuelto (HU-18, RN-CONFIG-01/02, RN-ETAPA-02, Flujo 7). Si la lectura falla o aún no responde, DEBE (SHALL) mostrar temporalmente los cinco nombres canónicos `Corte`, `Soldadura`, `Mecanizado`, `Pintura` y `Entrega` como fallback, sin persistirlos. Si el usuario no modifica la lista, el `POST /api/ops` DEBE (SHALL) omitir el campo `etapas` para que el backend aplique su propia configuración como fuente autoritativa; si la modifica, DEBE (SHALL) enviar la colección explícita. Esta redacción reemplaza la dependencia de la constante hardcodeada registrada en C-07, que ya no es válida desde que C-10 expone `GET /api/configuracion`.

#### Scenario: Precarga canónica visible

- **WHEN** se monta el formulario de alta y la API devuelve la plantilla canónica
- **THEN** el editor muestra cinco filas en orden `Corte`, `Soldadura`, `Mecanizado`, `Pintura`, `Entrega`

#### Scenario: Precarga con plantilla editada

- **WHEN** se monta el formulario de alta y la API devuelve `["Corte", "Plegado", "Entrega"]`
- **THEN** el editor muestra esas tres filas en ese orden, sin agregar nombres canónicos ausentes

#### Scenario: Alta sin modificar las etapas

- **WHEN** el usuario guarda la OP sin tocar el editor de etapas
- **THEN** el payload de `POST /api/ops` no incluye la clave `etapas` y el backend precarga la `configuracion.etapas_default` vigente

#### Scenario: Alta con etapas modificadas

- **WHEN** el usuario quita `Pintura` y agrega `Control`
- **THEN** el payload incluye `etapas` con los nombres resultantes y sus `horasVendidas` como strings decimales, sin la etapa quitada

#### Scenario: Fallo de lectura de configuración

- **WHEN** `GET /api/configuracion` falla y el usuario guarda sin modificar el editor
- **THEN** el editor muestra los cinco nombres canónicos como fallback y el `POST /api/ops` omite `etapas`, delegando la plantilla al backend

### Requirement: Agregar y quitar etapas de texto libre

El editor DEBE (SHALL) permitir agregar y quitar etapas con nombre de texto libre, sin taxonomía cerrada (HU-04, RN-ETAPA-01/03). El nombre DEBE validarse no vacío y con longitud máxima de 100 caracteres, espejando `BodyAltaEtapaSchema`; la baja y el alta en una OP existente DEBEN persistirse con `DELETE /api/ops/:id/etapas/:etapaId` y `POST /api/ops/:id/etapas` (C-06). El editor NO DEBE (SHALL NOT) ofrecer renombrar etapas (DU-3 de C-06).

#### Scenario: Agregar etapa no canónica

- **WHEN** el usuario agrega `Pulido` a una OP existente
- **THEN** se envía `POST /api/ops/:id/etapas` con `{ nombre: 'Pulido', horasVendidas: '0.00' }` y, tras reconsultar el detalle, la etapa aparece en la lista

#### Scenario: Quitar etapa

- **WHEN** el usuario elimina `Entrega` de una OP existente
- **THEN** se envía `DELETE /api/ops/:id/etapas/:etapaId` correspondiente y, tras reconsultar, la etapa desaparece y las restantes conservan sus nombres y horas

#### Scenario: Nombre vacío rechazado

- **WHEN** el usuario intenta agregar una etapa con nombre vacío o de más de 100 caracteres
- **THEN** el editor marca el campo como inválido y NO envía la petición de alta

#### Scenario: Sin renombrar ni lista cerrada

- **WHEN** se inspecciona el editor
- **THEN** no existe control de renombrado ni selector con un conjunto fijo de nombres; el nombre es un campo de texto libre

### Requirement: Reorden persistido sin pérdida de horas vendidas

El editor DEBE (SHALL) permitir reordenar etapas mediante `PATCH /api/ops/:id/etapas/:etapaId/orden` con `{ ordenSecuencia }`, usando números enteros desde 1 (C-06, RN-ETAPA-01). Como ese endpoint responde `{ ok: true }`, el editor DEBE (SHALL) invalidar y reconsultar `GET /api/ops/:id` y repintar con el orden devuelto por el servidor; NO DEBE (SHALL NOT) considerar persistido un cambio que solo existe en el estado local. El reorden NO DEBE (SHALL NOT) alterar `id`, `nombre`, `completada` ni `horasVendidas` de las etapas (DU-3 de C-06, R3).

#### Scenario: Reorden confirmado por el servidor

- **WHEN** el usuario mueve `Mecanizado` de la posición 3 a la 1 y el `PATCH` responde con éxito
- **THEN** se reconsulta el detalle y la lista muestra `Mecanizado`, `Corte`, `Soldadura`, `Pintura`, `Entrega` en ese orden, según `ordenSecuencia` del DTO

#### Scenario: Horas vendidas conservadas

- **WHEN** la etapa reordenada tiene `horasVendidas: '7.50'`
- **THEN** tras la reconsulta la etapa conserva su `id`, su nombre y `horasVendidas: '7.50'`, sin recalcular totales en React

#### Scenario: Reorden fallido

- **WHEN** el `PATCH` de orden responde con error o la reconsulta falla
- **THEN** se muestra un aviso de error, la lista conserva el orden servido por el servidor y no se afirma que el cambio fue persistido

### Requirement: Sin derivados ni taxonomía en el editor

El editor NO DEBE (SHALL NOT) calcular avance, etapa `ahora`, semáforo ni total de horas vendidas, y DEBE mostrar los derivados que ya traen los DTOs cuando estén presentes (RN-AVANCE-01, RN-AHORA-01, RN-GLOBAL-02, R3).

#### Scenario: Derivados intactos tras gestionar etapas

- **WHEN** se agrega o quita una etapa y vuelve el detalle actualizado
- **THEN** `avance`, `etapaAhora` y `semaforo` se toman del DTO recibido y no se recalculan en el componente

#### Scenario: Sin slider de avance

- **WHEN** se inspecciona el editor de etapas
- **THEN** no hay control de tipo `range` ni campo editable de porcentaje de avance
