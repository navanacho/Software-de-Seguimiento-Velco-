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

### Requirement: Reglas puras de estado exportadas desde el paquete compartido

`packages/domain` DEBE (SHALL) exponer, además de los tipos de C-02, las funciones puras `calcularAvance`, `etapaAhora`, `agruparFlujo`, `calcularSemaforo`, `diasRestantes` y la función constructora del DTO derivado, reexportadas desde `packages/domain/src/index.ts`. Estas reglas DEBEN ubicarse en `packages/domain/src/<feature>/` y NO DEBEN importar Fastify, Prisma, React ni `exceljs` (R2, R9).

#### Scenario: Reexportación única

- **WHEN** se inspecciona `packages/domain/src/index.ts`
- **THEN** las funciones de estado y el tipo del DTO derivado están disponibles para backend y frontend desde un único punto de exportación

#### Scenario: Aislamiento de frameworks

- **WHEN** se buscan importaciones de Fastify, `@prisma/client`, React o `exceljs` en `packages/domain/src/`
- **THEN** el resultado es vacío, incluidos los archivos nuevos de reglas de estado

#### Scenario: Compilación sin adaptadores

- **WHEN** se eliminan todos los directorios `backend/src/features/*/{prisma,http,excel}` y se compila `packages/domain`
- **THEN** la compilación finaliza correctamente sin frameworks ni adaptadores

#### Scenario: Tipado estricto

- **WHEN** se ejecuta la comprobación de tipos de `packages/domain`
- **THEN** no se reportan errores, no aparece `any` en los archivos nuevos y el `tsconfig` sigue siendo estricto con TypeScript 7.0.2

### Requirement: Runner propio para tests puros del dominio

`packages/domain` DEBE (SHALL) declarar el script `test` con Vitest 5.1.1 y un `vitest.config.ts` con entorno `node` e `include: ['src/**/*.test.ts']`, de modo que las pruebas de reglas puras se ejecuten desde la raíz con `npm test` sin depender del runner de `backend/` ni de PostgreSQL (R1, R10).

#### Scenario: Ejecución desde la raíz

- **WHEN** se ejecuta `npm test` en la raíz del workspace
- **THEN** la suite de `packages/domain/src/` se ejecuta junto a las de backend y frontend, sin contenedores ni mocks

#### Scenario: Aislamiento del runner

- **WHEN** se inspecciona `backend/vitest.config.ts`
- **THEN** su `include` no se modifica para abarcar `packages/domain/` y el runner de dominio es independiente

#### Scenario: Naturaleza pura

- **WHEN** se ejecuta un test de regla de negocio de `packages/domain`
- **THEN** transcurre sin inicializar PostgreSQL ni importar `@testcontainers/postgresql`

