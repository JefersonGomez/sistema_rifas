import { useEffect } from 'react';
import { X } from 'lucide-react';

// Hoja que sube desde abajo en el celular y se muestra centrada en la computadora.
export default function HojaInferior({ titulo, onCerrar, children }) {
  useEffect(() => {
    const alTeclear = (e) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alTeclear);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = '';
    };
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="absolute inset-0 animate-aparecer bg-tinta/50" onClick={onCerrar} />
      <div className="relative max-h-[92dvh] w-full max-w-lg animate-subir overflow-y-auto rounded-t-3xl bg-arena px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-xl md:rounded-3xl md:pb-6">
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-black/15 md:hidden" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-titulo text-2xl font-extrabold">{titulo}</h2>
          <button type="button" onClick={onCerrar} className="btn -mr-2 px-3" aria-label="Cerrar">
            <X className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Confirmación dentro de la app antes de acciones que no se pueden deshacer.
export function Confirmar({ titulo, mensaje, textoBoton, onConfirmar, onCerrar, cargando }) {
  return (
    <HojaInferior titulo={titulo} onCerrar={onCerrar}>
      <p className="text-lg">{mensaje}</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" className="btn-secundario" onClick={onCerrar}>
          Cancelar
        </button>
        <button type="button" className="btn bg-coral text-white" onClick={onConfirmar} disabled={cargando}>
          {textoBoton}
        </button>
      </div>
    </HojaInferior>
  );
}
