import crypto from 'node:crypto';
import { config } from '../config.js';
import { ErrorApp } from './errores.js';

// Sesión: token firmado con HMAC-SHA256 dentro de una cookie httpOnly.
export const COOKIE = 'sesion';
export const DURACION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

const firmar = (datos) => crypto.createHmac('sha256', config.sessionSecret).update(datos).digest('base64url');

export function crearToken(admin) {
  const datos = Buffer.from(
    JSON.stringify({ id: admin.id, usuario: admin.usuario, exp: Date.now() + DURACION_MS }),
  ).toString('base64url');
  return `${datos}.${firmar(datos)}`;
}

function leerToken(token) {
  const [datos, firma] = String(token).split('.');
  if (!datos || !firma) return null;
  const esperada = Buffer.from(firmar(datos));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !crypto.timingSafeEqual(esperada, recibida)) return null;
  try {
    const sesion = JSON.parse(Buffer.from(datos, 'base64url').toString());
    return sesion.exp > Date.now() ? sesion : null;
  } catch {
    return null;
  }
}

function leerCookie(req, nombre) {
  for (const parte of (req.headers.cookie || '').split(';')) {
    const [clave, ...valor] = parte.trim().split('=');
    if (clave === nombre) return decodeURIComponent(valor.join('='));
  }
  return null;
}

export const opcionesCookie = {
  httpOnly: true,
  secure: config.esProduccion,
  sameSite: 'strict',
  path: '/',
};

export function sesionActual(req) {
  const token = leerCookie(req, COOKIE);
  return token ? leerToken(token) : null;
}

export function requiereSesion(req, _res, next) {
  const sesion = sesionActual(req);
  if (!sesion) throw new ErrorApp(401, 'Su sesión terminó. Vuelva a entrar con su usuario y contraseña.');
  req.admin = sesion;
  next();
}
