interface ResultadoIncremento {
  texto: string;
  acarreo: boolean;
}

const SIGUIENTE_DIGITO: Record<string, string> = {
  '0': '1', '1': '2', '2': '3', '3': '4', '4': '5',
  '5': '6', '6': '7', '7': '8', '8': '9', '9': '0',
};

function incrementar(texto: string): ResultadoIncremento {
  let resultado = '';
  let acarreo = true;
  for (let indice = texto.length - 1; indice >= 0; indice -= 1) {
    const digito = texto[indice] ?? '0';
    if (acarreo) {
      const siguiente = SIGUIENTE_DIGITO[digito] ?? '0';
      resultado = siguiente + resultado;
      acarreo = siguiente === '0';
    } else {
      resultado = digito + resultado;
    }
  }
  return { texto: resultado, acarreo };
}

export function formatearImporte(valor: string): string {
  const negativo = valor.startsWith('-');
  const magnitud = negativo ? valor.slice(1) : valor;
  const separador = magnitud.indexOf('.');
  const entera = (separador === -1 ? magnitud : magnitud.slice(0, separador)) || '0';
  const decimales = separador === -1 ? '' : magnitud.slice(separador + 1);
  const dosDecimales = `${decimales}00`.slice(0, 2);
  const decimalesAjustados = (decimales[2] ?? '0') >= '5'
    ? incrementar(dosDecimales)
    : { texto: dosDecimales, acarreo: false };

  let enteraAjustada = entera;
  if (decimalesAjustados.acarreo) {
    const parteEntera = incrementar(entera);
    enteraAjustada = `${parteEntera.acarreo ? '1' : ''}${parteEntera.texto}`;
  }

  const signo = negativo ? '-' : '';
  return `${signo}${enteraAjustada}.${decimalesAjustados.texto}`;
}

export function formatearPorcentaje(valor: string | null): string {
  if (valor === null) {
    return '—';
  }
  const recortado = formatearImporte(valor).replace(/0+$/, '').replace(/\.$/, '');
  return `${recortado}%`;
}
