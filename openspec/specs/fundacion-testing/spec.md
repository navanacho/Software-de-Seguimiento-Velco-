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

### Requirement: Guardián de alcance sobre el change archivado de fundación

El guardián `backend/test/fundacion/alcance.test.ts` DEBE (SHALL) verificar que el change archivado `openspec/changes/archive/2026-11-20-velco-mvp-foundation/` no introdujo reglas de negocio, modelos de dominio ni migraciones, aplicando las comprobaciones sobre los artefactos de ese change y NO sobre las fuentes vivas del workspace. La aparición legítima de `calcularAvance`, `calcularSemaforo` o `calcularMargen` en cambios posteriores NO DEBE hacer fallar este guardián (R1, R8).

#### Scenario: Reglas presentes en fuentes vivas

- **WHEN** C-03 agrega `calcularAvance` y `calcularSemaforo` a `packages/domain/src/` y se ejecuta el guardián
- **THEN** el guardián no inspecciona esas fuentes para la prohibición de derivados y los tres casos del archivo pasan

#### Scenario: Artefacto archivado modificado

- **WHEN** se modifica la propuesta, el diseño, las tareas o una spec archivada de `velco-mvp-foundation` para introducir una regla `RN-XX-NN` o un derivado
- **THEN** el guardián falla con un mensaje que nombra el artefacto archivado

#### Scenario: Aserciones sin debilitar

- **WHEN** se inspecciona el guardián
- **THEN** conserva las expresiones regulares originales, las cadenas literales sobre los artefactos de fundación y la comprobación de que el change archivado no contiene código de implementación; no contiene `skip`, `todo`, `only`, listas de excepciones ni aserciones tautológicas

#### Scenario: Casos restantes intactos

- **WHEN** se ejecuta el guardián
- **THEN** los casos que prohíben auth/PIN/RBAC y archivos `.xlsx` nuevos en fuentes vivas y el que valida el índice de ADR con HU-19, Fase 2, Admin/Oficina y sin montos siguen activos y con el mismo alcance

### Requirement: Reglas de negocio definidas solo en el dominio

El workspace DEBE (SHALL) mantener las definiciones de `calcularAvance`, `calcularSemaforo`, `calcularMargen`, `diasRestantes`, `agruparFlujo` y `etapaAhora` exclusivamente bajo `packages/domain/src/`. El guardián `backend/test/fundacion/ubicacion-reglas.test.ts` DEBE inspeccionar fuentes de producción, excluyendo `*.test.ts`/`*.test.tsx`, y NO DEBE prohibir la aparición legítima de esos nombres en la suite de dominio ni en el archive de C-01 (R1, R2, R9).

#### Scenario: Definición en un adaptador

- **WHEN** un archivo bajo `backend/src/features/*/{http,prisma,excel}` o `frontend/src/features/*` define `function calcularMargen(` o `const calcularMargen = (op) => ...` (equivalente con `let` o `var`)
- **THEN** el guardián falla con un mensaje que nombra el archivo

#### Scenario: Definición en el dominio

- **WHEN** las reglas están definidas bajo `packages/domain/src/`
- **THEN** el guardián pasa y verifica que existe al menos una definición, sin aserción tautológica

#### Scenario: Referencias RN en tests

- **WHEN** un test de dominio nombra su RN en el título del `it`
- **THEN** el guardián no lo inspecciona porque excluye `*.test.ts`/`*.test.tsx`

#### Scenario: Referencia RN en código de producción

- **WHEN** un archivo de producción cita `RN-[A-Z]+-\d+`
- **THEN** el guardián falla

