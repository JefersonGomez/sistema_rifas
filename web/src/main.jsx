import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { ProveedorAvisos } from './components/Avisos.jsx';
import RifaPublica from './pages/publica/RifaPublica.jsx';
import Login from './pages/admin/Login.jsx';
import Panel from './pages/admin/Panel.jsx';
import Inicio from './pages/admin/Inicio.jsx';
import Talonario from './pages/admin/Talonario.jsx';
import PorCobrar from './pages/admin/PorCobrar.jsx';
import Rifas from './pages/admin/Rifas.jsx';
import FormRifa from './pages/admin/FormRifa.jsx';
import RifaHistorial from './pages/admin/RifaHistorial.jsx';
import Clientes from './pages/admin/Clientes.jsx';
import ClienteFicha from './pages/admin/ClienteFicha.jsx';
import './index.css';

const router = createBrowserRouter([
  { path: '/', element: <RifaPublica /> },
  { path: '/admin/login', element: <Login /> },
  {
    path: '/admin',
    element: <Panel />,
    children: [
      { index: true, element: <Inicio /> },
      { path: 'talonario', element: <Talonario /> },
      { path: 'por-cobrar', element: <PorCobrar /> },
      { path: 'clientes', element: <Clientes /> },
      { path: 'clientes/:id', element: <ClienteFicha /> },
      { path: 'rifas', element: <Rifas /> },
      { path: 'rifas/nueva', element: <FormRifa /> },
      { path: 'rifas/:id', element: <RifaHistorial /> },
      { path: 'rifas/:id/editar', element: <FormRifa /> },
    ],
  },
  { path: '*', element: <RifaPublica /> },
]);

// Si la sesión vence mientras mamá usa el panel, la manda a entrar de nuevo.
const alFallar = (error) => {
  if (error.status === 401 && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
    router.navigate('/admin/login');
  }
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: alFallar }),
  mutationCache: new MutationCache({ onError: alFallar }),
  defaultOptions: {
    queries: { retry: (n, error) => error.status !== 401 && error.status !== 404 && n < 1, staleTime: 15_000 },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ProveedorAvisos>
        <RouterProvider router={router} />
      </ProveedorAvisos>
    </QueryClientProvider>
  </StrictMode>,
);
