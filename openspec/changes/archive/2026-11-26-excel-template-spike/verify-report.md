# Verification Report — excel-template-spike (C-13)

**Fecha**: 2026-11-26  
**Change**: `excel-template-spike`  
**Modo**: análisis con gate automático y checklist manual FIRMADA  
**Compuerta humana**: FIRMADO — usuario en nombre de Velco (2026-11-26)  
**Decisor: usuario en nombre de Velco**

## Veredicto final

**READY FOR ARCHIVE / compuerta cumplida**

El gate automático verifica estructura, hashes, celdas autorizadas y texto plano. La checklist (a)–(g) fue ejecutada y confirmada por el usuario en nombre de Velco el 2026-11-26 con la versión de Excel 2611. En consecuencia, quedan habilitados el archive de C-13 y GATE 11 de C-14; C-15 permanece bloqueado hasta completar C-14.

El ADR `adr/estrategia-escritura-excel.md` documenta la estrategia. Con checklist firmada por el usuario en nombre de Velco, el ADR habilita el archive de C-13 y GATE 11 de C-14; el ADR por sí solo no cambia el veredicto de `verify-report.md`. Ahora el reporte refleja esa frase firmada.

### Checklist manual (a)–(g)

| Casilla | Verificación | Estado |
|---|---|---|
| (a) | Apertura en Excel sin aviso de reparación | CONFIRMADA por el usuario en nombre de Velco |
| (b) | Sin pérdida de merges ni advertencias de contenido | CONFIRMADA por el usuario en nombre de Velco |
| (c) | `_xlnm.Print_Area` visible como `'1640'!$A:$S` | CONFIRMADA por el usuario en nombre de Velco |
| (d) | `ID Plano:` correcto en `O7`, con `ID Plano: S/P` cuando corresponda | CONFIRMADA por el usuario en nombre de Velco |
| (e) | costos, horas y márgenes coherentes en la vista de Excel | CONFIRMADA por el usuario en nombre de Velco |
| (f) | variante operativa sin importes expuestos | CONFIRMADA por el usuario en nombre de Velco; sin `costeo-sin-importes.xlsx` porque el patcher aún no expone `incluirMargenes`; soporte explícito queda para C-14/C-15 |
| (g) | Registro de fecha de ejecución en la firma manual | CONFIRMADA por el usuario en nombre de Velco |

| Campo | Valor |
|---|---|
| Firma | Firmada por el usuario en nombre de Velco |
| Fecha de ejecución | 2026-11-26 |
| Versión de Excel | 2611 |
| Responsable | Usuario en nombre de Velco |

El usuario revisó los `.xlsx` generados en `C:\Users\navar\AppData\Local\Temp\opencode\c13-validacion-manual\`: `costeo-ejemplo.xlsx`, `op-con-plano.xlsx` y `op-sin-plano.xlsx`. No se generó `costeo-sin-importes.xlsx` por falta de flag en el patcher; la casilla (f) quedó cubierta por confirmación del usuario en nombre de Velco.

### Gate automático

- Comparación de todas las piezas del zip por hash: sin piezas faltantes, nuevas o no autorizadas.
- Diff controlado: hoja, celda, valor esperado y valor obtenido para cada una de las 12 celdas maestras más `O7`.
- `xl/externalLinks/externalLink1.xml` y `xl/printerSettings/printerSettings1.bin` protegidos contra cualquier cambio.
- `_xlnm.Print_Area` exigido como `'1640'!$A:$S`; se rechaza `$ANaN:$SNaN`.
- Texto plano verificado en `O7` con `J7:N8` intacto (`PC N°: `).
- Validación OpenSpec aislada del repositorio: change válido y specs válidas; mutaciones de prueba ejecutadas solo en directorio temporal.
- Safety net inicial del spike: 16 archivos, 81 tests verdes; sin fallos preexistentes. Cierre del apply: 16 archivos, 85 tests verdes. Las plantillas oficiales conservan sus hashes SHA-256 antes y después de la ejecución.

### Compuerta de archive y GATE 11

La firma manual real del usuario en nombre de Velco quedó registrada el 2026-11-26 con Excel 2611. El archive de C-13 y GATE 11 de C-14 están habilitados; C-15 sigue bloqueado hasta completar C-14; no se ejecuta archive, build, commit ni push en esta tranche.

El procedimiento de cierre es `openspec verify` y posterior archive; sin ejecutar build, commit, push ni archive en esta tranche. El archive queda para el flujo OPSX posterior si el usuario lo solicita explícitamente.

### Precedente

Se sigue el formato de `openspec/changes/archive/2026-11-25-desvios-y-margen-domain/verify-report.md`, ahora con la compuerta humana firmada.

## Cierre

La implementación automatizada está completa, verificada y la compuerta humana está cumplida; el veredicto es **READY FOR ARCHIVE / compuerta cumplida** y el archive no se ejecuta en esta tranche.
