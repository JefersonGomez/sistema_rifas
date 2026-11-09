import { formatoColones, formatoFecha, formatoTelefono, primerNombre, unirLista } from './formato.js';

// Teléfono de 8 dígitos → chat con esa persona. Sin teléfono → WhatsApp deja elegir a quién mandarlo.
export const enlaceWhatsApp = (telefono, texto) =>
  telefono
    ? `https://wa.me/506${telefono}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/?text=${encodeURIComponent(texto)}`;

// Mensajes de fábrica. Mamá los puede cambiar en Ajustes; las palabras entre llaves se rellenan solas.
// Si un dato no existe (por ejemplo, la rifa no tiene fecha), se quita la línea que lo usa.
export const PLANTILLAS = {
  apartar: 'Hola, quiero apartar {numeros} de la {rifa}.',
  recordatorio:
    'Hola {nombre}, le recuerdo que tiene pendiente {debe} por {numeros} de la {rifa}.\nEl sorteo es el {fecha}.\nPuede pagar por SINPE al {sinpe}.\n¡Gracias!',
  libres: '🎟️ ¡Participe en la {rifa}! {precio} el número.\nJuega con la Lotería Nacional del {fecha}.\nNúmeros libres: {libres}\nVea los números aquí: {enlace}',
};

// Palabras que se pueden usar en cada mensaje (se muestran en Ajustes).
export const VARIABLES = {
  apartar: { numeros: 'los números elegidos', rifa: 'el nombre de la rifa' },
  recordatorio: {
    nombre: 'primer nombre del cliente',
    debe: 'cuánto debe',
    numeros: 'sus números pendientes',
    rifa: 'el nombre de la rifa',
    fecha: 'fecha del sorteo',
    sinpe: 'número de SINPE',
  },
  libres: { rifa: 'el nombre de la rifa', precio: 'precio del número', fecha: 'fecha del sorteo', libres: 'números libres', enlace: 'enlace de la página' },
};

// "Rifa de la Freidora de aire" → "rifa de la Freidora de aire"
const enMinuscula = (titulo) => titulo.charAt(0).toLowerCase() + titulo.slice(1);

const losNumeros = (numeros) =>
  numeros.length === 1 ? `el número ${numeros[0]}` : `los números ${unirLista(numeros)}`;

// Cambia {palabra} por su valor. Las líneas con un valor vacío se quitan.
export function rellenar(plantilla, valores) {
  return plantilla
    .split('\n')
    .filter((linea) => ![...linea.matchAll(/\{(\w+)\}/g)].some(([, clave]) => clave in valores && !valores[clave]))
    .map((linea) => linea.replace(/\{(\w+)\}/g, (todo, clave) => (clave in valores ? valores[clave] : todo)))
    .join('\n')
    .trim();
}

// Cliente → mamá: "Hola, quiero apartar el número 27 de la rifa de la Freidora de aire."
export const mensajeApartar = (numeros, titulo, plantilla) =>
  rellenar(plantilla || PLANTILLAS.apartar, { numeros: losNumeros(numeros), rifa: enMinuscula(titulo) });

// Mamá → cliente
export const mensajeRecordatorio = ({ nombre, debe, numeros, rifa }, plantilla) =>
  rellenar(plantilla || PLANTILLAS.recordatorio, {
    nombre: primerNombre(nombre),
    debe: formatoColones(debe),
    numeros: losNumeros(numeros),
    rifa: enMinuscula(rifa.titulo),
    fecha: rifa.fechaSorteo ? formatoFecha(rifa.fechaSorteo) : '',
    sinpe: rifa.sinpeNumero ? formatoTelefono(rifa.sinpeNumero) : '',
  });

// Mamá → grupos o estados
export const mensajeCompartirLibres = (rifa, libres, plantilla) =>
  rellenar(plantilla || PLANTILLAS.libres, {
    rifa: enMinuscula(rifa.titulo),
    precio: formatoColones(rifa.precioNumero),
    fecha: rifa.fechaSorteo ? formatoFecha(rifa.fechaSorteo) : '',
    libres: libres.length ? libres.join(', ') : '¡ya no quedan, se vendieron todos!',
    enlace: `${window.location.origin}/`,
  });
