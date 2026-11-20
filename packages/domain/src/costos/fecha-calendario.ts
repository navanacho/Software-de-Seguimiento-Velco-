export function fechaCalendario(instanteIso: string, zonaHoraria: string): string {
  const instante = new Date(instanteIso);
  if (Number.isNaN(instante.getTime())) {
    return '';
  }
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
  return anio !== undefined && mes !== undefined && dia !== undefined
    ? `${anio}-${mes}-${dia}`
    : '';
}
