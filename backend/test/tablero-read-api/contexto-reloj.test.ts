import { construirTarjetaOrden } from '@velco/domain';
import { describe, expect, it } from 'vitest';
import {
  ETAPAS_DEFAULT,
  contextoTarjeta,
} from '../../src/features/configuracion/application/contextoTarjeta.ts';
import { fechaCalendarioEnZona } from '../../src/shared/reloj.ts';
import {
  INSTANTE_FIJO,
  ZONA_PRUEBA,
  crearConfiguracion,
  crearDependenciasFalsas,
  crearEtapas,
  crearOrden,
} from './fixtures.ts';

describe('contexto de tarjeta inyectado al dominio', () => {
  it('D6 RN-CONFIG-02 contextoTarjeta toma los umbrales de la fila singleton', async () => {
    const { dependencias } = crearDependenciasFalsas({
      configuracion: crearConfiguracion({ diasAlertaRiesgo: 5, porcentajeAvanceRiesgo: 60 }),
    });
    const contexto = await contextoTarjeta(dependencias, 'Cliente Norte');
    expect(contexto).toMatchObject({
      diasAlertaRiesgo: 5,
      porcentajeAvanceRiesgo: 60,
      zonaHoraria: ZONA_PRUEBA,
      clienteNombre: 'Cliente Norte',
    });
    expect(contexto.hoy).toBe('2026-03-08');
  });

  it('D6 RN-CONFIG-01 sin fila singleton aplica defaults sin insertar la fila', async () => {
    const { dependencias, estado } = crearDependenciasFalsas({ configuracion: null });
    const contexto = await contextoTarjeta(dependencias);
    expect(contexto.diasAlertaRiesgo).toBe(3);
    expect(contexto.porcentajeAvanceRiesgo).toBe(80);
    expect(ETAPAS_DEFAULT).toEqual(['Corte', 'Soldadura', 'Mecanizado', 'Pintura', 'Entrega']);
    expect(estado.configuracion).toBeNull();
    expect(estado.consultas).toEqual([]);
  });

  it('D6 RN-CONFIG-02 TRIANGULA: umbrales personalizados sin nombre de cliente', async () => {
    const { dependencias } = crearDependenciasFalsas({
      configuracion: crearConfiguracion({ diasAlertaRiesgo: 1, porcentajeAvanceRiesgo: 95 }),
    });
    const contexto = await contextoTarjeta(dependencias, null);
    expect(contexto.diasAlertaRiesgo).toBe(1);
    expect(contexto.porcentajeAvanceRiesgo).toBe(95);
    expect(Object.hasOwn(contexto, 'clienteNombre')).toBe(false);
  });

  it('D6 SU-05 el adaptador convierte el instante a fecha calendaria dentro de la zona', () => {
    const instante = new Date('2027-03-11T02:00:00.000Z');
    expect(fechaCalendarioEnZona(instante, 'UTC')).toBe('2027-03-11');
    expect(fechaCalendarioEnZona(instante, ZONA_PRUEBA)).toBe('2027-03-10');
    expect(fechaCalendarioEnZona(INSTANTE_FIJO, ZONA_PRUEBA)).toBe('2026-03-08');
    expect(crearDependenciasFalsas().dependencias.reloj.ahora()).toEqual(INSTANTE_FIJO);
  });

  it('D6 SU-05 TRIANGULA: el mismo instante en dos zonas produce semáforos distintos sin leer el entorno', async () => {
    const instante = new Date('2027-03-11T02:00:00.000Z');
    const orden = crearOrden({ fechaEntrega: '2027-03-13' });
    const etapas = crearEtapas(['Corte'], orden.id);
    const { dependencias } = crearDependenciasFalsas({ ops: [orden], etapas, instante });
    const contextoUtc = await contextoTarjeta({ ...dependencias, zonaHoraria: 'UTC' });
    const contextoMendoza = await contextoTarjeta({ ...dependencias, zonaHoraria: ZONA_PRUEBA });
    const semaforoUtc = construirTarjetaOrden(orden, etapas, contextoUtc).semaforo;
    const semaforoMendoza = construirTarjetaOrden(orden, etapas, contextoMendoza).semaforo;
    expect([semaforoUtc, semaforoMendoza]).toEqual(['En riesgo', 'En plazo']);

    const zonaOriginal = process.env.TZ;
    try {
      process.env.TZ = 'Pacific/Auckland';
      const contextoRepetido = await contextoTarjeta({ ...dependencias, zonaHoraria: ZONA_PRUEBA });
      expect(contextoRepetido).toEqual(contextoMendoza);
      expect(construirTarjetaOrden(orden, etapas, contextoRepetido).semaforo).toBe(semaforoMendoza);
    } finally {
      if (zonaOriginal === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = zonaOriginal;
      }
    }
  });
});
