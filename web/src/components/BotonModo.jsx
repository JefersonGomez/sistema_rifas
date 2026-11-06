import { Moon, Sun } from 'lucide-react';

// Interruptor animado: el sol se esconde girando y entra la luna (y al revés).
export default function BotonModo({ oscuro, onCambiar, className = '' }) {
  return (
    <button
      type="button"
      onClick={onCambiar}
      role="switch"
      aria-checked={oscuro}
      aria-label={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={oscuro ? 'Modo claro' : 'Modo oscuro'}
      className={`relative inline-flex h-12 w-[5.5rem] shrink-0 items-center rounded-full p-1 transition-colors duration-500 ${
        oscuro ? 'bg-slate-700' : 'bg-sky-200'
      } ${className}`}
    >
      {/* Estrellitas que aparecen de noche */}
      <span
        aria-hidden
        className={`absolute left-3 top-2 h-1 w-1 rounded-full bg-white transition-opacity duration-500 ${oscuro ? 'opacity-90' : 'opacity-0'}`}
      />
      <span
        aria-hidden
        className={`absolute left-6 top-6 h-1.5 w-1.5 rounded-full bg-white transition-opacity delay-150 duration-500 ${
          oscuro ? 'opacity-70' : 'opacity-0'
        }`}
      />
      {/* Bolita que se desliza con el sol o la luna adentro */}
      <span
        aria-hidden
        className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(.4,1.4,.6,1)] ${
          oscuro ? 'translate-x-[2.5rem] bg-slate-900' : 'translate-x-0 bg-white'
        }`}
      >
        <Sun
          className={`absolute h-6 w-6 text-amber-500 transition-all duration-500 ${
            oscuro ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon
          className={`absolute h-6 w-6 text-amber-200 transition-all duration-500 ${
            oscuro ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </span>
    </button>
  );
}
