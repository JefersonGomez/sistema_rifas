import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Gift, Ticket, Trophy, Wallet, X } from 'lucide-react';
import { pedir } from '../../api/cliente.js';
import Cuadricula from '../../components/Cuadricula.jsx';
import BotonWhatsApp from '../../components/BotonWhatsApp.jsx';
import Logo, { Marca } from '../../components/Logo.jsx';
import BarraAvance from '../../components/BarraAvance.jsx';
import { temaDe } from '../../utils/temas.js';
import Medalla from '../../components/Medalla.jsx';
import { formatoColones, formatoFecha, formatoTelefono, nombreLugar, unirLista } from '../../utils/formato.js';
import { mensajeApartar } from '../../utils/mensajesWhatsApp.js';

export default function RifaPublica() {
  const rifaQ = useQuery({ queryKey: ['public', 'rifa'], queryFn: () => pedir('/public/rifa') });
  const rifa = rifaQ.data?.rifa;

  // Barra del navegador del celular del mismo color que el fondo.
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#12312D');
  }, []);

  return (
    // Fondo oscuro; las tarjetas blancas llevan la clase "clara" (ver index.css).
    <div className="publica-oscura min-h-dvh bg-pino text-tinta">
      <header className="mx-auto flex max-w-xl justify-center px-4 pt-5 md:max-w-6xl md:justify-start lg:px-8">
        <Marca />
      </header>
      {rifaQ.isPending ? (
        <Cargando />
      ) : rifaQ.isError ? (
        <ErrorCarga mensaje={rifaQ.error.message} onReintentar={rifaQ.refetch} />
      ) : rifa ? (
        <RifaActiva rifa={rifa} />
      ) : (
        <SinRifaActiva />
      )}
    </div>
  );
}

function RifaActiva({ rifa }) {
  const numerosQ = useQuery({
    queryKey: ['public', 'numeros'],
    queryFn: () => pedir('/public/rifa/numeros'),
    refetchInterval: 60_000, // la lista se mantiene al día sola
  });
  const [seleccion, setSeleccion] = useState(() => new Set());
  const tema = temaDe(rifa);

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

  const celdas = numerosQ.data?.numeros.map(({ numero, estado }) =>
    estado === 'ocupado'
      ? { numero, estado }
      : { numero, estado: elegidos.has(numero) ? 'elegido' : 'libre', onClick: () => tocar(numero) },
  );

  return (
    // Celular: uno debajo del otro. Desde tablet: la rifa a la izquierda y el talonario a la derecha.
    <main
      className={`mx-auto max-w-xl px-4 pt-4 md:grid md:max-w-6xl md:grid-cols-[5fr_6fr] md:items-start md:gap-8 md:pt-6 lg:px-8 ${
        listaElegidos.length ? 'pb-56 md:pb-10' : 'pb-10'
      }`}
    >
      <div className="md:sticky md:top-6">
        <Premio rifa={rifa} />
      </div>

      <section className="clara mt-5 rounded-3xl bg-white px-3 py-5 text-tinta shadow-lg md:mt-0 md:p-6" aria-label="Talonario">
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
            <BarraAvance vendidos={100 - numerosQ.data.libres} className="mx-auto mt-3 max-w-xs" />
            <p className="mt-1 text-center text-base text-tinta/70">{100 - numerosQ.data.libres} de 100 vendidos</p>
            <p className="mb-4 mt-3 text-center text-lg">Toque los números que quiere y apártelos por WhatsApp.</p>
            <Leyenda tema={tema} />
            <Cuadricula celdas={celdas} tema={tema} />
          </>
        )}

        {rifa.sinpeNumero && (
          <p className="mt-6 text-center text-lg">
            <Wallet aria-hidden className="mr-2 inline h-5 w-5 align-[-3px] text-jade" />
            Puede pagar por SINPE Móvil al <strong className="tabular-nums">{formatoTelefono(rifa.sinpeNumero)}</strong>
          </p>
        )}

        {listaElegidos.length > 0 && (
          <BarraApartar rifa={rifa} numeros={listaElegidos} onLimpiar={() => setSeleccion(new Set())} />
        )}
      </section>
    </main>
  );
}

function Premio({ rifa }) {
  const [principal, ...otros] = rifa.premios;
  return (
    <section className="clara overflow-hidden rounded-3xl bg-white text-tinta shadow-lg">
      <div className="relative">
        {rifa.fotoUrl ? (
          // La foto se ve completa (sin recortes) sea horizontal o vertical. El espacio que sobra
          // se rellena con la misma foto difuminada, así el cuadro nunca queda con franjas vacías.
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-tinta/10">
            <img src={rifa.fotoUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl" />
            <img
              src={rifa.fotoUrl}
              alt={principal?.descripcion ?? rifa.titulo}
              className="relative h-full w-full object-contain drop-shadow-xl"
            />
          </div>
        ) : (
          // Sin foto: la tómbola girando sobre un fondo alegre.
          <div className="flex aspect-[2/1] items-center justify-center bg-gradient-to-br from-jade-claro via-white to-mango-claro">
            <Logo className="h-32 w-32 drop-shadow-sm" />
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-tinta/85 px-4 py-1.5 text-lg font-extrabold text-white shadow-lg backdrop-blur">
          {formatoColones(rifa.precioNumero)}
        </span>
      </div>
      <div className="p-5">
        <p className="text-base font-bold uppercase tracking-wide text-jade">{rifa.titulo}</p>
        {otros.length > 0 && (
          <p className="mt-2 flex items-center gap-2 text-lg font-bold">
            <Medalla lugar={1} className="h-7 w-7 text-sm" /> {nombreLugar(1)}
          </p>
        )}
        <h1 className="mt-1 font-titulo text-4xl font-extrabold leading-tight">{principal?.descripcion}</h1>
        {rifa.descripcion && <p className="mt-2 text-lg">{rifa.descripcion}</p>}

        {otros.length > 0 && (
          <ul className="mt-4 space-y-2 rounded-2xl bg-arena p-3">
            {otros.map((p) => (
              <li key={p.lugar} className="flex items-center gap-3 text-lg">
                <Medalla lugar={p.lugar} />
                <span>
                  <span className="font-bold">{nombreLugar(p.lugar)}:</span> {p.descripcion}
                </span>
              </li>
            ))}
          </ul>
        )}

        <ul className="mt-4 space-y-2 text-lg">
          <Dato icono={Ticket}>
            <strong>{formatoColones(rifa.precioNumero)}</strong> el número
          </Dato>
          {rifa.fechaSorteo && (
            <Dato icono={CalendarDays}>
              Sorteo el <strong>{formatoFecha(rifa.fechaSorteo)}</strong>
            </Dato>
          )}
          <Dato icono={Trophy}>
            {rifa.premios.length === 1
              ? 'Gana el número del primer premio de la Lotería Nacional.'
              : 'Cada premio lo gana el número del mismo premio de la Lotería Nacional.'}
            {rifa.reglaGanador && <span className="block text-base text-tinta/70">{rifa.reglaGanador}</span>}
          </Dato>
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

function Leyenda({ tema }) {
  const item = (clase, texto) => (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-5 w-5 border-2 ${clase}`} aria-hidden />
      {texto}
    </span>
  );
  return (
    <div className="mb-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-base">
      {item(`rounded bg-white ${tema.color.libre}`, 'Libre')}
      {item(`rounded-full ${tema.color.elegido}`, 'Elegido')}
      {item('rounded border-transparent bg-gray-200', 'Ocupado')}
    </div>
  );
}

function BarraApartar({ rifa, numeros, onLimpiar }) {
  const total = numeros.length * rifa.precioNumero;
  return (
    <div className="clara fixed inset-x-0 bottom-0 z-10 animate-subir border-t border-black/5 bg-white/95 text-tinta shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur md:sticky md:bottom-4 md:mt-5 md:rounded-2xl md:border md:shadow-xl">
      <div className="mx-auto max-w-xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:pb-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="text-lg">
            {numeros.length === 1 ? 'Número' : 'Números'} <strong className="tabular-nums">{unirLista(numeros)}</strong>
            <br />
            Total: <strong>{formatoColones(total)}</strong>
          </p>
          <button type="button" onClick={onLimpiar} className="btn shrink-0 px-3 text-base text-tinta/70 hover:bg-black/5">
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
    <main className="mx-auto max-w-xl px-4 py-8 text-center">
      {resultado && (
        <section className="clara mb-5 rounded-3xl bg-white p-6 text-tinta shadow-lg">
          <Trophy aria-hidden className="mx-auto h-12 w-12 text-mango" />
          <p className="mt-2 text-lg">{resultado.titulo}</p>
          <h1 className="mt-1 font-titulo text-3xl font-extrabold">
            {resultado.premios.length === 1 ? 'Número ganador' : 'Números ganadores'}
          </h1>
          {resultado.fechaSorteo && <p className="text-lg">Sorteo del {formatoFecha(resultado.fechaSorteo)}</p>}

          <ul className="mt-5 space-y-3 text-left">
            {resultado.premios.map((p) => (
              <li key={p.lugar} className="flex items-center gap-4 rounded-2xl bg-arena p-3">
                <span className="w-20 shrink-0 text-center font-titulo text-5xl font-extrabold tabular-nums text-jade">
                  {p.numeroGanador}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-lg font-extrabold">
                    <Medalla lugar={p.lugar} className="h-6 w-6 text-sm" /> {nombreLugar(p.lugar)}
                  </span>
                  <span className="block text-lg">{p.descripcion}</span>
                  <span className={`block text-base ${p.hayGanador ? 'font-bold text-jade' : 'text-tinta/60'}`}>
                    {p.hayGanador ? '¡Tiene ganador!' : 'Ese número no se vendió: sin ganador.'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="clara rounded-3xl bg-white p-6 text-tinta shadow-lg">
        <Gift aria-hidden className="mx-auto h-14 w-14 text-jade" strokeWidth={1.5} />
        <p className="mt-3 font-titulo text-3xl font-extrabold">Pronto una nueva rifa</p>
        <p className="mt-2 text-lg">Vuelva a visitar esta página en unos días.</p>
      </section>
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
      <button type="button" onClick={() => onReintentar()} className="btn-primario mt-4">
        Intentar de nuevo
      </button>
    </div>
  );
}
