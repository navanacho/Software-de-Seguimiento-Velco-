## ADDED Requirements

### Requirement: Fallo operativo por plantilla ausente

Cuando una plantilla oficial no esté disponible en `EXCEL_TEMPLATES_DIR`, el adaptador DEBE (SHALL) devolver un error tipado `plantilla_no_encontrada` con un mensaje operativo que nombre la plantilla esperada sin revelar rutas absolutas ni UNC. NO DEBE (SHALL NOT) continuar con datos parciales ni generar un workbook improvisado (RN-EXPORT-02, Flujo 6, DD-02, R6).

#### Scenario: Falta la plantilla de costeo

- **WHEN** `MASTER COSTEO NUEVO.xlsx` no existe en el directorio configurado
- **THEN** se devuelve `plantilla_no_encontrada` con un mensaje que nombra esa plantilla y no se crea ningún workbook

#### Scenario: Falta la plantilla de OP-MASTER

- **WHEN** `A - OP-MASTER.xlsx` no existe en el directorio configurado
- **THEN** se devuelve `plantilla_no_encontrada` con un mensaje que nombra esa plantilla y no se crea ningún workbook

#### Scenario: Mensaje sin ruta del servidor

- **WHEN** se reporta la ausencia de una plantilla
- **THEN** el mensaje no incluye la ruta absoluta del servidor ni la ruta UNC configurada

### Requirement: Contrato HTTP 500 para ausencia de plantilla

El contrato de error DEBE (SHALL) traducirse a una respuesta HTTP 500 con cuerpo `{ error: 'plantilla_no_encontrada', message: <mensaje operativo> }`. La respuesta NO DEBE (SHALL NOT) incluir `Content-Disposition` de descarga ni un archivo parcial (Flujo 6, RN-EXPORT-02, C-14/C-15 consumen este contrato).

#### Scenario: Respuesta 500 operativa

- **WHEN** se invoca el adaptador de exportación con una plantilla ausente a través del doble de ruta del test de contrato
- **THEN** la respuesta tiene estado 500 y el cuerpo identifica `plantilla_no_encontrada` con el mensaje operativo

#### Scenario: Sin descarga parcial

- **WHEN** se produce la respuesta de error
- **THEN** no hay `Content-Disposition`, no se devuelve un `Buffer` de `.xlsx` y el llamador no recibe un archivo incompleto
