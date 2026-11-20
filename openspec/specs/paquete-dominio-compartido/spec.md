# paquete-dominio-compartido Specification

## Purpose
TBD - created by archiving change velco-mvp-foundation. Update Purpose after archive.
## Requirements
### Requirement: Paquete de dominio compartido por workspace

El workspace DEBE (SHALL) incluir `packages/domain` como paquete referenciado por `backend/` y `frontend/` para tipos y contratos comunes, de modo que cada definición exista una sola vez. Las reglas puras compartidas DEBEN organizarse en `packages/domain/src/<feature>/`, una carpeta por vertical slice.

#### Scenario: Importación desde ambos proyectos

- **WHEN** se inspeccionan las configuraciones de `backend/` y `frontend/`
- **THEN** ambos referencian `packages/domain` para los tipos compartidos

#### Scenario: Sin duplicación de contratos

- **WHEN** se define un tipo de contrato de la API
- **THEN** una única definición en `packages/domain/src/<feature>/` es consumida por ambos proyectos

#### Scenario: Organización por feature

- **WHEN** se inspecciona `packages/domain/src/`
- **THEN** las reglas y contratos puros están agrupados por feature y no existe una capa central de adaptadores

### Requirement: Dominio puro y compilación aislada

`packages/domain` DEBE (SHALL) compilar de forma autónoma con TypeScript puro y NO DEBE depender de Fastify, Prisma, React ni `exceljs`. El dominio DEBE seguir compilando al eliminarse TODOS los adaptadores por feature (`backend/src/features/*/prisma`, `backend/src/features/*/excel` y `backend/src/features/*/http`).

#### Scenario: Compilación aislada

- **WHEN** se compila `packages/domain` sin instalar dependencias de framework
- **THEN** la compilación finaliza correctamente

#### Scenario: Eliminación de todos los adaptadores por feature

- **WHEN** se eliminan `backend/src/features/*/prisma`, `backend/src/features/*/excel` y `backend/src/features/*/http`
- **THEN** `packages/domain/` sigue compilando sin errores y sin requerir Fastify, Prisma, React ni `exceljs`

### Requirement: Tipado estricto del paquete compartido

La configuración DEBE (SHALL) usar `tsconfig` estricto con TypeScript 7.0.2 y NO DEBE permitir `any` en el código del paquete.

#### Scenario: Verificación de tipos

- **WHEN** se ejecuta la comprobación de tipos de `packages/domain`
- **THEN** no se reportan errores ni se requiere el tipo `any`

