const ZONA = 'America/Costa_Rica';

const colonesFmt = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0,
});

// 2000 → "₡2 000"
export const formatoColones = (monto) => colonesFmt.format(monto);

// → "domingo 15 de noviembre"
export const formatoFecha = (fecha) =>
  new Intl.DateTimeFormat('es-CR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: ZONA })
    .format(new Date(fecha))
    .replace(',', '');

// "88888888" → "8888-8888"
export const formatoTelefono = (tel) => `${tel.slice(0, 4)}-${tel.slice(4)}`;

// ["07", "27", "45"] → "07, 27 y 45"
export const unirLista = (items) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;
