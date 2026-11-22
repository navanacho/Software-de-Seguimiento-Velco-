export class RecursoNoEncontradoError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'RecursoNoEncontradoError';
  }
}

export interface OpExistentePlano {
  readonly id: string;
  readonly numeroOp: string;
}

export class CodigoPlanoDuplicadoError extends Error {
  readonly statusCode = 409 as const;
  readonly body: {
    readonly error: 'codigo_plano_duplicado';
    readonly message: string;
    readonly codigoPlano: string;
    readonly opExistente: OpExistentePlano;
  };

  constructor(codigoPlano: string, opExistente: OpExistentePlano) {
    const message = `El ID de plano ${codigoPlano} ya está asignado a la OP ${opExistente.numeroOp}.`;
    super(message);
    this.name = 'CodigoPlanoDuplicadoError';
    this.body = {
      error: 'codigo_plano_duplicado',
      message,
      codigoPlano,
      opExistente,
    };
  }
}

export class NumeroOpDuplicadoError extends Error {
  readonly statusCode = 409 as const;
  readonly body: {
    readonly error: 'numero_op_duplicado';
    readonly message: string;
    readonly numeroOp: string;
  };

  constructor(numeroOp: string) {
    const message = `El número de OP ${numeroOp} ya existe.`;
    super(message);
    this.name = 'NumeroOpDuplicadoError';
    this.body = { error: 'numero_op_duplicado', message, numeroOp };
  }
}
