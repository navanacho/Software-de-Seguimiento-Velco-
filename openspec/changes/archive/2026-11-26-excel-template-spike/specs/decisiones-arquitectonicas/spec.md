## MODIFIED Requirements

### Requirement: Registro versionado de decisiones DD-01 a DD-10

El sistema de documentación DEBE (SHALL) contener diez ADR versionados identificados como DD-01…DD-10, cada uno con contexto, decisión, alternativas consideradas, justificación y trade-offs, cubriendo stack, esquema canónico, auth diferida, Excel sobre plantillas, avance derivado y exportación por OP. DD-02 DEBE (SHALL) reflejar la enmienda aprobada: parche OOXML quirúrgico sobre las plantillas oficiales, `exceljs` 4.4.0 solo para lectura/verificación, conservación byte-a-byte de las piezas no autorizadas, reemplazo de las 12 fórmulas `[1]` por valores estáticos de BD, conservación de los enlaces como metadata histórica, `ID Plano: <valor>` / `ID Plano: S/P` en `O7`, y UNC histórica sin uso en runtime. El guardado/reapertura con `exceljs` consta como alternativa descartada. NO DEBE (SHALL NOT) crearse DD-14.

#### Scenario: Consulta de los ADR

- **WHEN** se revisa la documentación del change `velco-mvp-foundation`
- **THEN** los diez ADR están presentes con su identificador, estado y trazabilidad a `CHANGES.md` y a `knowledge-base/`

#### Scenario: Alternativas descartadas de DD-01

- **WHEN** se consulta DD-01
- **THEN** constan Next.js + SQLite, Python/openpyxl, Express y Prisma 8.0.0-rc.34 como alternativas descartadas con su razón técnica

#### Scenario: Versiones fijadas en la decisión de stack

- **WHEN** se consultan las versiones de DD-01
- **THEN** figuran las versiones exactas verificadas el 2026-11-19, que superan los mínimos históricos (React 18+, Vite 5+, TypeScript 5+, Fastify 4+, Prisma 5+, Vitest 1+), y consta que se eligió stable actual evitando release candidates

#### Scenario: DD-02 enmendada sin DD-14

- **WHEN** se consulta DD-02 en `knowledge-base/09_decisiones_y_supuestos.md`
- **THEN** figura el parche OOXML quirúrgico con `exceljs` solo para lectura, los tamaños 577.125 bytes en OP y 994 bytes en costeo, la UNC como referencia histórica sin uso en runtime y el guardado/reapertura con `exceljs` como alternativa descartada, sin que exista DD-14

### Requirement: Riesgos abiertos declarados explícitamente

La documentación DEBE (SHALL) registrar DD-07 como riesgo abierto con su decisor y su fase siguiente. IN-08 DEBE (SHALL) figurar como RESUELTA por las cinco decisiones aprobadas por el usuario en nombre de Velco, condicionada al ADR de C-13 y a la checklist manual firmada, con el tamaño de 577.125 bytes atribuido a `A - OP-MASTER.xlsx` y el de 994 bytes a `MASTER COSTEO NUEVO.xlsx`. La resolución de IN-08 NO DEBE (SHALL NOT) condicionarse a que la UNC resuelva ni considerarse cerrada sin firma cuando falte la checklist. NO DEBE (SHALL NOT) incluir IN-09 entre los riesgos abiertos.

#### Scenario: Spike Excel resuelto y condicionado

- **WHEN** se consulta el estado de IN-08
- **THEN** figura como RESUELTA por el usuario en nombre de Velco, condicionada al ADR de C-13 y a la firma de la checklist manual, con decisor y compuerta explícitos y sin exigir resolución de la UNC

#### Scenario: Sin resolución silenciosa del spike

- **WHEN** el gate automatizado está en verde pero no hay checklist firmada
- **THEN** el `verify-report.md` marca CRITICAL, C-13 no se archiva y C-15 permanece bloqueado

#### Scenario: Auth diferida

- **WHEN** se solicita código de PIN, login o RBAC durante el MVP
- **THEN** se rechaza por R5 y se exige aprobación humana explícita antes de cualquier implementación de autenticación

#### Scenario: IN-09 fuera de los riesgos abiertos

- **WHEN** se revisa la lista de riesgos abiertos
- **THEN** IN-09 no figura en ella por haber sido resuelta por el usuario como decisión definitiva sobre los documentos vigentes
