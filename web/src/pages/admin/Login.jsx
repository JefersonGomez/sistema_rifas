import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { pedir } from '../../api/cliente.js';
import Logo from '../../components/Logo.jsx';

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  const entrar = useMutation({
    mutationFn: () => pedir('/auth/login', { metodo: 'POST', datos: { usuario, password } }),
    onSuccess: (datos) => {
      queryClient.setQueryData(['sesion'], datos);
      navigate('/admin', { replace: true });
    },
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <Logo className="mx-auto h-24 w-24" />
      <h1 className="mt-3 text-center font-titulo text-4xl font-extrabold">
        Rifas <span className="text-jade">Ivannia</span>
      </h1>
      <p className="mb-8 mt-1 text-center text-lg">Panel para manejar las rifas</p>

      <form
        className="tarjeta space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          entrar.mutate();
        }}
      >
        <div>
          <label className="etiqueta" htmlFor="usuario">Usuario</label>
          <input
            id="usuario"
            className="campo"
            autoComplete="username"
            autoCapitalize="none"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="etiqueta" htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            className="campo"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {entrar.isError && <p className="font-bold text-coral">{entrar.error.message}</p>}
        <button type="submit" className="btn-primario w-full" disabled={entrar.isPending}>
          {entrar.isPending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <a href="/" className="btn mt-4 text-jade">
        ¿Quiere ver los números de la rifa?
      </a>
    </main>
  );
}
