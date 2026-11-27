import { createHash } from 'node:crypto';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../../src/features/salud/http/app.ts';
import { nombreArchivoCosteo } from '../../src/features/exportacion/http/nombreDescarga.ts';
import {
  ConsultaExportacionJSONSchema,
  ConsultaExportacionSchema,
  ParamsOpSchema,
} from '../../src/features/exportacion/http/esquemas.ts';
import { leerPlantilla, rutaPlantilla } from '../excel-template-spike/soporte.ts';
import {
  configuracionPrueba,
  crearCliente,
  crearConfiguracion,
  crearDependenciasFalsas,
  crearEtapas,
  crearOrden,
  crearRegistroHora,
} from '../tablero-read-api/fixtures.ts';

const OP_ID = '11111111-1111-4111-8111-111111111111';
const NOMBRE_PLANTILLA = 'MASTER COSTEO NUEVO.xlsx';

function prepararDirectorio(conPlantilla = true): string {
  const directorio = mkdtempSync(join(tmpdir(), `velco-export-${Date.now()}-`));
  if (conPlantilla) {
    copyFileSync(rutaPlantilla(NOMBRE_PLANTILLA), join(directorio, NOMBRE_PLANTILLA));
  }
  return directorio;
}

function dependenciasConOp({
  id = OP_ID,
  numeroOp = 'OT-1001',
  nombreCliente = 'ACME S.A.',
}: { id?: string; numeroOp?: string; nombreCliente?: string } = {}) {
  const falso = crearDependenciasFalsas({
    ops: [crearOrden({ id, numeroOp, montoVendido: '1000.00' })],
    etapas: crearEtapas(['Corte'], id),
    horas: [crearRegistroHora({ ordenId: id, etapaId: `${id}-etapa-1`, horas: '2.50' })],
    clientes: [crearCliente({ id: 'cli-1', nombre: nombreCliente })],
    configuracion: crearConfiguracion({ valorHoraEstandar: '32.8250' }),
  });
  return falso.dependencias;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('endpoint de exportación de costeo', () => {
  it('safety net: la plantilla conserva su hash y la app base sigue respondiendo', async () => {
    const hash = createHash('sha256').update(leerPlantilla(NOMBRE_PLANTILLA)).digest('hex').toUpperCase();
    expect(hash).toBe('1FA2DA0031D2A06BBAC506057F3679D77CA835D1EB70B8657F19D95A47649602');

    const directorio = prepararDirectorio();
    vi.stubEnv('EXCEL_TEMPLATES_DIR', directorio);
    const app = await buildApp(configuracionPrueba(), dependenciasConOp());
    try {
      const respuesta = await app.inject({ method: 'GET', url: '/api/health' });
      expect(respuesta.statusCode).toBe(200);
    } finally {
      await app.close();
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('4.4 el esquema de consulta acepta solo variante costeo', () => {
    expect(ConsultaExportacionSchema.safeParse({ variante: 'costeo' }).success).toBe(true);
    expect(ConsultaExportacionSchema.safeParse({ variante: 'op' }).success).toBe(false);
    expect(ConsultaExportacionSchema.safeParse({}).success).toBe(false);
    expect(
      ConsultaExportacionSchema.safeParse({ variante: 'costeo', extra: 'x' }).success,
    ).toBe(false);
    expect(JSON.stringify(ConsultaExportacionJSONSchema)).toContain('costeo');
  });

  it('4.4 ParamsOpSchema valida el UUID y rechaza identificadores arbitrarios', () => {
    expect(ParamsOpSchema.safeParse({ id: OP_ID }).success).toBe(true);
    expect(ParamsOpSchema.safeParse({ id: 'op-1' }).success).toBe(false);
  });

  it('4.5 buildApp monta la ruta documentada y devuelve un xlsx binario', async () => {
    const directorio = prepararDirectorio();
    vi.stubEnv('EXCEL_TEMPLATES_DIR', directorio);
    const app = await buildApp(configuracionPrueba(), dependenciasConOp());
    try {
      const respuesta = await app.inject({
        method: 'GET',
        url: `/api/ops/${OP_ID}/export?variante=costeo`,
      });

      expect(respuesta.statusCode).toBe(200);
      expect(Buffer.isBuffer(respuesta.rawPayload)).toBe(true);
      expect(respuesta.headers['content-type']).toContain('spreadsheetml.sheet');

      const documentacion = await app.inject({ method: 'GET', url: '/documentation/json' });
      const paths = documentacion.json().paths as Record<string, unknown>;
      expect(paths['/api/ops/{id}/export']).toBeDefined();
    } finally {
      await app.close();
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('4.7 plantilla ausente produce 500 tipado sin cabecera de descarga ni parcial', async () => {
    const directorio = prepararDirectorio(false);
    vi.stubEnv('EXCEL_TEMPLATES_DIR', directorio);
    const app = await buildApp(configuracionPrueba(), dependenciasConOp());
    try {
      const respuesta = await app.inject({
        method: 'GET',
        url: `/api/ops/${OP_ID}/export?variante=costeo`,
      });
      expect(respuesta.statusCode).toBe(500);
      const cuerpo = respuesta.json<{ error?: string; message?: string }>();
      expect(cuerpo.error).toBe('plantilla_no_encontrada');
      expect(cuerpo.message).toContain(NOMBRE_PLANTILLA);
      expect(respuesta.headers['content-disposition']).toBeUndefined();
      expect(respuesta.headers['content-type']).toContain('application/json');
    } finally {
      await app.close();
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('4.9 TRANS el mensaje nombra la plantilla y no filtra rutas, variables de entorno ni UNC', async () => {
    const directorio = prepararDirectorio(false);
    vi.stubEnv('EXCEL_TEMPLATES_DIR', directorio);
    vi.stubEnv('EXCEL_UNC_BASE', '\\\\servidor\\compartido\\Excel');
    const app = await buildApp(configuracionPrueba(), dependenciasConOp());
    try {
      const respuesta = await app.inject({
        method: 'GET',
        url: `/api/ops/${OP_ID}/export?variante=costeo`,
      });
      const cuerpo = respuesta.json<{ error?: string; message?: string }>();
      expect(respuesta.statusCode).toBe(500);
      expect(cuerpo.error).toBe('plantilla_no_encontrada');
      expect(cuerpo.message).toContain(NOMBRE_PLANTILLA);
      for (const secreto of [
        'EXCEL_TEMPLATES_DIR',
        'EXCEL_UNC_BASE',
        '\\\\servidor',
        directorio,
      ]) {
        expect(respuesta.rawPayload.toString('utf8')).not.toContain(secreto);
      }
      expect(respuesta.headers['content-disposition']).toBeUndefined();
      expect(respuesta.headers['content-type']).toContain('application/json');
    } finally {
      await app.close();
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('regresión 6.5: sin EXCEL_TEMPLATES_DIR la app se registra y responde 500 tipado seguro', async () => {
    vi.stubEnv('EXCEL_TEMPLATES_DIR', undefined);
    const app = await buildApp(configuracionPrueba(), dependenciasConOp());
    try {
      const respuesta = await app.inject({
        method: 'GET',
        url: `/api/ops/${OP_ID}/export?variante=costeo`,
      });
      expect(respuesta.statusCode).toBe(500);
      expect(respuesta.json()).toEqual({
        error: 'plantilla_no_encontrada',
        message:
          'No se encontró la plantilla oficial MASTER COSTEO NUEVO.xlsx en el directorio configurado.',
      });
      expect(respuesta.headers['content-disposition']).toBeUndefined();
      expect(respuesta.headers['content-type']).toContain('application/json');
      const texto = respuesta.rawPayload.toString('utf8');
      for (const secreto of ['EXCEL_TEMPLATES_DIR', 'EXCEL_UNC_BASE', '\\\\', tmpdir()]) {
        expect(texto).not.toContain(secreto);
      }
    } finally {
      await app.close();
    }
  });

  it('4.9 TRANS sin UNC y con plantilla presente la exportación sigue funcionando', async () => {
    const directorio = prepararDirectorio();
    vi.stubEnv('EXCEL_TEMPLATES_DIR', directorio);
    vi.stubEnv('EXCEL_UNC_BASE', '');
    const app = await buildApp(configuracionPrueba(), dependenciasConOp());
    try {
      const respuesta = await app.inject({
        method: 'GET',
        url: `/api/ops/${OP_ID}/export?variante=costeo`,
      });
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.headers['content-disposition']).toContain('COSTEO_OT-1001_');
    } finally {
      await app.close();
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('4.10 el nombre saneado elimina acentos, separadores de ruta y caracteres de control', () => {
    expect(nombreArchivoCosteo('OT/1001 "A"', 'Ácme\\S.A.:Ltda?')).toBe(
      'COSTEO_OT 1001 A_Acme S.A. Ltda.xlsx',
    );
    expect(nombreArchivoCosteo('OT-2002', '   ')).toBe('COSTEO_OT-2002_cliente.xlsx');
  });

  it('4.10 la cabecera usa el nombre saneado y Swagger no ofrece la variante op', async () => {
    const directorio = prepararDirectorio();
    vi.stubEnv('EXCEL_TEMPLATES_DIR', directorio);
    const app = await buildApp(
      configuracionPrueba(),
      dependenciasConOp({
        numeroOp: 'OT/1001 "A"',
        nombreCliente: 'Ácme\\S.A.:Ltda?',
      }),
    );
    try {
      const respuesta = await app.inject({
        method: 'GET',
        url: `/api/ops/${OP_ID}/export?variante=costeo`,
      });
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.headers['content-disposition']).toBe(
        'attachment; filename="COSTEO_OT 1001 A_Acme S.A. Ltda.xlsx"',
      );

      const documentacion = await app.inject({ method: 'GET', url: '/documentation/json' });
      const ruta = documentacion.json().paths['/api/ops/{id}/export'] as {
        get: { parameters: { in: string; schema: unknown }[] };
      };
      const consulta = ruta.get.parameters.find((parametro) => parametro.in === 'query');
      const esquema = JSON.stringify(consulta?.schema);
      expect(esquema).toContain('costeo');
      expect(esquema).not.toContain('"op"');
    } finally {
      await app.close();
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('4.10 sin dependencias la ruta no existe y no hay auth/PIN/RBAC', async () => {
    const app = await buildApp(configuracionPrueba());
    try {
      const respuesta = await app.inject({
        method: 'GET',
        url: `/api/ops/${OP_ID}/export?variante=costeo`,
      });
      expect(respuesta.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it('4.6 la cabecera sigue exactamente el patrón COSTEO_[NroOP]_[Cliente].xlsx', async () => {
    const directorio = prepararDirectorio();
    vi.stubEnv('EXCEL_TEMPLATES_DIR', directorio);
    const app = await buildApp(configuracionPrueba(), dependenciasConOp());
    try {
      const respuesta = await app.inject({
        method: 'GET',
        url: `/api/ops/${OP_ID}/export?variante=costeo`,
      });
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.headers['content-disposition']).toBe(
        'attachment; filename="COSTEO_OT-1001_ACME S.A.xlsx"',
      );
    } finally {
      await app.close();
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('4.6 TRANS variante op devuelve 422 y una OP inexistente devuelve 404', async () => {
    const directorio = prepararDirectorio();
    vi.stubEnv('EXCEL_TEMPLATES_DIR', directorio);
    const app = await buildApp(configuracionPrueba(), dependenciasConOp());
    try {
      const invalida = await app.inject({
        method: 'GET',
        url: `/api/ops/${OP_ID}/export?variante=op`,
      });
      expect(invalida.statusCode).toBe(422);
      expect(invalida.json().error).toBe('validation_error');

      const sinOp = await buildApp(
        configuracionPrueba(),
        crearDependenciasFalsas({ ops: [] }).dependencias,
      );
      try {
        const respuesta = await sinOp.inject({
          method: 'GET',
          url: `/api/ops/${OP_ID}/export?variante=costeo`,
        });
        expect(respuesta.statusCode).toBe(404);
        expect(respuesta.json().error).toBe('not_found');
        expect(respuesta.headers['content-disposition']).toBeUndefined();
      } finally {
        await sinOp.close();
      }
    } finally {
      await app.close();
      rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('4.5 TRANS otra OP genera otro archivo sin estado compartido', async () => {
    const otroId = '22222222-2222-4222-8222-222222222222';
    const directorio = prepararDirectorio();
    vi.stubEnv('EXCEL_TEMPLATES_DIR', directorio);
    const app = await buildApp(
      configuracionPrueba(),
      dependenciasConOp({ id: otroId, numeroOp: 'OT-2002', nombreCliente: 'Beta Ltda.' }),
    );
    try {
      const respuesta = await app.inject({
        method: 'GET',
        url: `/api/ops/${otroId}/export?variante=costeo`,
      });
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.headers['content-disposition']).toContain('OT-2002');
      expect(Buffer.isBuffer(respuesta.rawPayload)).toBe(true);
    } finally {
      await app.close();
      rmSync(directorio, { recursive: true, force: true });
    }
  });
});
