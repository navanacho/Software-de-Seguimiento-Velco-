# fundacion-testing Specification

## Purpose
TBD - created by archiving change velco-mvp-foundation. Update Purpose after archive.
## Requirements
### Requirement: Vitest configurado en backend y frontend

Ambos proyectos DEBEN (SHALL) tener Vitest 5.1.1 configurado con scripts de ejecución de tests y `tsconfig` estricto con TypeScript 7.0.2. El entorno de componentes DEBE usar `@testing-library/react` 16.3.3 y `jsdom` 31.0.1. Estas versiones superan el mínimo histórico de Vitest 1+.

#### Scenario: Configuración presente

- **WHEN** se inspeccionan los manifiestos de `backend/` y `frontend/`
- **THEN** cada uno declara Vitest 5.1.1 como dependencia de desarrollo y un script para ejecutarlo

#### Scenario: Entorno de componentes

- **WHEN** se inspecciona la configuración de Vitest de `frontend/`
- **THEN** declara `jsdom` 31.0.1 como entorno y `@testing-library/react` 16.3.3 como dependencia de pruebas

### Requirement: Tests de smoke antes de cualquier implementación

Antes de escribir código de negocio DEBEN (SHALL) existir y pasar los tests de smoke del health check y de la configuración de Vitest en ambos proyectos.

#### Scenario: Smoke del health check

- **WHEN** el test invoca `GET /api/health`
- **THEN** la respuesta es 200 con estado `ok` y el test pasa antes de agregar reglas de dominio

#### Scenario: Smoke de configuración de Vitest

- **WHEN** se ejecutan los tests de `backend/` y `frontend/`
- **THEN** el runner de Vitest 5.1.1 arranca en ambos y el test de configuración pasa

### Requirement: Ciclo TDD estricto

Toda implementación DEBE (SHALL) comenzar con un test fallido y seguir el ciclo RED → GREEN → TRIANGULATE con un mínimo de dos casos → REFACTOR.

#### Scenario: Regla nueva

- **WHEN** se incorpora una regla al proyecto
- **THEN** existe previamente un test que falla, luego se implementa lo mínimo para pasarlo y se agregan al menos dos casos antes de refactorizar

### Requirement: Integración contra PostgreSQL real

Los tests de integración DEBEN (SHALL) ejecutarse contra PostgreSQL 18.7 real en contenedor, mediante `@testcontainers/postgresql` 12.2.2 o equivalente; NO DEBEN mockear PostgreSQL. Los tests de reglas puras NO DEBEN requerir base de datos y DEBEN ubicarse junto a la feature correspondiente en `packages/domain/src/<feature>/`.

#### Scenario: Test de integración

- **WHEN** se ejecuta un test que necesita persistencia
- **THEN** se apoya en un contenedor PostgreSQL 18.7 real, sin mocks del cliente Prisma ni de la base de datos

#### Scenario: Test de regla pura

- **WHEN** se ejecuta un test de regla de negocio pura
- **THEN** transcurre sin inicializar ninguna base de datos

#### Scenario: Pruebas por feature

- **WHEN** se organizan las pruebas de una feature
- **THEN** las reglas puras quedan en `packages/domain/src/<feature>/` y las pruebas HTTP en `backend/src/features/<feature>/http/`

