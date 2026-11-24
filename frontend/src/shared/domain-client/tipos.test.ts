import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type {
  EstadoSemaforo,
  EtapaTarjeta,
  GrupoFlujo,
  TarjetaOrdenDTO,
} from '@velco/domain';
import type { KpisTablero, RespuestaListadoTablero } from './tipos.ts';
import { ESTADOS } from './esquemas.ts';

describe('tipos de transporte del tablero (2.1-2.4)', () => {
  it('compone el envelope desde tipos canónicos de @velco/domain', () => {
    const etapa: EtapaTarjeta = { id: 'e1', nombre: 'Corte', ordenSecuencia: 1, completada: false };
    const flujo: GrupoFlujo = { etapa: 'Corte', cantidad: 1 };
    const estado: EstadoSemaforo = 'En plazo';
    const op: TarjetaOrdenDTO = {
      id: 'op1',
      numeroOp: 'OT-1',
      codigoPlano: null,
      clienteId: 'c1',
      clienteNombre: 'Cliente',
      descripcionPieza: 'Pieza',
      etapas: [etapa],
      avance: 0,
      semaforo: estado,
      diasRestantes: 2,
      etapaAhora: 'Corte',
      etiquetaPlazo: 'Faltan 2 días',
      horasVendidasTotales: '40.00',
      horasRealesTotales: '0.00',
    };
    const kpis: KpisTablero = {
      total: 1,
      porEstado: { Terminado: 0, Atrasado: 0, 'En riesgo': 0, 'En plazo': 1 },
    };
    const respuesta: RespuestaListadoTablero = { ops: [op], kpis, flujo: [flujo] };
    expect(respuesta.ops[0]?.etapaAhora).toBe('Corte');
    expect(respuesta.kpis.porEstado['En plazo']).toBe(1);
  });

  it('acepta clienteNombre null y múltiples estados en KPIs', () => {
    const op: TarjetaOrdenDTO = {
      id: 'op2',
      numeroOp: 'OT-2',
      codigoPlano: null,
      clienteId: 'c2',
      clienteNombre: null,
      descripcionPieza: 'Pieza 2',
      etapas: [],
      avance: 100,
      semaforo: 'Terminado',
      diasRestantes: 0,
      etapaAhora: 'Todo listo',
      etiquetaPlazo: 'Terminado',
      horasVendidasTotales: '0.00',
      horasRealesTotales: '0.00',
    };
    const respuesta: RespuestaListadoTablero = {
      ops: [op],
      kpis: { total: 1, porEstado: { Terminado: 1, Atrasado: 0, 'En riesgo': 0, 'En plazo': 0 } },
      flujo: [],
    };
    expect(respuesta.ops[0]?.clienteNombre).toBeNull();
  });

  it('usa EstadoSemaforo canónico sin redeclarar type Estado local', () => {
    const estados: readonly EstadoSemaforo[] = ESTADOS;
    expect(estados).toEqual(['Terminado', 'Atrasado', 'En riesgo', 'En plazo']);
    const fuente = readFileSync(resolve(process.cwd(), 'src/shared/domain-client/tipos.ts'), 'utf8');
    expect(fuente).not.toMatch(/\btype Estado\b/);
    expect(fuente).toMatch(/EstadoSemaforo/);
  });
});
