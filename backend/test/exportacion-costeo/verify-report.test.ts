import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');
const rutaReporte = join(raiz, 'openspec', 'changes', 'exportacion-costeo', 'verify-report.md');
const RUTA_C13 =
  'openspec/changes/archive/2026-11-26-excel-template-spike/verify-report.md';
const HASH_PLANTILLA_COSTEO =
  '1FA2DA0031D2A06BBAC506057F3679D77CA835D1EB70B8657F19D95A47649602';
const HASH_PLANTILLA_OP =
  '4154E5BAF8FB82B5BFD3FD48EE8C7AF8F05F5980E4EFA8627CB14562454F015A';
const HASH_SALIDA = '1D734C23BB0A368C0ACFCAAB9A74F66B40A95D73E01F3501692B29209D354D53';
const HASH_SHEET2_SALIDA = '6629E64CEA54A3CAE8538098C1AFF3DAA4E3B0EE12A1C8480832B078C4AE9EE2';
const VALORES_CELDA = [
  ['P13', '`8.00`'],
  ['R10', '`8.00`'],
  ['Q13:Q21', '`0.00`'],
  ['R40', '`15.00`'],
  ['R41', '`100.00`'],
  ['R59', '`115.00`'],
] as const;
const VALIDACIONES = [
  "openspec validate exportacion-costeo --strict → Change 'exportacion-costeo' is valid",
  'openspec validate --specs --strict → 45 passed, 0 failed (45 items)',
] as const;
const SECCIONES = [
  '## 1. Gate automático limitado a la hoja 1',
  '## 2. Cotejo del costeo generado en la hoja 1',
  '## 3. Registro de firma de la compuerta manual de C-14',
  '## 4. Compuerta propia de C-14, distinta de C-13 / GATE 11',
  '## 5. Hojas 2..5 y GENERAL: paso MANUAL pendiente',
  '## 6. Costeo histórico inexistente',
  '## 7. Veredicto y cierre',
] as const;
const EVIDENCIA_ENCABEZADO = '### Evidencia de verificación';
const CIERRE_ENCABEZADO = '### Cierre sin efectos fuera de alcance';
const REGRESION_ENCABEZADO =
  '### Regresión corregida: configuración Excel diferida al handler';
const REGRESION_TOKENS = [
  'registrarRutas.ts',
  'crearPuerto()',
  'plantilla_no_encontrada',
  '500',
  'sin filtrar rutas absolutas',
] as const;
const LENGUAJE_OBSOLETO = [
  '62 failed',
  '23 failed',
  '999.24s',
  'Bloqueo: los 62 fallos',
  '6.5 queda sin marcar',
  '6.5 permanece sin marcar',
] as const;
const SUITES_DIRIGIDAS =
  'Suites dirigidas tras la implementación: 33 archivos, 206 tests verdes, sin fallos.';

interface EvaluacionReporte {
  readonly gateHoja1: string;
  readonly firmado: string;
  readonly fecha: string;
  readonly versionExcel: string;
  readonly responsable: string;
  readonly representa: string;
  readonly hashes: boolean;
  readonly cotejoConforme: boolean;
  readonly firmaC14Propia: boolean;
  readonly manualPendiente: boolean;
  readonly compuertaDistintaDeC13: boolean;
  readonly sinCosteoHistorico: boolean;
  readonly veredicto: 'CONFORME' | 'CRITICAL';
}

function leerReporte(): string {
  return existsSync(rutaReporte) ? readFileSync(rutaReporte, 'utf8') : '';
}

function seccion(texto: string, inicio: string, fin: string): string {
  const desde = texto.indexOf(inicio);
  if (desde === -1) return '';
  const hasta = texto.indexOf(fin, desde + inicio.length);
  return hasta === -1 ? texto.slice(desde) : texto.slice(desde, hasta);
}

function valorCampo(texto: string, campo: string): string {
  const prefijo = `| \`${campo}\` | `;
  const linea = texto.split(/\r?\n/).find((textoLinea) => textoLinea.startsWith(prefijo));
  return linea === undefined ? '' : linea.slice(prefijo.length).replace(/ \|$/, '').trim();
}

function evaluar(reporte: string): EvaluacionReporte {
  const cotejo = seccion(reporte, '## 2.', '## 3.');
  const firma = seccion(reporte, '## 3.', '## 4.');
  const c13 = seccion(reporte, '## 4.', '## 5.');
  const manual = seccion(reporte, '## 5.', '## 6.');
  const historico = seccion(reporte, '## 6.', '## 7.');

  const cotejoConforme =
    VALORES_CELDA.every(([celda, valor]) => valorCampo(cotejo, celda) === valor) &&
    valorCampo(cotejo, 'cliente') === '`ACME Costeo S.A.`' &&
    valorCampo(cotejo, 'numeroOp') === '`OT-C14-001`' &&
    /FUERA DE LA HOJA `1`/.test(valorCampo(cotejo, 'horasVendidas')) &&
    cotejo.includes('perfecto ahora si coincide todo');

  const firmado = valorCampo(firma, 'firmado');
  const responsable = valorCampo(firma, 'responsable');
  const firmaC14Propia =
    firmado === 'SÍ' &&
    valorCampo(firma, 'fecha') === '2026-11-26' &&
    valorCampo(firma, 'versionExcel') === '2611' &&
    responsable === 'usuario firmante en representación de Velco' &&
    valorCampo(firma, 'representa') === 'Velco' &&
    valorCampo(firma, 'nombrePersonal').includes('NO DECLARADO') &&
    !firma.includes('Firmada por el usuario en nombre de Velco') &&
    !firma.includes('C-13/GATE 11');

  const manualPendiente =
    valorCampo(manual, 'hojas2a5').startsWith('PENDIENTE') &&
    valorCampo(manual, 'GENERAL').startsWith('PENDIENTE') &&
    valorCampo(manual, 'noEsFalloAutomatico').startsWith('SÍ');

  const compuertaDistintaDeC13 =
    c13.includes(RUTA_C13) &&
    c13.includes('NO se reabre') &&
    c13.includes('checklist');

  const sinCosteoHistorico =
    historico.includes('NO EXISTE') && historico.includes('costeo generado');

  const hashes =
    reporte.includes(HASH_PLANTILLA_COSTEO) &&
    reporte.includes(HASH_PLANTILLA_OP) &&
    reporte.includes(HASH_SALIDA) &&
    reporte.includes(HASH_SHEET2_SALIDA);

  const conforme =
    valorCampo(reporte, 'gateHoja1') === 'CONFORME' &&
    hashes &&
    cotejoConforme &&
    firmaC14Propia &&
    manualPendiente &&
    compuertaDistintaDeC13 &&
    sinCosteoHistorico;

  return {
    gateHoja1: valorCampo(reporte, 'gateHoja1'),
    firmado,
    fecha: valorCampo(firma, 'fecha'),
    versionExcel: valorCampo(firma, 'versionExcel'),
    responsable,
    representa: valorCampo(firma, 'representa'),
    hashes,
    cotejoConforme,
    firmaC14Propia,
    manualPendiente,
    compuertaDistintaDeC13,
    sinCosteoHistorico,
    veredicto: conforme ? 'CONFORME' : 'CRITICAL',
  };
}

const REPORT = leerReporte();
const ESTADO = evaluar(REPORT);

describe('C-14: cotejo del costeo generado y compuerta manual (5.4–5.6)', () => {
  it('5.4 limita el gate a la hoja 1 y coteja las celdas confirmadas por Velco', () => {
    expect(ESTADO.gateHoja1).toBe('CONFORME');
    expect(ESTADO.hashes).toBe(true);
    expect(ESTADO.cotejoConforme).toBe(true);
    expect(REPORT).toContain('xl/worksheets/sheet2.xml');
  });

  it('5.5 registra firma, fecha, versión y responsable sin inventar un nombre personal', () => {
    expect(ESTADO.firmado).toBe('SÍ');
    expect(ESTADO.fecha).toBe('2026-11-26');
    expect(ESTADO.versionExcel).toBe('2611');
    expect(ESTADO.responsable).toBe('usuario firmante en representación de Velco');
    expect(ESTADO.representa).toBe('Velco');
    expect(ESTADO.firmaC14Propia).toBe(true);
  });

  it.each([
    {
      caso: 'firma en blanco',
      reporte: REPORT.replace('| `firmado` | SÍ |', '| `firmado` |  |'),
      esperado: 'CRITICAL' as const,
    },
    {
      caso: 'casilla económica R59 alterada',
      reporte: REPORT.replace('| `R59` | `115.00` |', '| `R59` | `999.00` |'),
      esperado: 'CRITICAL' as const,
    },
    {
      caso: 'versión de Excel alterada',
      reporte: REPORT.replace('| `versionExcel` | 2611 |', '| `versionExcel` | 2610 |'),
      esperado: 'CRITICAL' as const,
    },
    {
      caso: 'fecha alterada',
      reporte: REPORT.replace('| `fecha` | 2026-11-26 |', '| `fecha` | 2026-11-25 |'),
      esperado: 'CRITICAL' as const,
    },
    {
      caso: 'responsable alterado',
      reporte: REPORT.replace(
        '| `responsable` | usuario firmante en representación de Velco |',
        '| `responsable` | otro responsable |',
      ),
      esperado: 'CRITICAL' as const,
    },
    {
      caso: 'firma de C-13 reutilizada como si fuera C-14',
      reporte: REPORT.replace(
        '| `responsable` | usuario firmante en representación de Velco |',
        '| `responsable` | Firmada por el usuario en nombre de Velco |',
      ),
      esperado: 'CRITICAL' as const,
    },
    {
      caso: 'hojas manuales fabricadas como completadas',
      reporte: REPORT.replace('| `hojas2a5` | PENDIENTE', '| `hojas2a5` | COMPLETADA'),
      esperado: 'CRITICAL' as const,
    },
    {
      caso: 'firma presente con hojas manuales pendientes',
      reporte: REPORT,
      esperado: 'CONFORME' as const,
    },
  ])('5.6 $caso → veredicto $esperado', ({ reporte, esperado }) => {
    expect(evaluar(reporte).veredicto).toBe(esperado);
  });
});

function compuertaC14Distinta(reporte: string): boolean {
  const c13 = seccion(reporte, '## 4.', '## 5.');
  return (
    c13.includes(RUTA_C13) &&
    c13.includes('está YA FIRMADA') &&
    c13.includes('permanece intacta') &&
    c13.includes('NO se reabre') &&
    c13.includes('NO es la firma de C-13/GATE 11')
  );
}

describe('C-14: verificación final y cierre sin archive (6.1–6.6)', () => {
  it('6.1 distingue la compuerta de C-14 de la checklist ya firmada de C-13', () => {
    expect(ESTADO.compuertaDistintaDeC13).toBe(true);
    expect(compuertaC14Distinta(REPORT)).toBe(true);
    expect(REPORT).toContain('GATE 11');
  });

  it('6.2 documenta todas las secciones exigidas y el resultado de las validaciones', () => {
    for (const encabezado of SECCIONES) {
      expect(REPORT, `falta la sección ${encabezado}`).toContain(encabezado);
    }
    for (const validacion of VALIDACIONES) {
      expect(REPORT, `falta la validación ${validacion}`).toContain(validacion);
    }
    expect(REPORT).toContain('**Veredicto**: gate automático CONFORME; llenado MANUAL PENDIENTE.');
  });

  it.each([
    {
      caso: 'firma ausente',
      reporte: REPORT.replace('| `firmado` | SÍ |', '| `firmado` |  |'),
      esperado: 'CRITICAL' as const,
    },
    {
      caso: 'versión, fecha y responsable alterados',
      reporte: REPORT.replace('| `versionExcel` | 2611 |', '| `versionExcel` | 2610 |')
        .replace('| `fecha` | 2026-11-26 |', '| `fecha` | 2026-11-25 |')
        .replace(
          '| `responsable` | usuario firmante en representación de Velco |',
          '| `responsable` | otro responsable |',
        ),
      esperado: 'CRITICAL' as const,
    },
    {
      caso: 'firma de C-13 presentada como C-14',
      reporte: REPORT.replace('| `firmado` | SÍ |', '| `firmado` | SÍ (C-13/GATE 11) |'),
      esperado: 'CRITICAL' as const,
    },
    {
      caso: 'hojas MANUALMENTE pendientes marcadas como completadas',
      reporte: REPORT.replace('| `GENERAL` | PENDIENTE', '| `GENERAL` | COMPLETADA'),
      esperado: 'CRITICAL' as const,
    },
    {
      caso: 'firma de C-14 con hojas pendientes',
      reporte: REPORT,
      esperado: 'CONFORME' as const,
    },
  ])('6.3 $caso → veredicto $esperado', ({ reporte, esperado }) => {
    expect(evaluar(reporte).veredicto).toBe(esperado);
  });

  it('6.3 falsificar la firma de C-13 como pendiente rompe la distinción de compuertas', () => {
    const mutado = REPORT.replace(
      'La checklist (a)–(g) de C-13 está YA FIRMADA',
      'La checklist (a)–(g) de C-13 está PENDIENTE',
    );
    expect(compuertaC14Distinta(mutado)).toBe(false);
    expect(compuertaC14Distinta(REPORT)).toBe(true);
  });

  it('6.4 registra ambos comandos de validación OpenSpec en verde', () => {
    for (const validacion of VALIDACIONES) {
      expect(REPORT, `falta la validación ${validacion}`).toContain(validacion);
    }
  });


  it('6.6 cierra sin archive, commit, push, build ni ediciones fuera de alcance', () => {
    expect(REPORT).toContain('sin build, commit, push ni archive');
    expect(REPORT).toContain('`CHANGES.md`');
    expect(REPORT).toContain('`AGENTS.md`');
    expect(REPORT).toContain('`CLAUDE.md`');
    expect(REPORT).toContain('`knowledge-base/`');
    expect(REPORT).toContain('`Docs/FichasExcel/`');
  });
});

interface EvidenciaFinal {
  readonly suiteCompletaVerde: boolean;
  readonly regresionDocumentada: boolean;
  readonly sinLenguajeObsoleto: boolean;
}

function evaluarEvidenciaFinal(reporte: string): EvidenciaFinal {
  const evidencia = seccion(reporte, EVIDENCIA_ENCABEZADO, CIERRE_ENCABEZADO);
  const regresion = seccion(reporte, REGRESION_ENCABEZADO, CIERRE_ENCABEZADO);
  return {
    suiteCompletaVerde:
      /92 passed files.*415 passed tests.*0 failures.*1039\.83s/.test(evidencia),
    regresionDocumentada:
      regresion.length > 0 && REGRESION_TOKENS.every((token) => regresion.includes(token)),
    sinLenguajeObsoleto: LENGUAJE_OBSOLETO.every((fragmento) => !reporte.includes(fragmento)),
  };
}

describe('C-14: evidencia final de la suite completa (6.5)', () => {
  it('6.5 documenta la suite completa en verde y la regresión de configuración corregida', () => {
    expect(REPORT).toContain(SUITES_DIRIGIDAS);
    const evidencia = evaluarEvidenciaFinal(REPORT);
    expect(evidencia.suiteCompletaVerde).toBe(true);
    expect(evidencia.regresionDocumentada).toBe(true);
    expect(evidencia.sinLenguajeObsoleto).toBe(true);
  });

  it.each([
    {
      caso: 'bloqueo obsoleto reintroducido',
      reporte: REPORT.replace(
        /- Suite completa del backend:.*$/m,
        '- Suite completa del backend: 62 failed | 351 passed; 6.5 queda sin marcar.',
      ),
    },
    {
      caso: 'sección de la regresión eliminada',
      reporte: REPORT.replace(REGRESION_ENCABEZADO, '### Sección eliminada'),
    },
    {
      caso: 'duración exitosa sustituida por la anterior',
      reporte: REPORT.replace('1039.83s', '999.24s'),
    },
  ])('6.5 TRIANGULATE $caso → evidencia final no conforme', ({ reporte }) => {
    const evidencia = evaluarEvidenciaFinal(reporte);
    expect(
      evidencia.suiteCompletaVerde &&
        evidencia.regresionDocumentada &&
        evidencia.sinLenguajeObsoleto,
    ).toBe(false);
  });
});
