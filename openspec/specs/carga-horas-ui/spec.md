# carga-horas-ui Specification

## Purpose
Formulario y validaciones de frontera para la carga rápida de partes de horas desde el detalle de OP (C-09, HU-10).

## Requirements
### Requirement: Modal de carga rápida de horas desde detalle

La SPA DEBE (SHALL) ofrecer en la vista de detalle de OP un formulario/modal "Cargar horas" para crear un parte mediante `POST /api/ops/:id/horas`, con campos fecha, etapa opcional, operario en texto libre y horas (HU-10). El formulario DEBE (SHALL) precargar la fecha con el día actual en formato calendario y listar etapas de la OP como opciones opcionales; NO DEBE (SHALL NOT) requerir identidad de usuario ni exponer campos de auth (R5).

#### Scenario: Alta exitosa desde detalle

- **WHEN** el usuario completa fecha, operario y horas válidas y confirma la carga
- **THEN** el frontend envía `POST /api/ops/:id/horas`, cierra o resetea el formulario según el patrón UI elegido y refresca el detalle para mostrar el nuevo parte y los derivados actualizados

#### Scenario: Alta con etapa opcional

- **WHEN** el usuario selecciona una etapa de la OP o deja la etapa vacía
- **THEN** el payload envía `etapaId` con UUID o `null`/ausente según contrato, y el backend acepta ambas variantes

#### Scenario: Error de validación del backend

- **WHEN** la API responde 422 por un parte inválido
- **THEN** la UI muestra un mensaje de error accionable, conserva los valores ingresados y no agrega el parte a la lista

### Requirement: Validación de frontera de horas en UI

El formulario DEBE (SHALL) bloquear el envío cuando `horas <= 0`, cuando horas no es un número decimal válido, o cuando faltan campos obligatorios de frontera (fecha, operario). Esta validación es de UX/frontera y NO DEBE (SHALL NOT) reemplazar la validación autoritativa del backend ni calcular derivados de negocio (RN-HORAS-05, RN-GLOBAL-02).

#### Scenario: Horas cero

- **WHEN** el usuario ingresa `0` en horas e intenta guardar
- **THEN** el formulario muestra error de validación junto al campo horas y no realiza la petición HTTP

#### Scenario: Horas negativas

- **WHEN** el usuario ingresa un valor negativo en horas
- **THEN** el formulario impide el envío y muestra un mensaje que indique que las horas deben ser mayores a cero

#### Scenario: Reintento tras corregir

- **WHEN** el usuario corrige un valor inválido por uno válido
- **THEN** el error de campo se limpia y el envío queda habilitado
