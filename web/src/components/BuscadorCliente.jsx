import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus } from 'lucide-react';
import { pedir } from '../api/cliente.js';
import { formatoTelefono } from '../utils/formato.js';

// Buscar un cliente por nombre o teléfono, o crearlo si es nuevo. Llama onElegir(cliente).
export default function BuscadorCliente({ onElegir }) {
  const [texto, setTexto] = useState('');
  const [buscar, setBuscar] = useState('');
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBuscar(texto.trim()), 250);
    return () => clearTimeout(t);
  }, [texto]);

  const clientesQ = useQuery({
    queryKey: ['admin', 'clientes', buscar],
    queryFn: () => pedir(`/admin/clientes?buscar=${encodeURIComponent(buscar)}`),
    enabled: buscar.length >= 2,
  });

  if (creando) {
    // Si escribió números, probablemente es el teléfono; si no, el nombre.
    const pareceTelefono = /^[\d\s+-]+$/.test(texto);
    return (
      <ClienteNuevo
        inicial={pareceTelefono ? { telefono: texto } : { nombre: texto }}
        onCreado={onElegir}
        onCancelar={() => setCreando(false)}
      />
    );
  }

  const clientes = clientesQ.data?.clientes ?? [];
  return (
    <div>
      <label className="etiqueta" htmlFor="buscar-cliente">
        ¿A quién se lo vende?
      </label>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-tinta/50" />
        <input
          id="buscar-cliente"
          className="campo pl-10"
          placeholder="Nombre o teléfono"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          autoComplete="off"
          autoFocus
        />
      </div>

      {buscar.length >= 2 && (
        <ul className="mt-2 divide-y divide-black/5 overflow-hidden rounded-xl bg-white">
          {clientesQ.isPending && <li className="p-3 text-tinta/60">Buscando…</li>}
          {!clientesQ.isPending && clientes.length === 0 && <li className="p-3 text-tinta/60">No hay clientes con ese nombre.</li>}
          {clientes.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onElegir(c)} className="flex min-h-12 w-full items-center justify-between gap-2 px-4 py-2 text-left hover:bg-jade-claro">
                <span className="text-lg font-bold">{c.nombre}</span>
                <span className="tabular-nums text-tinta/60">{formatoTelefono(c.telefono)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="btn-secundario mt-3 w-full" onClick={() => setCreando(true)}>
        <UserPlus aria-hidden className="h-5 w-5" /> Cliente nuevo
      </button>
    </div>
  );
}

function ClienteNuevo({ inicial, onCreado, onCancelar }) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState(inicial.nombre ?? '');
  const [telefono, setTelefono] = useState(inicial.telefono ?? '');
  const crear = useMutation({
    mutationFn: () => pedir('/admin/clientes', { metodo: 'POST', datos: { nombre, telefono } }),
    onSuccess: ({ cliente }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clientes'] });
      onCreado(cliente);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        crear.mutate();
      }}
      className="space-y-3"
    >
      <div>
        <label className="etiqueta" htmlFor="nuevo-nombre">Nombre</label>
        <input id="nuevo-nombre" className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus autoComplete="off" />
      </div>
      <div>
        <label className="etiqueta" htmlFor="nuevo-tel">Teléfono (WhatsApp)</label>
        <input
          id="nuevo-tel"
          className="campo tabular-nums"
          inputMode="tel"
          placeholder="8888-8888"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          autoComplete="off"
        />
      </div>
      {crear.isError && <p className="font-bold text-coral">{crear.error.message}</p>}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="btn-secundario" onClick={onCancelar}>
          Volver
        </button>
        <button type="submit" className="btn-primario" disabled={crear.isPending}>
          Guardar cliente
        </button>
      </div>
    </form>
  );
}
