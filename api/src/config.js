import path from 'node:path';

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('Falta SESSION_SECRET en api/.env (mínimo 32 caracteres). Vea api/.env.example.');
}

// APP_URL debe ser solo la dirección, por ejemplo https://rifasivannia.duckdns.org.
// Si viene mal escrita se ignora (con aviso) para no armar enlaces rotos en la miniatura de WhatsApp.
function direccionPublica(valor) {
  if (!valor) return '';
  try {
    const url = new URL(valor);
    if (!/^https?:$/.test(url.protocol) || !/^[a-z0-9.-]+$/.test(url.hostname)) throw new Error();
    return url.origin;
  } catch {
    console.warn(`APP_URL no es una dirección válida ("${valor}"). Escríbala así: https://rifasivannia.duckdns.org`);
    return '';
  }
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  // En el VPS: 127.0.0.1, para que solo Caddy pueda llegar a la app.
  host: process.env.HOST || undefined,
  esProduccion: process.env.NODE_ENV === 'production',
  // Detrás de Caddy: 1 = confiar en un proxy, para que el límite de intentos vea la IP real.
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
  sessionSecret: process.env.SESSION_SECRET,
  // Dirección pública de la página (para la miniatura de WhatsApp). Ej.: https://rifasivannia.duckdns.org
  appUrl: direccionPublica(process.env.APP_URL),
  uploadDir:path.resolve(process.env.UPLOAD_DIR || 'uploads'),
};
