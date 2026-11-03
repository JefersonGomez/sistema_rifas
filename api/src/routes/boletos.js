import { Router } from 'express';
import { prisma } from '../db.js';
import { ErrorApp } from '../middleware/errores.js';
import { cambioClienteSchema, idParam, pagoSchema } from '../schemas.js';
import { actualizarEstado, colones, sumaPagos } from '../saldos.js';

export const boletosRouter = Router();

async function buscarBoleto(id, tx = prisma) {
  const boleto = await tx.boleto.findUnique({
    where: { id: idParam.parse(id) },
    include: { pagos: true, rifa: true },
  });
  if (!boleto) throw new ErrorApp(404, 'Ese número ya no está asignado. Actualice la pantalla.');
  return boleto;
}

// Cambiar el número a otro cliente.
boletosRouter.patch('/boletos/:id', async (req, res) => {
  const boleto = await buscarBoleto(req.params.id);
  const { clienteId } = cambioClienteSchema.parse(req.body);
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) throw new ErrorApp(404, 'No se encontró el cliente. Búsquelo de nuevo.');

  await prisma.boleto.update({ where: { id: boleto.id }, data: { clienteId } });
  res.json({ mensaje: `El número ${boleto.numero} ahora es de ${cliente.nombre}.` });
});

// Liberar el número. NO se permite si ya tiene pagos: alguien pagó por él.
boletosRouter.delete('/boletos/:id', async (req, res) => {
  const boleto = await buscarBoleto(req.params.id);
  if (boleto.rifa.estado === 'finalizada') {
    throw new ErrorApp(409, 'La rifa ya terminó; no se pueden liberar números.');
  }
  if (boleto.pagos.length > 0) {
    throw new ErrorApp(
      409,
      `El número ${boleto.numero} no se puede liberar porque ya tiene pagos (${colones(sumaPagos(boleto.pagos))}).`,
    );
  }
  // deleteMany con la condición evita borrar si entró un pago justo ahora.
  const { count } = await prisma.boleto.deleteMany({ where: { id: boleto.id, pagos: { none: {} } } });
  if (count === 0) throw new ErrorApp(409, `El número ${boleto.numero} recibió un pago y ya no se puede liberar.`);
  res.json({ mensaje: `Número ${boleto.numero} liberado.` });
});

// Registrar un abono.
boletosRouter.post('/boletos/:id/pagos', async (req, res) => {
  const datos = pagoSchema.parse(req.body);
  const id = idParam.parse(req.params.id);

  const resultado = await prisma.$transaction(async (tx) => {
    // Bloquea el boleto para que dos abonos al mismo tiempo no pasen del precio.
    await tx.$queryRaw`SELECT id FROM boletos WHERE id = ${id} FOR UPDATE`;
    const boleto = await buscarBoleto(id, tx);
    const saldo = boleto.rifa.precioNumero - sumaPagos(boleto.pagos);
    if (saldo <= 0) throw new ErrorApp(409, `El número ${boleto.numero} ya está pagado completo.`);
    if (datos.monto > saldo) {
      throw new ErrorApp(400, `El monto es mayor a lo que debe. Del número ${boleto.numero} solo faltan ${colones(saldo)}.`);
    }
    await tx.pago.create({ data: { ...datos, boletoId: boleto.id } });
    const estado = await actualizarEstado(tx, boleto.id);
    return { numero: boleto.numero, estado, saldo: saldo - datos.monto };
  });

  res.status(201).json({
    mensaje:
      resultado.estado === 'pagado'
        ? `Pago de ${colones(datos.monto)} registrado. El número ${resultado.numero} quedó pagado.`
        : `Pago de ${colones(datos.monto)} registrado. Faltan ${colones(resultado.saldo)}.`,
  });
});

// Borrar un pago mal ingresado.
boletosRouter.delete('/pagos/:id', async (req, res) => {
  const id = idParam.parse(req.params.id);
  const pago = await prisma.pago.findUnique({ where: { id }, include: { boleto: { include: { rifa: true } } } });
  if (!pago) throw new ErrorApp(404, 'Ese pago ya no existe. Actualice la pantalla.');
  if (pago.boleto.rifa.estado === 'finalizada') {
    throw new ErrorApp(409, 'La rifa ya terminó; sus pagos no se pueden borrar.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.pago.delete({ where: { id } });
    await actualizarEstado(tx, pago.boletoId);
  });
  res.json({ mensaje: `Pago de ${colones(pago.monto)} borrado.` });
});
