// Reglas de saldo: saldo = precio_numero − suma(pagos). Saldo 0 → boleto "pagado".

const colonesFmt = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 });
export const colones = (monto) => colonesFmt.format(monto);

export const sumaPagos = (pagos) => pagos.reduce((total, p) => total + p.monto, 0);

export function resumenBoleto(boleto, precioNumero) {
  const pagado = sumaPagos(boleto.pagos);
  return { pagado, saldo: Math.max(precioNumero - pagado, 0) };
}

// Recalcula el estado del boleto dentro de una transacción después de agregar o borrar un pago.
export async function actualizarEstado(tx, boletoId) {
  const boleto = await tx.boleto.findUniqueOrThrow({
    where: { id: boletoId },
    include: { pagos: { select: { monto: true } }, rifa: { select: { precioNumero: true } } },
  });
  const estado = sumaPagos(boleto.pagos) >= boleto.rifa.precioNumero ? 'pagado' : 'apartado';
  if (estado !== boleto.estado) {
    await tx.boleto.update({ where: { id: boletoId }, data: { estado } });
  }
  return estado;
}
