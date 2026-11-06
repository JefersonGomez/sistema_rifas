import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { ErrorApp } from '../middleware/errores.js';
import { finalizarSchema, idParam, rifaEditarSchema, rifaSchema, ventaSchema } from '../schemas.js';
import { colones, resumenBoleto } from '../saldos.js';

export const rifasRouter = Router();

const TODOS_LOS_NUMEROS = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));

const conPremios = { premios: { orderBy: { lugar: 'asc' } } };

async function buscarRifa(id) {
  const rifa = await prisma.rifa.findUnique({ where: { id: idParam.parse(id) }, include: conPremios });
  if (!rifa) throw new ErrorApp(404, 'No se encontró la rifa.');
  return rifa;
}

// [{ descripcion, costo }] → filas para crear, con el lugar según el orden.
const premiosParaCrear = (premios) => premios.map((p, i) => ({ ...p, lugar: i + 1 }));

// Quién ganó cada premio (null si nadie compró ese número).
async function ganadoresDe(rifaId, premios) {
  const numeros = premios.map((p) => p.numeroGanador).filter(Boolean);
  const boletos = await prisma.boleto.findMany({
    where: { rifaId, numero: { in: numeros } },
    select: { numero: true, cliente: { select: { id: true, nombre: true, telefono: true } } },
  });
  const porNumero = new Map(boletos.map((b) => [b.numero, b.cliente]));
  return premios.map((p) => ({ ...p, ganador: p.numeroGanador ? (porNumero.get(p.numeroGanador) ?? null) : null }));
}

// ---------- Rifas ----------

rifasRouter.get('/rifas', async (_req, res) => {
  const rifas = await prisma.rifa.findMany({
    orderBy: { creadaEn: 'desc' },
    include: { ...conPremios, _count: { select: { boletos: true } } },
  });
  for (const r of rifas) {
    if (r.estado === 'finalizada') r.premios = await ganadoresDe(r.id, r.premios);
  }
  const cobros = await prisma.$queryRaw`
    SELECT b.rifa_id AS "rifaId", COALESCE(SUM(p.monto), 0)::int AS cobrado
    FROM boletos b LEFT JOIN pagos p ON p.boleto_id = b.id
    GROUP BY b.rifa_id`;
  const cobradoPorRifa = new Map(cobros.map((c) => [c.rifaId, c.cobrado]));

  res.json({
    rifas: rifas.map(({ _count, ...r }) => ({
      ...r,
      vendidos: _count.boletos,
      cobrado: cobradoPorRifa.get(r.id) ?? 0,
    })),
  });
});

rifasRouter.post('/rifas', async (req, res) => {
  const { premios, ...datos } = rifaSchema.parse(req.body);
  const rifa = await prisma.rifa.create({
    data: { ...datos, premios: { create: premiosParaCrear(premios) } },
    include: conPremios,
  });
  res.status(201).json({ rifa });
});

rifasRouter.get('/rifas/:id', async (req, res) => {
  res.json({ rifa: await buscarRifa(req.params.id) });
});

rifasRouter.patch('/rifas/:id', async (req, res) => {
  const rifa = await buscarRifa(req.params.id);
  const datos = rifaEditarSchema.parse(req.body);

  if (rifa.estado === 'finalizada' || rifa.estado === 'cancelada') {
    throw new ErrorApp(409, 'Esta rifa ya terminó y no se puede editar.');
  }
  if (datos.precioNumero !== undefined && datos.precioNumero !== rifa.precioNumero) {
    const vendidos = await prisma.boleto.count({ where: { rifaId: rifa.id } });
    if (vendidos > 0) {
      throw new ErrorApp(409, 'No se puede cambiar el precio porque ya hay números vendidos.');
    }
  }

  const { premios, ...resto } = datos;
  // Si vienen premios, se reemplaza la lista completa (1.º, 2.º, 3.º).
  const actualizada = await prisma.rifa.update({
    where: { id: rifa.id },
    data: {
      ...resto,
      ...(premios && { premios: { deleteMany: {}, create: premiosParaCrear(premios) } }),
    },
    include: conPremios,
  });
  res.json({ rifa: actualizada });
});

rifasRouter.post('/rifas/:id/activar', async (req, res) => {
  const rifa = await buscarRifa(req.params.id);
  if (rifa.estado !== 'borrador') {
    throw new ErrorApp(409, 'Solo se puede publicar una rifa que está en borrador.');
  }
  const otra = await prisma.rifa.findFirst({ where: { estado: 'activa' }, select: { titulo: true } });
  if (otra) {
    throw new ErrorApp(409, `Ya hay una rifa publicada: "${otra.titulo}". Finalícela antes de publicar otra.`);
  }
  try {
    res.json({ rifa: await prisma.rifa.update({ where: { id: rifa.id }, data: { estado: 'activa' } }) });
  } catch (e) {
    // El índice único parcial evita dos rifas activas aunque se toque "Publicar" dos veces.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new ErrorApp(409, 'Ya hay otra rifa publicada. Finalícela antes de publicar esta.');
    }
    throw e;
  }
});

rifasRouter.post('/rifas/:id/finalizar', async (req, res) => {
  const rifa = await buscarRifa(req.params.id);
  if (rifa.estado !== 'activa') throw new ErrorApp(409, 'Solo se puede finalizar la rifa publicada.');
  const { numerosGanadores } = finalizarSchema.parse(req.body);
  if (numerosGanadores.length !== rifa.premios.length) {
    throw new ErrorApp(400, `Escriba el número ganador de cada uno de los ${rifa.premios.length} premios.`);
  }

  // Se cierra aunque nadie tenga el número: queda registrado "sin ganador".
  const actualizada = await prisma.rifa.update({
    where: { id: rifa.id },
    data: {
      estado: 'finalizada',
      finalizadaEn: new Date(),
      premios: {
        update: rifa.premios.map((p, i) => ({ where: { id: p.id }, data: { numeroGanador: numerosGanadores[i] } })),
      },
    },
    include: conPremios,
  });
  res.json({ rifa: actualizada, premios: await ganadoresDe(rifa.id, actualizada.premios) });
});

// ---------- Foto del premio ----------

fs.mkdirSync(config.uploadDir, { recursive: true });

const EXTENSIONES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const subida = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${EXTENSIONES[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (EXTENSIONES[file.mimetype]) return cb(null, true);
    cb(new ErrorApp(400, 'La foto debe ser JPG, PNG o WebP.'));
  },
});

// Revisa los primeros bytes del archivo: no basta con el tipo que dice el navegador.
function esImagenReal(ruta) {
  const b = Buffer.alloc(12);
  const fd = fs.openSync(ruta, 'r');
  fs.readSync(fd, b, 0, 12, 0);
  fs.closeSync(fd);
  const jpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const webp = b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP';
  return jpg || png || webp;
}

const borrarFoto = (fotoUrl) => {
  if (fotoUrl?.startsWith('/uploads/')) {
    fs.rm(path.join(config.uploadDir, path.basename(fotoUrl)), { force: true }, () => {});
  }
};

rifasRouter.post('/rifas/:id/foto', subida.single('foto'), async (req, res) => {
  if (!req.file) throw new ErrorApp(400, 'Elija una foto del premio.');
  try {
    if (!esImagenReal(req.file.path)) throw new ErrorApp(400, 'El archivo no es una foto válida. Use JPG, PNG o WebP.');
    const rifa = await buscarRifa(req.params.id);
    const actualizada = await prisma.rifa.update({
      where: { id: rifa.id },
      data: { fotoUrl: `/uploads/${req.file.filename}` },
      include: conPremios,
    });
    borrarFoto(rifa.fotoUrl);
    res.json({ rifa: actualizada });
  } catch (e) {
    fs.rm(req.file.path, { force: true }, () => {});
    throw e;
  }
});

// ---------- Talonario ----------

rifasRouter.get('/rifas/:id/boletos', async (req, res) => {
  const rifa = await buscarRifa(req.params.id);
  const boletos = await prisma.boleto.findMany({
    where: { rifaId: rifa.id },
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true } },
      pagos: { orderBy: { fecha: 'asc' } },
    },
  });
  const porNumero = new Map(boletos.map((b) => [b.numero, b]));

  let cobrado = 0;
  let pendiente = 0;
  const numeros = TODOS_LOS_NUMEROS.map((numero) => {
    const b = porNumero.get(numero);
    if (!b) return { numero, boleto: null };
    const { pagado, saldo } = resumenBoleto(b, rifa.precioNumero);
    cobrado += pagado;
    pendiente += saldo;
    return {
      numero,
      boleto: { id: b.id, estado: b.estado, cliente: b.cliente, pagos: b.pagos, pagado, saldo, creadoEn: b.creadoEn },
    };
  });

  res.json({
    rifa,
    numeros,
    resumen: {
      vendidos: boletos.length,
      pagados: boletos.filter((b) => b.estado === 'pagado').length,
      cobrado,
      pendiente,
    },
  });
});

// Vender (asignar) uno o varios números a un cliente.
rifasRouter.post('/rifas/:id/boletos', async (req, res) => {
  const rifa = await buscarRifa(req.params.id);
  if (rifa.estado !== 'activa' && rifa.estado !== 'borrador') {
    throw new ErrorApp(409, 'Esta rifa ya terminó; no se pueden vender más números.');
  }
  const { clienteId, numeros, pagadoCon } = ventaSchema.parse(req.body);

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) throw new ErrorApp(404, 'No se encontró el cliente. Búsquelo de nuevo.');

  const ocupados = await prisma.boleto.findMany({
    where: { rifaId: rifa.id, numero: { in: numeros } },
    select: { numero: true },
  });
  if (ocupados.length) throw errorOcupados(ocupados.map((o) => o.numero));

  try {
    await prisma.$transaction(
      numeros.map((numero) =>
        prisma.boleto.create({
          data: {
            rifaId: rifa.id,
            numero,
            clienteId,
            estado: pagadoCon ? 'pagado' : 'apartado',
            pagos: pagadoCon ? { create: { monto: rifa.precioNumero, metodo: pagadoCon } } : undefined,
          },
        }),
      ),
    );
  } catch (e) {
    // Otra persona apartó el número justo al mismo tiempo.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const tomados = await prisma.boleto.findMany({
        where: { rifaId: rifa.id, numero: { in: numeros } },
        select: { numero: true },
      });
      throw errorOcupados(tomados.map((t) => t.numero));
    }
    throw e;
  }

  const total = numeros.length * rifa.precioNumero;
  res.status(201).json({
    mensaje: pagadoCon
      ? `${numeros.length === 1 ? 'Número vendido' : 'Números vendidos'} y pago de ${colones(total)} registrado.`
      : `${numeros.length === 1 ? 'Número apartado' : 'Números apartados'} para ${cliente.nombre}.`,
  });
});

function errorOcupados(numeros) {
  return new ErrorApp(
    409,
    numeros.length === 1
      ? `El número ${numeros[0]} ya está apartado por otra persona. Elija otro.`
      : `Los números ${numeros.sort().join(', ')} ya están apartados por otra persona. Elija otros.`,
  );
}

// ---------- Por cobrar ----------

rifasRouter.get('/rifas/:id/pendientes', async (req, res) => {
  const rifa = await buscarRifa(req.params.id);
  const boletos = await prisma.boleto.findMany({
    where: { rifaId: rifa.id, estado: 'apartado' },
    include: { cliente: true, pagos: { select: { monto: true } } },
    orderBy: { numero: 'asc' },
  });
  const recordatorios = await prisma.recordatorio.groupBy({
    by: ['clienteId'],
    where: { rifaId: rifa.id },
    _max: { enviadoEn: true },
  });
  const ultimoPorCliente = new Map(recordatorios.map((r) => [r.clienteId, r._max.enviadoEn]));

  const porCliente = new Map();
  for (const b of boletos) {
    const { saldo } = resumenBoleto(b, rifa.precioNumero);
    const fila = porCliente.get(b.clienteId) ?? {
      cliente: { id: b.cliente.id, nombre: b.cliente.nombre, telefono: b.cliente.telefono },
      numeros: [],
      debe: 0,
      ultimoRecordatorio: ultimoPorCliente.get(b.clienteId) ?? null,
    };
    fila.numeros.push({ numero: b.numero, saldo });
    fila.debe += saldo;
    porCliente.set(b.clienteId, fila);
  }

  const pendientes = [...porCliente.values()].sort((a, b) => b.debe - a.debe);
  res.json({ rifa, pendientes, total: pendientes.reduce((t, p) => t + p.debe, 0) });
});
