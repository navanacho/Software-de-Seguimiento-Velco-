export function calcularHorasVendidasTotales(horasVendidas: readonly string[]): string {
  const totalCentesimas = horasVendidas.reduce((acc, valor) => {
    const normalizado = valor.trim();
    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalizado);
    if (!match) throw new Error(`horasVendidas inválida: ${valor}`);
    const entero = Number(match[1]);
    const dec = (match[2] ?? '').padEnd(2, '0');
    return acc + entero * 100 + Number(dec);
  }, 0);
  const entero = Math.floor(totalCentesimas / 100);
  const dec = String(totalCentesimas % 100).padStart(2, '0');
  return `${entero}.${dec}`;
}
