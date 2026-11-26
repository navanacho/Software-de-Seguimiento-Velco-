export type IdPlantilla = 'costeo' | 'op';

export type TipoCelda = 'numerico' | 'cadena' | 'inlineStr';

export interface CeldaDescriptor {
  hoja: string;
  pieza: string;
  referencia: string;
  clave: string;
  tipo: TipoCelda;
}

export interface DescriptorRangoPlano {
  celda: string;
  fusion: string;
  tipo: 'inlineStr';
  alternativa: { rango: string; texto: string };
}

export interface DescriptorPlantilla {
  id: IdPlantilla;
  archivo: string;
  celdas: readonly CeldaDescriptor[];
  hojas: () => ReadonlyArray<readonly [string, string]>;
  piezasAutorizadas: () => readonly string[];
  rangoPlano?: DescriptorRangoPlano;
}

const hojasCosteo: ReadonlyArray<readonly [string, string]> = [
  ['1', 'xl/worksheets/sheet2.xml'],
  ['2', 'xl/worksheets/sheet3.xml'],
  ['3', 'xl/worksheets/sheet4.xml'],
  ['4', 'xl/worksheets/sheet5.xml'],
  ['5', 'xl/worksheets/sheet6.xml'],
];

const hojasOP: ReadonlyArray<readonly [string, string]> = [['1640', 'xl/worksheets/sheet1.xml']];

const rangoPlanoOP: DescriptorRangoPlano = {
  celda: 'O7',
  fusion: 'O7:R8',
  tipo: 'inlineStr',
  alternativa: { rango: 'J7:N8', texto: 'PC N°: ' },
};

const descriptors: Readonly<Record<IdPlantilla, DescriptorPlantilla>> = {
  costeo: {
    id: 'costeo',
    archivo: 'MASTER COSTEO NUEVO.xlsx',
    celdas: hojasCosteo.flatMap(([hoja, pieza]) => [
      { hoja, pieza, referencia: 'C6', clave: `${hoja}:C6`, tipo: 'numerico' as const },
      { hoja, pieza, referencia: 'C7', clave: `${hoja}:C7`, tipo: 'numerico' as const },
    ]),
    hojas: () => hojasCosteo,
    piezasAutorizadas: () => hojasCosteo.map(([, pieza]) => pieza),
  },
  op: {
    id: 'op',
    archivo: 'A - OP-MASTER.xlsx',
    celdas: [
      { hoja: '1640', pieza: 'xl/worksheets/sheet1.xml', referencia: 'D10', clave: '1640:D10', tipo: 'cadena' },
      { hoja: '1640', pieza: 'xl/worksheets/sheet1.xml', referencia: 'D11', clave: '1640:D11', tipo: 'cadena' },
      {
        hoja: '1640',
        pieza: 'xl/worksheets/sheet1.xml',
        referencia: rangoPlanoOP.celda,
        clave: `1640:${rangoPlanoOP.celda}`,
        tipo: rangoPlanoOP.tipo,
      },
    ],
    hojas: () => hojasOP,
    piezasAutorizadas: () => hojasOP.map(([, pieza]) => pieza),
    rangoPlano: rangoPlanoOP,
  },
};

export function descriptorPlantilla(id: IdPlantilla): DescriptorPlantilla {
  return descriptors[id];
}
