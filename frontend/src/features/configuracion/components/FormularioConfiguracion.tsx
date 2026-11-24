import { useEffect, useState, type FormEvent } from 'react';
import { validarConfiguracion } from '@velco/domain';
import type { BodyConfiguracion, ConfiguracionDTO } from '../../../shared/domain-client/configuracion.ts';
import estilos from './FormularioConfiguracion.module.css';

interface ErrorCampo {
  readonly path: string;
  readonly message: string;
}

interface Props {
  readonly configuracion: ConfiguracionDTO;
  readonly erroresApi?: readonly ErrorCampo[];
  readonly guardado?: boolean;
  readonly onGuardar: (cuerpo: BodyConfiguracion) => void;
}

interface Valores {
  valorHoraEstandar: string;
  diasAlertaRiesgo: string;
  porcentajeAvanceRiesgo: string;
  etapasDefault: string[];
}

function desdeConfiguracion(configuracion: ConfiguracionDTO): Valores {
  return {
    valorHoraEstandar: configuracion.valorHoraEstandar,
    diasAlertaRiesgo: String(configuracion.diasAlertaRiesgo),
    porcentajeAvanceRiesgo: String(configuracion.porcentajeAvanceRiesgo),
    etapasDefault: [...configuracion.etapasDefault],
  };
}

function entero(valor: string): number {
  const texto = valor.trim();
  return /^\d+$/.test(texto) ? Number(texto) : Number.NaN;
}

export function FormularioConfiguracion({ configuracion, erroresApi = [], guardado = false, onGuardar }: Props) {
  const [valores, setValores] = useState<Valores>(() => desdeConfiguracion(configuracion));
  const [erroresLocales, setErroresLocales] = useState<Record<string, string>>({});

  useEffect(() => {
    setValores(desdeConfiguracion(configuracion));
    setErroresLocales({});
  }, [configuracion]);

  function mensaje(campo: string): string | undefined {
    const local = erroresLocales[campo];
    if (local !== undefined) return local;
    const remoto = erroresApi.find((error) => error.path === campo || error.path.startsWith(`${campo}.`));
    return remoto?.message;
  }

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    const candidato = {
      valorHoraEstandar: valores.valorHoraEstandar.trim(),
      diasAlertaRiesgo: entero(valores.diasAlertaRiesgo),
      porcentajeAvanceRiesgo: entero(valores.porcentajeAvanceRiesgo),
      etapasDefault: valores.etapasDefault,
    };
    const validacion = validarConfiguracion(candidato);
    if (!validacion.valido) {
      setErroresLocales(Object.fromEntries(validacion.errores.map((error) => [error.campo, error.mensaje])));
      return;
    }
    setErroresLocales({});
    onGuardar({ ...validacion.valores, etapasDefault: [...validacion.valores.etapasDefault] });
  }

  function cambiarEtapa(indice: number, nombre: string): void {
    setValores((anterior) => ({
      ...anterior,
      etapasDefault: anterior.etapasDefault.map((etapa, i) => (i === indice ? nombre : etapa)),
    }));
  }

  return (
    <form className={estilos.formulario} onSubmit={enviar} noValidate>
      <div className={estilos.campo}>
        <label htmlFor="valor-hora">Valor hora estándar</label>
        <input
          id="valor-hora"
          type="text"
          inputMode="decimal"
          value={valores.valorHoraEstandar}
          onChange={(evento) => setValores({ ...valores, valorHoraEstandar: evento.target.value })}
        />
        {mensaje('valorHoraEstandar') ? <p role="alert">{mensaje('valorHoraEstandar')}</p> : null}
        <p data-testid="aviso-tasa">Los márgenes se recalculan con la tasa vigente al leer cada OP; no se guardan valores históricos.</p>
      </div>

      <div className={estilos.campo}>
        <label htmlFor="dias-alerta">Días de alerta de riesgo</label>
        <input
          id="dias-alerta"
          type="number"
          min={0}
          value={valores.diasAlertaRiesgo}
          onChange={(evento) => setValores({ ...valores, diasAlertaRiesgo: evento.target.value })}
        />
        {mensaje('diasAlertaRiesgo') ? <p role="alert">{mensaje('diasAlertaRiesgo')}</p> : null}
      </div>

      <div className={estilos.campo}>
        <label htmlFor="porcentaje-riesgo">% de avance de riesgo</label>
        <input
          id="porcentaje-riesgo"
          type="number"
          min={0}
          max={100}
          value={valores.porcentajeAvanceRiesgo}
          onChange={(evento) => setValores({ ...valores, porcentajeAvanceRiesgo: evento.target.value })}
        />
        {mensaje('porcentajeAvanceRiesgo') ? <p role="alert">{mensaje('porcentajeAvanceRiesgo')}</p> : null}
      </div>

      <fieldset className={estilos.campo}>
        <legend>Etapas por defecto</legend>
        {valores.etapasDefault.map((etapa, indice) => (
          <div key={indice} className={estilos.etapa}>
            <label htmlFor={`etapa-${indice}`}>{`Etapa ${indice + 1}`}</label>
            <input
              id={`etapa-${indice}`}
              type="text"
              value={etapa}
              onChange={(evento) => cambiarEtapa(indice, evento.target.value)}
            />
            {mensaje(`etapasDefault.${indice}`) ? (
              <p role="alert">{mensaje(`etapasDefault.${indice}`)}</p>
            ) : null}
            <button type="button" onClick={() => setValores((anterior) => ({
              ...anterior,
              etapasDefault: anterior.etapasDefault.filter((_, i) => i !== indice),
            }))}>Quitar</button>
          </div>
        ))}
        {mensaje('etapasDefault') ? <p role="alert">{mensaje('etapasDefault')}</p> : null}
        <button type="button" onClick={() => setValores((anterior) => ({
          ...anterior,
          etapasDefault: [...anterior.etapasDefault, ''],
        }))}>Agregar etapa</button>
        <p data-testid="aviso-plantilla">Los cambios en la plantilla afectan solo a las OPs creadas después del guardado; las OPs existentes conservan su ruta de etapas.</p>
      </fieldset>

      <button type="submit">Guardar configuración</button>
      {guardado ? <p role="status">Configuración guardada</p> : null}
    </form>
  );
}
