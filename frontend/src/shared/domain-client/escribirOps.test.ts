import { describe, expect, it, vi } from 'vitest';
import {
  EsquemaActualizarOp,
  EsquemaAltaEtapa,
  EsquemaAltaMaterial,
  EsquemaCrearOp,
  EsquemaReordenEtapa,
} from './esquemas.ts';
import { ErrorApi, interpretarErrorHTTP } from './errores.ts';
import type { AltaMaterialEntrada } from './esquemas.ts';
import {
  actualizarOp,
  altaCliente,
  altaEtapa,
  altaMaterial,
  bajaEtapa,
  crearOp,
  reordenarEtapa,
} from './escribirOps.ts';

const detalle = {
  id: 'op-1',
  numeroOp: '1871',
  codigoPlano: 'PL-2026-045',
  clienteId: 'c-1',
  clienteNombre: 'ACME',
  descripcionPieza: 'Eje',
  etapas: [{ id: 'e-1', nombre: 'Corte', ordenSecuencia: 1, completada: false, horasVendidas: '7.50' }],
  avance: 0,
  semaforo: 'En plazo',
  diasRestantes: 2,
  etapaAhora: 'Corte',
  etiquetaPlazo: 'Faltan 2 días',
  fechaIngreso: '2026-11-22',
  fechaEntrega: '2026-12-01',
  montoVendido: '1000.00',
  observaciones: null,
  horas: [],
  materiales: [],
  costoMaterialesCotizado: '0.00',
  costoMaterialesReal: '0.00',
  horasVendidasTotales: '7.50',
  horasRealesTotales: '0.00',
  desvioHoras: '-7.50',
  porcentajeConsumo: '0.00',
  alertaDesvio: false,
};

const baseOp = {
  numeroOp: '1871',
  codigoPlano: 'PL-2026-045',
  clienteNombre: 'ACME',
  descripcionPieza: 'Eje',
  fechaEntrega: '2026-12-01',
  montoVendido: '1000.00',
};

const material: AltaMaterialEntrada = {
  tipo: 'MP',
  descripcion: 'Acero',
  cantidad: '2.00',
  unidad: 'kg',
  costoUnitarioCotizado: '10.50',
};

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } });
}

describe('esquemas de escritura espejo de C-06', () => {
  it('acepta el body exacto de alta con materiales y etapas', () => {
    const body = { ...baseOp, materiales: [material], etapas: [{ nombre: 'Corte', horasVendidas: '7.50' }] };
    expect(EsquemaCrearOp.parse(body)).toEqual({ ...body, observaciones: undefined });
  });

  it('acepta el body exacto de edición sin etapas ni materiales', () => {
    expect(EsquemaActualizarOp.parse(baseOp)).toEqual({ ...baseOp, observaciones: undefined });
  });

  it('rechaza claves extra, tipo de material inválido y decimal numérico', () => {
    expect(() => EsquemaCrearOp.parse({ ...baseOp, fechaIngreso: '2026-01-01' })).toThrow();
    expect(() => EsquemaAltaMaterial.parse({ ...material, tipo: 'OTRO' })).toThrow();
    expect(() => EsquemaAltaMaterial.parse({ ...material, cantidad: 2 })).toThrow();
  });

  it('valida alta de etapa y reorden con los mismos límites de C-06', () => {
    expect(EsquemaAltaEtapa.parse({ nombre: 'Pulido', horasVendidas: '0.00' })).toEqual({ nombre: 'Pulido', horasVendidas: '0.00' });
    expect(() => EsquemaAltaEtapa.parse({ nombre: '' })).toThrow();
    expect(EsquemaReordenEtapa.parse({ ordenSecuencia: 1 })).toEqual({ ordenSecuencia: 1 });
    expect(() => EsquemaReordenEtapa.parse({ ordenSecuencia: 0 })).toThrow();
  });
});

describe('cliente HTTP de escritura (C-06)', () => {
  it('POST /api/ops envía el plano sin normalizar y omite etapas cuando no se editan', async () => {
    const consulta = vi.fn(async (_url: string, _init?: RequestInit) => respuesta(detalle, 201));
    await crearOp({ ...baseOp, codigoPlano: '  pl-2026-045  ' }, consulta);
    const [url, init] = consulta.mock.calls[0] ?? [];
    expect(url).toBe('/api/ops');
    expect(init?.method).toBe('POST');
    const cuerpo = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(cuerpo.codigoPlano).toBe('  pl-2026-045  ');
    expect(Object.hasOwn(cuerpo, 'etapas')).toBe(false);
  });

  it('POST /api/ops incluye materiales y etapas explícitas cuando se modifican', async () => {
    const consulta = vi.fn(async (_url: string, _init?: RequestInit) => respuesta(detalle, 201));
    await crearOp({ ...baseOp, materiales: [material], etapas: [{ nombre: 'Corte', horasVendidas: '7.50' }] }, consulta);
    const init = consulta.mock.calls[0]?.[1];
    const cuerpo = JSON.parse(String(init?.body)) as { materiales: unknown[]; etapas: { horasVendidas: string }[] };
    expect(cuerpo.materiales).toHaveLength(1);
    expect(cuerpo.etapas[0]?.horasVendidas).toBe('7.50');
  });

  it('PUT /api/ops/:id no envía etapas ni materiales', async () => {
    const consulta = vi.fn(async (_url: string, _init?: RequestInit) => respuesta(detalle));
    await actualizarOp('op-1', baseOp, consulta);
    const [url, init] = consulta.mock.calls[0] ?? [];
    expect(url).toBe('/api/ops/op-1');
    expect(init?.method).toBe('PUT');
    const cuerpo = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(Object.hasOwn(cuerpo, 'etapas')).toBe(false);
    expect(Object.hasOwn(cuerpo, 'materiales')).toBe(false);
  });

  it('usa los endpoints dedicados de etapas y materiales', async () => {
    const materialCreado = {
      id: 'm-1',
      ordenId: 'op-1',
      ...material,
      unidad: 'kg',
      costoUnitarioReal: null,
      nroRemito: null,
      nroFactura: null,
      nt: null,
      po: null,
    };
    const consulta = vi.fn(async (url: string, _init?: RequestInit) => String(url).includes('/materiales') ? respuesta(materialCreado, 201) : respuesta({ ok: true }, 201));
    await altaEtapa('op-1', { nombre: 'Pulido', horasVendidas: '0.00' }, consulta);
    await reordenarEtapa('op-1', 'e-1', 1, consulta);
    await bajaEtapa('op-1', 'e-1', consulta);
    await altaMaterial('op-1', material, consulta);
    expect(consulta.mock.calls[0]?.[0]).toBe('/api/ops/op-1/etapas');
    expect(consulta.mock.calls[1]?.[0]).toBe('/api/ops/op-1/etapas/e-1/orden');
    expect(consulta.mock.calls[1]?.[1]?.method).toBe('PATCH');
    expect(consulta.mock.calls[2]?.[1]?.method).toBe('DELETE');
    expect(consulta.mock.calls[3]?.[0]).toBe('/api/ops/op-1/materiales');
  });

  it('POST /api/clientes transporta solo { nombre }', async () => {
    const consulta = vi.fn(async (_url: string, _init?: RequestInit) => respuesta({ id: 'c-2', nombre: 'Nueva SA', createdAt: '2026-11-22' }, 201));
    await altaCliente('Nueva SA', consulta);
    const [url, init] = consulta.mock.calls[0] ?? [];
    expect(url).toBe('/api/clientes');
    expect(JSON.parse(String(init?.body))).toEqual({ nombre: 'Nueva SA' });
  });
});

describe('parseo tipado de errores 409/422', () => {
  it('mapea el 409 de plano con opExistente a un error discriminado', () => {
    const causa = interpretarErrorHTTP(409, {
      error: 'codigo_plano_duplicado',
      message: 'El ID de plano PL-2026-045 ya está asignado a la OP 1871.',
      codigoPlano: 'PL-2026-045',
      opExistente: { id: 'op-1871', numeroOp: '1871' },
    });
    expect(causa.tipo).toBe('codigo_plano_duplicado');
    if (causa.tipo === 'codigo_plano_duplicado') {
      expect(causa.opExistente.id).toBe('op-1871');
      expect(causa.message).toBe('El ID de plano PL-2026-045 ya está asignado a la OP 1871.');
    }
  });

  it('mapea el 409 de OP sin opExistente y el 422 por path', () => {
    const op = interpretarErrorHTTP(409, { error: 'numero_op_duplicado', message: 'Existe', numeroOp: '1871' });
    expect(op.tipo).toBe('numero_op_duplicado');
    const validacion = interpretarErrorHTTP(422, {
      error: 'validation_error',
      message: 'datos inválidos en la solicitud',
      details: [
        { path: 'numeroOp', message: 'Requerido' },
        { path: 'clienteNombre', message: 'Requerido' },
      ],
    });
    expect(validacion.tipo).toBe('validation_error');
    if (validacion.tipo === 'validation_error') {
      expect(validacion.detalles[0]?.path).toBe('numeroOp');
      expect(validacion.detalles[1]?.path).toBe('clienteNombre');
    }
  });

  it('lanza ErrorApi con la causa al fallar una escritura', async () => {
    const consulta = vi.fn(async (_url: string, _init?: RequestInit) => respuesta({ error: 'numero_op_duplicado', message: 'Existe', numeroOp: '1871' }, 409));
    await expect(crearOp(baseOp, consulta)).rejects.toBeInstanceOf(ErrorApi);
    await expect(crearOp(baseOp, consulta)).rejects.toMatchObject({ causa: { tipo: 'numero_op_duplicado' } });
  });
});
