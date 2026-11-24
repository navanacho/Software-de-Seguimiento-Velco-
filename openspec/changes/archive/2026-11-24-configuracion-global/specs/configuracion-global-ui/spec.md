## ADDED Requirements

### Requirement: Vista de configuración accesible

La aplicación DEBE (SHALL) registrar la ruta `/configuracion` y ofrecer un enlace de navegación desde el encabezado del tablero hacia esa vista, sin pantallas de autenticación, PIN ni selección de roles (HU-18, Flujo 7, R5). El componente DEBE (SHALL) llamarse `ConfiguracionPage` y seguir el patrón contenedor/presentacional con componentes en PascalCase (R9).

#### Scenario: Navegación desde el tablero

- **WHEN** el usuario activa el enlace `Configuración` en el tablero
- **THEN** la aplicación muestra `/configuracion` sin recargar la página

#### Scenario: Sin autenticación

- **WHEN** se inspecciona la vista y sus rutas
- **THEN** no aparece login, PIN, selector de rol ni tabla `usuarios`

### Requirement: Formulario de parámetros y guardado

La vista DEBE (SHALL) cargar los valores desde `GET /api/configuracion` y permitir editar `valorHoraEstandar`, `diasAlertaRiesgo`, `porcentajeAvanceRiesgo` y `etapasDefault`. El guardado DEBE (SHALL) enviar un `PUT /api/configuracion` con la representación completa, mostrar confirmación al éxito y exponer los errores devueltos por la API (HU-18, RN-CONFIG-02, Flujo 7). La vista NO DEBE (SHALL NOT) calcular derivados ni guardar valores en almacenamiento local.

#### Scenario: Carga inicial

- **WHEN** se monta `/configuracion`
- **THEN** los campos muestran los valores devueltos por la API, con `valorHoraEstandar` como texto decimal

#### Scenario: Guardado exitoso

- **WHEN** el usuario cambia los días de alerta a `5` y guarda
- **THEN** se envía un `PUT` con todos los parámetros y se muestra confirmación de guardado

#### Scenario: Error de validación de la API

- **WHEN** la API responde `422` con errores por campo
- **THEN** la vista muestra cada mensaje junto a su campo y NO afirma que se guardó

### Requirement: Validación local espejo del dominio

La vista DEBE (SHALL) rechazar localmente valores negativos, porcentajes mayores a 100 y plantillas de etapas vacías, duplicadas o con nombres demasiado largos, evitando el `PUT` cuando la validación falla; los mensajes DEBEN (SHALL) corresponder a los mismos límites que la API (RN-CONFIG-01/02, R9).

#### Scenario: Porcentaje inválido

- **WHEN** el usuario escribe `101` en `% de avance de riesgo` e intenta guardar
- **THEN** el campo se marca inválido y NO se envía la petición

#### Scenario: Etapas duplicadas

- **WHEN** el usuario deja `Corte` dos veces, una en minúsculas
- **THEN** el editor marca la plantilla inválida y NO se envía la petición

### Requirement: Aviso de recálculo y alcance de la plantilla

La vista DEBE (SHALL) mostrar el aviso "los márgenes se recalculan con la tasa vigente" como información sobre el cálculo que se implementa en C-11 —C-10 NO DEBE (SHALL NOT) calcular `margen`— y además informar que los cambios en `etapasDefault` afectan solo a las OPs creadas después del guardado (Flujo 7, DD-04, RN-ETAPA-01).

#### Scenario: Aviso de tasa

- **WHEN** se muestra el campo `valor hora estándar`
- **THEN** aparece el aviso de que los márgenes se recalculan con la tasa vigente y no se guardan valores históricos, sin que la vista calcule `margen` (cálculo diferido a C-11)

#### Scenario: Aviso de plantilla

- **WHEN** se muestra el editor de `etapasDefault`
- **THEN** aparece un aviso que indica que las OPs existentes conservan su ruta de etapas
