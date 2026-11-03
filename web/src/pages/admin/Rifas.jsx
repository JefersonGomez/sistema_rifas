import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, Pencil, Plus, Send, Trophy } from 'lucide-react';
import { pedir } from '../../api/cliente.js';
import { useRifas } from '../../hooks/useRifas.js';
import HojaInferior from '../../components/HojaInferior.jsx';
import { useAvisos } from '../../components/Avisos.jsx';
import { formatoColones, formatoFecha } from '../../utils/formato.js';

const etiquetas = {
  borrador: ['Borrador', 'bg-black/10 text-tinta'],
  activa: ['Publicada', 'bg-jade text-white'],
  finalizada: ['Finalizada', 'bg-tinta text-white'],
  cancelada: ['Cancelada', 'bg-coral/10 text-coral'],
};

export default function Rifas() {
  const { rifas, isPending } = useRifas();
  const [finalizando, setFinalizando] = useState(null);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="font-titulo text-3xl font-extrabold">Mis rifas</h1>
        <Link to="/admin/rifas/nueva" className="btn-primario px-4">
          <Plus aria-hidden className="h-6 w-6" /> Crear rifa
        </Link>
      </div>

      {isPending && <p className="py-10 text-center text-lg">Cargando…</p>}
      {!isPending && rifas.length === 0 && (
        <p className="tarjeta p-6 text-center text-lg">Todavía no hay rifas. Toque "Crear rifa" para empezar.</p>
      )}

      <ul className="space-y-3">
        {rifas.map((r) => (
          <TarjetaRifa key={r.id} rifa={r} onFinalizar={() => setFinalizando(r)} />
        ))}
      </ul>

      {finalizando && <HojaFinalizar rifa={finalizando} onCerrar={() => setFinalizando(null)} />}
    </div>
  );
}

function TarjetaRifa({ rifa, onFinalizar }) {
  const queryClient = useQueryClient();
  const avisar = useAvisos();
  const [texto, clase] = etiquetas[rifa.estado];

  const publicar = useMutation({
    mutationFn: () => pedir(`/admin/rifas/${rifa.id}/activar`, { metodo: 'POST' }),
    onSuccess: () => {
      avisar('Rifa publicada. Ya los clientes pueden ver los números.');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['public'] });
    },
    onError: (e) => avisar(e.message, 'error'),
  });

  return (
    <li className="tarjeta">
      <div className="flex gap-3">
        {rifa.fotoUrl && <img src={rifa.fotoUrl} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />}
        <div className="min-w-0 flex-1">
          <span className={`inline-block rounded-full px-3 py-0.5 text-base font-bold ${clase}`}>{texto}</span>
          <p className="mt-1 text-xl font-extrabold leading-tight">{rifa.titulo}</p>
          <p className="text-base text-tinta/70">
            {formatoColones(rifa.precioNumero)} el número
            {rifa.fechaSorteo && ` · ${formatoFecha(rifa.fechaSorteo)}`}
          </p>
        </div>
      </div>

      <p className="mt-3 text-lg">
        <strong>{rifa.vendidos}</strong> de 100 vendidos · <strong className="text-jade">{formatoColones(rifa.cobrado)}</strong> cobrado
      </p>
      {rifa.estado === 'finalizada' && (
        <p className="mt-1 flex items-center gap-2 text-lg">
          <Trophy aria-hidden className="h-5 w-5 text-mango" /> Número ganador: <strong className="tabular-nums">{rifa.numeroGanador}</strong>
        </p>
      )}

      {(rifa.estado === 'borrador' || rifa.estado === 'activa') && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link to={`/admin/rifas/${rifa.id}/editar`} className="btn-secundario">
            <Pencil aria-hidden className="h-5 w-5" /> Editar
          </Link>
          {rifa.estado === 'borrador' ? (
            <button type="button" className="btn-primario" onClick={() => publicar.mutate()} disabled={publicar.isPending}>
              <Send aria-hidden className="h-5 w-5" /> Publicar
            </button>
          ) : (
            <button type="button" className="btn bg-tinta text-white" onClick={onFinalizar}>
              <Flag aria-hidden className="h-5 w-5" /> Finalizar
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function HojaFinalizar({ rifa, onCerrar }) {
  const queryClient = useQueryClient();
  const avisar = useAvisos();
  const [numero, setNumero] = useState('');
  const valido = /^\d{1,2}$/.test(numero);
  const ganador = numero.padStart(2, '0');

  const finalizar = useMutation({
    mutationFn: () => pedir(`/admin/rifas/${rifa.id}/finalizar`, { metodo: 'POST', datos: { numeroGanador: ganador } }),
    onSuccess: (d) => {
      avisar(d.ganador ? `Rifa finalizada. Ganó ${d.ganador.nombre} con el ${ganador}.` : `Rifa finalizada. Nadie tenía el ${ganador}.`);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['public'] });
      onCerrar();
    },
  });

  return (
    <HojaInferior titulo="Finalizar rifa" onCerrar={onCerrar}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valido) finalizar.mutate();
        }}
      >
        <p className="text-lg">
          Escriba el número del <strong>primer premio de la Lotería Nacional</strong> para la rifa "{rifa.titulo}".
        </p>
        <input
          className="campo mt-4 h-20 text-center font-titulo text-5xl font-extrabold tabular-nums"
          inputMode="numeric"
          maxLength={2}
          placeholder="00"
          aria-label="Número ganador"
          value={numero}
          onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
          autoFocus
        />
        <p className="mt-3 rounded-xl bg-mango-claro p-3 text-base">
          Al finalizar, la rifa se cierra y ya no se pueden vender números. Esto no se puede deshacer.
        </p>
        {finalizar.isError && <p className="mt-3 font-bold text-coral">{finalizar.error.message}</p>}
        <button type="submit" className="btn mt-4 w-full bg-tinta text-white" disabled={!valido || finalizar.isPending}>
          {valido ? `Finalizar con el ${ganador}` : 'Escriba el número ganador'}
        </button>
      </form>
    </HojaInferior>
  );
}
