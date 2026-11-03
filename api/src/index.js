import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { prisma } from './db.js';
import { publicRouter } from './routes/public.js';
import { authRouter } from './routes/auth.js';
import { rifasRouter } from './routes/rifas.js';
import { boletosRouter } from './routes/boletos.js';
import { clientesRouter } from './routes/clientes.js';
import { requiereSesion } from './middleware/auth.js';
import { manejarErrores, rutaNoEncontrada } from './middleware/errores.js';

const app = express();
app.set('trust proxy', config.trustProxy);
app.disable('x-powered-by');

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
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, baseDeDatos: 'conectada' });
  } catch {
    res.status(503).json({ ok: false, baseDeDatos: 'sin conexión' });
  }
});

app.use('/api/public', publicRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', requiereSesion, rifasRouter, boletosRouter, clientesRouter);
app.use('/api', rutaNoEncontrada);

// Fotos de los premios.
app.use('/uploads', express.static(config.uploadDir, { maxAge: '7d', index: false }));
app.use('/uploads', (_req, res) => res.status(404).end());

// En producción Express sirve el frontend ya compilado.
if (config.esProduccion) {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');
  // Los archivos de /assets llevan un código en el nombre: se pueden guardar un año.
  // index.html y el service worker siempre se revisan, para que las actualizaciones lleguen.
  app.use(
    express.static(dist, {
      index: false,
      setHeaders: (res, ruta) => {
        const largo = ruta.includes(`${path.sep}assets${path.sep}`);
        res.setHeader('Cache-Control', largo ? 'public, max-age=31536000, immutable' : 'no-cache');
      },
    }),
  );
  app.get(/.*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.use(manejarErrores);

app.listen(config.port, config.host, () => {
  console.log(`API escuchando en http://${config.host ?? 'localhost'}:${config.port}`);
});
