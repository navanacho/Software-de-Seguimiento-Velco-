## ADDED Requirements

### Requirement: Contrato de plantilla ausente en el endpoint real de costeo

El endpoint `GET /api/ops/:id/export?variante=costeo` DEBE (SHALL) consumir el contrato existente `plantilla_no_encontrada`: cuando `MASTER COSTEO NUEVO.xlsx` no esté disponible en `EXCEL_TEMPLATES_DIR`, DEBE (SHALL) responder HTTP 500 con cuerpo `{ error: 'plantilla_no_encontrada', message: <mensaje operativo> }`, sin `Content-Disposition`, sin `Buffer` y sin archivo parcial. El mensaje DEBE (SHALL) nombrar la plantilla esperada sin revelar rutas absolutas ni la UNC histórica (Flujo 6, RN-EXPORT-02, R6).

#### Scenario: Plantilla de costeo ausente en producción

- **WHEN** se solicita la exportación de costeo y la plantilla no existe en el directorio configurado
- **THEN** la respuesta es 500 con `error: 'plantilla_no_encontrada'`, sin cabecera de descarga ni workbook improvisado

#### Scenario: Mensaje sin rutas del servidor

- **WHEN** se lee el cuerpo del error 500
- **THEN** incluye `MASTER COSTEO NUEVO.xlsx` y no incluye `EXCEL_TEMPLATES_DIR`, `EXCEL_UNC_BASE` ni la ruta UNC histórica

#### Scenario: Variable UNC ausente

- **WHEN** `EXCEL_UNC_BASE` no está definida y la plantilla sí existe
- **THEN** la exportación se realiza igual y no se emite error de configuración por la UNC (DD-02)
