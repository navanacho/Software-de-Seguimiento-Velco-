## Context

Velco necesita exportar dos planillas oficiales con continuidad contable y operativa. DD-02 se enmienda: la escritura será un parche OOXML quirúrgico y `exceljs` 4.4.0 queda reducido a lectura/verificación. La evidencia OOXML real mostró que el enlace de 577.125 bytes vive en `A - OP-MASTER.xlsx` (`xl/externalLinks/externalLink1.xml`, Target `/COMERCIAL/FG48%20-%20FACTURACION%20REGISTRO.xlsx`) y que el de `MASTER COSTEO NUEVO.xlsx` mide 994 bytes (Target `file:///K:\COMERCIAL\...COSTEO MASTER - PETROLERA EL TREBOL - MENDOZA.xlsx`). La UNC `\\Servidor\g\OPERACIONES\ORDENES DE PROCESO\OP - DIGITALIZADA\` no resuelve y aparece solo como `x15ac:absPath` en `xl/workbook.xml` de OP. `O7:R8` está vacío con estilo `s="73"` y `J7:N8` contiene `PC N°: ` con espacio final; la etiqueta `ID Plano:` y el literal `S/P` no existen en la plantilla y los genera el exportador. Stack solo TypeScript (R4), dominio puro (R2), sin derivados persistidos (R3). Governance: **MEDIO**, con las cinco decisiones ya aprobadas por el usuario en nombre de Velco.

## Goals / Non-Goals

**Goals:**
- Demostrar con TDD estricto que el parche OOXML modifica solo las celdas autorizadas y conserva byte-a-byte el resto del paquete.
- Reemplazar las 12 fórmulas `[1]` por valores estáticos de BD, conservando `externalLinks/*` como metadata histórica.
- Confirmar `O7` como celda maestra del texto `ID Plano: <valor>` / `ID Plano: S/P` con `inlineStr`, sin tocar `sharedStrings.xml` ni `J7:N8`.
- Fijar el error operativo 500 cuando falte una plantilla, sin workbook generado desde cero.
- Documentar la enmienda de DD-02 y la resolución condicionada de IN-08 en el ADR del change, sin DD-14.
- Ejecutar el gate automatizado y dejar la checklist manual firmada como compuerta de archive y de GATE 11 de C-14.

**Non-Goals:**
- Implementar los exportadores completos de `C-14`/`C-15`, sus endpoints de producción ni el MAP dominio → celdas definitivo.
- Eliminar `EXCEL_UNC_BASE`, usar la UNC como fuente o modificar `x15ac:absPath`.
- Crear DD-14, editar `openspec/specs/`, `AGENTS.md` o `CLAUDE.md` ni marcar tareas/archivar el change en esta enmienda.
- Persistir derivados (R3), agregar auth/RBAC (R5), introducir Python en runtime (R4) ni usar PostgreSQL (R10 no aplica).

## Decisions

- **D1 — Slice técnico confinado al adaptador; UNC histórica.** Tests en `backend/test/excel-template-spike/` y código de soporte en `backend/src/features/exportacion/excel/`. `EXCEL_UNC_BASE` sigue documentado como referencia histórica, sin uso en runtime; la exportación produce el mismo resultado con la variable definida o ausente, y no hay error de configuración por su ausencia. El `absPath` se conserva byte-idéntico. *Alternativas:* spike en Python/openpyxl (R4); eliminar la variable (excede scope y toca el spec de C-01); fijar la UNC en código o tests (rompe portabilidad).
- **D2 — Parche OOXML quirúrgico con comparación por hash de piezas.** Se copia la plantilla y se sustituye solo el par `<f>…</f><v>…</v>` por `<v>` con datos de BD en 12 celdas maestras; se recomprime el ZIP. El gate compara por hash TODAS las piezas OOXML y, cuando una difiere, exige un diff controlado que solo puede contener las 12 celdas autorizadas y, cuando corresponda, `O7`. El inventario semántico por sí solo daba falso positivo: 0 diferencias en 1.366 y 23.013 celdas, aunque se perdieron `externalLinks`, `calcChain` y `printerSettings1.bin` y `_xlnm.Print_Area` pasó de `'1640'!$A:$S` a `$ANaN:$SNaN`. *Alternativas:* escribir con `exceljs` (descartada; OP 136.961 → 21.288 B, −84,5 %; costeo 273.751 → 311.479 B, +13,8 %); diff binario del ZIP (ruido de empaquetado); solo inventario semántico (falso positivo demostrado).
- **D3 — Enlace externo conservado como metadata, nunca como fuente.** El archivo de 577.125 bytes está en OP; el de costeo mide 994 bytes. Se conservan `externalLinks/*` byte-a-byte por fidelidad de formato y se reemplazan las 12 fórmulas `[1]` por valores estáticos de BD: el inventario de `[1]` en esas celdas pasa de 12 a 0 y no se introduce ninguna referencia nueva fuera de ellas. *Alternativas:* eliminar el enlace (rompe metadata histórica); versionar el archivo enlazado (peso y licencia); seguir consumiendo `[1]` (dependencia externa en runtime).
- **D4 — Error de plantilla ausente como contrato único.** Error tipado `plantilla_no_encontrada` con mensaje operativo que nombra la plantilla esperada, sin exponer rutas absolutas ni UNC; se traduce a HTTP 500 sin `Content-Disposition`. Nunca se invoca un constructor de workbook vacío como fallback (RN-EXPORT-02, Flujo 6, R6). *Alternativas:* generar plantilla mínima (R6); devolver 404 (describe un recurso de API inexistente, no un fallo operativo).
- **D5 — `O7` como celda maestra con etiqueta generada.** En la hoja `1640`, `O7` recibe `ID Plano: <codigoPlano>` o `ID Plano: S/P` con `t="inlineStr"`; se conservan el merge `O7:R8` y `s="73"`, y `J7:N8` permanece con `PC N°: ` intacto. El dominio ya aplica `trim()` + `toUpperCase()` y vacío ⇒ `null`; el exportador no agrega prefijo `PL-`. *Alternativas:* escribir valor pelado (incumple RN-EXPORT-08 y CHANGES.md C-15); usar `J7:N8` (celda equivocada); modificar `sharedStrings.xml` (riesgo de romper la plantilla).
- **D6 — Gobernanza MEDIO con compuerta humana.** Las cinco decisiones están aprobadas por el usuario en nombre de Velco y se registran en el ADR con Estado, Contexto, Decisión, Alternativas, Justificación, Trade-offs y Trazabilidad. DD-02 queda enmendada, IN-08 resuelta y condicionada al ADR y a la firma de la checklist, sin crear DD-14. El archive de C-13 y GATE 11 de C-14 requieren esa firma. *Alternativas:* cerrar con evidencia automática únicamente (no prueba renderizado en Excel ni coincidencia contable); decidir sin aprobación (excede governance MEDIO).
- **D7 — Validación en doble capa.** Capa automática: hash de todas las piezas OOXML salvo el diff controlado, merges/estilos, inventario `[1]` antes 12 → 0 en celdas reemplazadas, `O7` y `J7:N8`, error 500 sin workbook y `openspec validate --strict`. Capa manual: checklist en Excel firmada por el usuario en nombre de Velco con (a) apertura sin aviso de reparación, (b) merges/encabezados/bloques/logo, (c) área de impresión `'1640'!$A:$S` e impresión/PDF, (d) `ID Plano: …` / `S/P` en `O7` y `PC N°:` intacto en `J7:N8`, (e) costos/horas/márgenes contra un costeo real de Velco, (f) variante operativa sin importes, (g) registro con fecha, versión de Excel y responsable adjunto al `verify-report.md`. Sin checklist, el reporte marca CRITICAL, no se archiva C-13 ni se habilita C-15. Se ejecuta `openspec verify` antes del archive, con el precedente de `openspec/changes/archive/2026-11-25-desvios-y-margen-domain/verify-report.md`. *Alternativas:* solo gate automático (no cubre apertura real en Excel); solo revisión manual (no repetible ni auditable).

## Risks / Trade-offs

- **[El parche modifica una pieza no autorizada] →** comparación por hash de todas las piezas y diff controlado; toda diferencia no declarada falla el gate.
- **[El comparador semántico vuelve a dar falso positivo] →** TRIANGULATE con casos inyectados en `externalLink1.xml` y `printerSettings1.bin`, además del caso de éxito.
- **[La apertura en Excel revela daño no detectable por hash] →** checklist manual firmada como compuerta; sin firma, CRITICAL y sin archive.
- **[La UNC no resuelve] →** no es insumo de runtime; se documenta como referencia histórica y se conserva `absPath` byte-idéntico; su inaccesibilidad no bloquea el spike por sí sola.
- **[El literal `ID Plano:` o `S/P` se escribe como valor pelado] →** aserción exacta sobre `O7` con `inlineStr` y `J7:N8` inmutable en al menos dos casos.
- **[Falsos positivos por comparar la copia contra sí misma] →** SAFETY NET: hashes de las plantillas originales antes de escribir, copias en directorio temporal por test y verificación de que `Docs/FichasExcel/` no cambia.
- **[Dependencia de `exceljs` en el dominio] →** el patcher vive en el adaptador; test de aislamiento de `packages/domain/` (R2, R9).
- **[Extensión accidental a endpoints de producción] →** el contrato HTTP 500 se valida con un doble de ruta; los endpoints reales pertenecen a `C-14`/`C-15`.

## Migration Plan

Sin migración de base de datos ni cambios de esquema. Secuencia del `apply`: (1) SAFETY NET e inventario de solo lectura; (2) RED de hash y parche en costeo; (3) GREEN y TRIANGULATE del patcher; (4) RED/GREEN/TRIANGULATE del patcher de OP y de `O7`; (5) RED/GREEN/TRIANGULATE de enlace, UNC, plantilla ausente y error 500; (6) ADR con DD-02 enmendada e IN-08 condicionada; (7) gate automatizado y `openspec verify`; (8) checklist manual firmada, `verify-report.md` y archive. Rollback: descartar copias temporales y mantener CRITICAL si falta evidencia o firma.

## Open Questions

Ninguna pendiente para C-13. Las cinco preguntas quedaron resueltas por el usuario en nombre de Velco:

| Tema | Resolución |
|---|---|
| Enlace externo | Conservar `externalLinks/*` byte-a-byte; 577.125 B en OP y 994 B en costeo; 12 `[1]` neutralizados con valores de BD |
| Estrategia de escritura | Parche OOXML quirúrgico; `exceljs` solo lectura/verificación |
| Plano | `O7` = `ID Plano: <valor>` / `ID Plano: S/P` con `inlineStr`; `J7:N8` intacto |
| UNC | Referencia histórica sin uso en runtime; variable no eliminada; `absPath` byte-idéntico |
| Validación | Doble capa; checklist manual firmada como compuerta de archive y GATE 11 |
