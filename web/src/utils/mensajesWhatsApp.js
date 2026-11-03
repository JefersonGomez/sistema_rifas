import { unirLista } from './formato.js';

// Teléfono de 8 dígitos → enlace de WhatsApp con el mensaje ya escrito.
export const enlaceWhatsApp = (telefono, texto) =>
  `https://wa.me/506${telefono}?text=${encodeURIComponent(texto)}`;

// "Rifa de la Freidora de aire" → "rifa de la Freidora de aire"
const enMinuscula = (titulo) => titulo.charAt(0).toLowerCase() + titulo.slice(1);

// Cliente → mamá: "Hola, quiero apartar el número 27 de la rifa de la Freidora de aire."
export const mensajeApartar = (numeros, titulo) =>
  numeros.length === 1
    ? `Hola, quiero apartar el número ${numeros[0]} de la ${enMinuscula(titulo)}.`
    : `Hola, quiero apartar los números ${unirLista(numeros)} de la ${enMinuscula(titulo)}.`;
