import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/features/salud/http/app.ts';
import {
  configuracionPrueba,
  crearDependenciasFalsas,
  crearEtapas,
  crearOrden,
} from './fixtures.ts';

describe('PATCH /api/ops/:id/etapas/:etapaId', () => {
  it('D4 RN-GLOBAL-02 devuelve la tarjeta recalculada tras marcar la última etapa', async () => {
    const ordenId = randomUUID();
    const etapaId = randomUUID();
    const etapas = crearEtapas(['Corte', 'Soldadura'], ordenId, 1).map((etapa, indice) =>
      indice === 1 ? { ...etapa, id: etapaId } : etapa,
    );
    const { dependencias, estado } = crearDependenciasFalsas({
      ops: [crearOrden({ id: ordenId })],
      etapas,
    });
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const respuesta = await app.inject({
        method: 'PATCH',
        url: `/api/ops/${ordenId}/etapas/${etapaId}`,
        payload: { completada: true },
      });
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.json()).toMatchObject({
        avance: 100,
        etapaAhora: 'Todo listo',
        semaforo: 'Terminado',
      });
      expect(estado.escrituras).toEqual([{ etapaId, completada: true }]);
    } finally {
      await app.close();
    }
  });

  it('D4 RN-GLOBAL-01 devuelve 404 para una etapa ajena a la OP', async () => {
    const ordenId = randomUUID();
    const etapaId = randomUUID();
    const { dependencias, estado } = crearDependenciasFalsas({
      ops: [crearOrden({ id: ordenId })],
      etapas: crearEtapas(['Corte'], ordenId).map((etapa) => ({ ...etapa, id: etapaId })),
    });
    const app = await buildApp(configuracionPrueba(), dependencias);
    try {
      const respuesta = await app.inject({
        method: 'PATCH',
        url: `/api/ops/${ordenId}/etapas/${randomUUID()}`,
        payload: { completada: true },
      });
      expect(respuesta.statusCode).toBe(404);
      expect(respuesta.json()).toMatchObject({ error: 'not_found' });
      expect(estado.escrituras).toEqual([]);
    } finally {
      await app.close();
    }
  });
});
