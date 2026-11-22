import estilos from './BadgePlano.module.css';

interface Props {
  readonly codigoPlano: string | null;
}

export function BadgePlano({ codigoPlano }: Props) {
  return (
    <span data-testid="badge-plano" className={estilos.badge}>
      {codigoPlano === null ? 'Sin plano' : `Plano: ${codigoPlano}`}
    </span>
  );
}
