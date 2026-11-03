import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db.js';

// Rutas públicas: NUNCA devuelven nombres ni teléfonos de los compradores.
export const publicRouter = Router();

publicRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Espere unos minutos y vuelva a intentar.' },
  }),
);

const TODOS_LOS_NUMEROS = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));

// Solo los campos que el público puede ver.
const camposPublicos = {
  id: true,
  titulo: true,
  descripcion: true,
  premio: true,
  fotoUrl: true,
  precioNumero: true,
  fechaSorteo: true,
  reglaGanador: true,
  sinpeNumero: true,
  whatsapp: true,
  colorCeldas: true,
  fuenteNumeros: true,
};

const buscarRifaActiva = () =>
  prisma.rifa.findFirst({ where: { estado: 'activa' }, select: camposPublicos });

publicRouter.get('/rifa', async (_req, res) => {
  res.json({ rifa: await buscarRifaActiva() });
});

publicRouter.get('/rifa/numeros', async (_req, res) => {
  const rifa = await prisma.rifa.findFirst({ where: { estado: 'activa' }, select: { id: true } });
  if (!rifa) {
    return res.status(404).json({ error: 'No hay una rifa activa en este momento.' });
  }

  const boletos = await prisma.boleto.findMany({
    where: { rifaId: rifa.id },
    select: { numero: true },
  });
  const ocupados = new Set(boletos.map((b) => b.numero));
  const numeros = TODOS_LOS_NUMEROS.map((numero) => ({
    numero,
    estado: ocupados.has(numero) ? 'ocupado' : 'libre',
  }));

  res.json({ numeros, libres: 100 - ocupados.size });
});

// Resultado de la última rifa finalizada (se muestra cuando no hay rifa activa).
publicRouter.get('/rifa/ganador', async (_req, res) => {
  const rifa = await prisma.rifa.findFirst({
    where: { estado: 'finalizada' },
    orderBy: { finalizadaEn: 'desc' },
    select: { id: true, titulo: true, premio: true, fechaSorteo: true, numeroGanador: true },
  });
  if (!rifa) return res.json({ resultado: null });

  const boletoGanador = rifa.numeroGanador
    ? await prisma.boleto.findUnique({
        where: { rifaId_numero: { rifaId: rifa.id, numero: rifa.numeroGanador } },
        select: { id: true },
      })
    : null;

  const { id: _id, ...datos } = rifa;
  res.json({ resultado: { ...datos, hayGanador: Boolean(boletoGanador) } });
});
