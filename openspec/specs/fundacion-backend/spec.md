# fundacion-backend Specification

## Purpose
TBD - created by archiving change velco-mvp-foundation. Update Purpose after archive.
## Requirements
### Requirement: Servicio Fastify con health check

El backend DEBE (SHALL) exponer `GET /api/health` mediante Fastify 5.12.8 y responder JSON con estado operativo `ok`; el puerto DEBE tomarse de la variable `PORT` sobre Node.js 26.13.1.

#### Scenario: Health check exitoso

- **WHEN** se envía `GET /api/health` al servicio iniciado
- **THEN** la respuesta tiene código 200 y un cuerpo JSON que indica estado `ok`

#### Scenario: Puerto configurable

- **WHEN** se inicia el backend con un valor distinto de `PORT`
- **THEN** el servidor escucha en ese puerto sin cambios de código

### Requirement: Estructura feature-based del backend

La carpeta `backend/src` DEBE (SHALL) contener `features/<feature>/{application,http,prisma,excel}`, `shared/` y `main.ts`; cada feature DEBE agrupar su caso de uso, controlador Fastify, adaptador Prisma y adaptador Excel, sin reglas de negocio dentro de los adaptadores. NO DEBE existir un directorio `infrastructure/` central.

#### Scenario: Capas por feature presentes

- **WHEN** se inspecciona `backend/src`
- **THEN** las features existentes tienen `application`, `http`, `prisma` y `excel`, además de `shared/` y `main.ts`, y los handlers HTTP solo realizan validación de frontera y delegación

#### Scenario: Sin capa central de infraestructura

- **WHEN** se busca `backend/src/infrastructure/`
- **THEN** no existe; los adaptadores están dentro de cada feature

### Requirement: Aislamiento del dominio respecto de frameworks

`packages/domain/src/` NO DEBE importar Fastify, Prisma, React ni `exceljs`; las dependencias externas DEBEN (SHALL) declararse como puertos en `backend/src/features/<feature>/application/` e implementarse en los adaptadores `http`, `prisma` y `excel` de esa feature. La verificación DEBE consistir en eliminar TODOS los adaptadores por feature.

#### Scenario: Eliminación de todos los adaptadores por feature

- **WHEN** se eliminan `backend/src/features/*/prisma`, `backend/src/features/*/excel` y `backend/src/features/*/http`
- **THEN** `packages/domain/` sigue compilando sin errores

#### Scenario: Búsqueda de importaciones prohibidas

- **WHEN** se buscan importaciones de frameworks dentro de `packages/domain/src/`
- **THEN** no se encuentra ninguna

### Requirement: Origen CORS configurable

El servidor DEBE (SHALL) permitir únicamente el origen indicado por `CORS_ORIGIN`, sin valores hardcodeados.

#### Scenario: Origen definido

- **WHEN** se inicia el backend con `CORS_ORIGIN` configurado
- **THEN** las respuestas HTTP reflejan ese origen permitido

### Requirement: Contratos de API tipados y documentación

El backend DEBE (SHALL) usar `zod` 4.6.7 para la validación de frontera y `@fastify/swagger` 9.9.5 para la documentación del endpoint, con los contratos compartidos importados desde `packages/domain`.

#### Scenario: Validación y documentación presentes

- **WHEN** se inspecciona el endpoint `GET /api/health`
- **THEN** su frontera usa esquemas `zod` y el contrato compartido, y Swagger expone la documentación del endpoint

