import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router';
import { House, LogOut, Ticket, Trophy, Wallet } from 'lucide-react';
import { pedir } from '../../api/cliente.js';
import { Marca } from '../../components/Logo.jsx';

const secciones = [
  { a: '/admin', texto: 'Inicio', icono: House, exacto: true },
  { a: '/admin/talonario', texto: 'Talonario', icono: Ticket },
  { a: '/admin/por-cobrar', texto: 'Por cobrar', icono: Wallet },
  { a: '/admin/rifas', texto: 'Rifas', icono: Trophy },
];

// Marco del panel: barra lateral en computadora, barra inferior en el celular.
export default function Panel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    <div className="min-h-dvh md:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-black/5 bg-white p-4 md:flex">
        <Marca className="mb-8 px-2" />
        <nav className="flex flex-col gap-1">
          {secciones.map((s) => (
            <NavLink
              key={s.a}
              to={s.a}
              end={s.exacto}
              className={({ isActive }) =>
                `flex min-h-12 items-center gap-3 rounded-xl px-3 text-lg font-bold ${isActive ? 'bg-jade-claro text-jade' : 'hover:bg-black/5'}`
              }
            >
              <s.icono aria-hidden className="h-6 w-6" /> {s.texto}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="btn mt-auto justify-start px-3 text-tinta/70" onClick={() => salir.mutate()}>
          <LogOut aria-hidden className="h-5 w-5" /> Salir
        </button>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between px-4 pt-4 md:hidden">
          <Marca />
          <button type="button" className="btn px-3 text-base text-tinta/70" onClick={() => salir.mutate()}>
            <LogOut aria-hidden className="h-5 w-5" /> Salir
          </button>
        </header>
        <main className="mx-auto max-w-3xl px-4 pb-28 pt-4 md:px-8 md:pb-10 md:pt-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-black/5 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {secciones.map((s) => (
          <NavLink
            key={s.a}
            to={s.a}
            end={s.exacto}
            className={({ isActive }) =>
              `flex min-h-16 flex-col items-center justify-center gap-0.5 text-base font-bold ${isActive ? 'text-jade' : 'text-tinta/60'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`rounded-full px-4 py-1 ${isActive ? 'bg-jade-claro' : ''}`}>
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
