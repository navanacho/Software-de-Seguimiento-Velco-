import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(process.cwd(), '..');

type Manifiesto = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: Record<string, string>;
};

function leerManifiesto(ruta: string): Manifiesto {
  return JSON.parse(readFileSync(join(raiz, ruta), 'utf8')) as Manifiesto;
}

describe('fijación exacta de versiones', () => {
  it('fija todas las versiones del stack en los manifiestos correspondientes', () => {
    const raizManifiesto = leerManifiesto('package.json');
    const backend = leerManifiesto('backend/package.json');
    const frontend = leerManifiesto('frontend/package.json');

    expect(raizManifiesto.engines?.node).toBe('26.13.1');
    expect(raizManifiesto.devDependencies?.typescript).toBe('7.0.2');
    expect(frontend.dependencies?.react).toBe('19.3.1');
    expect(frontend.dependencies?.['react-dom']).toBe('19.3.1');
    expect(frontend.devDependencies?.vite).toBe('8.3.8');
    expect(backend.dependencies?.fastify).toBe('5.12.8');
    expect(backend.dependencies?.zod).toBe('4.6.7');
    expect(backend.dependencies?.exceljs).toBe('4.4.0');
    expect(backend.dependencies?.['@fastify/swagger']).toBe('9.9.5');
    expect(backend.dependencies?.['@prisma/client']).toBe('7.10.1');
    expect(backend.devDependencies?.prisma).toBe('7.10.1');
    expect(backend.devDependencies?.['@testcontainers/postgresql']).toBe('12.2.2');
    expect(frontend.dependencies?.['@tanstack/react-query']).toBe('5.108.1');
    expect(frontend.dependencies?.['react-router-dom']).toBe('7.18.6');
    expect(frontend.dependencies?.clsx).toBe('2.1.1');
    expect(frontend.devDependencies?.['@testing-library/react']).toBe('16.3.3');
    expect(frontend.devDependencies?.jsdom).toBe('31.0.1');
    expect(backend.devDependencies?.vitest).toBe('5.1.1');
    expect(frontend.devDependencies?.vitest).toBe('5.1.1');
    expect(backend.devDependencies?.['@types/node']).toBe('26.6.6');
    expect(frontend.devDependencies?.['@types/react']).toBe('19.3.0');
    expect(frontend.devDependencies?.['@types/react-dom']).toBe('19.3.0');
  });

  it('documenta el Node fijado y evita release candidates', () => {
    expect(readFileSync(join(raiz, '.nvmrc'), 'utf8').trim()).toBe('26.13.1');
    for (const ruta of ['package.json', 'backend/package.json', 'frontend/package.json', 'packages/domain/package.json']) {
      expect(readFileSync(join(raiz, ruta), 'utf8')).not.toMatch(/8\.0\.0-rc|@rc|next@/);
    }
  });
});
