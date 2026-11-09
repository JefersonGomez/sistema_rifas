import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Banknote, ChartColumn, Smartphone } from 'lucide-react';
import { pedir } from '../../api/cliente.js';
import BarraAvance from '../../components/BarraAvance.jsx';
import { formatoColones } from '../../utils/formato.js';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

// "Rifa de la Freidora de aire" → "Freidora de aire"
const nombreCorto = (titulo) => {
  const sinRifa = titulo.replace(/^rifa\s+(de\s+la|de\s+las|de\s+los|del|de)?\s*/i, '');
  return sinRifa.charAt(0).toUpperCase() + sinRifa.slice(1);
};

// ₡32 000 → "₡32 mil", ₡1 250 000 → "₡1,3 M"
const colonesCorto = (v) =>
  Math.abs(v) >= 1_000_000 ? `₡${(v / 1_000_000).toLocaleString('es-CR', { maximumFractionDigits: 1 })} M`
  : Math.abs(v) >= 1000 ? `₡${Math.round(v / 1000)} mil`
  : formatoColones(v);

// Globo que aparece al tocar una barra.
const estiloGlobo = {
  contentStyle: {
    background: 'rgb(var(--superficie))',
    border: '1px solid rgb(var(--tinta) / 0.1)',
    borderRadius: 12,
    color: 'rgb(var(--tinta))',
    fontSize: 16,
  },
  itemStyle: { color: 'rgb(var(--tinta))' },
  cursor: { className: 'fill-tinta/5' },
};

// Métricas del año: cuánto entró, cuánto se ganó, quién compra más y qué números piden.
export default function Metricas() {
  const [anio, setAnio] = useState(null);
  const q = useQuery({
    queryKey: ['admin', 'metricas', anio],
    queryFn: () => pedir(`/admin/metricas${anio ? `?anio=${anio}` : ''}`),
    placeholderData: (anterior) => anterior,
  });

  if (q.isPending) return <p className="py-10 text-center text-lg">Cargando métricas…</p>;
  if (q.isError) return <p className="py-10 text-center text-lg text-coral">{q.error.message}</p>;

  const { totales: t, porRifa, porMes, frecuentes, numeros, anios } = q.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-titulo text-3xl font-extrabold">Métricas</h1>
          <p className="text-lg text-tinta/70">Rifas publicadas y finalizadas del año.</p>
        </div>
        {anios.length > 1 && (
          <label className="flex items-center gap-2 text-base font-bold">
            Año
            <select className="campo w-auto" value={q.data.anio} onChange={(e) => setAnio(Number(e.target.value))}>
              {anios.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {t.rifas === 0 ? (
        <div className="tarjeta p-8 text-center">
          <ChartColumn aria-hidden className="mx-auto h-12 w-12 text-tinta/30" />
          <p className="mt-2 text-lg">Las métricas aparecen cuando publique la primera rifa.</p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3">
            <Dato titulo={`Recaudado ${q.data.anio}`} valor={formatoColones(t.cobrado)} color="text-jade" />
            <Dato
              titulo="Ganancia"
              valor={formatoColones(t.ganancia)}
              color={t.ganancia < 0 ? 'text-coral' : 'text-jade'}
              nota={`Premios: ${formatoColones(t.costoPremios)}`}
            />
            <Dato titulo="Números vendidos" valor={t.vendidos} nota={t.rifas === 1 ? 'En 1 rifa' : `En ${t.rifas} rifas`} />
            <Dato
              titulo="Por cobrar"
              valor={formatoColones(t.pendiente)}
              color={t.pendiente ? 'text-amber-700 dark:text-amber-400' : ''}
            />
          </section>

          <GananciaPorRifa porRifa={porRifa} />
          <CobradoPorMes porMes={porMes} />
          <EfectivoSinpe efectivo={t.efectivo} sinpe={t.sinpe} />
          <TiempoDeVenta porRifa={porRifa} />
          <Frecuentes lista={frecuentes} />
          <NumerosPedidos numeros={numeros} />
        </>
      )}
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

function Seccion({ titulo, ayuda, children }) {
  return (
    <section className="tarjeta">
      <h2 className="text-lg font-extrabold">{titulo}</h2>
      {ayuda && <p className="text-base text-tinta/60">{ayuda}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

// Barras horizontales: lo que quedó de cada rifa después de pagar los premios.
function GananciaPorRifa({ porRifa }) {
  const datos = porRifa.map((r) => ({ ...r, nombre: nombreCorto(r.titulo) }));
  return (
    <Seccion titulo="Ganancia por rifa" ayuda="Recaudado menos lo que costaron los premios.">
      <div className="grafico" role="img" aria-label="Gráfico de ganancia por rifa">
        <ResponsiveContainer width="100%" height={datos.length * 56 + 16}>
          <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis type="number" hide domain={[(min) => Math.min(0, min), (max) => Math.max(0, max)]} />
            <YAxis
              type="category"
              dataKey="nombre"
              width={136}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v.length > 15 ? `${v.slice(0, 14)}…` : v)}
            />
            <ReferenceLine x={0} className="stroke-tinta/20" />
            <Tooltip {...estiloGlobo} formatter={(v) => [formatoColones(v), 'Ganancia']} />
            <Bar dataKey="ganancia" radius={6} barSize={28}>
              {datos.map((r) => (
                <Cell key={r.id} className={r.ganancia < 0 ? 'fill-coral' : 'fill-jade'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 divide-y divide-tinta/5">
        {datos.map((r) => (
          <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-3 py-2">
            <Link to={`/admin/rifas/${r.id}`} className="min-w-0 truncate text-base font-bold underline-offset-4 hover:underline">
              {r.nombre}
              {r.estado === 'activa' && <span className="font-normal text-tinta/60"> (en curso)</span>}
            </Link>
            <span className="ml-auto text-right text-base tabular-nums">
              <span className="text-tinta/60">{formatoColones(r.cobrado)} − {formatoColones(r.costoPremios)} = </span>
              <strong className={r.ganancia < 0 ? 'text-coral' : 'text-jade'}>{formatoColones(r.ganancia)}</strong>
            </span>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

// Columnas por mes: cuánto se cobró (según la fecha de cada pago).
function CobradoPorMes({ porMes }) {
  const conPagos = porMes.filter((m) => m.cobrado > 0).map((m) => m.mes);
  if (!conPagos.length) return null;
  // Del primer al último mes con pagos, y al menos 3 meses para que no quede una sola columna.
  const desde = Math.max(1, Math.min(Math.min(...conPagos), Math.max(...conPagos) - 2));
  const hasta = Math.max(...conPagos);
  const datos = porMes.slice(desde - 1, hasta).map((m) => ({ ...m, nombre: MESES[m.mes - 1] }));

  return (
    <Seccion titulo="Cobrado por mes">
      <div className="grafico" role="img" aria-label="Gráfico de lo cobrado por mes">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={datos} margin={{ top: 28, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="nombre" tickLine={false} axisLine={false} interval={0} />
            <YAxis hide />
            <Tooltip {...estiloGlobo} formatter={(v) => [formatoColones(v), 'Cobrado']} />
            <Bar
              dataKey="cobrado"
              className="fill-jade"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
              label={datos.length <= 6 ? { position: 'top', formatter: (v) => (v ? colonesCorto(v) : '') } : false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Seccion>
  );
}

// Dona: cuánto entró en efectivo y cuánto por SINPE.
function EfectivoSinpe({ efectivo, sinpe }) {
  const total = efectivo + sinpe;
  if (!total) return null;
  const pct = (v) => Math.round((v / total) * 100);
  const datos = [
    { nombre: 'Efectivo', valor: efectivo, clase: 'fill-mango' },
    { nombre: 'SINPE', valor: sinpe, clase: 'fill-jade' },
  ];
  return (
    <Seccion titulo="¿Cómo le pagaron?">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="grafico h-40 w-40 shrink-0" role="img" aria-label={`Efectivo ${pct(efectivo)} %, SINPE ${pct(sinpe)} %`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={datos} dataKey="valor" nameKey="nombre" innerRadius="58%" outerRadius="100%" stroke="none" startAngle={90} endAngle={-270}>
                {datos.map((d) => (
                  <Cell key={d.nombre} className={d.clase} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid w-full flex-1 grid-cols-2 gap-3">
          <Metodo icono={Banknote} nombre="Efectivo" monto={efectivo} pct={pct(efectivo)} punto="bg-mango" />
          <Metodo icono={Smartphone} nombre="SINPE" monto={sinpe} pct={pct(sinpe)} punto="bg-jade" />
        </div>
      </div>
    </Seccion>
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

// Cuántos números vendió cada rifa y en cuántos días (de la primera a la última venta).
function TiempoDeVenta({ porRifa }) {
  return (
    <Seccion titulo="¿Qué tan rápido se vendió?" ayuda="Días entre la primera y la última venta.">
      <ul className="space-y-4">
        {porRifa.map((r) => (
          <li key={r.id}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-base font-bold">{nombreCorto(r.titulo)}</span>
              <span className="shrink-0 text-base tabular-nums text-tinta/70">
                {r.vendidos} de 100
                {r.diasVendiendo !== null && ` · ${r.diasVendiendo === 1 ? '1 día' : `${r.diasVendiendo} días`}`}
              </span>
            </div>
            <BarraAvance vendidos={r.vendidos} className="mt-1" />
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

function Frecuentes({ lista }) {
  if (!lista.length) return null;
  return (
    <Seccion titulo="Clientes que más compran">
      <ol className="divide-y divide-tinta/5">
        {lista.map((c, i) => (
          <li key={c.id}>
            <Link to={`/admin/clientes/${c.id}`} className="flex min-h-12 items-center gap-3 py-2 hover:bg-tinta/5">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-titulo text-lg font-extrabold ${
                  i < 3 ? 'bg-mango text-[#1C2B2A]' : 'bg-tinta/10'
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-bold">{c.nombre}</span>
                <span className="block text-base text-tinta/60">
                  {c.numeros === 1 ? '1 número' : `${c.numeros} números`} · {c.rifas === 1 ? '1 rifa' : `${c.rifas} rifas`}
                </span>
              </span>
              <span className="shrink-0 text-base font-bold tabular-nums text-jade">{formatoColones(c.pagado)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </Seccion>
  );
}

// Cuadrícula 00–99: más oscuro = más veces lo compraron.
function NumerosPedidos({ numeros }) {
  const max = Math.max(...numeros.map((n) => n.veces));
  if (!max) return null;
  const top = [...numeros].sort((a, b) => b.veces - a.veces).filter((n) => n.veces > 0).slice(0, 5);
  return (
    <Seccion titulo="Números más pedidos" ayuda="Más oscuro = lo compraron en más rifas.">
      <p className="text-base">
        Los favoritos:{' '}
        {top.map((n, i) => (
          <span key={n.numero}>
            {i > 0 && ', '}
            <strong className="tabular-nums">{n.numero}</strong> ({n.veces === 1 ? '1 vez' : `${n.veces} veces`})
          </span>
        ))}
      </p>
      <div className="mt-3 grid grid-cols-10 gap-1" aria-hidden>
        {numeros.map((n) => {
          const nivel = n.veces / max;
          return (
            <div
              key={n.numero}
              title={`${n.numero}: ${n.veces === 1 ? '1 vez' : `${n.veces} veces`}`}
              className={`flex aspect-square items-center justify-center rounded-md text-base font-bold tabular-nums ${
                nivel > 0.5 ? 'text-sobrejade' : 'text-tinta/70'
              }`}
              style={{ backgroundColor: n.veces ? `rgb(var(--jade) / ${0.15 + nivel * 0.85})` : 'rgb(var(--tinta) / 0.05)' }}
            >
              {n.numero}
            </div>
          );
        })}
      </div>
    </Seccion>
  );
}
