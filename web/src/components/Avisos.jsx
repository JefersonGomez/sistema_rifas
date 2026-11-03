import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';

// Mensajes cortos arriba de la pantalla: "Pago de ₡1 000 registrado".
const AvisosContext = createContext(() => {});

export function ProveedorAvisos({ children }) {
  const [aviso, setAviso] = useState(null);
  const temporizador = useRef();

  const avisar = useCallback((texto, tipo = 'exito') => {
    clearTimeout(temporizador.current);
    setAviso({ texto, tipo, id: Date.now() });
    temporizador.current = setTimeout(() => setAviso(null), tipo === 'error' ? 6000 : 3500);
  }, []);

  return (
    <AvisosContext.Provider value={avisar}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))]" aria-live="polite">
        {aviso && (
          <p
            key={aviso.id}
            onClick={() => setAviso(null)}
            className={`pointer-events-auto flex max-w-md animate-aparecer items-start gap-2 rounded-2xl px-4 py-3 text-lg font-bold shadow-lg ${
              aviso.tipo === 'error' ? 'bg-coral text-white' : 'bg-tinta text-white'
            }`}
          >
            {aviso.tipo === 'error' ? (
              <CircleAlert aria-hidden className="mt-0.5 h-6 w-6 shrink-0" />
            ) : (
              <CircleCheck aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-whatsapp" />
            )}
            {aviso.texto}
          </p>
        )}
      </div>
    </AvisosContext.Provider>
  );
}

export const useAvisos = () => useContext(AvisosContext);
