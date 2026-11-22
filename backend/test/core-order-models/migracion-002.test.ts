import { describe, expect, it } from 'vitest';
import { hayDocker, conBase } from '../core-order-models/contenedor.ts';

const describeSiDocker = hayDocker() ? describe : describe.skip;

describeSiDocker('migración 002 plano y materiales', () => {
  it('agrega codigo_plano nullable, CHECK no vacío e índice único parcial', async () => {
    await conBase(async ({ prisma }) => {
      await prisma.$executeRawUnsafe(
        "INSERT INTO clientes (id,nombre) VALUES ('00000000-0000-0000-0000-000000000001','Cliente A')",
      );
      await prisma.$executeRawUnsafe(
        "INSERT INTO ordenes_trabajo (id,numero_op,codigo_plano,cliente_id,descripcion_pieza,fecha_entrega,monto_vendido) VALUES ('00000000-0000-0000-0000-000000000101','OP-1','PL-1','00000000-0000-0000-0000-000000000001','Pieza','2026-12-01',100)",
      );
      await expect(
        prisma.$executeRawUnsafe(
          "INSERT INTO ordenes_trabajo (id,numero_op,codigo_plano,cliente_id,descripcion_pieza,fecha_entrega,monto_vendido) VALUES ('00000000-0000-0000-0000-000000000102','OP-2','PL-1','00000000-0000-0000-0000-000000000001','Pieza','2026-12-01',100)",
        ),
      ).rejects.toThrow();
    });
  });

  it('TRIANGULA: acepta múltiples NULL y rechaza cadena vacía en codigo_plano', async () => {
    await conBase(async ({ prisma }) => {
      await prisma.$executeRawUnsafe(
        "INSERT INTO clientes (id,nombre) VALUES ('00000000-0000-0000-0000-000000000011','Cliente B')",
      );
      for (const [id, op] of [
        ['00000000-0000-0000-0000-000000000111', 'OP-N1'],
        ['00000000-0000-0000-0000-000000000112', 'OP-N2'],
        ['00000000-0000-0000-0000-000000000113', 'OP-N3'],
      ] as const) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO ordenes_trabajo (id,numero_op,codigo_plano,cliente_id,descripcion_pieza,fecha_entrega,monto_vendido) VALUES ('${id}','${op}',NULL,'00000000-0000-0000-0000-000000000011','Pieza','2026-12-01',100)`,
        );
      }
      const nulos = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        "SELECT COUNT(*)::bigint AS count FROM ordenes_trabajo WHERE codigo_plano IS NULL",
      );
      expect(Number(nulos[0]?.count)).toBeGreaterThanOrEqual(3);
      await expect(
        prisma.$executeRawUnsafe(
          "INSERT INTO ordenes_trabajo (id,numero_op,codigo_plano,cliente_id,descripcion_pieza,fecha_entrega,monto_vendido) VALUES ('00000000-0000-0000-0000-000000000114','OP-VACIO','','00000000-0000-0000-0000-000000000011','Pieza','2026-12-01',100)",
        ),
      ).rejects.toThrow();
    });
  });

  it('materiales_orden: FK cascade, cantidad>0, costos no negativos e índices', async () => {
    await conBase(async ({ prisma }) => {
      await prisma.$executeRawUnsafe(
        "INSERT INTO clientes (id,nombre) VALUES ('00000000-0000-0000-0000-000000000021','Cliente M')",
      );
      await prisma.$executeRawUnsafe(
        "INSERT INTO ordenes_trabajo (id,numero_op,cliente_id,descripcion_pieza,fecha_entrega,monto_vendido) VALUES ('00000000-0000-0000-0000-000000000201','OP-M','00000000-0000-0000-0000-000000000021','Pieza','2026-12-01',100)",
      );
      await prisma.$executeRawUnsafe(
        "INSERT INTO materiales_orden (id,orden_id,tipo,descripcion,cantidad,unidad,costo_unitario_cotizado,costo_unitario_real,nro_remito,nro_factura,nt,po) VALUES ('00000000-0000-0000-0000-000000000301','00000000-0000-0000-0000-000000000201','MP','Acero',2.5,'kg',10.00,NULL,'R1','F1','NT1','PO1')",
      );
      await expect(
        prisma.$executeRawUnsafe(
          "INSERT INTO materiales_orden (id,orden_id,tipo,descripcion,cantidad,unidad,costo_unitario_cotizado) VALUES ('00000000-0000-0000-0000-000000000302','00000000-0000-0000-0000-000000000201','MP','X',0,'kg',10.00)",
        ),
      ).rejects.toThrow();
      await expect(
        prisma.$executeRawUnsafe(
          "INSERT INTO materiales_orden (id,orden_id,tipo,descripcion,cantidad,unidad,costo_unitario_cotizado,costo_unitario_real) VALUES ('00000000-0000-0000-0000-000000000303','00000000-0000-0000-0000-000000000201','MP','X',1,'kg',10.00,-1)",
        ),
      ).rejects.toThrow();
      await prisma.$executeRawUnsafe(
        "DELETE FROM ordenes_trabajo WHERE id='00000000-0000-0000-0000-000000000201'",
      );
      const materiales = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        "SELECT COUNT(*)::bigint AS count FROM materiales_orden WHERE orden_id='00000000-0000-0000-0000-000000000201'",
      );
      expect(Number(materiales[0]?.count)).toBe(0);
    });
  });
});
