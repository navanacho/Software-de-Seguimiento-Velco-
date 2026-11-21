import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { actualizarCompletada } from '../../src/features/etapas/application/actualizarCompletada.ts';
import {
  crearDependenciasFalsas,
  crearEtapas,
  crearOrden,
} from '../tablero-read-api/fixtures.ts';

describe('actualizarCompletada', () => {
  it('D4 RN-AVANCE-01 recalcula avance y etapaAhora tras marcar una etapa intermedia', async () => {
    const etapas = crearEtapas(['Corte', 'Soldadura', 'Pintura'], 'op-1', 1);
    const { dependencias, estado } = crearDependenciasFalsas({
      ops: [crearOrden({ id: 'op-1' })],
      etapas,
    });

    const tarjeta = await actualizarCompletada(dependencias, {
      ordenId: 'op-1',
      etapaId: 'op-1-etapa-2',
      completada: true,
    });

    expect(tarjeta).toMatchObject({ avance: 67, etapaAhora: 'Pintura' });
    expect(estado.escrituras).toEqual([{ etapaId: 'op-1-etapa-2', completada: true }]);
  });

  it('D4 RN-AVANCE-02 / RN-AHORA-01 / RN-SEMAFORO-01 TRIANGULA: marcar la última pendiente produce avance 100, Todo listo y Terminado', async () => {
    const etapas = crearEtapas(['Corte', 'Soldadura'], 'op-1', 1);
    const { dependencias } = crearDependenciasFalsas({
      ops: [crearOrden({ id: 'op-1' })],
      etapas,
    });

    const tarjeta = await actualizarCompletada(dependencias, {
      ordenId: 'op-1',
      etapaId: 'op-1-etapa-2',
      completada: true,
    });

    expect(tarjeta).toMatchObject({
      avance: 100,
      etapaAhora: 'Todo listo',
      semaforo: 'Terminado',
    });
  });

  it('D4 RN-AVANCE-02 / RN-SEMAFORO-01 Flujo 3 desmarcar una etapa de OP terminada la reactiva', async () => {
    const etapas = crearEtapas(['Corte', 'Soldadura'], 'op-1', 2);
    const { dependencias, estado } = crearDependenciasFalsas({
      ops: [crearOrden({ id: 'op-1' })],
      etapas,
    });

    const tarjeta = await actualizarCompletada(dependencias, {
      ordenId: 'op-1',
      etapaId: 'op-1-etapa-2',
      completada: false,
    });

    expect(tarjeta).toMatchObject({ avance: 50, etapaAhora: 'Soldadura' });
    expect(tarjeta?.semaforo).not.toBe('Terminado');
    expect(estado.escrituras).toEqual([{ etapaId: 'op-1-etapa-2', completada: false }]);
  });

  it('D4 RN-GLOBAL-02 / R3 el recálculo lee las etapas después del UPDATE', () => {
    const codigo = readFileSync(
      new URL('../../src/features/etapas/application/actualizarCompletada.ts', import.meta.url),
      'utf8',
    );
    const escritura = codigo.indexOf('dependencias.etapas.actualizarCompletada(');
    const lectura = codigo.indexOf('dependencias.etapas.listarPorOrden(');
    expect(escritura).toBeGreaterThan(-1);
    expect(lectura).toBeGreaterThan(escritura);
  });

  it('D4 RN-GLOBAL-01 etapa de otra OP devuelve null sin escribir', async () => {
    const { dependencias, estado } = crearDependenciasFalsas({
      ops: [crearOrden({ id: 'op-1' }), crearOrden({ id: 'op-2' })],
      etapas: [...crearEtapas(['Corte'], 'op-1'), ...crearEtapas(['Corte'], 'op-2')],
    });

    const tarjeta = await actualizarCompletada(dependencias, {
      ordenId: 'op-1',
      etapaId: 'op-2-etapa-1',
      completada: true,
    });

    expect(tarjeta).toBeNull();
    expect(estado.escrituras).toEqual([]);
  });

  it('D4 RN-GLOBAL-01 TRIANGULA: OP inexistente con etapa válida devuelve null sin escribir', async () => {
    const { dependencias, estado } = crearDependenciasFalsas({
      ops: [crearOrden({ id: 'op-1' })],
      etapas: crearEtapas(['Corte'], 'op-1'),
    });
    const tarjeta = await actualizarCompletada(dependencias, {
      ordenId: 'op-inexistente',
      etapaId: 'op-1-etapa-1',
      completada: true,
    });
    expect(tarjeta).toBeNull();
    expect(estado.escrituras).toEqual([]);
  });

  it('D4 RN-GLOBAL-01 TRIANGULA: etapa inexistente con OP válida devuelve null sin escribir', async () => {
    const { dependencias, estado } = crearDependenciasFalsas({
      ops: [crearOrden({ id: 'op-1' })],
      etapas: crearEtapas(['Corte'], 'op-1'),
    });
    const tarjeta = await actualizarCompletada(dependencias, {
      ordenId: 'op-1',
      etapaId: 'op-1-etapa-inexistente',
      completada: true,
    });
    expect(tarjeta).toBeNull();
    expect(estado.escrituras).toEqual([]);
  });

  it('D4 RN-GLOBAL-02 / R3 el adaptador escribe solo la columna completada', () => {
    const codigo = readFileSync(
      new URL('../../src/features/etapas/prisma/PrismaEtapaRepository.ts', import.meta.url),
      'utf8',
    );
    expect(codigo).toContain('data: { completada }');
    for (const columna of ['porcentajeAvance', 'semaforo', 'avance', 'horasTotales', 'costo', 'margen']) {
      expect(codigo).not.toContain(columna);
    }
  });
});
