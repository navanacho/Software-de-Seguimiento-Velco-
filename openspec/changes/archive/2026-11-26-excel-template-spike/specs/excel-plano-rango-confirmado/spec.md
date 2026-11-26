## ADDED Requirements

### Requirement: Confirmación del rango O7:R8 en la plantilla real

El spike DEBE (SHALL) inspeccionar `Docs/FichasExcel/A - OP-MASTER.xlsx` y verificar que la celda maestra `O7` del merge `O7:R8` está vacía con estilo `s="73"`, que `J7:N8` contiene `PC N°: ` con espacio final y que los literales `ID Plano:` y `S/P` no existen en la plantilla. La etiqueta y el literal DEBEN (SHALL) generarse como dato del exportador. El rango `J7:N8` NO DEBE (SHALL NOT) usarse para el plano. Si la verificación falla, DEBE (SHALL) reportarse un bloqueo explícito para `C-15` en lugar de inventar la celda (DD-11, RN-EXPORT-08, IN-08).

#### Scenario: Celda maestra y combinación confirmadas

- **WHEN** se inspecciona la plantilla real de OP-MASTER
- **THEN** se registra como evidencia que `O7:R8` está combinada, `O7` es `<c r="O7" s="73"/>` y `J7:N8` contiene `PC N°: `, mientras `ID Plano:` y `S/P` no figuran en `sharedStrings.xml`

#### Scenario: Etiqueta generada por el exportador

- **WHEN** se construye la salida con un plano
- **THEN** el texto `ID Plano: ` se genera como dato del exportador sin modificar la plantilla de origen ni `sharedStrings.xml`

#### Scenario: Rango alternativo detectado

- **WHEN** `O7:R8` no está combinada o `J7:N8` no dice `PC N°: `
- **THEN** se documenta la discrepancia, el mapeo de `C-15` queda bloqueado y no se escribe ninguna celda derivada de un supuesto

### Requirement: Escritura de `ID Plano: <valor>` o `ID Plano: S/P`

Cuando el rango esté confirmado, el adaptador DEBE (SHALL) escribir en la celda maestra `O7` el texto exacto `ID Plano: <codigoPlano>` si el valor normalizado no es `null`, o `ID Plano: S/P` si lo es. DEBE (SHALL) escribir con `t="inlineStr"` y conservar el estilo `s="73"` y el merge `O7:R8`. NO DEBE (SHALL NOT) modificar `J7:N8`, modificar `sharedStrings.xml`, agregar el prefijo `PL-` ni normalizar el valor en la capa de Excel: el dominio ya aplica `trim()` + `toUpperCase()` y convierte la cadena vacía en `null` (DD-11, RN-OP-05/06, RN-EXPORT-08, R2).

#### Scenario: OP con ID de plano

- **WHEN** `codigo_plano` es `PL-2026-045` y el rango está confirmado
- **THEN** `O7` contiene exactamente `ID Plano: PL-2026-045` con `t="inlineStr"`, y `J7:N8` permanece con `PC N°: ` sin cambios

#### Scenario: OP sin ID de plano

- **WHEN** `codigo_plano` es `null` y el rango está confirmado
- **THEN** `O7` contiene exactamente `ID Plano: S/P` y `J7:N8` permanece intacto

#### Scenario: Cadena vacía normalizada en el dominio

- **WHEN** el valor de entrada es `'   '` y el dominio lo normaliza a `null`
- **THEN** `O7` contiene exactamente `ID Plano: S/P` y no se duplica el prefijo `PL-`

#### Scenario: Confirmación pendiente

- **WHEN** el spike no ha confirmado el rango sobre la plantilla real
- **THEN** no se escribe plano en ninguna celda y se reporta el bloqueo a `C-15` con la evidencia disponible
