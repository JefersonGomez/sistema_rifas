import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router';
import { ChartColumn, House, LogOut, Settings, Ticket, Trophy, Users, Wallet } from 'lucide-react';
import { pedir } from '../../api/cliente.js';
import { Marca } from '../../components/Logo.jsx';
import BotonModo from '../../components/BotonModo.jsx';
import { useModoOscuro } from '../../hooks/useModoOscuro.js';

const secciones = [
  { a: '/admin', texto: 'Inicio', icono: House, exacto: true },
  { a: '/admin/talonario', texto: 'Talonario', icono: Ticket },
  { a: '/admin/por-cobrar', texto: 'Por cobrar', icono: Wallet },
  { a: '/admin/clientes', texto: 'Clientes', icono: Users },
  { a: '/admin/rifas', texto: 'Rifas', icono: Trophy },
  // En el celular no caben: Métricas se abre desde Inicio y Mis rifas; Ajustes, con el engranaje de arriba.
  { a: '/admin/metricas', texto: 'Métricas', icono: ChartColumn, soloPc: true },
  { a: '/admin/ajustes', texto: 'Ajustes', icono: Settings, soloPc: true },
];
const seccionesCelular = secciones.filter((s) => !s.soloPc);

// Marco del panel: barra lateral en computadora, barra inferior en el celular.
export default function Panel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [oscuro, cambiarModo] = useModoOscuro();
  const sesionQ = useQuery({ queryKey: ['sesion'], queryFn: () => pedir('/auth/me'), staleTime: Infinity });
  const salir = useMutation({
    mutationFn: () => pedir('/auth/logout', { metodo: 'POST' }),
    onSuccess: () => {
      queryClient.clear();
      navigate('/admin/login', { replace: true });
    },
  });

  if (sesionQ.isPending) return <p className="py-20 text-center text-lg">Cargando…</p>;
  if (sesionQ.isError) return <Navigate to="/admin/login" replace />;

  return (
    // La clase modo-oscuro cambia los colores de todo el panel (variables en index.css).
    <div className={`min-h-dvh bg-arena text-tinta transition-colors duration-500 md:flex ${oscuro ? 'modo-oscuro' : ''}`}>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-tinta/5 bg-superficie p-4 transition-colors duration-500 md:flex">
        <Marca className="mb-8 px-2" />
        <nav className="flex flex-col gap-1">
          {secciones.map((s) => (
            <NavLink
              key={s.a}
              to={s.a}
              end={s.exacto}
              className={({ isActive }) =>
                `flex min-h-12 items-center gap-3 rounded-xl px-3 text-lg font-bold ${isActive ? 'bg-jade-claro text-jade' : 'hover:bg-tinta/5'}`
              }
            >
              <s.icono aria-hidden className="h-6 w-6" /> {s.texto}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-2">
          <button type="button" className="btn justify-start px-3 text-tinta/70" onClick={() => salir.mutate()}>
            <LogOut aria-hidden className="h-5 w-5" /> Salir
          </button>
          <BotonModo oscuro={oscuro} onCambiar={cambiarModo} />
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between gap-2 px-4 pt-4 md:hidden">
          <Marca />
          <div className="flex items-center gap-1">
            <BotonModo oscuro={oscuro} onCambiar={cambiarModo} />
            <NavLink to="/admin/ajustes" className={({ isActive }) => `btn px-2 ${isActive ? 'text-jade' : 'text-tinta/70'}`} aria-label="Ajustes">
              <Settings aria-hidden className="h-6 w-6" />
            </NavLink>
            <button type="button" className="btn px-2 text-tinta/70" onClick={() => salir.mutate()} aria-label="Salir">
              <LogOut aria-hidden className="h-6 w-6" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 pb-28 pt-4 md:px-8 md:pb-10 md:pt-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-tinta/5 bg-superficie transition-colors duration-500 pb-[env(safe-area-inset-bottom)] md:hidden">
        {seccionesCelular.map((s) => (
          <NavLink
            key={s.a}
            to={s.a}
            end={s.exacto}
            className={({ isActive }) =>
              `flex min-h-16 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-center text-[15px] font-bold leading-tight tracking-tight min-[400px]:text-base ${isActive ? 'text-jade' : 'text-tinta/60'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`rounded-full px-3 py-1 ${isActive ? 'bg-jade-claro' : ''}`}>
                  <s.icono aria-hidden className="h-6 w-6" />
                </span>
                {s.texto}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
