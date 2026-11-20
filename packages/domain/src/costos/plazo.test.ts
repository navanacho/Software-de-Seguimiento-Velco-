import { describe, expect, it } from 'vitest';
import { CONTEXTO, crearOrden } from '../testing/fixtures.ts';
import { diasRestantes, etiquetaPlazo } from './plazo.ts';

describe('diasRestantes', () => {
  it('RN-SEMAFORO-06: entrega a 3 días en la zona inyectada da 3', () => {
    expect(diasRestantes(crearOrden({ fechaEntrega: '2026-03-11' }), CONTEXTO)).toBe(3);
  });

  it('RN-SEMAFORO-06: vence hoy da 0 días y la etiqueta Vence hoy', () => {
    const orden = crearOrden({ fechaEntrega: '2026-03-08' });
    const dias = diasRestantes(orden, CONTEXTO);
    expect(dias).toBe(0);
    expect(etiquetaPlazo(dias, 'En riesgo')).toBe('Vence hoy');
  });

  it('RN-SEMAFORO-06: entrega hace 2 días da -2 y la etiqueta Pasó hace 2 días', () => {
    const orden = crearOrden({ fechaEntrega: '2026-03-06' });
    const dias = diasRestantes(orden, CONTEXTO);
    expect(dias).toBe(-2);
    expect(etiquetaPlazo(dias, 'Atrasado')).toBe('Pasó hace 2 días');
  });

  it('RN-SEMAFORO-01: terminada con fecha futura usa la etiqueta Terminado', () => {
    const orden = crearOrden({ fechaEntrega: '2026-03-20' });
    const dias = diasRestantes(orden, CONTEXTO);
    expect(dias).toBe(12);
    expect(etiquetaPlazo(dias, 'Terminado')).toBe('Terminado');
  });

  it('SU-05: el mismo instante en dos zonas distintas cambia los días restantes', () => {
    const orden = crearOrden({ fechaEntrega: '2026-03-08' });
    const instante = { ...CONTEXTO, hoy: '2026-03-08T02:30:00.000Z' };
    expect(diasRestantes(orden, instante)).toBe(1);
    expect(diasRestantes(orden, { ...instante, zonaHoraria: 'UTC' })).toBe(0);
  });
});
