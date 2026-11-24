## MODIFIED Requirements

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
