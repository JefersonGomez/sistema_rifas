import { formatoColones, formatoFecha, formatoTelefono, primerNombre, unirLista } from './formato.js';

// Teléfono de 8 dígitos → chat con esa persona. Sin teléfono → WhatsApp deja elegir a quién mandarlo.
export const enlaceWhatsApp = (telefono, texto) =>
  telefono
    ? `https://wa.me/506${telefono}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/?text=${encodeURIComponent(texto)}`;

// "Rifa de la Freidora de aire" → "rifa de la Freidora de aire"
const enMinuscula = (titulo) => titulo.charAt(0).toLowerCase() + titulo.slice(1);

const losNumeros = (numeros) =>
  numeros.length === 1 ? `el número ${numeros[0]}` : `los números ${unirLista(numeros)}`;

// Cliente → mamá: "Hola, quiero apartar el número 27 de la rifa de la Freidora de aire."
export const mensajeApartar = (numeros, titulo) =>
  `Hola, quiero apartar ${losNumeros(numeros)} de la ${enMinuscula(titulo)}.`;

// Mamá → cliente
export function mensajeRecordatorio({ nombre, debe, numeros, rifa }) {
  const partes = [
    `Hola ${primerNombre(nombre)}, le recuerdo que tiene pendiente ${formatoColones(debe)} ${
      numeros.length === 1 ? `del número ${numeros[0]}` : `de los números ${unirLista(numeros)}`
    } de la ${enMinuscula(rifa.titulo)}.`,
  ];
  if (rifa.fechaSorteo) partes.push(`El sorteo es el ${formatoFecha(rifa.fechaSorteo)}.`);
  if (rifa.sinpeNumero) partes.push(`Puede pagar por SINPE al ${formatoTelefono(rifa.sinpeNumero)}.`);
  partes.push('¡Gracias!');
  return partes.join(' ');
}

// Mamá → grupos o estados
export function mensajeCompartirLibres(rifa, libres) {
  const partes = [`🎟️ ${rifa.titulo}. ${formatoColones(rifa.precioNumero)} el número.`];
  if (rifa.fechaSorteo) partes.push(`Juega con la Lotería Nacional del ${formatoFecha(rifa.fechaSorteo)}.`);
  partes.push(libres.length ? `Números libres: ${libres.join(', ')}.` : '¡Ya no quedan números libres!');
  partes.push(`Vea los números aquí: ${window.location.origin}`);
  return partes.join('\n');
}
