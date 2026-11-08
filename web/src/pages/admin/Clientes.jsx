import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Search, Users } from 'lucide-react';
import { pedir } from '../../api/cliente.js';
import Opciones from '../../components/Opciones.jsx';
import { formatoColones, formatoTelefono } from '../../utils/formato.js';

// "José Pérez" → "jose perez", para buscar sin importar tildes ni mayúsculas.
const sinTildes = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const ordenes = {
  frecuentes: (a, b) => b.numeros - a.numeros || b.pagado - a.pagado,
  deben: (a, b) => b.debe - a.debe,
  nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
};

// Lista de todas las personas que le han comprado a mamá, con buscador.
export default function Clientes() {
  const q = useQuery({ queryKey: ['admin', 'clientes', 'todos'], queryFn: () => pedir('/admin/clientes/todos') });
  const [buscar, setBuscar] = useState('');
  const [orden, setOrden] = useState('frecuentes');

  const lista = useMemo(() => {
    const todos = q.data?.clientes ?? [];
    const texto = sinTildes(buscar.trim());
    const digitos = buscar.replace(/\D/g, '');
    const filtrados = texto
      ? todos.filter((c) => sinTildes(c.nombre).includes(texto) || (digitos.length >= 3 && c.telefono.includes(digitos)))
      : todos;
    const base = orden === 'deben' ? filtrados.filter((c) => c.debe > 0) : filtrados;
    return [...base].sort(ordenes[orden]);
  }, [q.data, buscar, orden]);

  if (q.isPending) return <p className="py-10 text-center text-lg">Cargando clientes…</p>;
  if (q.isError) return <p className="py-10 text-center text-lg text-coral">{q.error.message}</p>;

  const total = q.data.clientes.length;

  return (
    <div>
      <h1 className="font-titulo text-3xl font-extrabold">Clientes</h1>
      <p className="text-lg text-tinta/70">
        {total === 1 ? '1 persona' : `${total} personas`} le han comprado. Los clientes se agregan al vender un número.
      </p>

      <label className="relative mt-4 block">
        <span className="sr-only">Buscar cliente</span>
        <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-tinta/50" />
        <input
          type="search"
          className="campo pl-12"
          placeholder="Nombre o teléfono"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
      </label>

      <div className="mt-3">
        <Opciones
          nombre="Ordenar"
          valor={orden}
          onCambiar={setOrden}
          opciones={[
            { valor: 'frecuentes', texto: 'Más compran' },
            { valor: 'deben', texto: 'Deben' },
            { valor: 'nombre', texto: 'A – Z' },
          ]}
        />
      </div>

      {lista.length === 0 ? (
        <div className="tarjeta mt-5 p-8 text-center">
          <Users aria-hidden className="mx-auto h-12 w-12 text-tinta/30" />
          <p className="mt-2 text-lg">
            {total === 0
              ? 'Todavía no hay clientes. Aparecen aquí al vender el primer número.'
              : buscar
                ? 'Nadie coincide con esa búsqueda.'
                : '¡Nadie debe nada!'}
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {lista.map((c) => (
            <li key={c.id}>
              <Link to={`/admin/clientes/${c.id}`} className="tarjeta flex items-center gap-3 hover:ring-2 hover:ring-jade/30">
                <Inicial nombre={c.nombre} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-extrabold">{c.nombre}</p>
                  <p className="text-base tabular-nums text-tinta/60">
                    {formatoTelefono(c.telefono)}
                    {c.numeros > 0 && ` · ${c.numeros === 1 ? '1 número' : `${c.numeros} números`}`}
                  </p>
                  <p className="text-base tabular-nums">
                    {c.numeros === 0 ? (
                      <span className="text-tinta/60">Sin compras</span>
                    ) : (
                      <>
                        Pagó <strong className="text-jade">{formatoColones(c.pagado)}</strong>
                        {c.debe > 0 && (
                          <>
                            {' · '}Debe <strong className="text-amber-700 dark:text-amber-400">{formatoColones(c.debe)}</strong>
                          </>
                        )}
                      </>
                    )}
                  </p>
                </div>
                <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-tinta/40" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Inicial({ nombre, grande }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-jade-claro font-titulo font-extrabold text-jade ${
        grande ? 'h-16 w-16 text-3xl' : 'h-12 w-12 text-xl'
      }`}
    >
      {nombre.trim().charAt(0).toUpperCase()}
    </span>
  );
}
