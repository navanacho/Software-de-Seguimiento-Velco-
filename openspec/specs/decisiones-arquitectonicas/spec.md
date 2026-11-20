# decisiones-arquitectonicas Specification

## Purpose
TBD - created by archiving change velco-mvp-foundation. Update Purpose after archive.
## Requirements
### Requirement: Registro versionado de decisiones DD-01 a DD-10

El sistema de documentación DEBE (SHALL) contener diez ADR versionados identificados como DD-01…DD-10, cada uno con contexto, decisión, alternativas consideradas, justificación y trade-offs, cubriendo stack, esquema canónico, auth diferida, Excel sobre plantillas, avance derivado y exportación por OP.

#### Scenario: Consulta de los ADR

- **WHEN** se revisa la documentación del change `velco-mvp-foundation`
- **THEN** los diez ADR están presentes con su identificador, estado y trazabilidad a `CHANGES.md` y a `knowledge-base/`

#### Scenario: Alternativas descartadas de DD-01

- **WHEN** se consulta DD-01
- **THEN** constan Next.js + SQLite, Python/openpyxl, Express y Prisma 8.0.0-rc.34 como alternativas descartadas con su razón técnica

#### Scenario: Versiones fijadas en la decisión de stack

- **WHEN** se consultan las versiones de DD-01
- **THEN** figuran las versiones exactas verificadas el 2026-11-19, que superan los mínimos históricos (React 18+, Vite 5+, TypeScript 5+, Fastify 4+, Prisma 5+, Vitest 1+), y consta que se eligió stable actual evitando release candidates

### Requirement: Congelamiento de decisiones sin código de negocio

La fundación DEBE (SHALL) limitarse a decisiones, andamiaje y configuración; NO DEBE crear modelos de negocio, reglas `RN-*` ni endpoints de órdenes de producción.

#### Scenario: Límite de alcance

- **WHEN** se inspecciona el resultado del change
- **THEN** no existen modelos Prisma de dominio, reglas de negocio ni recursos REST de OP, etapas, horas o exportación

### Requirement: Riesgos abiertos declarados explícitamente

La documentación DEBE (SHALL) registrar IN-08 y DD-07 como riesgos abiertos con su decisor y su change o fase siguiente; NO DEBE presentarlos como resueltos ni incluir IN-09 entre los riesgos abiertos.

#### Scenario: Spike Excel pendiente

- **WHEN** se consulta el estado de IN-08
- **THEN** figura como abierto y asignado al spike `C-13`, bloqueante de `C-14`

#### Scenario: Auth diferida

- **WHEN** se solicita código de PIN, login o RBAC durante el MVP
- **THEN** se rechaza por R5 y se exige aprobación humana explícita antes de cualquier implementación de autenticación

### Requirement: Resolución de IN-09 registrada como decisión

La documentación DEBE (SHALL) registrar IN-09 como RESUELTA por el usuario, indicando que `Docs/MVP.md` y `Docs/HistoriasDeUsuario.md` se borraron deliberadamente por obsoletos y que la documentación vigente del repositorio es la fuente; NO DEBE recuperar documentos del historial de git ni usar ZIP o PIN como requisitos.

#### Scenario: Consulta de IN-09

- **WHEN** se consulta el estado de IN-09
- **THEN** figura como resuelta por el usuario, sin dudas pendientes sobre la validez de los documentos borrados

#### Scenario: Fuentes vigentes

- **WHEN** se necesita definir el alcance o las reglas del MVP
- **THEN** se consulta la documentación vigente del repositorio y NO se restauran documentos obsoletos desde git

#### Scenario: Sin requisitos de ZIP ni PIN

- **WHEN** se planifican los requisitos del MVP
- **THEN** no figuran la exportación consolidada en ZIP ni el PIN como requisitos; la exportación por OP usa plantillas oficiales y la autenticación está diferida

### Requirement: Roles y visibilidad de montos

La documentación DEBE (SHALL) acotar los roles del MVP a HU-19 en Fase 2, con Admin/Oficina viendo costos y márgenes y Taller sin montos; cualquier auth, PIN o RBAC DEBE requerir aprobación humana explícita (R5) y NO DEBE incluirse en el MVP.

#### Scenario: Visibilidad en HU-19

- **WHEN** se consulta la visibilidad de costos y márgenes en HU-19 de Fase 2
- **THEN** Admin/Oficina puede verlos y Taller no ve montos

#### Scenario: Fuera del MVP

- **WHEN** se propone implementar autenticación en el MVP
- **THEN** se rechaza por R5 hasta que exista aprobación humana explícita

