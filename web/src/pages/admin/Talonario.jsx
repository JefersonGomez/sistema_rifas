import { useState } from 'react';
import { Link } from 'react-router';
import { Share2, X } from 'lucide-react';
import { useRifas, useTalonario, useAjustes } from '../../hooks/useRifas.js';
import Cuadricula from '../../components/Cuadricula.jsx';
import BotonWhatsApp from '../../components/BotonWhatsApp.jsx';
import { temaDe } from '../../utils/temas.js';
import { formatoColones, unirLista } from '../../utils/formato.js';
import { mensajeCompartirLibres } from '../../utils/mensajesWhatsApp.js';
import HojaBoleto from './HojaBoleto.jsx';
import HojaVender from './HojaVender.jsx';

export default function Talonario() {
  const ajustes = useAjustes();
  const { activa, isPending } = useRifas();
  const talonarioQ = useTalonario(activa?.id);
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [abierto, setAbierto] = useState(null); // número con comprador que se está viendo
  const [vendiendo, setVendiendo] = useState(false);

  if (isPending) return <p className="py-10 text-center text-lg">Cargando…</p>;
  if (!activa) {
    return (
      <section className="tarjeta p-6 text-center">
        <p className="text-lg">No hay una rifa publicada para vender números.</p>
        <Link to="/admin/rifas" className="btn-primario mt-4 w-full">Ir a mis rifas</Link>
      </section>
    );
  }
  if (talonarioQ.isError) return <p className="py-10 text-center text-lg text-coral">{talonarioQ.error.message}</p>;
  if (!talonarioQ.data) return <p className="py-10 text-center text-lg">Cargando números…</p>;

  const { numeros, resumen, rifa } = talonarioQ.data;
  const libres = numeros.filter((n) => !n.boleto).map((n) => n.numero);
  const elegidos = [...seleccion].filter((n) => libres.includes(n)).sort();
  const itemAbierto = abierto && numeros.find((n) => n.numero === abierto && n.boleto);

  const tocarLibre = (numero) =>
    setSeleccion((prev) => {
      const nueva = new Set(prev);
      nueva.has(numero) ? nueva.delete(numero) : nueva.add(numero);
      return nueva;
    });

  const celdas = numeros.map(({ numero, boleto }) =>
    boleto
      ? { numero, estado: boleto.estado, onClick: () => setAbierto(numero) }
      : { numero, estado: seleccion.has(numero) ? 'elegido' : 'libre', onClick: () => tocarLibre(numero) },
  );

  return (
    <div className={elegidos.length ? 'pb-36 md:pb-24' : ''}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-titulo text-3xl font-extrabold">Talonario</h1>
          <p className="text-lg">{rifa.titulo}</p>
        </div>
        <BotonWhatsApp mensaje={mensajeCompartirLibres(rifa, libres, ajustes.mensajeLibres)} className="shrink-0 px-3 text-base">
          <span className="sr-only">Compartir números libres</span>
          <Share2 aria-hidden className="-ml-1 h-5 w-5" />
          <span className="hidden sm:inline">Compartir libres</span>
        </BotonWhatsApp>
      </header>

      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <Conteo valor={libres.length} texto="Libres" clase="border-2 border-jade bg-superficie" />
        <Conteo valor={resumen.vendidos - resumen.pagados} texto="Apartados" clase="border-2 border-mango bg-mango-claro" />
        <Conteo valor={resumen.pagados} texto="Pagados" clase="bg-jade text-sobrejade" />
      </div>
      <p className="mb-3 text-center text-base text-tinta/70">
        Toque un número libre para venderlo, o uno ocupado para ver quién lo tiene.
      </p>

      <Cuadricula celdas={celdas} tema={{ fuente: temaDe(rifa).fuente }} />

      {elegidos.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-tinta/5 bg-superficie/95 backdrop-blur md:bottom-0 md:left-64">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
            <p className="min-w-0 flex-1 text-lg">
              <strong className="tabular-nums">{unirLista(elegidos)}</strong>
              <br />
              <span className="text-base">{formatoColones(elegidos.length * rifa.precioNumero)}</span>
            </p>
            <button type="button" className="btn px-3 text-tinta/70" onClick={() => setSeleccion(new Set())} aria-label="Quitar selección">
              <X className="h-6 w-6" />
            </button>
            <button type="button" className="btn-primario shrink-0" onClick={() => setVendiendo(true)}>
              Vender {elegidos.length === 1 ? 'número' : `${elegidos.length} números`}
            </button>
          </div>
        </div>
      )}

      {vendiendo && (
        <HojaVender
          rifa={rifa}
          numeros={elegidos}
          onCerrar={() => setVendiendo(false)}
          onVendido={() => {
            setVendiendo(false);
            setSeleccion(new Set());
          }}
        />
      )}
      {itemAbierto && <HojaBoleto rifa={rifa} item={itemAbierto} onCerrar={() => setAbierto(null)} />}
    </div>
  );
}

function Conteo({ valor, texto, clase }) {
  return (
    <div className={`rounded-xl px-2 py-2 ${clase}`}>
      <p className="font-titulo text-2xl font-extrabold tabular-nums leading-none">{valor}</p>
      <p className="text-base font-bold">{texto}</p>
    </div>
  );
}
