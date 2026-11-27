# Verification Report — exportacion-costeo (C-14)

**Change**: `exportacion-costeo` (C-14)  
**Modo**: gate automático limitado a la hoja `1` más compuerta manual firmada del costeo generado  
**Decisor**: usuario en representación de Velco

## Veredicto final

**gateHoja1: CONFORME**. El veredicto de la compuerta automática es CONFORME y el llenado MANUAL de las hojas `2`..`5` y `GENERAL` queda PENDIENTE. La firma de C-14 es propia de este change y NO reabre la checklist ya firmada de C-13.

## 1. Gate automático limitado a la hoja 1

El alcance automatizado de C-14 es exclusivamente la hoja `1` del costeo, pieza OOXML `xl/worksheets/sheet2.xml`. El resto de las piezas se conserva byte-a-byte según el gate por hash y el diff controlado.

| Campo | Valor |
|---|---|
| `gateHoja1` | CONFORME |
| pieza gobernada | `xl/worksheets/sheet2.xml` (hoja `1`) |
| archivo generado | `COSTEO_OT-C14-001_ACME Costeo S.A.xlsx` |
| SHA-256 `Docs/FichasExcel/MASTER COSTEO NUEVO.xlsx` | `1FA2DA0031D2A06BBAC506057F3679D77CA835D1EB70B8657F19D95A47649602` |
| SHA-256 `Docs/FichasExcel/A - OP-MASTER.xlsx` | `4154E5BAF8FB82B5BFD3FD48EE8C7AF8F05F5980E4EFA8627CB14562454F015A` |
| SHA-256 del `.xlsx` generado | `1D734C23BB0A368C0ACFCAAB9A74F66B40A95D73E01F3501692B29209D354D53` |
| SHA-256 de `xl/worksheets/sheet2.xml` en la plantilla | `191B20ACDB15A9312E5EC579A0F2DB7677CC9DCBC766E49AF6C0E5A96C002772` |
| SHA-256 de `xl/worksheets/sheet2.xml` en la salida | `6629E64CEA54A3CAE8538098C1AFF3DAA4E3B0EE12A1C8480832B078C4AE9EE2` |

El costeo se generó desde una OP real con PostgreSQL 18.7 en contenedor, sin mocks, y el `Buffer` pasó `exigirGateConforme(verificarCosteo(...))`. La salida quedó registrada en `C:\Users\navar\AppData\Local\Temp\opencode\costeo-c14\`.

## 2. Cotejo del costeo generado en la hoja 1

| Celda o dato | Valor cotejado |
|---|---|
| `P13` | `8.00` |
| `R10` | `8.00` |
| `Q13:Q21` | `0.00` |
| `R40` | `15.00` |
| `R41` | `100.00` |
| `R59` | `115.00` |
| `cliente` | `ACME Costeo S.A.` |
| `numeroOp` | `OT-C14-001` |
| `horasVendidas` | FUERA DE LA HOJA `1` — solo modelo/comparativa |

El usuario abrió el `.xlsx` regenerado en Excel 2611 y confirmó, en nombre de Velco: "perfecto ahora si coincide todo". El cotejo cubrió ÚNICAMENTE la hoja `1`; no se cotejaron las hojas `2`..`5` ni `GENERAL`. `horasVendidas` no se escribe en la hoja de costeo: permanece en el modelo semántico y en la comparativa.

## 3. Registro de firma de la compuerta manual de C-14

| Campo | Valor |
|---|---|
| `firmado` | SÍ |
| `fecha` | 2026-11-26 |
| `versionExcel` | 2611 |
| `responsable` | usuario firmante en representación de Velco |
| `representa` | Velco |
| `nombrePersonal` | NO DECLARADO — el usuario no declaró un nombre personal; no se inventa uno |

El usuario confirmó: "si confirmo mi firma en representacion de velco". Sin `firmado: SÍ`, el veredicto sería CRITICAL y la evidencia no se aceptaría para cerrar C-14. El llenado MANUAL pendiente de otras hojas NO convierte en CRITICAL esta compuerta.

## 4. Compuerta propia de C-14, distinta de C-13 / GATE 11

La compuerta manual de C-14 valida el costeo generado a partir de datos reales de una OP. Es distinta de la checklist (a)–(g) ya firmada de C-13, que validó preservación OOXML y habilitó GATE 11.

- Referencia: `openspec/changes/archive/2026-11-26-excel-template-spike/verify-report.md`.
- La checklist (a)–(g) de C-13 está YA FIRMADA, permanece intacta y NO se reabre ni se reemplaza con esta firma.
- Esta firma NO es la firma de C-13/GATE 11: la firma de C-14 no se reutiliza como firma de C-13, ni la firma de C-13 se reutiliza como firma de C-14.

## 5. Hojas 2..5 y GENERAL: paso MANUAL pendiente

| Campo | Valor |
|---|---|
| `hojas2a5` | PENDIENTE — completación MANUAL por Velco (`sheet3.xml`..`sheet6.xml`) |
| `GENERAL` | PENDIENTE — completación MANUAL por Velco (`sheet1.xml`) |
| `noEsFalloAutomatico` | SÍ — NO es fallo CRITICAL de la compuerta automática de C-14 |

El usuario declaró: "por ahora no voy a completar las hojas manualmente vamos a dejar esa parte para después". Las piezas `sheet1.xml` y `sheet3.xml`..`sheet6.xml` permanecen byte-a-byte idénticas a la plantilla oficial. Este paso MANUAL queda documentado y NO constituye un fallo automático ni una fabricación de completación.

## 6. Costeo histórico inexistente

NO EXISTE costeo histórico de Velco. La comparativa se realizó contra el costeo generado y verificado por Velco en la hoja `1`; no se inventa evidencia histórica.

## 7. Veredicto y cierre

**Veredicto**: gate automático CONFORME; llenado MANUAL PENDIENTE.

La evidencia automatizada y la firma de C-14 se aceptan para el gate automático; la firma ausente habría dejado el veredicto en CRITICAL.

### Evidencia de verificación

- `openspec validate exportacion-costeo --strict → Change 'exportacion-costeo' is valid`
- `openspec validate --specs --strict → 45 passed, 0 failed (45 items)`
- Typecheck: `npm run typecheck` limpio para `packages/domain`, `@velco/backend` y `@velco/frontend`.
- Línea base de suites dirigidas (`test/exportacion-costeo/` + `test/excel-template-spike/`): 32 archivos, 185 tests verdes, sin fallos preexistentes.
- Suites dirigidas tras la implementación: 33 archivos, 206 tests verdes, sin fallos.
- Hashes de las plantillas oficiales verificados antes y después: `1FA2DA0031D2A06BBAC506057F3679D77CA835D1EB70B8657F19D95A47649602` y `4154E5BAF8FB82B5BFD3FD48EE8C7AF8F05F5980E4EFA8627CB14562454F015A`.
- Suite completa del backend: 92 passed files | 415 passed tests | 0 failures | duración 1039.83s. La suite completa terminó sin fallos y la verificación 6.5 quedó cerrada.

### Regresión corregida: configuración Excel diferida al handler

Tras la redacción original se corrigió una regresión real en `backend/src/features/exportacion/http/registrarRutas.ts`: el puerto de configuración Excel ahora se resuelve de forma diferida dentro del handler (`crearPuerto()`) y no al registrar las rutas. Un entorno sin `EXCEL_TEMPLATES_DIR` ya no rompe `buildApp` ni contamina las suites preexistentes: la ausencia se traduce al contrato tipado 500 `plantilla_no_encontrada`, sin filtrar rutas absolutas ni la UNC histórica en el mensaje.

### Cierre sin efectos fuera de alcance

Cierre sin build, commit, push ni archive; sin ediciones de `CHANGES.md`, `AGENTS.md`, `CLAUDE.md`, `knowledge-base/`, `Docs/FichasExcel/` ni de otros changes. La tarea 6.5 está marcada y verificada con la suite completa del backend terminada sin fallos.
