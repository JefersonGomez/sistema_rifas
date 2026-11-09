import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Pencil, Trophy } from 'lucide-react';
import { pedir } from '../../api/cliente.js';
import { useAvisos } from '../../components/Avisos.jsx';
import BotonWhatsApp from '../../components/BotonWhatsApp.jsx';
import HojaInferior from '../../components/HojaInferior.jsx';
import Medalla from '../../components/Medalla.jsx';
import { Inicial } from './Clientes.jsx';
import { esHoy, formatoColones, formatoFecha, formatoFechaCorta, formatoTelefono, nombreLugar, primerNombre } from '../../utils/formato.js';
import { mensajeRecordatorio } from '../../utils/mensajesWhatsApp.js';
import { useAjustes } from '../../hooks/useRifas.js';

const etiquetas = {
  borrador: ['Borrador', 'bg-tinta/10 text-tinta'],
  activa: ['Publicada', 'bg-jade text-sobrejade'],
  finalizada: ['Finalizada', 'bg-tinta text-arena'],
};

// Ficha de un cliente: datos, totales y cada rifa en la que participó.
export default function ClienteFicha() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ['admin', 'clientes', id], queryFn: () => pedir(`/admin/clientes/${id}`) });
  const [editando, setEditando] = useState(false);

  if (q.isPending) return <p className="py-10 text-center text-lg">Cargando…</p>;
  if (q.isError) return <p className="py-10 text-center text-lg text-coral">{q.error.message}</p>;

  const { cliente, totales: t, participaciones } = q.data;

  return (
    <div className="space-y-5">
      <div>
        <Link to="/admin/clientes" className="btn -ml-3 px-3 text-base text-jade">
          <ChevronLeft aria-hidden className="h-5 w-5" /> Clientes
        </Link>
        <div className="flex items-center gap-4">
          <Inicial nombre={cliente.nombre} grande />
          <div className="min-w-0">
            <h1 className="font-titulo text-3xl font-extrabold leading-tight">{cliente.nombre}</h1>
            <p className="text-lg tabular-nums text-tinta/70">{formatoTelefono(cliente.telefono)}</p>
          </div>
        </div>
        {cliente.notas && <p className="mt-3 whitespace-pre-line rounded-xl bg-mango-claro px-4 py-2 text-lg">{cliente.notas}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <BotonWhatsApp telefono={cliente.telefono} mensaje={`Hola ${primerNombre(cliente.nombre)}, `}>
          Escribirle por WhatsApp
        </BotonWhatsApp>
        <button type="button" className="btn-secundario" onClick={() => setEditando(true)}>
          <Pencil aria-hidden className="h-5 w-5" /> Corregir datos
        </button>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <Dato titulo="Ha pagado" valor={formatoColones(t.pagado)} color="text-jade" />
        <Dato titulo="Debe" valor={formatoColones(t.debe)} color={t.debe ? 'text-amber-700 dark:text-amber-400' : ''} />
        <Dato titulo="Rifas" valor={t.rifas} />
        <Dato titulo="Números" valor={t.numeros} />
      </section>

      {t.pagado > 0 && (
        <p className="text-center text-base text-tinta/70">
          Pagó {formatoColones(t.efectivo)} en efectivo y {formatoColones(t.sinpe)} por SINPE.
        </p>
      )}
      {t.premiosGanados > 0 && (
        <p className="flex items-center justify-center gap-2 text-lg font-bold text-jade">
          <Trophy aria-hidden className="h-6 w-6" />
          {t.premiosGanados === 1 ? 'Ganó 1 premio' : `Ganó ${t.premiosGanados} premios`}
        </p>
      )}

      <section>
        <h2 className="mb-3 text-xl font-extrabold">Rifas en las que participó</h2>
        {participaciones.length === 0 ? (
          <p className="tarjeta text-center text-lg text-tinta/70">Todavía no ha comprado números.</p>
        ) : (
          <ul className="space-y-3">
            {participaciones.map((p) => (
              <Participacion key={p.rifa.id} p={p} cliente={cliente} />
            ))}
          </ul>
        )}
      </section>

      {editando && <HojaEditar cliente={cliente} onCerrar={() => setEditando(false)} />}
    </div>
  );
}

function Dato({ titulo, valor, color = '' }) {
  return (
    <div className="tarjeta">
      <p className="text-base text-tinta/70">{titulo}</p>
      <p className={`font-titulo text-2xl font-extrabold tabular-nums ${color}`}>{valor}</p>
    </div>
  );
}

function Participacion({ p, cliente }) {
  const ajustes = useAjustes();
  const queryClient = useQueryClient();
  const { rifa } = p;
  const [texto, clase] = etiquetas[rifa.estado] ?? etiquetas.borrador;
  const recordadoHoy = p.ultimoRecordatorio && esHoy(p.ultimoRecordatorio);

  const recordar = useMutation({
    mutationFn: () => pedir('/admin/recordatorios', { metodo: 'POST', datos: { clienteId: cliente.id, rifaId: rifa.id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  return (
    <li className="tarjeta">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/admin/rifas/${rifa.id}`} className="text-lg font-extrabold underline-offset-4 hover:underline">
            {rifa.titulo}
          </Link>
          {rifa.fechaSorteo && <p className="text-base text-tinta/60">Sorteo: {formatoFecha(rifa.fechaSorteo)}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-3 py-0.5 text-base font-bold ${clase}`}>{texto}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {p.numeros.map((n) => (
          <span
            key={n.numero}
            title={n.estado === 'pagado' ? 'Pagado' : `Debe ${formatoColones(n.saldo)}`}
            className={`rounded-lg border-2 px-2 py-0.5 text-base font-bold tabular-nums ${
              n.estado === 'pagado'
                ? 'border-jade bg-jade text-sobrejade'
                : 'border-mango bg-mango-claro text-amber-900 dark:text-amber-200'
            }`}
          >
            {n.numero}
            {n.estado === 'pagado' ? ' ✓' : ''}
          </span>
        ))}
      </div>

      <p className="mt-2 text-base">
        Pagó <strong className="text-jade">{formatoColones(p.pagado)}</strong>
        {p.debe > 0 && (
          <>
            {' · '}Debe <strong className="text-amber-700 dark:text-amber-400">{formatoColones(p.debe)}</strong>
          </>
        )}
      </p>

      {p.premiosGanados.map((premio) => (
        <p key={premio.lugar} className="mt-2 flex items-center gap-2 rounded-xl bg-jade-claro px-3 py-2 text-base font-bold text-jade">
          <Medalla lugar={premio.lugar} /> Ganó el {nombreLugar(premio.lugar)} con el {premio.numeroGanador}: {premio.descripcion}
        </p>
      ))}

      {p.debe > 0 && (
        <>
          <BotonWhatsApp
            telefono={cliente.telefono}
            mensaje={mensajeRecordatorio({
              nombre: cliente.nombre,
              debe: p.debe,
              numeros: p.numeros.filter((n) => n.saldo > 0).map((n) => n.numero),
              rifa,
            }, ajustes.mensajeRecordatorio)}
            onClick={() => recordar.mutate()}
            className="mt-3 w-full"
          >
            Recordar por WhatsApp
          </BotonWhatsApp>
          {p.ultimoRecordatorio && (
            <p className="mt-1 text-center text-base text-tinta/60">
              {recordadoHoy ? 'Ya se le recordó hoy' : `Último recordatorio: ${formatoFechaCorta(p.ultimoRecordatorio)}`}
            </p>
          )}
        </>
      )}
    </li>
  );
}

function HojaEditar({ cliente, onCerrar }) {
  const queryClient = useQueryClient();
  const avisar = useAvisos();
  const [nombre, setNombre] = useState(cliente.nombre);
  const [telefono, setTelefono] = useState(formatoTelefono(cliente.telefono));
  const [notas, setNotas] = useState(cliente.notas ?? '');

  const guardar = useMutation({
    mutationFn: () => pedir(`/admin/clientes/${cliente.id}`, { metodo: 'PATCH', datos: { nombre, telefono, notas } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      avisar('Datos guardados');
      onCerrar();
    },
    onError: (error) => avisar(error.message, 'error'),
  });

  return (
    <HojaInferior titulo="Corregir datos" onCerrar={onCerrar}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          guardar.mutate();
        }}
      >
        <div>
          <label className="etiqueta" htmlFor="nombre">Nombre</label>
          <input id="nombre" className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="telefono">Teléfono</label>
          <input
            id="telefono"
            className="campo tabular-nums"
            inputMode="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <label className="etiqueta" htmlFor="notas">Notas (opcional)</label>
          <textarea
            id="notas"
            className="campo min-h-24 py-3"
            placeholder="Ej.: paga los viernes, es vecina de la iglesia"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            maxLength={300}
          />
        </div>
        <button type="submit" className="btn-primario w-full" disabled={guardar.isPending}>
          {guardar.isPending ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </HojaInferior>
  );
}
