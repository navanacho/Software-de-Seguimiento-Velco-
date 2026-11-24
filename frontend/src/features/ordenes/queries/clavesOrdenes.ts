export function claveOrden(ordenId: string) {
  return ['orden', ordenId] as const;
}

export function claveHoras(ordenId: string) {
  return ['horas', ordenId] as const;
}
