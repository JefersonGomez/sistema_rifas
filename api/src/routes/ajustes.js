import { Router } from 'express';
import { prisma } from '../db.js';
import { ajustesSchema } from '../schemas.js';

export const ajustesRouter = Router();

const VACIOS = { mensajeApartar: null, mensajeRecordatorio: null, mensajeLibres: null };

// Los ajustes viven en una sola fila; si todavía no existe, se usan los mensajes de fábrica.
export async function leerAjustes() {
  const fila = await prisma.ajustes.findUnique({ where: { id: 1 } });
  if (!fila) return VACIOS;
  const { id: _id, ...ajustes } = fila;
  return ajustes;
}

ajustesRouter.get('/ajustes', async (_req, res) => {
  res.json({ ajustes: await leerAjustes() });
});

ajustesRouter.put('/ajustes', async (req, res) => {
  const datos = { ...VACIOS, ...ajustesSchema.parse(req.body) };
  const { id: _id, ...ajustes } = await prisma.ajustes.upsert({ where: { id: 1 }, create: { id: 1, ...datos }, update: datos });
  res.json({ ajustes });
});
