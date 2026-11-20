import { describe, expect, it } from 'vitest';
import { CONTEXTO, crearEtapas, crearOrden } from '../testing/fixtures.ts';
import { calcularSemaforo } from './semaforo.ts';

describe('calcularSemaforo', () => {
  it('RN-SEMAFORO-01/05: terminada con fecha vencida devuelve Terminado, no Atrasado', () => {
    const orden = crearOrden({ fechaEntrega: '2026-03-01' });
    const etapas = crearEtapas(['Corte', 'Soldadura'], 2);
    expect(calcularSemaforo(orden, etapas, CONTEXTO)).toBe('Terminado');
  });

  it('RN-SEMAFORO-02: activa con fecha vencida y avance bajo devuelve Atrasado', () => {
    const orden = crearOrden({ fechaEntrega: '2026-03-06' });
    expect(calcularSemaforo(orden, crearEtapas(['Corte', 'Soldadura']), CONTEXTO)).toBe('Atrasado');
  });

  it('RN-SEMAFORO-03: vence en 2 días con avance 0 devuelve En riesgo', () => {
    const orden = crearOrden({ fechaEntrega: '2026-03-10' });
    expect(calcularSemaforo(orden, crearEtapas(['Corte', 'Soldadura']), CONTEXTO)).toBe('En riesgo');
  });

  it('RN-SEMAFORO-04: vence en 4 días con umbral 3 devuelve En plazo', () => {
    const orden = crearOrden({ fechaEntrega: '2026-03-12' });
    expect(calcularSemaforo(orden, crearEtapas(['Corte', 'Soldadura']), CONTEXTO)).toBe('En plazo');
  });

  it('RN-SEMAFORO-03: exactamente 3 días de umbral es En riesgo (límite inclusivo)', () => {
    const orden = crearOrden({ fechaEntrega: '2026-03-11' });
    expect(calcularSemaforo(orden, crearEtapas(['Corte', 'Soldadura']), CONTEXTO)).toBe('En riesgo');
  });

  it('RN-SEMAFORO-01: avance 100 recibido con etapa pendiente prevalece Terminado', () => {
    const orden = crearOrden({ fechaEntrega: '2026-03-06' });
    const etapas = crearEtapas(['Corte', 'Soldadura'], 1);
    expect(calcularSemaforo(orden, etapas, CONTEXTO, 100)).toBe('Terminado');
  });

  it('RN-SEMAFORO-03/RN-CONFIG-02: cambiar el umbral de 3 a 5 días cambia el estado', () => {
    const orden = crearOrden({ fechaEntrega: '2026-03-12' });
    const etapas = crearEtapas(['Corte', 'Soldadura']);
    expect(calcularSemaforo(orden, etapas, CONTEXTO)).toBe('En plazo');
    expect(calcularSemaforo(orden, etapas, { ...CONTEXTO, diasAlertaRiesgo: 5 })).toBe('En riesgo');
  });

  it('RN-CONFIG-02: subir el avance de riesgo de 80 a 60 cambia En riesgo por En plazo', () => {
    const orden = crearOrden({ fechaEntrega: '2026-03-10' });
    const etapas = crearEtapas(['Corte', 'Soldadura']);
    expect(calcularSemaforo(orden, etapas, CONTEXTO, 70)).toBe('En riesgo');
    expect(
      calcularSemaforo(orden, etapas, { ...CONTEXTO, porcentajeAvanceRiesgo: 60 }, 70),
    ).toBe('En plazo');
  });
});
