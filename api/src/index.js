import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { config } from './config.js';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, baseDeDatos: 'conectada' });
  } catch {
    res.status(503).json({ ok: false, baseDeDatos: 'sin conexión' });
  }
});

// En producción Express sirve el frontend ya compilado.
if (config.esProduccion) {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');
  app.use(express.static(dist));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(config.port, () => {
  console.log(`API escuchando en http://localhost:${config.port}`);
});
