import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Gift, Ticket, Trophy, Wallet, X } from 'lucide-react';
import { pedir } from '../../api/cliente.js';
import Cuadricula from '../../components/Cuadricula.jsx';
import BotonWhatsApp from '../../components/BotonWhatsApp.jsx';
import { formatoColones, formatoFecha, formatoTelefono, unirLista } from '../../utils/formato.js';
import { mensajeApartar } from '../../utils/mensajesWhatsApp.js';

export default function RifaPublica() {
  const rifaQ = useQuery({ queryKey: ['public', 'rifa'], queryFn: () => pedir('/public/rifa') });
  const rifa = rifaQ.data?.rifa;

  if (rifaQ.isPending) return <Cargando />;
  if (rifaQ.isError) return <ErrorCarga mensaje={rifaQ.error.message} onReintentar={rifaQ.refetch} />;
  if (!rifa) return <SinRifaActiva />;
  return <RifaActiva rifa={rifa} />;
}

function RifaActiva({ rifa }) {
  const numerosQ = useQuery({
    queryKey: ['public', 'numeros'],
    queryFn: () => pedir('/public/rifa/numeros'),
    refetchInterval: 60_000, // la lista se mantiene al día sola
  });
  const [seleccion, setSeleccion] = useState(() => new Set());

  // Si alguien aparta un número mientras el cliente lo tenía elegido, se quita de la selección.
  const elegidos = useMemo(() => {
    const libres = new Set(numerosQ.data?.numeros.filter((n) => n.estado === 'libre').map((n) => n.numero));
    return new Set([...seleccion].filter((n) => libres.has(n)));
  }, [seleccion, numerosQ.data]);
  const listaElegidos = [...elegidos].sort();

  const tocar = (numero) =>
    setSeleccion((prev) => {
      const nueva = new Set(prev);
      nueva.has(numero) ? nueva.delete(numero) : nueva.add(numero);
      return nueva;
    });

  return (
    <main className={`mx-auto max-w-xl px-4 pt-6 ${listaElegidos.length ? 'pb-56' : 'pb-10'}`}>
      <Premio rifa={rifa} />

      <section className="mt-6">
        {numerosQ.isError ? (
          <ErrorCarga mensaje={numerosQ.error.message} onReintentar={numerosQ.refetch} />
        ) : !numerosQ.data ? (
          <p className="py-10 text-center text-lg">Cargando números…</p>
        ) : (
          <>
            <p className="text-center font-titulo text-3xl font-extrabold">
              {numerosQ.data.libres === 0 ? (
                '¡Todos los números se vendieron!'
              ) : (
                <>
                  Quedan <span className="text-jade">{numerosQ.data.libres}</span>{' '}
                  {numerosQ.data.libres === 1 ? 'número' : 'números'}
                </>
              )}
            </p>
            <p className="mb-4 mt-1 text-center text-lg">Toque los números que quiere y apártelos por WhatsApp.</p>
            <Leyenda />
            <Cuadricula numeros={numerosQ.data.numeros} elegidos={elegidos} onTocar={tocar} />
          </>
        )}
      </section>

      {rifa.sinpeNumero && (
        <p className="mt-6 text-center text-lg">
          <Wallet aria-hidden className="mr-2 inline h-5 w-5 align-[-3px] text-jade" />
          Puede pagar por SINPE Móvil al <strong className="tabular-nums">{formatoTelefono(rifa.sinpeNumero)}</strong>
        </p>
      )}

      {listaElegidos.length > 0 && (
        <BarraApartar rifa={rifa} numeros={listaElegidos} onLimpiar={() => setSeleccion(new Set())} />
      )}
    </main>
  );
}

function Premio({ rifa }) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
      {rifa.fotoUrl ? (
        <img src={rifa.fotoUrl} alt={rifa.premio} className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="flex aspect-[2/1] items-center justify-center bg-jade-claro">
          <Gift aria-hidden className="h-20 w-20 text-jade" strokeWidth={1.5} />
        </div>
      )}
      <div className="p-5">
        <p className="text-base font-bold uppercase tracking-wide text-jade">{rifa.titulo}</p>
        <h1 className="mt-1 font-titulo text-4xl font-extrabold leading-tight">{rifa.premio}</h1>
        {rifa.descripcion && <p className="mt-2 text-lg">{rifa.descripcion}</p>}

        <ul className="mt-4 space-y-2 text-lg">
          <Dato icono={Ticket}>
            <strong>{formatoColones(rifa.precioNumero)}</strong> el número
          </Dato>
          {rifa.fechaSorteo && (
            <Dato icono={CalendarDays}>
              Sorteo el <strong>{formatoFecha(rifa.fechaSorteo)}</strong>
            </Dato>
          )}
          {rifa.reglaGanador && <Dato icono={Trophy}>{rifa.reglaGanador}</Dato>}
        </ul>
      </div>
    </section>
  );
}

function Dato({ icono: Icono, children }) {
  return (
    <li className="flex items-start gap-3">
      <Icono aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-jade" />
      <span>{children}</span>
    </li>
  );
}

function Leyenda() {
  const item = (clase, texto) => (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-5 w-5 rounded ${clase}`} aria-hidden />
      {texto}
    </span>
  );
  return (
    <div className="mb-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-base">
      {item('border-2 border-jade bg-white', 'Libre')}
      {item('bg-jade', 'Elegido')}
      {item('bg-gray-200', 'Ocupado')}
    </div>
  );
}

function BarraApartar({ rifa, numeros, onLimpiar }) {
  const total = numeros.length * rifa.precioNumero;
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-black/5 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="mx-auto max-w-xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="text-lg">
            {numeros.length === 1 ? 'Número' : 'Números'}{' '}
            <strong className="tabular-nums">{unirLista(numeros)}</strong>
            <br />
            Total: <strong>{formatoColones(total)}</strong>
          </p>
          <button
            type="button"
            onClick={onLimpiar}
            className="flex min-h-12 shrink-0 items-center gap-1 rounded-xl px-3 text-base font-bold text-tinta/70 hover:bg-black/5"
          >
            <X aria-hidden className="h-5 w-5" /> Quitar
          </button>
        </div>
        {rifa.whatsapp ? (
          <BotonWhatsApp telefono={rifa.whatsapp} mensaje={mensajeApartar(numeros, rifa.titulo)}>
            Apartar por WhatsApp
          </BotonWhatsApp>
        ) : (
          <p className="text-center text-lg">Escríbale a quien organiza la rifa para apartarlos.</p>
        )}
      </div>
    </div>
  );
}

function SinRifaActiva() {
  const ganadorQ = useQuery({ queryKey: ['public', 'ganador'], queryFn: () => pedir('/public/rifa/ganador') });
  const resultado = ganadorQ.data?.resultado;

  return (
    <main className="mx-auto max-w-xl px-4 py-10 text-center">
      {resultado && (
        <section className="mb-10 rounded-3xl bg-white p-6 shadow-sm">
          <Trophy aria-hidden className="mx-auto h-12 w-12 text-mango" />
          <p className="mt-2 text-lg">{resultado.titulo}</p>
          <h1 className="mt-1 font-titulo text-2xl font-extrabold">Número ganador</h1>
          <p className="my-3 font-titulo text-8xl font-extrabold tabular-nums text-jade">{resultado.numeroGanador}</p>
          {resultado.fechaSorteo && <p className="text-lg">Sorteo del {formatoFecha(resultado.fechaSorteo)}</p>}
          <p className="mt-3 text-lg font-bold">
            {resultado.hayGanador
              ? `¡Felicidades a la persona ganadora del premio: ${resultado.premio}!`
              : 'Ese número no se vendió: esta vez no hubo ganador.'}
          </p>
        </section>
      )}
      <Gift aria-hidden className="mx-auto h-14 w-14 text-jade" strokeWidth={1.5} />
      <p className="mt-3 font-titulo text-3xl font-extrabold">Pronto una nueva rifa</p>
      <p className="mt-2 text-lg">Vuelva a visitar esta página en unos días.</p>
    </main>
  );
}

function Cargando() {
  return <p className="py-20 text-center text-lg">Cargando la rifa…</p>;
}

function ErrorCarga({ mensaje, onReintentar }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-lg">{mensaje}</p>
      <button
        type="button"
        onClick={() => onReintentar()}
        className="mt-4 min-h-12 rounded-xl bg-jade px-6 text-lg font-bold text-white"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
