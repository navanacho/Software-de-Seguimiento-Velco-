import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Prisma, type PrismaClient } from '@prisma/client';
import {
  calcularHorasRealesTotales,
  costoMaterialReal,
  costoMaterialesCotizado,
  margenReal,
  restar,
  tasaGlobalNoConfigurada,
} from '@velco/domain';
import ExcelJS from 'exceljs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../../src/features/salud/http/app.ts';
import { crearDependencias } from '../../src/shared/dependencias.ts';
import { exportOp } from '../../src/features/exportacion/application/exportOp.ts';
import { exigirGateConforme, generarCosteo, verificarCosteo } from '../../src/features/exportacion/excel/costeo.ts';
import { mapearModeloACeldas } from '../../src/features/exportacion/excel/mapeo.ts';
import { nombreArchivoCosteo } from '../../src/features/exportacion/http/nombreDescarga.ts';
import { conBase, hayDocker } from '../core-order-models/contenedor.ts';
import { leerPlantilla, rutaPlantilla } from '../excel-template-spike/soporte.ts';
import { ZONA_PRUEBA, configuracionBase } from '../tablero-read-api/ayuda.ts';

const NOMBRE_PLANTILLA = 'MASTER COSTEO NUEVO.xlsx';

interface MaterialSemilla {
  readonly tipo: 'MP' | 'INSUMOS' | 'TERCERIZADOS';
  readonly descripcion: string;
  readonly cantidad: string;
  readonly unidad: string | null;
  readonly costoUnitarioCotizado: string;
  readonly costoUnitarioReal: string | null;
}

interface OpcionesSemilla {
  readonly numeroOp: string;
  readonly nombreCliente: string;
  readonly montoVendido: string;
  readonly valorHora: string;
  readonly horas: readonly string[];
  readonly materiales: readonly MaterialSemilla[];
}

interface Semilla {
  readonly ordenId: string;
  readonly archivo: string;
}

const SEMILLA_COSTEO_C14: OpcionesSemilla = {
  numeroOp: 'OT-C14-001',
  nombreCliente: 'ACME Costeo S.A.',
  montoVendido: '1200.00',
  valorHora: '0.00',
  horas: ['5.00', '3.00'],
  materiales: [
    {
      tipo: 'INSUMOS',
      descripcion: 'Pintura',
      cantidad: '1.5000',
      unidad: 'l',
      costoUnitarioCotizado: '10.00',
      costoUnitarioReal: null,
    },
    {
      tipo: 'MP',
      descripcion: 'Acero',
      cantidad: '2.0000',
      unidad: 'kg',
      costoUnitarioCotizado: '32.8250',
      costoUnitarioReal: '50.00',
    },
  ],
};

function prepararDirectorioPlantillas(): string {
  const directorio = mkdtempSync(join(tmpdir(), `velco-c14-pg-${Date.now()}-`));
  copyFileSync(rutaPlantilla(NOMBRE_PLANTILLA), join(directorio, NOMBRE_PLANTILLA));
  return directorio;
}

function fechaDias(dias: number): Date {
  return new Date(Date.UTC(2026, 2, 1 + dias, 8, 0, 0));
}

async function valorCelda(salida: Buffer, referencia: string): Promise<unknown> {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(salida as unknown as Parameters<typeof libro.xlsx.load>[0]);
  const hoja = libro.worksheets[1];
  if (hoja === undefined) throw new Error('falta la hoja 1 del costeo');
  return hoja.getCell(referencia).value;
}

async function sembrar(prisma: PrismaClient, opciones: OpcionesSemilla): Promise<Semilla> {
  const cliente = await prisma.cliente.create({
    data: { nombre: opciones.nombreCliente },
  });
  const orden = await prisma.ordenTrabajo.create({
    data: {
      numeroOp: opciones.numeroOp,
      clienteId: cliente.id,
      descripcionPieza: 'Conjunto costeo C-14',
      fechaIngreso: fechaDias(0),
      fechaEntrega: fechaDias(10),
      montoVendido: new Prisma.Decimal(opciones.montoVendido),
    },
  });
  await prisma.etapaOrden.createMany({
    data: [
      {
        ordenId: orden.id,
        nombre: 'Corte',
        ordenSecuencia: 1,
        completada: true,
        horasVendidas: new Prisma.Decimal('4.00'),
      },
      {
        ordenId: orden.id,
        nombre: 'Soldadura',
        ordenSecuencia: 2,
        completada: false,
        horasVendidas: new Prisma.Decimal('2.50'),
      },
    ],
  });
  const etapas = await prisma.etapaOrden.findMany({
    where: { ordenId: orden.id },
    orderBy: { ordenSecuencia: 'asc' },
  });
  for (const [indice, cantidad] of opciones.horas.entries()) {
    await prisma.registroHora.create({
      data: {
        ordenId: orden.id,
        etapaId: etapas[indice % etapas.length]?.id ?? null,
        operario: `Operario ${indice + 1}`,
        fecha: fechaDias(indice),
        horas: new Prisma.Decimal(cantidad),
      },
    });
  }
  for (const [indice, material] of opciones.materiales.entries()) {
    await prisma.materialOrden.create({
      data: {
        id: `${orden.id.slice(0, 8)}-0000-4000-8000-${String(indice + 1).padStart(12, '0')}`,
        ordenId: orden.id,
        tipo: material.tipo,
        descripcion: material.descripcion,
        cantidad: new Prisma.Decimal(material.cantidad),
        unidad: material.unidad,
        costoUnitarioCotizado: new Prisma.Decimal(material.costoUnitarioCotizado),
        costoUnitarioReal:
          material.costoUnitarioReal === null ? null : new Prisma.Decimal(material.costoUnitarioReal),
      },
    });
  }
  await prisma.configuracion.update({
    where: { id: 1 },
    data: { valorHoraEstandar: new Prisma.Decimal(opciones.valorHora) },
  });
  return {
    ordenId: orden.id,
    archivo: nombreArchivoCosteo(opciones.numeroOp, opciones.nombreCliente),
  };
}

describe.skipIf(!hayDocker())('integración real de exportación de costeo (C-14)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('5.1 RED: una OP persistida en PostgreSQL 18.7 exporta 200 con nombre saneado y gate conforme', async () => {
    const directorio = prepararDirectorioPlantillas();
    vi.stubEnv('EXCEL_TEMPLATES_DIR', directorio);
    try {
      await conBase(async ({ prisma }) => {
        const semilla = await sembrar(prisma, SEMILLA_COSTEO_C14);
        const dependencias = crearDependencias(prisma, ZONA_PRUEBA);
        const app = await buildApp(configuracionBase(), dependencias);
        try {
          const respuesta = await app.inject({
            method: 'GET',
            url: `/api/ops/${semilla.ordenId}/export?variante=costeo`,
          });
          expect(respuesta.statusCode).toBe(200);
          expect(respuesta.headers['content-disposition']).toBe(
            `attachment; filename="${semilla.archivo}"`,
          );
          expect(respuesta.headers['content-type']).toContain('spreadsheetml.sheet');
          expect(Buffer.isBuffer(respuesta.rawPayload)).toBe(true);
          exigirGateConforme(verificarCosteo(leerPlantilla(NOMBRE_PLANTILLA), respuesta.rawPayload));
          expect(await dependencias.horas.totalHorasReales(semilla.ordenId)).toBe('8.00');
        } finally {
          await app.close();
        }
      });
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  }, 180_000);

  it('5.1 TRIANGULATE: otra OP persistida genera otro nombre y su propio total sin estado compartido', async () => {
    const directorio = prepararDirectorioPlantillas();
    vi.stubEnv('EXCEL_TEMPLATES_DIR', directorio);
    try {
      await conBase(async ({ prisma }) => {
        const primera = await sembrar(prisma, {
          numeroOp: 'OT-C14-001',
          nombreCliente: 'ACME Costeo S.A.',
          montoVendido: '1200.00',
          valorHora: '0.00',
          horas: ['5.00', '3.00'],
          materiales: [],
        });
        const segunda = await sembrar(prisma, {
          numeroOp: 'OT-C14-002',
          nombreCliente: 'Beta Industrial Ltda.',
          montoVendido: '300.00',
          valorHora: '0.00',
          horas: ['4.00'],
          materiales: [],
        });
        const dependencias = crearDependencias(prisma, ZONA_PRUEBA);
        const app = await buildApp(configuracionBase(), dependencias);
        try {
          const primeraRespuesta = await app.inject({
            method: 'GET',
            url: `/api/ops/${primera.ordenId}/export?variante=costeo`,
          });
          const segundaRespuesta = await app.inject({
            method: 'GET',
            url: `/api/ops/${segunda.ordenId}/export?variante=costeo`,
          });
          expect(primeraRespuesta.statusCode).toBe(200);
          expect(segundaRespuesta.statusCode).toBe(200);
          expect(primeraRespuesta.headers['content-disposition']).toBe(
            `attachment; filename="${primera.archivo}"`,
          );
          expect(segundaRespuesta.headers['content-disposition']).toBe(
            'attachment; filename="COSTEO_OT-C14-002_Beta Industrial Ltda.xlsx"',
          );
          expect(await dependencias.horas.totalHorasReales(primera.ordenId)).toBe('8.00');
          expect(await dependencias.horas.totalHorasReales(segunda.ordenId)).toBe('4.00');
          exigirGateConforme(
            verificarCosteo(leerPlantilla(NOMBRE_PLANTILLA), primeraRespuesta.rawPayload),
          );
          exigirGateConforme(
            verificarCosteo(leerPlantilla(NOMBRE_PLANTILLA), segundaRespuesta.rawPayload),
          );
        } finally {
          await app.close();
        }
      });
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  }, 180_000);

  it('5.2 GREEN: el caso de uso con repositorios Prisma reales calcula costos y margen exactos y el Buffer pasa el gate', async () => {
    const directorio = prepararDirectorioPlantillas();
    vi.stubEnv('EXCEL_TEMPLATES_DIR', directorio);
    try {
      await conBase(async ({ prisma }) => {
        const semilla = await sembrar(prisma, SEMILLA_COSTEO_C14);
        const dependencias = crearDependencias(prisma, ZONA_PRUEBA);
        const modelo = await exportOp(dependencias, semilla.ordenId, { incluirMargenes: true });
        if (modelo === null || modelo.variante !== 'costeo') {
          throw new Error('el caso de uso no devolvió un modelo de costeo');
        }
        const materiales = await dependencias.materiales.listarPorOrden(semilla.ordenId);
        expect(modelo.horasReales).toBe('8.00');
        expect(modelo.valorHora).toBe('0.00');
        expect(tasaGlobalNoConfigurada(modelo.valorHora)).toBe(true);
        expect(modelo.costos.costoMaterialesReal).toBe('115.00');
        expect(modelo.costos.costoMaterialesReal).toBe(costoMaterialReal(materiales));
        expect(modelo.costos.costoMaterialesCotizado).toBe('80.66');
        expect(modelo.costos.costoMaterialesCotizado).toBe(costoMaterialesCotizado(materiales));
        expect(modelo.margenReal).toBe('1085.00');
        expect(modelo.margenReal).toBe(
          margenReal({
            montoVendido: '1200.00',
            horasRealesTotales: '8.00',
            costoMaterialesReal: '115.00',
            valorHoraEstandar: '0.00',
          }),
        );
        expect(modelo.margenReal).toBe(restar('1200.00', '115.00'));

        const original = leerPlantilla(NOMBRE_PLANTILLA);
        const salida = generarCosteo(original, mapearModeloACeldas(modelo));
        exigirGateConforme(verificarCosteo(original, salida));
        expect(await valorCelda(salida, 'P13')).toBe(8);
        expect(await valorCelda(salida, 'R10')).toBe(8);
        expect(await valorCelda(salida, 'Q13')).toBe(0);
        expect(await valorCelda(salida, 'Q21')).toBe(0);
        expect(await valorCelda(salida, 'R40')).toBe(15);
        expect(await valorCelda(salida, 'R41')).toBe(100);
        expect(await valorCelda(salida, 'R59')).toBe(115);
      });
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  }, 180_000);

  it('5.3 TRIANGULATE: dos OPs comparan el COALESCE de horas y de costo unitario real sin tarifa inventada', async () => {
    const directorio = prepararDirectorioPlantillas();
    vi.stubEnv('EXCEL_TEMPLATES_DIR', directorio);
    try {
      await conBase(async ({ prisma }) => {
        const conCostos = await sembrar(prisma, {
          numeroOp: 'OT-C14-003',
          nombreCliente: 'Costos Reales S.A.',
          montoVendido: '200.00',
          valorHora: '0.00',
          horas: ['2.00'],
          materiales: [
            {
              tipo: 'MP',
              descripcion: 'Acero',
              cantidad: '1.0000',
              unidad: 'kg',
              costoUnitarioCotizado: '30.00',
              costoUnitarioReal: '40.00',
            },
            {
              tipo: 'INSUMOS',
              descripcion: 'Pintura',
              cantidad: '1.0000',
              unidad: 'l',
              costoUnitarioCotizado: '10.00',
              costoUnitarioReal: null,
            },
          ],
        });
        const sinHoras = await sembrar(prisma, {
          numeroOp: 'OT-C14-004',
          nombreCliente: 'Sin Horas Ltda.',
          montoVendido: '19.00',
          valorHora: '0.00',
          horas: [],
          materiales: [
            {
              tipo: 'MP',
              descripcion: 'Resina',
              cantidad: '2.0000',
              unidad: 'kg',
              costoUnitarioCotizado: '9.50',
              costoUnitarioReal: null,
            },
          ],
        });
        const dependencias = crearDependencias(prisma, ZONA_PRUEBA);
        const crudo = await prisma.$queryRaw<readonly { total: string | null }[]>`
          SELECT SUM(h."horas")::text AS total
          FROM "registros_horas" h
          WHERE h."orden_id" = ${sinHoras.ordenId}::uuid
        `;
        expect(crudo[0]?.total).toBeNull();
        expect(await dependencias.horas.totalHorasReales(sinHoras.ordenId)).toBe('0.00');
        expect(await dependencias.horas.totalHorasReales(sinHoras.ordenId)).toBe(
          calcularHorasRealesTotales([]),
        );
        expect(await dependencias.horas.totalHorasReales(conCostos.ordenId)).toBe('2.00');

        const modeloVacio = await exportOp(dependencias, sinHoras.ordenId, { incluirMargenes: true });
        if (modeloVacio === null || modeloVacio.variante !== 'costeo') {
          throw new Error('el caso de uso no devolvió un modelo de costeo');
        }
        expect(modeloVacio.horasReales).toBe('0.00');
        expect(modeloVacio.valorHora).toBe('0.00');
        expect(modeloVacio.costos.costoMaterialesReal).toBe('19.00');
        expect(modeloVacio.margenReal).toBe('0.00');
        expect(modeloVacio.margenReal).toBe(restar('19.00', '19.00'));
        expect(tasaGlobalNoConfigurada(modeloVacio.valorHora)).toBe(true);

        const salidaVacia = generarCosteo(
          leerPlantilla(NOMBRE_PLANTILLA),
          mapearModeloACeldas(modeloVacio),
        );
        const informeVacio = verificarCosteo(leerPlantilla(NOMBRE_PLANTILLA), salidaVacia);
        exigirGateConforme(informeVacio);
        expect(await valorCelda(salidaVacia, 'P13')).toBe(0);
        expect(await valorCelda(salidaVacia, 'R10')).toBe(0);
        expect(await valorCelda(salidaVacia, 'Q13')).toBe(0);
        expect(await valorCelda(salidaVacia, 'Q21')).toBe(0);

        const materiales = await dependencias.materiales.listarPorOrden(conCostos.ordenId);
        expect(materiales.some((material) => material.costoUnitarioReal === null)).toBe(true);
        expect(costoMaterialReal(materiales)).toBe('50.00');
      });
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  }, 180_000);

  it('5.4 PREPARACIÓN: guarda el xlsx real y el resumen sin firma ni cotejo manual', async () => {
    const directorio = prepararDirectorioPlantillas();
    const destino = join(tmpdir(), 'opencode', 'costeo-c14');
    mkdirSync(destino, { recursive: true });
    vi.stubEnv('EXCEL_TEMPLATES_DIR', directorio);
    try {
      await conBase(async ({ prisma }) => {
        const semilla = await sembrar(prisma, SEMILLA_COSTEO_C14);
        const dependencias = crearDependencias(prisma, ZONA_PRUEBA);
        const modelo = await exportOp(dependencias, semilla.ordenId, { incluirMargenes: true });
        if (modelo === null || modelo.variante !== 'costeo') {
          throw new Error('el caso de uso no devolvió un modelo de costeo');
        }
        const app = await buildApp(configuracionBase(), dependencias);
        try {
          const respuesta = await app.inject({
            method: 'GET',
            url: `/api/ops/${semilla.ordenId}/export?variante=costeo`,
          });
          expect(respuesta.statusCode).toBe(200);
          const informe = verificarCosteo(leerPlantilla(NOMBRE_PLANTILLA), respuesta.rawPayload);
          exigirGateConforme(informe);
          writeFileSync(join(destino, semilla.archivo), respuesta.rawPayload);
          const mapa = mapearModeloACeldas(modelo);
          const resumen = [
            `numeroOp: ${modelo.numeroOp}`,
            `cliente: ${modelo.cliente}`,
            `archivo: ${semilla.archivo}`,
            `horasReales: ${modelo.horasReales}`,
            `horasVendidas: ${modelo.horasVendidas}`,
            `valorHora: ${modelo.valorHora}`,
            `costoMaterialesCotizado: ${modelo.costos.costoMaterialesCotizado}`,
            `costoMaterialesReal: ${modelo.costos.costoMaterialesReal}`,
            `margenReal: ${modelo.margenReal}`,
            `celdasHoja1: P13=${mapa.horasReales}, R10=${mapa.horasReales}, Q13=${mapa.valorHora}, Q21=${mapa.valorHora}, R40=${mapa['materiales.0.costoTotal']}, R41=${mapa['materiales.1.costoTotal']}, R59=${mapa['costos.costoMaterialesReal']}`,
            `gateHoja1: ${informe.conforme ? 'CONFORME' : 'NO CONFORME'}`,
            'firma: SIN FIRMA',
            'cotejoConVelco: PENDIENTE_PASO_MANUAL',
            'hojas2a5YGeneral: PENDIENTE_PASO_MANUAL',
            'costeoHistorico: NO EXISTE',
          ].join('\n');
          writeFileSync(join(destino, 'resumen-verificacion.txt'), resumen, 'utf8');
          const escrito = readFileSync(join(destino, 'resumen-verificacion.txt'), 'utf8');
          expect(escrito).toContain(
            'celdasHoja1: P13=8.00, R10=8.00, Q13=0.00, Q21=0.00, R40=15.00, R41=100.00, R59=115.00',
          );
          for (const marcador of [
            'firma: SIN FIRMA',
            'cotejoConVelco: PENDIENTE_PASO_MANUAL',
            'hojas2a5YGeneral: PENDIENTE_PASO_MANUAL',
            'costeoHistorico: NO EXISTE',
          ]) {
            expect(escrito).toContain(marcador);
          }
        } finally {
          await app.close();
        }
      });
    } finally {
      rmSync(directorio, { recursive: true, force: true });
    }
  }, 180_000);
});
