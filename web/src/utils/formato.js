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

// → "2 nov., 3:15 p. m."
export const formatoFechaCorta = (fecha) =>
  new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: ZONA }).format(
    new Date(fecha),
  );

// Fecha → "2026-11-15" (día en Costa Rica), para <input type="date">
export const aFechaInput = (fecha) =>
  fecha ? new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date(fecha)) : '';

const diaCR = (fecha) => new Date(`${aFechaInput(fecha)}T00:00:00Z`).getTime();

// Días completos desde hoy (en Costa Rica) hasta la fecha. Negativo si ya pasó.
export const diasHasta = (fecha) => Math.round((diaCR(fecha) - diaCR(new Date())) / 86_400_000);

export const esHoy = (fecha) => diasHasta(fecha) === 0;

// "88888888" → "8888-8888"
export const formatoTelefono = (tel) => `${tel.slice(0, 4)}-${tel.slice(4)}`;

// ["07", "27", "45"] → "07, 27 y 45"
export const unirLista = (items) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;

export const primerNombre = (nombre) => nombre.trim().split(/\s+/)[0];
