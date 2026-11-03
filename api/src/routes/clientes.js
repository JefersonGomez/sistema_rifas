import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { ErrorApp } from '../middleware/errores.js';
import { clienteEditarSchema, clienteSchema, idParam, recordatorioSchema } from '../schemas.js';

export const clientesRouter = Router();

// Busca por nombre (sin importar mayúsculas) o por parte del teléfono.
clientesRouter.get('/clientes', async (req, res) => {
  const buscar = String(req.query.buscar ?? '').trim().slice(0, 50);
  const digitos = buscar.replace(/\D/g, '');
  const clientes = await prisma.cliente.findMany({
    where: buscar
      ? {
          OR: [
            { nombre: { contains: buscar, mode: 'insensitive' } },
            ...(digitos.length >= 3 ? [{ telefono: { contains: digitos } }] : []),
          ],
        }
      : undefined,
    orderBy: buscar ? { nombre: 'asc' } : { creadoEn: 'desc' },
    take: 20,
  });
  res.json({ clientes });
});

async function errorTelefonoRepetido(telefono) {
  const existente = await prisma.cliente.findUnique({ where: { telefono } });
  return new ErrorApp(
    409,
    `Ya existe un cliente con ese teléfono: ${existente?.nombre ?? 'otro cliente'}. Búsquelo por nombre en vez de crearlo.`,
  );
}

clientesRouter.post('/clientes', async (req, res) => {
  const datos = clienteSchema.parse(req.body);
  try {
    res.status(201).json({ cliente: await prisma.cliente.create({ data: datos }) });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw await errorTelefonoRepetido(datos.telefono);
    }
    throw e;
  }
});

clientesRouter.patch('/clientes/:id', async (req, res) => {
  const id = idParam.parse(req.params.id);
  const datos = clienteEditarSchema.parse(req.body);
  try {
    res.json({ cliente: await prisma.cliente.update({ where: { id }, data: datos }) });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw await errorTelefonoRepetido(datos.telefono);
    }
    throw e;
  }
});

// Registra que se tocó "Recordar" para mostrar la fecha y no insistir el mismo día.
clientesRouter.post('/recordatorios', async (req, res) => {
  const { clienteId, rifaId } = recordatorioSchema.parse(req.body);
  const recordatorio = await prisma.recordatorio.create({ data: { clienteId, rifaId } });
  res.status(201).json({ recordatorio });
});
