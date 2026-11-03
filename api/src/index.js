import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { prisma } from './db.js';
import { publicRouter } from './routes/public.js';
import { manejarErrores, rutaNoEncontrada } from './middleware/errores.js';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
      },
    },
  }),
);
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, baseDeDatos: 'conectada' });
  } catch {
    res.status(503).json({ ok: false, baseDeDatos: 'sin conexión' });
  }
});

app.use('/api/public', publicRouter);
app.use('/api', rutaNoEncontrada);

// En producción Express sirve el frontend ya compilado.
if (config.esProduccion) {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');
  app.use(express.static(dist));
  app.get(/.*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(manejarErrores);

app.listen(config.port, () => {
  console.log(`API escuchando en http://localhost:${config.port}`);
});
