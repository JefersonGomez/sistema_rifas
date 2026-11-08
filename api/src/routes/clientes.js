import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { ErrorApp } from '../middleware/errores.js';
import { resumenBoleto } from '../saldos.js';
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

// Las rifas canceladas no cuentan para lo gastado ni lo que se debe.
const rifaQueCuenta = { rifa: { estado: { not: 'cancelada' } } };

// Todos los clientes con sus totales, para la pantalla Clientes (se filtra en el teléfono).
clientesRouter.get('/clientes/todos', async (_req, res) => {
  const clientes = await prisma.cliente.findMany({
    orderBy: { nombre: 'asc' },
    select: {
      id: true,
      nombre: true,
      telefono: true,
      creadoEn: true,
      boletos: {
        where: rifaQueCuenta,
        select: { rifaId: true, creadoEn: true, pagos: { select: { monto: true } }, rifa: { select: { precioNumero: true } } },
      },
    },
  });

  res.json({
    clientes: clientes.map(({ boletos, ...c }) => {
      let pagado = 0;
      let debe = 0;
      for (const b of boletos) {
        const r = resumenBoleto(b, b.rifa.precioNumero);
        pagado += r.pagado;
        debe += r.saldo;
      }
      return {
        ...c,
        numeros: boletos.length,
        rifas: new Set(boletos.map((b) => b.rifaId)).size,
        pagado,
        debe,
        ultimaCompra: boletos.reduce((ultima, b) => (!ultima || b.creadoEn > ultima ? b.creadoEn : ultima), null),
      };
    }),
  });
});

// Ficha de un cliente: cada rifa en la que participó, con sus números, pagos, deudas y premios ganados.
clientesRouter.get('/clientes/:id', async (req, res) => {
  const id = idParam.parse(req.params.id);
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) throw new ErrorApp(404, 'Ese cliente no existe. Vuelva a la lista de clientes.');

  const boletos = await prisma.boleto.findMany({
    where: { clienteId: id, ...rifaQueCuenta },
    orderBy: { numero: 'asc' },
    include: {
      pagos: { select: { monto: true, metodo: true } },
      rifa: {
        select: {
          id: true,
          titulo: true,
          estado: true,
          fechaSorteo: true,
          precioNumero: true,
          sinpeNumero: true,
          creadaEn: true,
          premios: { select: { lugar: true, descripcion: true, numeroGanador: true }, orderBy: { lugar: 'asc' } },
        },
      },
    },
  });
  const recordatorios = await prisma.recordatorio.groupBy({
    by: ['rifaId'],
    where: { clienteId: id },
    _max: { enviadoEn: true },
  });
  const ultimoRecordatorio = new Map(recordatorios.map((r) => [r.rifaId, r._max.enviadoEn]));

  const porRifa = new Map();
  const totales = { numeros: boletos.length, pagado: 0, debe: 0, efectivo: 0, sinpe: 0, premiosGanados: 0 };
  for (const b of boletos) {
    const { premios, ...rifa } = b.rifa;
    const fila = porRifa.get(rifa.id) ?? {
      rifa,
      numeros: [],
      pagado: 0,
      debe: 0,
      premiosGanados: [],
      ultimoRecordatorio: ultimoRecordatorio.get(rifa.id) ?? null,
    };
    const { pagado, saldo } = resumenBoleto(b, rifa.precioNumero);
    fila.numeros.push({ numero: b.numero, estado: b.estado, pagado, saldo });
    fila.pagado += pagado;
    fila.debe += saldo;
    for (const p of b.pagos) totales[p.metodo] += p.monto;
    if (rifa.estado === 'finalizada') {
      for (const premio of premios.filter((p) => p.numeroGanador === b.numero)) {
        fila.premiosGanados.push({ ...premio });
        totales.premiosGanados += 1;
      }
    }
    porRifa.set(rifa.id, fila);
  }
  for (const fila of porRifa.values()) {
    totales.pagado += fila.pagado;
    totales.debe += fila.debe;
  }

  // La rifa publicada primero, luego de la más nueva a la más vieja.
  const participaciones = [...porRifa.values()].sort(
    (a, b) => (b.rifa.estado === 'activa') - (a.rifa.estado === 'activa') || b.rifa.creadaEn - a.rifa.creadaEn,
  );
  res.json({ cliente, totales: { ...totales, rifas: participaciones.length }, participaciones });
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
