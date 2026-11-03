import { useEffect, useState } from 'react';

// Página de prueba de la Etapa 1: confirma que web, api y base de datos se hablan.
// Se reemplaza en la Etapa 2 por la página pública de la rifa.
const colores = [
  ['jade', 'bg-jade'],
  ['jade-claro', 'bg-jade-claro'],
  ['mango', 'bg-mango'],
  ['coral', 'bg-coral'],
  ['tinta', 'bg-tinta'],
  ['whatsapp', 'bg-whatsapp'],
];

export default function App() {
  const [salud, setSalud] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setSalud)
      .catch(() => setSalud({ ok: false, baseDeDatos: 'API apagada' }));
  }, []);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="font-titulo text-4xl font-extrabold text-jade">Sistema de Rifas</h1>
      <p className="mt-2 text-lg">Etapa 1: base del proyecto lista.</p>

      <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">Estado del servidor</h2>
        <p className={`mt-1 ${salud?.ok ? 'text-jade' : 'text-coral'}`}>
          {salud === null ? 'Revisando…' : `Base de datos: ${salud.baseDeDatos}`}
        </p>
      </section>

      <section className="mt-6 grid grid-cols-3 gap-3">
        {colores.map(([nombre, clase]) => (
          <div key={nombre} className="text-center text-sm">
            <div className={`h-12 rounded-xl border border-black/5 ${clase}`} />
            {nombre}
          </div>
        ))}
      </section>
    </main>
  );
}
