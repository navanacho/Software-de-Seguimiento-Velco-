import { describe, expect, it } from 'vitest';
import { mensajeErrorEliminar } from './mensajeErrorEliminar.ts';

describe('mensajeErrorEliminar (CRITICAL-4)', () => {
  it('incluye el motivo del error y una acción para el usuario', () => {
    const mensaje = mensajeErrorEliminar(new Error('falla del servidor'));
    expect(mensaje).toMatch(/no se pudo eliminar/i);
    expect(mensaje).toMatch(/falla del servidor/i);
    expect(mensaje).toMatch(/reintent/i);
  });

  it('da un mensaje accionable cuando el error no es una Error', () => {
    const mensaje = mensajeErrorEliminar('fallo inesperado');
    expect(mensaje).toMatch(/no se pudo eliminar/i);
    expect(mensaje).toMatch(/error desconocido/i);
    expect(mensaje).toMatch(/reintent/i);
  });
});
