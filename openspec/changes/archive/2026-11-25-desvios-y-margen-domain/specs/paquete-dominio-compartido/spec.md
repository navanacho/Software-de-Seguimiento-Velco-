## ADDED Requirements

### Requirement: Reglas puras de desvío, costos y planilla reexportadas desde el barrel

`packages/domain` DEBE (SHALL) reexportar desde `packages/domain/src/index.ts`, además de las reglas de estado y horas existentes, las funciones puras `comparativaPorEtapa`, `costoMaterialReal`, `costoMaterialesCotizado`, `margenReal`, `tasaGlobalNoConfigurada` y `construirModeloPlanilla`, junto con sus tipos canónicos y el tipo `Decimal`. Cada definición DEBE (SHALL) existir una sola vez en `packages/domain/src/<feature>/` y ser consumida por backend y frontend desde ese único punto de exportación (R2, RN-GLOBAL-02).

#### Scenario: Reexportación única

- **WHEN** se inspecciona `packages/domain/src/index.ts`
- **THEN** las seis funciones nuevas, el tipo `Decimal` y los tipos de la comparativa y del modelo de planilla están disponibles para ambos workspaces

#### Scenario: Sin duplicación de contratos

- **WHEN** backend y frontend necesitan el tipo del modelo de planilla o el de la comparativa
- **THEN** lo importan desde `packages/domain` y no existe una definición paralela en adaptadores ni en componentes

#### Scenario: Nombres canónicos de horas preservados

- **WHEN** se buscan las funciones de totales, desvío, consumo y alerta
- **THEN** siguen siendo las definidas por C-08 en `packages/domain/src/horas/` y no se crean alias que dupliquen una misma regla

### Requirement: Aislamiento de frameworks y tipado estricto de las reglas nuevas

Los módulos nuevos NO DEBEN (SHALL NOT) importar Fastify, `@prisma/client`, React, `exceljs` ni `zod`, y NO DEBEN (SHALL NOT) usar `any`; el `tsconfig` estricto con TypeScript 7.0.2 se mantiene. `packages/domain/` DEBE (SHALL) seguir compilando al eliminarse TODOS los adaptadores por feature (`backend/src/features/*/{prisma,http,excel}`) (R2, R4, R9).

#### Scenario: Búsqueda de importaciones prohibidas

- **WHEN** se buscan importaciones de frameworks en los archivos nuevos de `packages/domain/src/{horas,margen,exportacion,decimal}/`
- **THEN** el resultado es vacío

#### Scenario: Compilación sin adaptadores

- **WHEN** se eliminan los directorios de adaptadores por feature y se compila `packages/domain`
- **THEN** la compilación finaliza sin errores y sin requerir PostgreSQL ni plantillas `.xlsx`

#### Scenario: Typecheck estricto

- **WHEN** se ejecuta `npm run typecheck -w @velco/domain`
- **THEN** no se reportan errores ni aparece `any` en las firmas nuevas

#### Scenario: Runner de tests puros

- **WHEN** se ejecuta la suite de `packages/domain/src/**/*.test.ts` con Vitest 5.1.1
- **THEN** transcurre en entorno `node`, sin inicializar PostgreSQL ni importar `@testcontainers/postgresql` (R1, R10)
