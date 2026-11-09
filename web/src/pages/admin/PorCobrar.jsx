import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Bell, PartyPopper } from 'lucide-react';
import { pedir } from '../../api/cliente.js';
import { useRifas, useAjustes } from '../../hooks/useRifas.js';
import BotonWhatsApp from '../../components/BotonWhatsApp.jsx';
import { esHoy, formatoColones, formatoFecha, formatoTelefono } from '../../utils/formato.js';
import { mensajeRecordatorio } from '../../utils/mensajesWhatsApp.js';

export default function PorCobrar() {
  const { activa, isPending } = useRifas();
  const pendientesQ = useQuery({
    queryKey: ['admin', 'pendientes', activa?.id],
    queryFn: () => pedir(`/admin/rifas/${activa.id}/pendientes`),
    enabled: Boolean(activa),
  });

  if (isPending) return <p className="py-10 text-center text-lg">Cargando…</p>;
  if (!activa) {
    return (
      <section className="tarjeta p-6 text-center">
        <p className="text-lg">No hay una rifa publicada.</p>
        <Link to="/admin/rifas" className="btn-primario mt-4 w-full">Ir a mis rifas</Link>
      </section>
    );
  }
  if (pendientesQ.isError) return <p className="py-10 text-center text-lg text-coral">{pendientesQ.error.message}</p>;
  if (!pendientesQ.data) return <p className="py-10 text-center text-lg">Cargando…</p>;

  const { pendientes, total, rifa } = pendientesQ.data;

  return (
    <div>
      <h1 className="font-titulo text-3xl font-extrabold">Por cobrar</h1>
      <p className="text-lg">
        {pendientes.length === 0 ? (
          'Nadie debe nada.'
        ) : (
          <>
            {pendientes.length} {pendientes.length === 1 ? 'persona debe' : 'personas deben'}{' '}
            <strong className="text-amber-700 dark:text-amber-400">{formatoColones(total)}</strong> en total.
          </>
        )}
      </p>
      <p className="mt-1 text-base text-tinta/70">Para registrar un pago, toque el número en el Talonario.</p>

      {pendientes.length === 0 ? (
        <div className="tarjeta mt-6 p-8 text-center">
          <PartyPopper aria-hidden className="mx-auto h-12 w-12 text-jade" />
          <p className="mt-2 text-lg font-bold">¡Todo está cobrado!</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {pendientes.map((p) => (
            <FilaPendiente key={p.cliente.id} pendiente={p} rifa={rifa} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilaPendiente({ pendiente, rifa }) {
  const ajustes = useAjustes();
  const queryClient = useQueryClient();
  const { cliente, numeros, debe, ultimoRecordatorio } = pendiente;
  const recordadoHoy = ultimoRecordatorio && esHoy(ultimoRecordatorio);

  const recordar = useMutation({
    mutationFn: () => pedir('/admin/recordatorios', { metodo: 'POST', datos: { clienteId: cliente.id, rifaId: rifa.id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'pendientes'] }),
  });

  return (
    <li className="tarjeta">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/admin/clientes/${cliente.id}`} className="block text-xl font-extrabold underline-offset-4 hover:underline">
            {cliente.nombre}
          </Link>
          <p className="tabular-nums text-tinta/70">{formatoTelefono(cliente.telefono)}</p>
        </div>
        <p className="shrink-0 font-titulo text-2xl font-extrabold text-amber-700 dark:text-amber-400">{formatoColones(debe)}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {numeros.map((n) => (
          <span key={n.numero} className="rounded-lg border-2 border-mango bg-mango-claro px-2 py-0.5 text-base font-bold tabular-nums text-amber-900 dark:text-amber-200">
            {n.numero} · {formatoColones(n.saldo)}
          </span>
        ))}
      </div>

      <p className={`mt-3 flex items-center gap-1.5 text-base ${recordadoHoy ? 'font-bold text-amber-800 dark:text-amber-300' : 'text-tinta/60'}`}>
        <Bell aria-hidden className="h-4 w-4" />
        {ultimoRecordatorio
          ? recordadoHoy
            ? 'Ya se le recordó hoy'
            : `Último recordatorio: ${formatoFecha(ultimoRecordatorio)}`
          : 'Todavía no se le ha recordado'}
      </p>

      <BotonWhatsApp
        telefono={cliente.telefono}
        mensaje={mensajeRecordatorio({ nombre: cliente.nombre, debe, numeros: numeros.map((n) => n.numero), rifa }, ajustes.mensajeRecordatorio)}
        onClick={() => recordar.mutate()}
        className="mt-3 w-full"
      >
        Recordar por WhatsApp
      </BotonWhatsApp>
    </li>
  );
}
