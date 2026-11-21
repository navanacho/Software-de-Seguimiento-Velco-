import type { GrupoFlujo } from '@velco/domain';

interface Props {
  flujo: readonly GrupoFlujo[];
}

export function TiraFlujo({ flujo }: Props) {
  if (flujo.length === 0) return <div data-testid="tira-flujo">no hay trabajos en curso</div>;
  return (
    <section data-testid="tira-flujo">
      {flujo.map((g) => (
        <span key={`${g.etapa}-${g.cantidad}`} data-testid="flujo-grupo">
          {g.etapa}: {g.cantidad}
        </span>
      ))}
    </section>
  );
}
