import { Check } from 'lucide-react';

// Un número de la cuadrícula. Cada estado se distingue por color Y por forma (tachado / check).
const estilos = {
  libre: 'border-2 border-jade bg-white text-jade hover:bg-jade-claro active:scale-95',
  elegido: 'border-2 border-jade bg-jade text-white active:scale-95',
  ocupado: 'border-2 border-transparent bg-gray-200 text-gray-400 line-through',
};

const textoEstado = { libre: 'libre', elegido: 'elegido', ocupado: 'ocupado' };

export default function Numero({ numero, estado, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={estado === 'ocupado'}
      aria-pressed={estado === 'elegido'}
      aria-label={`Número ${numero}, ${textoEstado[estado]}`}
      className={`relative flex aspect-square items-center justify-center rounded-lg text-base font-extrabold tabular-nums transition sm:text-lg ${estilos[estado]}`}
    >
      {numero}
      {estado === 'elegido' && (
        <Check
          aria-hidden
          strokeWidth={3}
          className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-mango p-0.5 text-tinta ring-2 ring-arena"
        />
      )}
    </button>
  );
}
