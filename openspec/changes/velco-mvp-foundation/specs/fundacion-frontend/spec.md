## ADDED Requirements

### Requirement: Aplicación Vite con React y TypeScript

El frontend DEBE (SHALL) ser una SPA construida con las versiones exactas Vite 8.3.8, React 19.3.1 y TypeScript 7.0.2, fijadas en los manifiestos del proyecto. Estas versiones superan los mínimos históricos (React 18+, Vite 5+, TypeScript 5+).

#### Scenario: Arranque de la SPA

- **WHEN** se inicia el servidor de desarrollo de `frontend/`
- **THEN** Vite 8.3.8 sirve una aplicación React 19.3.1 escrita en TypeScript 7.0.2 sin errores de configuración

#### Scenario: Versiones fijadas

- **WHEN** se inspeccionan los manifiestos de `frontend/`
- **THEN** React, Vite y TypeScript figuran con las versiones exactas indicadas, sin rangos ni versiones mínimas

### Requirement: Estructura feature-based del frontend

`frontend/src` DEBE (SHALL) organizarse en `features/<feature>/{components,hooks,queries}`, `shared/`, `app/` y un único `global.css`; la UI, los hooks y las queries DEBEN vivir dentro de la feature correspondiente.

#### Scenario: Vertical slices presentes

- **WHEN** se inspecciona `frontend/src`
- **THEN** existen `features/`, `shared/`, `app/` y `global.css`, y cada feature agrupa sus `components`, `hooks` y `queries`

#### Scenario: Sin capas transversales por tipo

- **WHEN** se buscan directorios globales `components/`, `hooks/` o `queries/` fuera de `features/` y `shared/`
- **THEN** no existen; esos artefactos están dentro de cada feature

### Requirement: Estilos con CSS Modules y un único global.css

Los estilos de componentes DEBEN (SHALL) vivir en archivos `.module.css`; un único `frontend/src/global.css` DEBE contener reset, tipografía y variables. Las clases condicionales DEBEN componerse con `clsx` 2.1.1 o template strings. NO DEBE incorporarse Tailwind.

#### Scenario: Revisión de estilos

- **WHEN** se inspecciona `frontend/src`
- **THEN** no existe configuración de Tailwind y solo hay un archivo `global.css` para estilos globales

### Requirement: Server state y routing configurados

La SPA DEBE (SHALL) usar `@tanstack/react-query` 5.108.1 para server state y `react-router-dom` 7.18.6 para enrutamiento, con las versiones fijadas en C-01. Las queries por feature DEBEN ubicarse en `frontend/src/features/<feature>/queries/`.

#### Scenario: Proveedores presentes

- **WHEN** se inspecciona `frontend/src/app/`
- **THEN** el proveedor de TanStack Query y el enrutador de React Router están configurados

#### Scenario: Queries por feature

- **WHEN** se inspecciona una feature del frontend
- **THEN** sus queries están en `features/<feature>/queries/` y no en un directorio global

### Requirement: Convenciones de componentes y tipado

Los componentes React DEBEN (SHALL) nombrarse en PascalCase y el código NO DEBE usar `any` bajo `tsconfig` estricto con TypeScript 7.0.2.

#### Scenario: Validación de convenciones

- **WHEN** se revisan los archivos de componentes y la configuración de TypeScript
- **THEN** todos los componentes usan PascalCase y la comprobación de tipos no admite `any`

### Requirement: Ausencia de reglas de negocio y controles descartados en la UI

La fundación del frontend DEBE (SHALL) evitar el cálculo de derivados y NO DEBE incluir un slider de avance ni columnas Kanban.

#### Scenario: Revisión de la superficie inicial

- **WHEN** se inspecciona el código del frontend
- **THEN** no hay lógica de cálculo de avance, semáforo, horas ni márgenes, ni los controles descartados del prototipo
