const CARACTERES_PROHIBIDOS = /[\\/:*?"<>|\u0000-\u001f\u007f]+/g;
const DIACRITICOS = /[\u0300-\u036f]/g;
const ESPACIOS = /\s+/g;
const FINAL_PUNTOS = /[.\s]+$/;

function sanear(valor: string, valorPorDefecto: string): string {
  const resultado = valor
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .replace(CARACTERES_PROHIBIDOS, ' ')
    .replace(ESPACIOS, ' ')
    .trim()
    .replace(FINAL_PUNTOS, '');
  return resultado === '' ? valorPorDefecto : resultado;
}

export function nombreArchivoCosteo(numeroOp: string, cliente: string): string {
  return `COSTEO_${sanear(numeroOp, 'OT')}_${sanear(cliente, 'cliente')}.xlsx`;
}
