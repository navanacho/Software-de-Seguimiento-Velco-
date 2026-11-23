import { describe, expect, it } from 'vitest';
import { conBase, hayDocker } from '../core-order-models/contenedor.ts';

async function mensajeDeRechazo(accion: () => Promise<unknown>): Promise<string> {
  try {
    await accion();
  } catch (error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error('La base de datos debía rechazar la operación');
}

async function crearOpBase(prisma: import('@prisma/client').PrismaClient, sufijo: string) {
  const cliente = await prisma.cliente.create({ data: { nombre: `Cliente Horas ${sufijo}` } });
  const op = await prisma.ordenTrabajo.create({
    data: {
      numeroOp: `OT-HORAS-${sufijo}`,
      clienteId: cliente.id,
      descripcionPieza: 'Pieza',
      fechaEntrega: new Date('2027-01-01'),
      montoVendido: '10.00',
    },
  });
  const etapa = await prisma.etapaOrden.create({
    data: { ordenId: op.id, nombre: 'Corte', ordenSecuencia: 1, horasVendidas: '4.00' },
  });
  return { cliente, op, etapa };
}

describe('C-08 2.x RN-HORAS-05 modelo-datos-horas', () => {
  it.skipIf(!hayDocker())('2.1 la tabla registros_horas existe tras migración 003', async () => {
    await conBase(async ({ prisma }) => {
      const filas = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'registros_horas'",
      );
      expect(filas).toHaveLength(1);
      expect(filas[0]?.table_name).toBe('registros_horas');
    });
  }, 180_000);

  it.skipIf(!hayDocker())('2.2 RN-HORAS-05 CHECK rechaza horas = 0', async () => {
    await conBase(async ({ prisma }) => {
      const { op } = await crearOpBase(prisma, 'CERO');
      const mensaje = await mensajeDeRechazo(() =>
        prisma.$executeRawUnsafe(
          `INSERT INTO registros_horas (orden_id, operario, fecha, horas) VALUES ($1::uuid, 'Operario', '2026-11-20', 0)`,
          op.id,
        ),
      );
      expect(mensaje).toMatch(/check|registros_horas_horas_check|violat/i);
    });
  }, 180_000);

  it.skipIf(!hayDocker())('2.2 RN-HORAS-05 CHECK rechaza horas negativas', async () => {
    await conBase(async ({ prisma }) => {
      const { op } = await crearOpBase(prisma, 'NEG');
      const mensaje = await mensajeDeRechazo(() =>
        prisma.$executeRawUnsafe(
          `INSERT INTO registros_horas (orden_id, operario, fecha, horas) VALUES ($1::uuid, 'Operario', '2026-11-20', -1.00)`,
          op.id,
        ),
      );
      expect(mensaje).toMatch(/check|registros_horas_horas_check|violat/i);
    });
  }, 180_000);

  it.skipIf(!hayDocker())('2.5 TRIANGULATE CASCADE: borrar OP elimina sus partes', async () => {
    await conBase(async ({ prisma }) => {
      const { op } = await crearOpBase(prisma, 'CASCADE');
      await prisma.$executeRawUnsafe(
        `INSERT INTO registros_horas (orden_id, operario, fecha, horas) VALUES ($1::uuid, 'Op', '2026-11-20', 2.50)`,
        op.id,
      );
      await prisma.$executeRawUnsafe(`DELETE FROM ordenes_trabajo WHERE id = $1::uuid`, op.id);
      const filas = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*)::bigint as count FROM registros_horas WHERE orden_id = $1::uuid`,
        op.id,
      );
      expect(Number(filas[0]?.count ?? -1)).toBe(0);
    });
  }, 180_000);

  it.skipIf(!hayDocker())('2.5 TRIANGULATE SET NULL: borrar etapa conserva horas y pone etapa_id NULL', async () => {
    await conBase(async ({ prisma }) => {
      const { op, etapa } = await crearOpBase(prisma, 'SETNULL');
      await prisma.$executeRawUnsafe(
        `INSERT INTO registros_horas (orden_id, etapa_id, operario, fecha, horas) VALUES ($1::uuid,$2::uuid,'Op','2026-11-20',3.75)`,
        op.id,
        etapa.id,
      );
      await prisma.$executeRawUnsafe(`DELETE FROM etapas_orden WHERE id = $1::uuid`, etapa.id);
      const filas = await prisma.$queryRawUnsafe<Array<{ etapa_id: string | null; horas: string }>>(
        `SELECT etapa_id, horas::text as horas FROM registros_horas WHERE orden_id = $1::uuid`,
        op.id,
      );
      expect(filas).toHaveLength(1);
      expect(filas[0]?.etapa_id).toBeNull();
      expect(filas[0]?.horas).toBe('3.75');
    });
  }, 180_000);

  it.skipIf(!hayDocker())('2.5 TRIANGULATE P-1: inserta parte sin etapa y con/sin observacion', async () => {
    await conBase(async ({ prisma }) => {
      const { op } = await crearOpBase(prisma, 'OBS');
      await prisma.$executeRawUnsafe(
        `INSERT INTO registros_horas (orden_id, operario, fecha, horas) VALUES ($1::uuid,'Op','2026-11-20',1.00)`,
        op.id,
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO registros_horas (orden_id, operario, fecha, horas, observacion) VALUES ($1::uuid,'Op','2026-11-21',2.00,$2)`,
        op.id,
        'Revisar tornillería',
      );
      const filas = await prisma.$queryRawUnsafe<Array<{ observacion: string | null }>>(
        `SELECT observacion FROM registros_horas WHERE orden_id = $1::uuid ORDER BY fecha ASC`,
        op.id,
      );
      expect(filas.map((f) => f.observacion)).toEqual([null, 'Revisar tornillería']);
    });
  }, 180_000);

  it.skipIf(!hayDocker())('2.6 TRIANGULATE índices, 001/002 intactas y sin usuario_id/Float/derivados', async () => {
    await conBase(async ({ prisma }) => {
      const indices = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(
        `SELECT indexname FROM pg_indexes WHERE tablename = 'registros_horas'`,
      );
      const nombres = indices.map((i) => i.indexname);
      expect(nombres).toContain('registros_horas_orden_id_fecha_idx');
      expect(nombres).toContain('registros_horas_etapa_id_idx');
      expect(nombres).toContain('registros_horas_operario_idx');

      const cols = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'registros_horas'`,
      );
      const nombresCols = cols.map((c) => c.column_name);
      expect(nombresCols).not.toContain('usuario_id');
      expect(nombresCols).not.toContain('horas_reales_totales');
      expect(nombresCols).not.toContain('desvio');
      expect(nombresCols).not.toContain('consumo');
      expect(nombresCols).not.toContain('alerta');

      const migraciones = await prisma.$queryRawUnsafe<Array<{ migration_name: string }>>(
        `SELECT migration_name FROM _prisma_migrations WHERE migration_name LIKE '001_%' OR migration_name LIKE '002_%' ORDER BY migration_name`,
      );
      expect(migraciones.map((m) => m.migration_name)).toEqual(['001_core_order_models', '002_ordenes_y_linea_base']);
    });
  }, 180_000);
});
