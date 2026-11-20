## ADDED Requirements

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
