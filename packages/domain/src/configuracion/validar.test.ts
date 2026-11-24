import { describe, expect, it } from 'vitest';
import { validarConfiguracion } from './validar.ts';

const entradaValida = {
  valorHoraEstandar: '1250.50',
  diasAlertaRiesgo: 3,
  porcentajeAvanceRiesgo: 80,
  etapasDefault: ['Corte', 'Soldadura'],
};

describe('validarConfiguracion', () => {
  it('acepta rangos válidos y conserva el decimal exacto', () => {
    const resultado = validarConfiguracion(entradaValida);
    expect(resultado).toEqual({
      valido: true,
      valores: {
        valorHoraEstandar: '1250.50',
        diasAlertaRiesgo: 3,
        porcentajeAvanceRiesgo: 80,
        etapasDefault: ['Corte', 'Soldadura'],
      },
    });
  });

  it('acepta los límites inclusive y normaliza a dos decimales', () => {
    const resultado = validarConfiguracion({
      ...entradaValida,
      valorHoraEstandar: '0',
      diasAlertaRiesgo: 0,
      porcentajeAvanceRiesgo: 100,
      etapasDefault: ['Entrega'],
    });
    expect(resultado).toEqual({
      valido: true,
      valores: {
        valorHoraEstandar: '0.00',
        diasAlertaRiesgo: 0,
        porcentajeAvanceRiesgo: 100,
        etapasDefault: ['Entrega'],
      },
    });
  });

  it('rechaza valor hora negativo y con más de dos decimales', () => {
    const negativo = validarConfiguracion({ ...entradaValida, valorHoraEstandar: '-1.00' });
    const exceso = validarConfiguracion({ ...entradaValida, valorHoraEstandar: '12.345' });
    expect(negativo.valido).toBe(false);
    expect(exceso.valido).toBe(false);
    if (!negativo.valido) expect(negativo.errores.map((e) => e.campo)).toContain('valorHoraEstandar');
    if (!exceso.valido) expect(exceso.errores.map((e) => e.campo)).toContain('valorHoraEstandar');
  });

  it('rechaza días negativos y porcentaje fuera de [0, 100]', () => {
    const dias = validarConfiguracion({ ...entradaValida, diasAlertaRiesgo: -1 });
    const bajo = validarConfiguracion({ ...entradaValida, porcentajeAvanceRiesgo: -1 });
    const alto = validarConfiguracion({ ...entradaValida, porcentajeAvanceRiesgo: 101 });
    expect(dias.valido).toBe(false);
    expect(bajo.valido).toBe(false);
    expect(alto.valido).toBe(false);
    if (!dias.valido) expect(dias.errores.map((e) => e.campo)).toContain('diasAlertaRiesgo');
    if (!bajo.valido) expect(bajo.errores.map((e) => e.campo)).toContain('porcentajeAvanceRiesgo');
    if (!alto.valido) expect(alto.errores.map((e) => e.campo)).toContain('porcentajeAvanceRiesgo');
  });

  it('TRIANGULA: rechaza plantilla vacía y nombres vacíos', () => {
    const vacia = validarConfiguracion({ ...entradaValida, etapasDefault: [] });
    const nombreVacio = validarConfiguracion({ ...entradaValida, etapasDefault: ['Corte', '  '] });
    expect(vacia.valido).toBe(false);
    expect(nombreVacio.valido).toBe(false);
    if (!vacia.valido) expect(vacia.errores.map((e) => e.campo)).toContain('etapasDefault');
    if (!nombreVacio.valido) expect(nombreVacio.errores.map((e) => e.campo)).toContain('etapasDefault.1');
  });

  it('TRIANGULA: rechaza nombre de más de 100 caracteres y duplicados sin distinguir mayúsculas', () => {
    const largo = validarConfiguracion({ ...entradaValida, etapasDefault: ['x'.repeat(101)] });
    const duplicado = validarConfiguracion({ ...entradaValida, etapasDefault: ['Corte', 'CORTE'] });
    expect(largo.valido).toBe(false);
    expect(duplicado.valido).toBe(false);
    if (!largo.valido) expect(largo.errores.map((e) => e.campo)).toContain('etapasDefault.0');
    if (!duplicado.valido) expect(duplicado.errores.map((e) => e.campo)).toContain('etapasDefault.1');
  });

  it('TRIANGULA: normaliza espacios y conserva el orden de la plantilla', () => {
    const resultado = validarConfiguracion({ ...entradaValida, etapasDefault: [' Corte ', 'Plegado'] });
    expect(resultado).toEqual({
      valido: true,
      valores: {
        valorHoraEstandar: '1250.50',
        diasAlertaRiesgo: 3,
        porcentajeAvanceRiesgo: 80,
        etapasDefault: ['Corte', 'Plegado'],
      },
    });
  });
});
