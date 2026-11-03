import path from 'node:path';

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('Falta SESSION_SECRET en api/.env (mínimo 32 caracteres). Vea api/.env.example.');
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  esProduccion: process.env.NODE_ENV === 'production',
  sessionSecret: process.env.SESSION_SECRET,
  uploadDir: path.resolve(process.env.UPLOAD_DIR || 'uploads'),
};
