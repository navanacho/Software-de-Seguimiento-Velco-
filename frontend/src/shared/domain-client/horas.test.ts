import { describe, expect, it, vi } from 'vitest';
import { ErrorApi } from './errores.ts';
import { cargarHora, editarHora, eliminarHora, listarHoras } from './horas.ts';

const ordenId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
const parteId = '2f8c1a4e-6d5b-4f0a-8c3e-1a2b3c4d5e6f';
const etapaId = '3a9c1a4e-6d5b-4f0a-8c3e-1a2b3c4d5e70';

const parte = {
  id: parteId,
  ordenId,
  etapaId,
  operario: 'Ana',
  fecha: '2026-03-05',
  horas: '2.50',
  createdAt: '2026-03-05T10:00:00.000Z',
  observacion: null,
};

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } });
}

describe('cliente HTTP de horas (C-09)', () => {
  it('GET /api/ops/:id/horas valida el listado con Zod', async () => {
    const consulta = vi.fn(async () => respuesta([parte]));
    const horas = await listarHoras(ordenId, consulta);
    expect(consulta).toHaveBeenCalledWith(`/api/ops/${ordenId}/horas`);
    expect(horas).toEqual([parte]);
  });

  it('POST /api/ops/:id/horas valida el cuerpo antes de enviar y parsea la respuesta', async () => {
    const consulta = vi.fn(async (_url: string, _init?: RequestInit) => respuesta(parte, 201));
    const creado = await cargarHora(ordenId, { etapaId, operario: 'Ana', fecha: '2026-03-05', horas: '2.50' }, consulta);
    expect(creado).toEqual(parte);
    const [url, init] = consulta.mock.calls[0] ?? [];
    expect(url).toBe(`/api/ops/${ordenId}/horas`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ etapaId, operario: 'Ana', fecha: '2026-03-05', horas: '2.50' });
  });

  it('cargarHora rechaza horas <= 0 sin llamar a la red', async () => {
    const consulta = vi.fn(async () => respuesta({}, 201));
    await expect(cargarHora(ordenId, { operario: 'Ana', fecha: '2026-03-05', horas: '0' }, consulta)).rejects.toThrow();
    expect(consulta).not.toHaveBeenCalled();
  });

  it('PATCH /api/ops/:id/horas/:parteId envía solo los cambios', async () => {
    const consulta = vi.fn(async (_url: string, _init?: RequestInit) => respuesta({ ...parte, horas: '3.00' }));
    const actualizado = await editarHora(ordenId, parteId, { horas: '3.00' }, consulta);
    expect(actualizado.horas).toBe('3.00');
    const [url, init] = consulta.mock.calls[0] ?? [];
    expect(url).toBe(`/api/ops/${ordenId}/horas/${parteId}`);
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(String(init?.body))).toEqual({ horas: '3.00' });
  });

  it('editarHora rechaza un cuerpo vacío sin llamar a la red', async () => {
    const consulta = vi.fn(async () => respuesta({}, 200));
    await expect(editarHora(ordenId, parteId, {}, consulta)).rejects.toThrow();
    expect(consulta).not.toHaveBeenCalled();
  });

  it('DELETE /api/ops/:id/horas/:parteId confirma el borrado', async () => {
    const consulta = vi.fn(async (_url: string, _init?: RequestInit) => respuesta({ ok: true }));
    await expect(eliminarHora(ordenId, parteId, consulta)).resolves.toBeUndefined();
    const [url, init] = consulta.mock.calls[0] ?? [];
    expect(url).toBe(`/api/ops/${ordenId}/horas/${parteId}`);
    expect(init?.method).toBe('DELETE');
  });

  it('propaga ErrorApi con causa validation_error ante un 422', async () => {
    const consulta = vi.fn(async () => respuesta({ error: 'validation_error', message: 'horas inválidas', details: [{ path: 'horas', message: 'horas inválidas' }] }, 422));
    await expect(cargarHora(ordenId, { operario: 'Ana', fecha: '2026-03-05', horas: '2.50' }, consulta)).rejects.toMatchObject({
      name: 'ErrorApi',
      causa: { tipo: 'validation_error' },
    });
    expect(ErrorApi).toBeDefined();
  });
});
