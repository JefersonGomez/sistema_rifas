import { Link } from 'react-router';
import { ExternalLink, Plus, Ticket, Wallet } from 'lucide-react';
import { useRifas, useTalonario } from '../../hooks/useRifas.js';
import BotonWhatsApp from '../../components/BotonWhatsApp.jsx';
import Medalla from '../../components/Medalla.jsx';
import CompartirPagina from '../../components/CompartirPagina.jsx';
import { diasHasta, formatoColones, formatoFecha } from '../../utils/formato.js';
import { mensajeCompartirLibres } from '../../utils/mensajesWhatsApp.js';

export default function Inicio() {
  const { activa, isPending } = useRifas();
  const talonarioQ = useTalonario(activa?.id);

  if (isPending) return <p className="py-10 text-center text-lg">Cargando…</p>;

  if (!activa) {
    return (
      <section className="tarjeta p-6 text-center">
        <h1 className="font-titulo text-3xl font-extrabold">No hay una rifa publicada</h1>
        <p className="mt-2 text-lg">Cree una rifa nueva o publique una que tenga en borrador.</p>
        <Link to="/admin/rifas/nueva" className="btn-primario mt-6 w-full">
          <Plus aria-hidden className="h-6 w-6" /> Crear rifa
        </Link>
        <Link to="/admin/rifas" className="btn-secundario mt-3 w-full">
          Ver mis rifas
        </Link>
      </section>
    );
  }

  const datos = talonarioQ.data;
  const r = datos?.resumen;
  const libres = datos?.numeros.filter((n) => !n.boleto).map((n) => n.numero) ?? [];
  const dias = activa.fechaSorteo ? diasHasta(activa.fechaSorteo) : null;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-jade to-teal-800 p-5 text-white dark:from-teal-800 dark:to-teal-950 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold uppercase tracking-wide text-teal-100">Rifa publicada</p>
            <h1 className="font-titulo text-3xl font-extrabold leading-tight">{activa.titulo}</h1>
            {activa.fechaSorteo && <p className="mt-1 text-lg text-white/90">Sorteo el {formatoFecha(activa.fechaSorteo)}</p>}
          </div>
          {dias !== null && (
            <div className="shrink-0 rounded-2xl bg-white/15 px-3 py-2 text-center">
              <p className="font-titulo text-3xl font-extrabold leading-none tabular-nums">
                {dias > 0 ? dias : dias === 0 ? '¡Hoy!' : '—'}
              </p>
              <p className="text-base font-bold">{dias > 0 ? (dias === 1 ? 'día' : 'días') : dias === 0 ? 'sorteo' : 'ya pasó'}</p>
            </div>
          )}
        </div>
        <p className="mt-4 text-lg">
          <strong className="font-titulo text-2xl">{r ? r.vendidos : '…'}</strong> de 100 números vendidos
        </p>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-mango transition-[width] duration-700" style={{ width: `${r?.vendidos ?? 0}%` }} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Dato titulo="Cobrado" valor={r ? formatoColones(r.cobrado) : '…'} color="text-jade" />
        <Dato titulo="Por cobrar" valor={r ? formatoColones(r.pendiente) : '…'} color="text-amber-700 dark:text-amber-400" />
      </section>

      <section className="tarjeta">
        <h2 className="mb-2 text-lg font-extrabold">Premios</h2>
        <ul className="space-y-2">
          {activa.premios.map((p) => (
            <li key={p.lugar} className="flex items-center gap-3 text-lg">
              <Medalla lugar={p.lugar} /> {p.descripcion}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <Link to="/admin/talonario" className="btn-primario w-full">
          <Ticket aria-hidden className="h-6 w-6" /> Vender número
        </Link>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link to="/admin/por-cobrar" className="btn-secundario">
            <Wallet aria-hidden className="h-6 w-6" /> Registrar pago
          </Link>
          <BotonWhatsApp mensaje={mensajeCompartirLibres(activa, libres)} className="w-full">
            Compartir números libres
          </BotonWhatsApp>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="btn w-full text-jade">
          <ExternalLink aria-hidden className="h-5 w-5" /> Ver la página de los clientes
        </a>
      </section>

      <CompartirPagina />
    </div>
  );
}

function Dato({ titulo, valor, color = 'text-tinta' }) {
  return (
    <div className="tarjeta">
      <p className="text-base text-tinta/70">{titulo}</p>
      <p className={`font-titulo text-2xl font-extrabold tabular-nums ${color}`}>{valor}</p>
    </div>
  );
}
