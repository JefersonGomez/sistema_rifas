import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChartColumn, ChevronRight, Flag, History, Pencil, Plus, Send } from 'lucide-react';
import { pedir } from '../../api/cliente.js';
import { useRifas } from '../../hooks/useRifas.js';
import HojaInferior from '../../components/HojaInferior.jsx';
import { useAvisos } from '../../components/Avisos.jsx';
import Medalla from '../../components/Medalla.jsx';
import { formatoColones, formatoFecha, nombreLugar } from '../../utils/formato.js';

const etiquetas = {
  borrador: ['Borrador', 'bg-tinta/10 text-tinta'],
  activa: ['Publicada', 'bg-jade text-sobrejade'],
  finalizada: ['Finalizada', 'bg-tinta text-arena'],
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
      <Link to="/admin/metricas" className="btn-secundario -mt-2 mb-5 w-full">
        <ChartColumn aria-hidden className="h-5 w-5" /> Ver métricas del año
      </Link>

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

      <ul className="mt-3 space-y-1.5">
        {rifa.premios.map((p) => (
          <li key={p.lugar} className="flex items-center gap-2 text-lg">
            <Medalla lugar={p.lugar} className="h-7 w-7 text-sm" />
            <span className="min-w-0 flex-1">
              {p.descripcion}
              {rifa.estado === 'finalizada' && (
                <span className="block text-base">
                  Número <strong className="tabular-nums">{p.numeroGanador}</strong> ·{' '}
                  {p.ganador ? (
                    <strong className="text-jade">{p.ganador.nombre}</strong>
                  ) : (
                    <span className="text-tinta/60">sin ganador</span>
                  )}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 border-t border-tinta/5 pt-3 text-lg">
        <strong>{rifa.vendidos}</strong> de 100 vendidos · <strong className="text-jade">{formatoColones(rifa.cobrado)}</strong> cobrado
      </p>

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
            <button type="button" className="btn bg-tinta text-arena" onClick={onFinalizar}>
              <Flag aria-hidden className="h-5 w-5" /> Finalizar
            </button>
          )}
        </div>
      )}

      <Link
        to={`/admin/rifas/${rifa.id}`}
        className={`btn w-full justify-between px-3 text-jade hover:bg-jade-claro ${rifa.estado === 'finalizada' ? 'mt-3 border-2 border-jade' : 'mt-2'}`}
      >
        <span className="flex items-center gap-2">
          <History aria-hidden className="h-5 w-5" /> Ver historial
        </span>
        <ChevronRight aria-hidden className="h-5 w-5" />
      </Link>
    </li>
  );
}

function HojaFinalizar({ rifa, onCerrar }) {
  const queryClient = useQueryClient();
  const avisar = useAvisos();
  const [numeros, setNumeros] = useState(() => rifa.premios.map(() => ''));
  const valido = numeros.every((n) => /^\d{1,2}$/.test(n));
  const ganadores = numeros.map((n) => n.padStart(2, '0'));

  const finalizar = useMutation({
    mutationFn: () => pedir(`/admin/rifas/${rifa.id}/finalizar`, { metodo: 'POST', datos: { numerosGanadores: ganadores } }),
    onSuccess: (d) => {
      const con = d.premios.filter((p) => p.ganador);
      avisar(
        con.length === 0
          ? 'Rifa finalizada. No hubo ganador: nadie tenía esos números.'
          : `Rifa finalizada. ${con.map((p) => `${nombreLugar(p.lugar)}: ${p.ganador.nombre}`).join(' · ')}`,
      );
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
          Escriba los números que salieron en la <strong>Lotería Nacional</strong> para "{rifa.titulo}".
        </p>
        <div className="mt-4 space-y-3">
          {rifa.premios.map((p, i) => (
            <label key={p.lugar} className="flex items-center gap-3">
              <Medalla lugar={p.lugar} />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-extrabold">{nombreLugar(p.lugar)}</span>
                <span className="block truncate text-base text-tinta/70">{p.descripcion}</span>
              </span>
              <input
                className="campo h-16 w-24 text-center font-titulo text-4xl font-extrabold tabular-nums"
                inputMode="numeric"
                maxLength={2}
                placeholder="00"
                aria-label={`Número del ${nombreLugar(p.lugar)}`}
                value={numeros[i]}
                onChange={(e) => setNumeros(numeros.map((n, j) => (j === i ? e.target.value.replace(/\D/g, '') : n)))}
                autoFocus={i === 0}
              />
            </label>
          ))}
        </div>
        <p className="mt-4 rounded-xl bg-mango-claro p-3 text-base">
          Al finalizar, la rifa se cierra y ya no se pueden vender números. Si nadie tiene un número, queda como
          "sin ganador". Esto no se puede deshacer.
        </p>
        {finalizar.isError && <p className="mt-3 font-bold text-coral">{finalizar.error.message}</p>}
        <button type="submit" className="btn mt-4 w-full bg-tinta text-arena" disabled={!valido || finalizar.isPending}>
          {valido ? 'Finalizar rifa' : 'Escriba los números ganadores'}
        </button>
      </form>
    </HojaInferior>
  );
}
