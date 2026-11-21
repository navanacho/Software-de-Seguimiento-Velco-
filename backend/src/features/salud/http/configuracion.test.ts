import { describe, expect, it } from 'vitest';
import { leerConfiguracion } from '../../../shared/configuracion.ts';

describe('configuración del servidor desde variables de entorno', () => {
  it('toma PORT y CORS_ORIGIN del entorno', () => {
    const configuracion = leerConfiguracion({
      PORT: '41234',
      CORS_ORIGIN: 'http://localhost:5173',
      EXCEL_UNC_BASE: '\\\\servidor\\plantillas',
    });
    expect(configuracion.puerto).toBe(41234);
    expect(configuracion.origenCors).toBe('http://localhost:5173');
    expect(configuracion.baseUncExcel).toBe('\\\\servidor\\plantillas');
  });

  it('no hardcodea un origen CORS ni una ruta UNC cuando no hay entorno', () => {
    const configuracion = leerConfiguracion({});
    expect(configuracion.puerto).toBe(3001);
    expect(configuracion.origenCors).toBe('');
    expect(configuracion.baseUncExcel).toBe('');
  });

  it('SU-05 expone TZ desde el entorno con default de Mendoza', () => {
    const conZona = leerConfiguracion({ TZ: 'UTC' });
    expect(conZona.zonaHoraria).toBe('UTC');
    const sinZona = leerConfiguracion({});
    expect(sinZona.zonaHoraria).toBe('America/Argentina/Mendoza');
  });
});
