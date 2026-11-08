import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Banknote, ChevronLeft, Download, Smartphone } from 'lucide-react';
import { pedir } from '../../api/cliente.js';
import Medalla from '../../components/Medalla.jsx';
import Opciones from '../../components/Opciones.jsx';
import BarraAvance from '../../components/BarraAvance.jsx';
import BotonWhatsApp from '../../components/BotonWhatsApp.jsx';
import { formatoColones, formatoFecha, formatoFechaCorta, formatoTelefono, nombreLugar } from '../../utils/formato.js';
import { mensajeRecordatorio } from '../../utils/mensajesWhatsApp.js';

const etiquetas = {
  borrador: ['Borrador', 'bg-tinta/10 text-tinta'],
  activa: ['Publicada', 'bg-jade text-sobrejade'],
  finalizada: ['Finalizada', 'bg-tinta text-arena'],
  cancelada: ['Cancelada', 'bg-coral/10 text-coral'],
};

// Historial completo de una rifa: totales, efectivo vs SINPE, compradores, deudas y pagos.
export default function RifaHistorial() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ['admin', 'historial', id], queryFn: () => pedir(`/admin/rifas/${id}/historial`) });
  const [vista, setVista] = useState('compradores');

  if (q.isPending) return <p className="py-10 text-center text-lg">Cargando historial…</p>;
  if (q.isError) return <p className="py-10 text-center text-lg text-coral">{q.error.message}</p>;

  const { rifa, resumen: r, compradores, pagos } = q.data;
  const deudores = compradores.filter((c) => c.debe > 0);
  const [texto, clase] = etiquetas[rifa.estado];

  return (
    <div className="space-y-5">
      <div>
        <Link to="/admin/rifas" className="btn -ml-3 px-3 text-base text-jade">
          <ChevronLeft aria-hidden className="h-5 w-5" /> Mis rifas
        </Link>
        <span className={`inline-block rounded-full px-3 py-0.5 text-base font-bold ${clase}`}>{texto}</span>
        <h1 className="mt-1 font-titulo text-3xl font-extrabold leading-tight">{rifa.titulo}</h1>
        <p className="text-lg text-tinta/70">
          {formatoColones(rifa.precioNumero)} el número
          {rifa.fechaSorteo && ` · Sorteo el ${formatoFecha(rifa.fechaSorteo)}`}
        </p>
      </div>

      {/* Premios y ganadores */}
      <section className="tarjeta">
        <h2 className="mb-2 text-lg font-extrabold">{rifa.estado === 'finalizada' ? 'Premios y ganadores' : 'Premios'}</h2>
        <ul className="space-y-2">
          {rifa.premios.map((p) => (
            <li key={p.lugar} className="flex items-center gap-3">
              <Medalla lugar={p.lugar} />
              <span className="min-w-0 flex-1 text-lg">
                {p.descripcion}
                {rifa.estado === 'finalizada' && (
                  <span className="block text-base">
                    {nombreLugar(p.lugar)}: número <strong className="tabular-nums">{p.numeroGanador}</strong> ·{' '}
                    {p.ganador ? <strong className="text-jade">{p.ganador.nombre}</strong> : <span className="text-tinta/60">sin ganador</span>}
                  </span>
                )}
              </span>
              {p.costo > 0 && <span className="shrink-0 text-base text-tinta/60">{formatoColones(p.costo)}</span>}
            </li>
          ))}
        </ul>
      </section>

      {/* Totales */}
      <section className="grid grid-cols-2 gap-3">
        <Dato titulo="Recaudado" valor={formatoColones(r.cobrado)} color="text-jade" />
        <Dato titulo="Quedó por cobrar" valor={formatoColones(r.pendiente)} color={r.pendiente ? 'text-amber-700 dark:text-amber-400' : ''} />
        <div className="tarjeta">
          <p className="text-base text-tinta/70">Vendidos</p>
          <p className="font-titulo text-2xl font-extrabold tabular-nums">{r.vendidos} de 100</p>
          <BarraAvance vendidos={r.vendidos} className="mt-2" />
        </div>
        <Dato
          titulo="Ganancia hasta hoy"
          valor={formatoColones(r.ganancia)}
          color={r.ganancia < 0 ? 'text-coral' : 'text-jade'}
          nota={r.pendiente > 0 ? `Si todos pagan: ${formatoColones(r.gananciaEsperada)}` : `Premios: ${formatoColones(r.costoPremios)}`}
        />
      </section>

      <EfectivoSinpe efectivo={r.efectivo} sinpe={r.sinpe} cantidad={r.cantidadPagos} />

      {r.primeraVenta && (
        <p className="text-center text-base text-tinta/60">
          Primera venta: {formatoFechaCorta(r.primeraVenta)} · Última: {formatoFechaCorta(r.ultimaVenta)}
        </p>
      )}

      {/* Detalle */}
      <section>
        <Opciones
          nombre="Ver"
          valor={vista}
          onCambiar={setVista}
          opciones={[
            { valor: 'compradores', texto: `Compraron (${compradores.length})` },
            { valor: 'deben', texto: `Deben (${deudores.length})` },
            { valor: 'pagos', texto: `Pagos (${pagos.length})` },
          ]}
        />
        <div className="mt-3">
          {vista === 'compradores' && <ListaCompradores lista={compradores} rifa={rifa} vacio="Todavía nadie ha comprado." />}
          {vista === 'deben' && <ListaCompradores lista={deudores} rifa={rifa} conRecordar vacio="¡Nadie debe nada!" />}
          {vista === 'pagos' && <ListaPagos pagos={pagos} />}
        </div>
      </section>

      <a href={`/api/admin/rifas/${rifa.id}/exportar`} download className="btn-secundario w-full">
        <Download aria-hidden className="h-5 w-5" /> Descargar lista (Excel)
      </a>
    </div>
  );
}

function Dato({ titulo, valor, color = '', nota }) {
  return (
    <div className="tarjeta">
      <p className="text-base text-tinta/70">{titulo}</p>
      <p className={`font-titulo text-2xl font-extrabold tabular-nums ${color}`}>{valor}</p>
      {nota && <p className="text-base text-tinta/60">{nota}</p>}
    </div>
  );
}

// Barra partida: cuánto entró en efectivo y cuánto por SINPE.
function EfectivoSinpe({ efectivo, sinpe, cantidad }) {
  const total = efectivo + sinpe;
  const pct = (v) => (total ? Math.round((v / total) * 100) : 0);
  return (
    <section className="tarjeta">
      <h2 className="text-lg font-extrabold">¿Cómo pagaron?</h2>
      <p className="text-base text-tinta/60">{cantidad === 1 ? '1 pago' : `${cantidad} pagos`} registrados</p>
      {total === 0 ? (
        <p className="mt-2 text-lg text-tinta/70">Todavía no hay pagos.</p>
      ) : (
        <>
          <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-tinta/10" role="img" aria-label={`Efectivo ${pct(efectivo)} %, SINPE ${pct(sinpe)} %`}>
            <div className="h-full bg-mango" style={{ width: `${pct(efectivo)}%` }} />
            <div className="h-full bg-jade" style={{ width: `${pct(sinpe)}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Metodo icono={Banknote} nombre="Efectivo" monto={efectivo} pct={pct(efectivo)} punto="bg-mango" />
            <Metodo icono={Smartphone} nombre="SINPE" monto={sinpe} pct={pct(sinpe)} punto="bg-jade" />
          </div>
        </>
      )}
    </section>
  );
}

function Metodo({ icono: Icono, nombre, monto, pct, punto }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-base font-bold">
        <span className={`h-3 w-3 rounded-full ${punto}`} aria-hidden />
        <Icono aria-hidden className="h-5 w-5" /> {nombre}
      </p>
      <p className="font-titulo text-xl font-extrabold tabular-nums">{formatoColones(monto)}</p>
      <p className="text-base text-tinta/60">{pct} %</p>
    </div>
  );
}

function ListaCompradores({ lista, rifa, conRecordar, vacio }) {
  if (!lista.length) return <p className="tarjeta text-center text-lg text-tinta/70">{vacio}</p>;
  return (
    <ul className="space-y-3">
      {lista.map((c) => (
        <li key={c.cliente.id} className="tarjeta">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link to={`/admin/clientes/${c.cliente.id}`} className="text-lg font-extrabold underline-offset-4 hover:underline">
                {c.cliente.nombre}
              </Link>
              <p className="tabular-nums text-tinta/60">{formatoTelefono(c.cliente.telefono)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-base">
                Pagó <strong className="text-jade">{formatoColones(c.pagado)}</strong>
              </p>
              {c.debe > 0 && (
                <p className="text-base">
                  Debe <strong className="text-amber-700 dark:text-amber-400">{formatoColones(c.debe)}</strong>
                </p>
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {c.numeros.map((n) => (
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
          {conRecordar && (
            <BotonWhatsApp
              telefono={c.cliente.telefono}
              mensaje={mensajeRecordatorio({
                nombre: c.cliente.nombre,
                debe: c.debe,
                numeros: c.numeros.filter((n) => n.saldo > 0).map((n) => n.numero),
                rifa,
              })}
              className="mt-3 w-full"
            >
              Recordar por WhatsApp
            </BotonWhatsApp>
          )}
        </li>
      ))}
    </ul>
  );
}

function ListaPagos({ pagos }) {
  if (!pagos.length) return <p className="tarjeta text-center text-lg text-tinta/70">Todavía no hay pagos.</p>;
  return (
    <ul className="divide-y divide-tinta/5 overflow-hidden rounded-2xl bg-superficie shadow-sm">
      {pagos.map((p) => (
        <li key={p.id} className="flex items-center gap-3 px-4 py-3">
          {p.metodo === 'sinpe' ? (
            <Smartphone aria-label="SINPE" className="h-5 w-5 shrink-0 text-jade" />
          ) : (
            <Banknote aria-label="Efectivo" className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg">
              <strong className="tabular-nums">{p.numero}</strong> · {p.cliente}
            </p>
            <p className="text-base text-tinta/60">
              {formatoFechaCorta(p.fecha)} · {p.metodo === 'sinpe' ? 'SINPE' : 'Efectivo'}
              {p.referencia && ` · Ref. ${p.referencia}`}
            </p>
          </div>
          <p className="shrink-0 text-lg font-extrabold tabular-nums">{formatoColones(p.monto)}</p>
        </li>
      ))}
    </ul>
  );
}
