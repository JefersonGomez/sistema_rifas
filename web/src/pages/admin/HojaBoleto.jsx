import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Banknote, Lock, Smartphone, Trash2 } from 'lucide-react';
import { pedir } from '../../api/cliente.js';
import HojaInferior, { Confirmar } from '../../components/HojaInferior.jsx';
import BotonWhatsApp from '../../components/BotonWhatsApp.jsx';
import BuscadorCliente from '../../components/BuscadorCliente.jsx';
import Opciones from '../../components/Opciones.jsx';
import { useAvisos } from '../../components/Avisos.jsx';
import { formatoColones, formatoFechaCorta, formatoTelefono } from '../../utils/formato.js';
import { mensajeRecordatorio } from '../../utils/mensajesWhatsApp.js';

// Detalle de un número vendido: comprador, pagos, saldo y acciones.
export default function HojaBoleto({ rifa, item, onCerrar }) {
  const { numero, boleto } = item;
  const queryClient = useQueryClient();
  const avisar = useAvisos();
  const [vista, setVista] = useState('detalle'); // detalle | cambiar
  const [confirmar, setConfirmar] = useState(null); // { tipo: 'liberar' } | { tipo: 'pago', pago }

  // Recarga los datos y después avisa, para que la pantalla ya muestre el cambio.
  const alTerminar = async ({ mensaje }) => {
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
    avisar(mensaje);
  };
  const alFallar = (error) => avisar(error.message, 'error');

  const liberar = useMutation({
    mutationFn: () => pedir(`/admin/boletos/${boleto.id}`, { metodo: 'DELETE' }),
    onSuccess: async (d) => {
      await alTerminar(d);
      onCerrar();
    },
    onError: (e) => {
      alFallar(e);
      setConfirmar(null);
    },
  });
  const borrarPago = useMutation({
    mutationFn: (pagoId) => pedir(`/admin/pagos/${pagoId}`, { metodo: 'DELETE' }),
    onSuccess: alTerminar,
    onError: alFallar,
    onSettled: () => setConfirmar(null),
  });
  const cambiarCliente = useMutation({
    mutationFn: (clienteId) => pedir(`/admin/boletos/${boleto.id}`, { metodo: 'PATCH', datos: { clienteId } }),
    onSuccess: async (d) => {
      await alTerminar(d);
      setVista('detalle');
    },
    onError: alFallar,
  });
  const recordar = useMutation({
    mutationFn: () => pedir('/admin/recordatorios', { metodo: 'POST', datos: { clienteId: boleto.cliente.id, rifaId: rifa.id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'pendientes'] }),
  });

  if (confirmar?.tipo === 'liberar') {
    return (
      <Confirmar
        titulo={`¿Liberar el ${numero}?`}
        mensaje={`El número ${numero} dejará de ser de ${boleto.cliente.nombre} y quedará libre para otra persona.`}
        textoBoton="Liberar número"
        cargando={liberar.isPending}
        onConfirmar={() => liberar.mutate()}
        onCerrar={() => setConfirmar(null)}
      />
    );
  }
  if (confirmar?.tipo === 'pago') {
    return (
      <Confirmar
        titulo="¿Borrar este pago?"
        mensaje={`Se borrará el pago de ${formatoColones(confirmar.pago.monto)} del número ${numero}. Hágalo solo si se anotó por error.`}
        textoBoton="Borrar pago"
        cargando={borrarPago.isPending}
        onConfirmar={() => borrarPago.mutate(confirmar.pago.id)}
        onCerrar={() => setConfirmar(null)}
      />
    );
  }

  if (vista === 'cambiar') {
    return (
      <HojaInferior titulo={`Cambiar dueño del ${numero}`} onCerrar={() => setVista('detalle')}>
        <BuscadorCliente onElegir={(c) => cambiarCliente.mutate(c.id)} />
      </HojaInferior>
    );
  }

  const pagado = boleto.estado === 'pagado';

  return (
    <HojaInferior titulo={`Número ${numero}`} onCerrar={onCerrar}>
      <div className="tarjeta">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xl font-extrabold">{boleto.cliente.nombre}</p>
            <p className="tabular-nums text-tinta/70">{formatoTelefono(boleto.cliente.telefono)}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-base font-bold ${pagado ? 'bg-jade text-sobrejade' : 'bg-mango-claro text-amber-900 dark:text-amber-200'}`}
          >
            {pagado ? 'Pagado' : 'Apartado'}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-base text-tinta/70">Pagó</p>
            <p className="font-titulo text-2xl font-extrabold text-jade">{formatoColones(boleto.pagado)}</p>
          </div>
          <div>
            <p className="text-base text-tinta/70">Debe</p>
            <p className={`font-titulo text-2xl font-extrabold ${boleto.saldo ? 'text-amber-700 dark:text-amber-400' : ''}`}>{formatoColones(boleto.saldo)}</p>
          </div>
        </div>
      </div>

      {boleto.pagos.length > 0 && (
        <section className="mt-4">
          <h3 className="etiqueta">Pagos</h3>
          <ul className="divide-y divide-tinta/5 rounded-xl bg-superficie">
            {boleto.pagos.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-1 pl-4 pr-1">
                {p.metodo === 'sinpe' ? (
                  <Smartphone aria-label="SINPE" className="h-5 w-5 shrink-0 text-jade" />
                ) : (
                  <Banknote aria-label="Efectivo" className="h-5 w-5 shrink-0 text-jade" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold">{formatoColones(p.monto)}</p>
                  <p className="text-base text-tinta/60">
                    {p.metodo === 'sinpe' ? 'SINPE' : 'Efectivo'} · {formatoFechaCorta(p.fecha)}
                    {p.referencia && ` · Ref. ${p.referencia}`}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn px-3 text-coral"
                  aria-label={`Borrar pago de ${formatoColones(p.monto)}`}
                  onClick={() => setConfirmar({ tipo: 'pago', pago: p })}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* key: al cambiar el saldo el monto sugerido se actualiza */}
      {!pagado && <FormAbono key={boleto.saldo} boleto={boleto} onListo={alTerminar} />}

      <div className="mt-5 space-y-3">
        {!pagado && (
          <BotonWhatsApp
            telefono={boleto.cliente.telefono}
            mensaje={mensajeRecordatorio({ nombre: boleto.cliente.nombre, debe: boleto.saldo, numeros: [numero], rifa })}
            onClick={() => recordar.mutate()}
          >
            Recordar por WhatsApp
          </BotonWhatsApp>
        )}
        <button type="button" className="btn-secundario w-full" onClick={() => setVista('cambiar')}>
          Cambiar dueño
        </button>
        {boleto.pagos.length > 0 ? (
          <p className="flex items-start gap-2 rounded-xl bg-tinta/5 p-3 text-base">
            <Lock aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
            Este número no se puede liberar porque ya tiene pagos.
          </p>
        ) : (
          <button type="button" className="btn-peligro w-full" onClick={() => setConfirmar({ tipo: 'liberar' })}>
            Liberar número
          </button>
        )}
      </div>
    </HojaInferior>
  );
}

function FormAbono({ boleto, onListo }) {
  const [monto, setMonto] = useState(String(boleto.saldo));
  const [metodo, setMetodo] = useState('efectivo');
  const [referencia, setReferencia] = useState('');

  const abonar = useMutation({
    mutationFn: () =>
      pedir(`/admin/boletos/${boleto.id}/pagos`, {
        metodo: 'POST',
        datos: { monto: Number(monto.replace(/\D/g, '')), metodo, referencia: metodo === 'sinpe' ? referencia : null },
      }),
    onSuccess: async (d) => {
      await onListo(d);
      setReferencia('');
    },
  });

  return (
    <form
      className="tarjeta mt-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        abonar.mutate();
      }}
    >
      <h3 className="text-lg font-extrabold">Registrar pago</h3>
      <div>
        <label className="etiqueta" htmlFor="monto">Monto en colones</label>
        <input
          id="monto"
          className="campo tabular-nums"
          inputMode="numeric"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
      </div>
      <Opciones
        nombre="Método de pago"
        valor={metodo}
        onCambiar={setMetodo}
        opciones={[
          { valor: 'efectivo', texto: 'Efectivo' },
          { valor: 'sinpe', texto: 'SINPE' },
        ]}
      />
      {metodo === 'sinpe' && (
        <div>
          <label className="etiqueta" htmlFor="referencia">Comprobante (opcional)</label>
          <input id="referencia" className="campo" inputMode="numeric" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
        </div>
      )}
      {abonar.isError && <p className="font-bold text-coral">{abonar.error.message}</p>}
      <button type="submit" className="btn-primario w-full" disabled={abonar.isPending}>
        Registrar pago
      </button>
    </form>
  );
}
