import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { resumenBoleto } from '../saldos.js';

export const metricasRouter = Router();

const ZONA = 'America/Costa_Rica';
const anioCR = (fecha) => Number(new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric' }).format(fecha));
const mesCR = (fecha) => Number(new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, month: 'numeric' }).format(fecha));
const DIA = 86_400_000;

// Una rifa cuenta en el año de su sorteo (o de cuando se creó, si no tiene fecha).
const anioDeRifa = (r) => anioCR(r.fechaSorteo ?? r.creadaEn);

const anioSchema = z.coerce
  .number({ error: 'El año no es válido.' })
  .int()
  .min(2020, 'El año no es válido.')
  .max(2100, 'El año no es válido.')
  .optional();

// Métricas de un año: totales, ganancia por rifa, cobros por mes, efectivo vs SINPE,
// clientes frecuentes, números más pedidos y cuánto tardó cada rifa en venderse.
// Solo rifas publicadas o finalizadas (no borradores ni canceladas). Todo se calcula al vuelo.
metricasRouter.get('/metricas', async (req, res) => {
  const rifas = await prisma.rifa.findMany({
    where: { estado: { in: ['activa', 'finalizada'] } },
    orderBy: { creadaEn: 'asc' },
    include: {
      premios: { select: { costo: true } },
      boletos: {
        select: {
          numero: true,
          creadoEn: true,
          cliente: { select: { id: true, nombre: true } },
          pagos: { select: { monto: true, metodo: true, fecha: true } },
        },
      },
    },
  });

  const anios = [...new Set(rifas.map(anioDeRifa))].sort((a, b) => b - a);
  const anio = anioSchema.parse(req.query.anio) ?? anios[0] ?? anioCR(new Date());
  const delAnio = rifas.filter((r) => anioDeRifa(r) === anio);

  const totales = { rifas: delAnio.length, vendidos: 0, cobrado: 0, pendiente: 0, costoPremios: 0, ganancia: 0, efectivo: 0, sinpe: 0 };
  const porMes = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, cobrado: 0 }));
  const clientes = new Map();
  const numeros = Array(100).fill(0);

  const porRifa = delAnio.map((r) => {
    let cobrado = 0;
    let pendiente = 0;
    for (const b of r.boletos) {
      const { pagado, saldo } = resumenBoleto(b, r.precioNumero);
      cobrado += pagado;
      pendiente += saldo;
      numeros[Number(b.numero)] += 1;
      for (const p of b.pagos) {
        totales[p.metodo] += p.monto;
        if (anioCR(p.fecha) === anio) porMes[mesCR(p.fecha) - 1].cobrado += p.monto;
      }
      const c = clientes.get(b.cliente.id) ?? { ...b.cliente, numeros: 0, pagado: 0, rifas: new Set() };
      c.numeros += 1;
      c.pagado += pagado;
      c.rifas.add(r.id);
      clientes.set(b.cliente.id, c);
    }
    const costoPremios = r.premios.reduce((t, p) => t + p.costo, 0);
    const ventas = r.boletos.map((b) => b.creadoEn.getTime());
    const primera = ventas.length ? Math.min(...ventas) : null;
    const ultima = ventas.length ? Math.max(...ventas) : null;

    totales.vendidos += r.boletos.length;
    totales.cobrado += cobrado;
    totales.pendiente += pendiente;
    totales.costoPremios += costoPremios;

    return {
      id: r.id,
      titulo: r.titulo,
      estado: r.estado,
      fechaSorteo: r.fechaSorteo,
      vendidos: r.boletos.length,
      cobrado,
      pendiente,
      costoPremios,
      ganancia: cobrado - costoPremios,
      // Días entre la primera y la última venta (mínimo 1 si hubo ventas).
      diasVendiendo: primera === null ? null : Math.max(1, Math.ceil((ultima - primera) / DIA)),
    };
  });
  totales.ganancia = totales.cobrado - totales.costoPremios;

  const frecuentes = [...clientes.values()]
    .map(({ rifas: ids, ...c }) => ({ ...c, rifas: ids.size }))
    .sort((a, b) => b.numeros - a.numeros || b.pagado - a.pagado)
    .slice(0, 10);

  res.json({
    anio,
    anios,
    totales,
    porRifa,
    porMes,
    frecuentes,
    numeros: numeros.map((veces, i) => ({ numero: String(i).padStart(2, '0'), veces })),
  });
});
