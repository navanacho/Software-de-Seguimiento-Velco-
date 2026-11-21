export interface Reloj {
  ahora(): Date;
}

export class RelojSistema implements Reloj {
  ahora(): Date {
    return new Date();
  }
}

export function fechaCalendarioEnZona(instante: Date, zonaHoraria: string): string {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zonaHoraria,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instante);
  let anio: string | undefined;
  let mes: string | undefined;
  let dia: string | undefined;
  for (const parte of partes) {
    if (parte.type === 'year') anio = parte.value;
    if (parte.type === 'month') mes = parte.value;
    if (parte.type === 'day') dia = parte.value;
  }
  if (anio === undefined || mes === undefined || dia === undefined) {
    throw new Error('la zona horaria no produjo una fecha calendaria válida');
  }
  return `${anio}-${mes}-${dia}`;
}
