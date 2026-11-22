import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { conBase, hayDocker } from '../tablero-read-api/ayuda.ts';
import { buildApp } from '../../src/features/salud/http/app.ts';
import { crearDependencias } from '../../src/shared/dependencias.ts';
import { configuracionPrueba } from '../tablero-read-api/fixtures.ts';
import { createOp } from '../../src/features/ordenes/application/createOp.ts';

describe('GET /api/ops/:id materiales', () => {
  it.skipIf(!hayDocker())('7.7/7.8 detalle con materiales y agregados derivados; horas vacío C-08', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const app = await buildApp(configuracionPrueba(), deps);
      try {
        const s = randomUUID().slice(0, 8);
        const op = await createOp(deps, { numeroOp: `OT-DET-${s}`, codigoPlano: 'PL-DET', clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null, materiales: [
          { tipo: 'MP', descripcion: 'A', cantidad: '2.00', costoUnitarioCotizado: '10.00', costoUnitarioReal: '12.00' },
          { tipo: 'INSUMOS', descripcion: 'B', cantidad: '1.00', costoUnitarioCotizado: '5.00', costoUnitarioReal: null },
        ] as any });
        const res = await app.inject({ method: 'GET', url: `/api/ops/${op.op.id}` });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.codigoPlano).toBe('PL-DET');
        expect(body.materiales).toHaveLength(2);
        expect(body.costoMaterialesCotizado).toBe('25.00');
        expect(body.costoMaterialesReal).toBe('29.00');
        expect(body.horas).toEqual([]);
      } finally { await app.close(); }
    });
  }, 180000);

  it.skipIf(!hayDocker())('7.8 TRIANGULA: sin materiales devuelve ceros y sin derivados persistidos', async () => {
    await conBase(async ({ prisma }) => {
      const deps = crearDependencias(prisma);
      const app = await buildApp(configuracionPrueba(), deps);
      try {
        const s = randomUUID().slice(0, 8);
        const op = await createOp(deps, { numeroOp: `OT-DET2-${s}`, codigoPlano: null, clienteNombre: 'C', descripcionPieza: 'P', fechaEntrega: '2027-01-01', montoVendido: '10.00', observaciones: null, materiales: [] });
        const res = await app.inject({ method: 'GET', url: `/api/ops/${op.op.id}` });
        const body = res.json();
        expect(body.materiales).toEqual([]);
        expect(body.costoMaterialesCotizado).toBe('0.00');
        expect(body.costoMaterialesReal).toBe('0.00');
        expect(body.horas).toEqual([]);
        const row = await prisma.ordenTrabajo.findUnique({ where: { id: op.op.id } });
        expect(row).not.toHaveProperty('costoMaterialesCotizado');
      } finally { await app.close(); }
    });
  }, 180000);
});
