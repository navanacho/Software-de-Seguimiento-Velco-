## ADDED Requirements

### Requirement: Informe/ADR con evidencia y alternativas

El change DEBE (SHALL) producir un informe/ADR con las secciones Estado, Contexto, Decisión, Alternativas, Justificación, Trade-offs y Trazabilidad. DEBE (SHALL) incluir la evidencia del parche OOXML, de la comparación por hash, del enlace externo, de la UNC histórica, del mapeo de `O7`, del error 500 y de la doble capa de validación. DEBE (SHALL) evaluar expresamente el parche quirúrgico elegido, la conservación de `[1]` como dependencia activa, la eliminación del enlace y el guardado/reapertura con `exceljs` como alternativa descartada. NO DEBE (SHALL NOT) crear DD-14 ni presentar como pendientes las cinco decisiones ya aprobadas por el usuario en nombre de Velco.

#### Scenario: Estructura completa del informe

- **WHEN** se abre el informe/ADR del spike
- **THEN** contiene las siete secciones exigidas y referencias a los tests y al `verify-report.md` que respaldan cada hallazgo

#### Scenario: Alternativas evaluadas con evidencia

- **WHEN** se documenta el mecanismo de escritura y el destino de los enlaces
- **THEN** figuran el parche OOXML con valores estáticos, la conservación activa de `[1]`, la eliminación del enlace y el guardado/reapertura con `exceljs`, cada una con sus trade-offs y con la segunda y la tercera marcadas como descartadas

#### Scenario: Atribución correcta del enlace grande

- **WHEN** se consulta la evidencia de los enlaces externos
- **THEN** el de 577.125 bytes figura en `A - OP-MASTER.xlsx` con Target `/COMERCIAL/FG48%20-%20FACTURACION%20REGISTRO.xlsx`, y el de `MASTER COSTEO NUEVO.xlsx` figura con 994 bytes y su Target `file:///K:\COMERCIAL\...`

#### Scenario: Decisión aprobada sin nueva decisión duplicada

- **WHEN** se consulta el estado de DD-02 en el ADR
- **THEN** aparece enmendada con el parche OOXML y `exceljs` solo para lectura, sin crear DD-14

### Requirement: Mitigación y compuerta antes de C-14

El informe DEBE (SHALL) describir la mitigación aplicada antes de `C-14`: parche OOXML, `externalLinks/*` conservados, 12 `[1]` neutralizados y UNC sin uso en runtime. La compuerta NO DEBE (SHALL NOT) exigir que la UNC resuelva. El spike solo DEBE (SHALL) cerrarse cuando el gate automatizado esté en verde y la checklist manual esté firmada por el usuario en nombre de Velco; esa firma es además compuerta de GATE 11 de C-14.

#### Scenario: Spike cerrado

- **WHEN** pasan todos los tests de contrato, `openspec verify` se ejecutó y la checklist manual firmada está adjunta al `verify-report.md`
- **THEN** el informe registra la mitigación previa a `C-14` y marca habilitados el archive de C-13 y GATE 11 de C-14

#### Scenario: Spike no cerrado por falta de firma

- **WHEN** algún test de contrato falla o no hay checklist firmada por el usuario en nombre de Velco
- **THEN** el informe marca la compuerta como bloqueada, detalla el motivo y no habilita C-15

#### Scenario: UNC no resoluble no bloquea

- **WHEN** la UNC histórica no resuelve desde el host
- **THEN** se documenta la limitación, se conserva `x15ac:absPath` byte-idéntico y el spike NO DEBE marcarse como bloqueado por ese solo motivo

### Requirement: Registro explícito del estado de DD-02 e IN-08

El informe DEBE (SHALL) registrar DD-02 como enmendada al parche OOXML quirúrgico con `exceljs` solo para lectura/verificación. IN-08 DEBE (SHALL) figurar como RESUELTA por las cinco decisiones aprobadas, condicionada al ADR y a la firma humana de la checklist; el decisor es el usuario en nombre de Velco (2026-11-26). NO DEBE (SHALL NOT) registrarse como resuelta en silencio ni como abierta por la UNC.

#### Scenario: DD-02 enmendada

- **WHEN** se consulta DD-02 en el ADR y en la documentación canónica
- **THEN** constan el parche OOXML, la conservación byte-a-byte de piezas, el `exceljs` de solo lectura, `ID Plano:` en `O7`, los tamaños 577.125 B en OP y 994 B en costeo, y la UNC histórica sin uso en runtime

#### Scenario: IN-08 resuelta y condicionada

- **WHEN** se consulta IN-08
- **THEN** figura como RESUELTA, con decisor el usuario en nombre de Velco, condicionada al ADR y a la compuerta humana, sin crear DD-14

#### Scenario: Sin resolución silenciosa

- **WHEN** el gate automático está en verde pero falta la firma de la checklist
- **THEN** IN-08 no se presenta como cerrada operativamente y el `verify-report.md` marca CRITICAL
