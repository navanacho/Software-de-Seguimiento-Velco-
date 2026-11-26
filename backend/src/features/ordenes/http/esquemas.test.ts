import { describe, expect, it } from 'vitest';
import { DetalleOpJSONSchema, TarjetaOrdenSchema } from './esquemas.ts';

const tarjetaValida = {
  id: 'op-1',
  numeroOp: 'OT-1',
  codigoPlano: null,
  clienteId: 'c-1',
  clienteNombre: 'ACME',
  descripcionPieza: 'Pieza',
  etapas: [{ id: 'e-1', nombre: 'Corte', ordenSecuencia: 1, completada: false }],
  avance: 50,
  semaforo: 'En plazo',
  diasRestantes: 3,
  etapaAhora: 'Corte',
  etiquetaPlazo: 'Faltan 3 días',
  horasVendidasTotales: '40.00',
  horasRealesTotales: '32.00',
};

describe('C-12 espejo HTTP de los derivados de la tarjeta', () => {
  it('acepta y conserva porcentajeConsumo y alertaDesvio en la tarjeta', () => {
    const tarjeta = { ...tarjetaValida, porcentajeConsumo: '80.00', alertaDesvio: true };
    expect(TarjetaOrdenSchema.parse(tarjeta)).toEqual(tarjeta);
  });

  it('rechaza una tarjeta que omite ambos derivados', () => {
    const incompleta: Record<string, unknown> = { ...tarjetaValida };
    delete incompleta.porcentajeConsumo;
    delete incompleta.alertaDesvio;
    const resultado = TarjetaOrdenSchema.safeParse(incompleta);
    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    const rutas = resultado.error.issues.map((issue) => issue.path.join('.'));
    expect(rutas).toContain('porcentajeConsumo');
    expect(rutas).toContain('alertaDesvio');
  });

  it('conserva consumo nulo y alerta falsa sin convertirlos', () => {
    const tarjeta = { ...tarjetaValida, porcentajeConsumo: null, alertaDesvio: false };
    const validada = TarjetaOrdenSchema.parse(tarjeta);
    expect(validada.porcentajeConsumo).toBeNull();
    expect(validada.alertaDesvio).toBe(false);
  });

  it('rechaza cada derivado por separado', () => {
    for (const campo of ['porcentajeConsumo', 'alertaDesvio'] as const) {
      const incompleta: Record<string, unknown> = {
        ...tarjetaValida,
        porcentajeConsumo: '80.00',
        alertaDesvio: true,
      };
      delete incompleta[campo];
      const resultado = TarjetaOrdenSchema.safeParse(incompleta);
      expect(resultado.success, campo).toBe(false);
      if (resultado.success) continue;
      const rutas = resultado.error.issues.map((issue) => issue.path.join('.'));
      expect(rutas).toContain(campo);
    }
  });

  it('publica ambos derivados en el esquema JSON del detalle sin redeclararlos', () => {
    expect(DetalleOpJSONSchema).toHaveProperty(['properties', 'porcentajeConsumo']);
    expect(DetalleOpJSONSchema).toHaveProperty(['properties', 'alertaDesvio']);
    expect(DetalleOpJSONSchema.required).toEqual(expect.arrayContaining(['porcentajeConsumo', 'alertaDesvio']));
  });
});
