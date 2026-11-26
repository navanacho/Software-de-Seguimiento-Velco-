import { createHash } from 'node:crypto';
import { deflateRawSync, inflateRawSync } from 'node:zlib';

interface MetadatosPieza {
  versionMadeBy: number;
  versionNeeded: number;
  flags: number;
  method: number;
  hora: number;
  fecha: number;
  crc: number;
  comprimidos: number;
  originales: number;
  extraLocal: Buffer;
  extraCentral: Buffer;
  comentario: Buffer;
  discoInicial: number;
  atributosInternos: number;
  atributosExternos: number;
  desplazamientoLocal: number;
}

export interface PiezaZip {
  nombre: string;
  datos: Buffer;
  metadatos: MetadatosPieza;
}

function localizarFinCentral(archivo: Buffer): number {
  for (let indice = archivo.length - 22; indice >= 0; indice -= 1) {
    if (archivo.readUInt32LE(indice) === 0x06054b50) {
      return indice;
    }
  }
  throw new Error('el contenedor no tiene un directorio central ZIP válido');
}

function crc32(datos: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of datos) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function hashDatos(datos: Buffer): string {
  return createHash('sha256').update(datos).digest('hex');
}

export function leerZip(archivo: Buffer): PiezaZip[] {
  const finCentral = localizarFinCentral(archivo);
  const cantidad = archivo.readUInt16LE(finCentral + 10);
  let desplazamiento = archivo.readUInt32LE(finCentral + 16);
  const piezas: PiezaZip[] = [];

  for (let indice = 0; indice < cantidad; indice += 1) {
    if (archivo.readUInt32LE(desplazamiento) !== 0x02014b50) {
      throw new Error(`entrada ${indice} del directorio central inválida`);
    }

    const metadatos: MetadatosPieza = {
      versionMadeBy: archivo.readUInt16LE(desplazamiento + 4),
      versionNeeded: archivo.readUInt16LE(desplazamiento + 6),
      flags: archivo.readUInt16LE(desplazamiento + 8),
      method: archivo.readUInt16LE(desplazamiento + 10),
      hora: archivo.readUInt16LE(desplazamiento + 12),
      fecha: archivo.readUInt16LE(desplazamiento + 14),
      crc: archivo.readUInt32LE(desplazamiento + 16),
      comprimidos: archivo.readUInt32LE(desplazamiento + 20),
      originales: archivo.readUInt32LE(desplazamiento + 24),
      extraLocal: Buffer.alloc(0),
      extraCentral: Buffer.alloc(0),
      comentario: Buffer.alloc(0),
      discoInicial: archivo.readUInt16LE(desplazamiento + 34),
      atributosInternos: archivo.readUInt16LE(desplazamiento + 36),
      atributosExternos: archivo.readUInt32LE(desplazamiento + 38),
      desplazamientoLocal: archivo.readUInt32LE(desplazamiento + 42),
    };

    const longitudNombre = archivo.readUInt16LE(desplazamiento + 28);
    const longitudExtra = archivo.readUInt16LE(desplazamiento + 30);
    const longitudComentario = archivo.readUInt16LE(desplazamiento + 32);
    const nombre = archivo.toString('utf8', desplazamiento + 46, desplazamiento + 46 + longitudNombre);
    metadatos.extraCentral = Buffer.from(
      archivo.subarray(desplazamiento + 46 + longitudNombre, desplazamiento + 46 + longitudNombre + longitudExtra),
    );
    metadatos.comentario = Buffer.from(
      archivo.subarray(
        desplazamiento + 46 + longitudNombre + longitudExtra,
        desplazamiento + 46 + longitudNombre + longitudExtra + longitudComentario,
      ),
    );

    const inicioLocal = metadatos.desplazamientoLocal;
    if (archivo.readUInt32LE(inicioLocal) !== 0x04034b50) {
      throw new Error(`cabecera local inválida para ${nombre}`);
    }
    const nombreLocal = archivo.readUInt16LE(inicioLocal + 26);
    const extraLocal = archivo.readUInt16LE(inicioLocal + 28);
    metadatos.extraLocal = Buffer.from(archivo.subarray(inicioLocal + 30 + nombreLocal, inicioLocal + 30 + nombreLocal + extraLocal));
    const inicioDatos = inicioLocal + 30 + nombreLocal + extraLocal;
    const comprimidosRaw = Buffer.from(archivo.subarray(inicioDatos, inicioDatos + metadatos.comprimidos));
    const datos =
      metadatos.method === 8
        ? inflateRawSync(comprimidosRaw)
        : metadatos.method === 0
          ? Buffer.from(comprimidosRaw)
          : (() => {
              throw new Error(`método de compresión ${metadatos.method} no soportado en ${nombre}`);
            })();

    piezas.push({ nombre, datos, metadatos });
    desplazamiento += 46 + longitudNombre + longitudExtra + longitudComentario;
  }

  return piezas;
}

export function escribirZip(piezas: PiezaZip[]): Buffer {
  const locales: Buffer[] = [];
  const centrales: Buffer[] = [];
  let desplazamiento = 0;

  for (const pieza of piezas) {
    const nombre = Buffer.from(pieza.nombre, 'utf8');
    const crc = crc32(pieza.datos);
    const comprimidos =
      pieza.metadatos.method === 8
        ? deflateRawSync(pieza.datos)
        : pieza.metadatos.method === 0
          ? Buffer.from(pieza.datos)
          : (() => {
              throw new Error(`método de compresión ${pieza.metadatos.method} no soportado en ${pieza.nombre}`);
            })();
    const originales = pieza.datos.length;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(pieza.metadatos.versionNeeded, 4);
    local.writeUInt16LE(pieza.metadatos.flags, 6);
    local.writeUInt16LE(pieza.metadatos.method, 8);
    local.writeUInt16LE(pieza.metadatos.hora, 10);
    local.writeUInt16LE(pieza.metadatos.fecha, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comprimidos.length, 18);
    local.writeUInt32LE(originales, 22);
    local.writeUInt16LE(nombre.length, 26);
    local.writeUInt16LE(pieza.metadatos.extraLocal.length, 28);
    locales.push(Buffer.concat([local, nombre, pieza.metadatos.extraLocal, comprimidos]));

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(pieza.metadatos.versionMadeBy, 4);
    central.writeUInt16LE(pieza.metadatos.versionNeeded, 6);
    central.writeUInt16LE(pieza.metadatos.flags, 8);
    central.writeUInt16LE(pieza.metadatos.method, 10);
    central.writeUInt16LE(pieza.metadatos.hora, 12);
    central.writeUInt16LE(pieza.metadatos.fecha, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(comprimidos.length, 20);
    central.writeUInt32LE(originales, 24);
    central.writeUInt16LE(nombre.length, 28);
    central.writeUInt16LE(pieza.metadatos.extraCentral.length, 30);
    central.writeUInt16LE(pieza.metadatos.comentario.length, 32);
    central.writeUInt16LE(pieza.metadatos.discoInicial, 34);
    central.writeUInt16LE(pieza.metadatos.atributosInternos, 36);
    central.writeUInt32LE(pieza.metadatos.atributosExternos, 38);
    central.writeUInt32LE(desplazamiento, 42);
    centrales.push(
      Buffer.concat([central, nombre, pieza.metadatos.extraCentral, pieza.metadatos.comentario]),
    );

    desplazamiento += local.length + nombre.length + pieza.metadatos.extraLocal.length + comprimidos.length;
  }

  const directorio = Buffer.concat(centrales);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(0, 4);
  fin.writeUInt16LE(0, 6);
  fin.writeUInt16LE(piezas.length, 8);
  fin.writeUInt16LE(piezas.length, 10);
  fin.writeUInt32LE(directorio.length, 12);
  fin.writeUInt32LE(desplazamiento, 16);
  fin.writeUInt16LE(0, 20);

  return Buffer.concat([...locales, directorio, fin]);
}
