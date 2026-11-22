import type { EtapaFormulario } from './tiposFormulario.ts';

export const ETAPAS_PRECARGADAS: readonly EtapaFormulario[] = [
  { nombre: 'Corte', horasVendidas: '0.00' },
  { nombre: 'Soldadura', horasVendidas: '0.00' },
  { nombre: 'Mecanizado', horasVendidas: '0.00' },
  { nombre: 'Pintura', horasVendidas: '0.00' },
  { nombre: 'Entrega', horasVendidas: '0.00' },
];
